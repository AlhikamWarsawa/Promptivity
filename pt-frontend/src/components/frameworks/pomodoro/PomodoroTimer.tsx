'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { TomatoSVG }                                 from './TomatoSVG';
import { PTButton }                                  from '@/components/pt/PTButton';
import { ShieldCheck, Bell, AlertTriangle, Coffee, Sparkles } from 'lucide-react';

/* ============================================
   PomodoroTimer — Background Persistent Timer
   ============================================ */

const STORAGE_KEY   = 'pt_pomodoro_timer_state';

type TimerMode  = 'work' | 'break';
type TimerState = 'idle' | 'running' | 'paused' | 'done';

const BREAK_SUGGESTIONS = [
  "Stand up and stretch your body 🧘‍♂️",
  "Drink a glass of water 💧",
  "Look away from the screen (20-20-20 rule) 👀",
  "Walk for 2 minutes 🚶‍♂️",
  "Take 5 deep breaths 🌬️",
  "Quick desk tidy up ✨",
  "Listen to one favorite song 🎵"
];

interface PomodoroTimerProps {
  currentTask?:       string;
  taskId?:            string;
  workDuration?:      number; // minutes
  breakDuration?:     number; // minutes
  onSessionComplete?: (mode: 'work' | 'break', duration: number) => void;
  onInterrupted?:     (type: 'internal' | 'external', note: string) => void;
}

interface PersistentState {
  mode: TimerMode;
  state: TimerState;
  sessionEndTime: number;    // timestamp
  remainingAtPause: number;  // seconds
  autoMode: boolean;
  isMuted: boolean;
  sessionsToday: number;
  workDuration: number;
  breakDuration: number;
}

export function PomodoroTimer({
  currentTask,
  taskId,
  workDuration = 25,
  breakDuration = 5,
  onSessionComplete,
  onInterrupted,
}: PomodoroTimerProps) {
  // --- States ---
  const [mode, setMode]               = useState<TimerMode>('work');
  const [state, setState]             = useState<TimerState>('idle');
  const [secondsLeft, setSeconds]     = useState(workDuration * 60);
  const [sessionEndTime, setEndTime]  = useState<number>(0);
  const [remainingAtPause, setRemaining] = useState<number>(workDuration * 60);
  
  const [sessionsToday, setSessions]  = useState(0);
  const [autoMode, setAutoMode]       = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const [isIntOpen, setIsIntOpen]     = useState(false);
  const [intNote, setIntNote]         = useState('');
  const [breakHint, setBreakHint]     = useState('');

  // --- Refs ---
  const audioRef                      = useRef<HTMLAudioElement | null>(null);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSessionCompleteRef          = useRef(onSessionComplete);

  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  const totalSeconds = mode === 'work' ? workDuration * 60 : breakDuration * 60;
  const progress     = secondsLeft / totalSeconds;

  // --- Persistence Logic ---
  const saveState = useCallback((overrides: Partial<PersistentState> = {}) => {
    const data: PersistentState = {
      mode,
      state,
      sessionEndTime,
      remainingAtPause,
      autoMode,
      isMuted,
      sessionsToday,
      workDuration,
      breakDuration,
      ...overrides
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [mode, state, sessionEndTime, remainingAtPause, autoMode, isMuted, sessionsToday, workDuration, breakDuration]);

  const loadState = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const data: PersistentState = JSON.parse(saved);
      // Only restore if durations match or we force it? 
      // Let's assume the task durations in props are source of truth for NEW sessions,
      // but persisted state handles CURRENT session.
      setMode(data.mode);
      setState(data.state);
      setEndTime(data.sessionEndTime);
      setRemaining(data.remainingAtPause);
      setAutoMode(data.autoMode);
      setIsMuted(data.isMuted);
      setSessions(data.sessionsToday || 0);

      if (data.state === 'running' && data.sessionEndTime > Date.now()) {
        const left = Math.max(0, Math.floor((data.sessionEndTime - Date.now()) / 1000));
        setSeconds(left);
      } else if (data.state === 'paused' || data.state === 'idle') {
        setSeconds(data.remainingAtPause);
      } else if (data.state === 'running' && data.sessionEndTime <= Date.now()) {
        setSeconds(0);
        setState('done');
      }
    } catch (e) {
      console.error('Failed to load timer state', e);
    }
  }, []);

  // --- Audio & Notifications ---
  const playSound = useCallback(() => {
    if (!isMuted && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [isMuted]);

  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // --- Core Lifecycle ---
  useEffect(() => {
    audioRef.current = new Audio('/sounds/timer-ring.wav');
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    loadState();

    const sync = () => {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) {
         const data: PersistentState = JSON.parse(saved);
         if (data.state === 'running') {
            const left = Math.max(0, Math.floor((data.sessionEndTime - Date.now()) / 1000));
            setSeconds(left);
            if (left === 0) setState('done');
         }
       }
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [loadState]);

  // --- Timer Sync Interval ---
  useEffect(() => {
    if (state !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((sessionEndTime - now) / 1000));
      setSeconds(left);

      if (left <= 0) {
        clearInterval(intervalRef.current!);
        setState('done');
        playSound();
        showNotification(
          mode === 'work' ? 'Pomodoro Selesai! 🍅' : 'Istirahat Selesai! ☕',
          mode === 'work' ? 'Waktunya istirahat sebentar.' : 'Siap untuk sesi fokus berikutnya?'
        );
        
        if (mode === 'work') setSessions(s => s + 1);
        
        onSessionCompleteRef.current?.(mode, mode === 'work' ? workDuration : breakDuration);

        if (autoMode) setAutoCountdown(3);
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, sessionEndTime, mode, playSound, showNotification, autoMode, workDuration, breakDuration]);

  // Handle mode switches and duration updates from props
  useEffect(() => {
    if (state === 'idle') {
      const dur = mode === 'work' ? workDuration : breakDuration;
      setSeconds(dur * 60);
      setRemaining(dur * 60);
    }
  }, [workDuration, breakDuration, mode, state]);

  // Random Break Hint
  useEffect(() => {
    if (mode === 'break' && state === 'running') {
      setBreakHint(BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]);
    } else {
      setBreakHint('');
    }
  }, [mode, state]);

  // Auto transition
  useEffect(() => {
    if (autoCountdown === null) return;
    if (autoCountdown <= 0) {
      const nextMode = mode === 'work' ? 'break' : 'work';
      const duration = nextMode === 'work' ? workDuration : breakDuration;
      const end = Date.now() + duration * 60 * 1000;
      
      setMode(nextMode);
      setEndTime(end);
      setSeconds(duration * 60);
      setState('running');
      setAutoCountdown(null);
      
      saveState({ mode: nextMode, state: 'running', sessionEndTime: end, remainingAtPause: duration * 60 });
      return;
    }
    const timer = setTimeout(() => setAutoCountdown(prev => prev! - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoCountdown, mode, saveState, workDuration, breakDuration]);

  useEffect(() => { saveState(); }, [mode, state, sessionEndTime, remainingAtPause, autoMode, isMuted, sessionsToday, saveState]);

  // --- Actions ---
  const start = useCallback(() => {
    const end = Date.now() + (secondsLeft || totalSeconds) * 1000;
    setEndTime(end);
    setState('running');
  }, [secondsLeft, totalSeconds]);

  const pause = useCallback(() => {
    const left = Math.max(0, Math.floor((sessionEndTime - Date.now()) / 1000));
    setRemaining(left);
    setEndTime(0);
    setState('paused');
  }, [sessionEndTime]);

  const reset = useCallback(() => {
    setState('idle');
    setEndTime(0);
    const duration = mode === 'work' ? workDuration : breakDuration;
    setSeconds(duration * 60);
    setRemaining(duration * 60);
  }, [mode, workDuration, breakDuration]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setState('idle');
    setEndTime(0);
    const duration = newMode === 'work' ? workDuration : breakDuration;
    setSeconds(duration * 60);
    setRemaining(duration * 60);
  }, [workDuration, breakDuration]);

  const handleInterrupt = (type: 'internal' | 'external') => {
    onInterrupted?.(type, intNote);
    setIsIntOpen(false);
    setIntNote('');
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const isDone    = state === 'done';
  const isRunning = state === 'running';
  const isPaused  = state === 'paused';
  const isIdle    = state === 'idle';

  return (
    <div
      className="relative rounded-sketch border-2 border-pt-black p-6 text-center overflow-hidden"
      style={{
        backgroundColor: mode === 'work' ? '#F04E5912' : '#17B66A12',
        boxShadow: '4px 4px 0px #2B2B2B',
      }}
    >
      {/* Background Safe Badge */}
      <div className="absolute top-3 left-4 flex items-center gap-1 opacity-60">
        <ShieldCheck className="w-3.5 h-3.5 text-pt-green" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">Background Safe</span>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center gap-2 mb-5 mt-2">
        {(['work', 'break'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className="px-4 py-1.5 rounded-sketch border-2 border-pt-black text-label font-bold transition-all"
            style={{
              fontFamily:      'var(--font-body)',
              backgroundColor: mode === m
                ? (m === 'work' ? 'var(--pt-coral)' : 'var(--pt-green)')
                : 'var(--pt-white)',
              color:     mode === m ? 'white' : 'var(--pt-black)',
              boxShadow: mode === m ? 'none' : '2px 2px 0px #2B2B2B',
            }}
          >
            {m === 'work' ? `🍅 Focus ${workDuration}m` : `☕ Break ${breakDuration}m`}
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className="flex justify-between items-center mb-2 px-1">
        <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer" style={{ color: '#4B4B4B' }}>
          <input type="checkbox" checked={autoMode} onChange={() => setAutoMode(!autoMode)} className="accent-pt-coral" />
          Auto Continue
        </label>
        <button onClick={() => setIsMuted(!isMuted)} className="flex items-center gap-1 text-xs font-bold" style={{ color: '#4B4B4B' }}>
          {isMuted ? '🔇 Muted' : '🔊 Sound On'}
        </button>
      </div>

      {/* Task Label */}
      <AnimatePresence mode="wait">
        {currentTask && (
          <motion.p
            key={currentTask}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm font-semibold mb-4 truncate max-w-xs mx-auto"
            style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
          >
            📝 {currentTask}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Timer Circle */}
      <div className="flex justify-center mb-8 mt-2 relative">
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: '240px', height: '240px',
            background: `conic-gradient(var(--pt-${mode === 'work' ? 'coral' : 'green'}) ${progress * 100}%, var(--pt-cream) ${progress * 100}%)`,
            boxShadow: '4px 4px 0px #2B2B2B',
            border: '2px solid #2B2B2B',
          }}
        >
          <div className="absolute inset-0 m-3 rounded-full bg-white flex flex-col items-center justify-center border-2 border-pt-black" style={{ zIndex: 10 }}>
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div key="done" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                  <Sparkles className="w-10 h-10 text-pt-yellow" />
                  <p className="text-sm font-display text-pt-black">{mode === 'work' ? 'Sesi Selesai!' : 'Siap Fokus!'}</p>
                </motion.div>
              ) : (
                <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                  <TomatoSVG size={60} isActive={isRunning} progress={1} className="mb-2" />
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: 1, letterSpacing: '0.05em' }}>{mm}:{ss}</p>
                  <p className="text-xs font-bold uppercase tracking-widest mt-1 text-gray-400">{mode === 'work' ? 'Focus' : 'Break'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Break Hint */}
      <AnimatePresence>
        {breakHint && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-pt-green/10 rounded-sketch border-2 border-dashed border-pt-green/40 flex items-center gap-3">
             <Coffee className="w-5 h-5 text-pt-green" />
             <p className="text-xs font-bold text-pt-green">{breakHint}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-5 flex-wrap">
        {isIdle && <PTButton variant="danger" size="md" onClick={start}>▶ Start</PTButton>}
        {isRunning && (
          <>
            <PTButton variant="secondary" size="md" onClick={pause}>⏸ Pause</PTButton>
            {mode === 'work' && (
              <PTButton variant="outline" size="md" onClick={() => setIsIntOpen(true)}>
                <AlertTriangle className="w-4 h-4 mr-1" /> Distracted
              </PTButton>
            )}
          </>
        )}
        {isPaused && <PTButton variant="danger" size="md" onClick={start}>▶ Resume</PTButton>}
        {isDone && (
          <PTButton variant="primary" size="md" onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}>
            {mode === 'work' ? '☕ Take Break' : '🍅 Back to Focus'}
          </PTButton>
        )}
        {!isIdle && <PTButton variant="ghost" size="md" onClick={reset}>↺ Reset</PTButton>}
      </div>

      {/* Interruption Modal */}
      <AnimatePresence>
        {isIntOpen && (
          <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-4">
            <h4 className="font-display text-h4 mb-4">Log Interruption</h4>
            <div className="flex gap-2 mb-4 w-full">
              <button onClick={() => handleInterrupt('internal')} className="flex-1 p-3 border-2 border-pt-black rounded-sketch hover:bg-pt-cream transition-colors">
                <span className="block text-xl mb-1">🧠</span>
                <span className="text-xs font-bold uppercase">Internal</span>
              </button>
              <button onClick={() => handleInterrupt('external')} className="flex-1 p-3 border-2 border-pt-black rounded-sketch hover:bg-pt-cream transition-colors">
                <span className="block text-xl mb-1">📢</span>
                <span className="text-xs font-bold uppercase">External</span>
              </button>
            </div>
            <textarea 
              className="w-full p-3 border-2 border-pt-black rounded-sketch text-sm mb-4"
              placeholder="What happened? (optional)"
              value={intNote}
              onChange={e => setIntNote(e.target.value)}
            />
            <PTButton variant="ghost" className="w-full" onClick={() => setIsIntOpen(false)}>Cancel</PTButton>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Counter */}
      <div className="mt-6 pt-4 border-t-2 border-dashed border-pt-black/10 flex justify-center gap-6">
        <div className="text-center">
          <p className="text-xl font-display">{sessionsToday}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Focus Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-display">{Math.floor(sessionsToday * workDuration)}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Focus Minutes</p>
        </div>
      </div>
    </div>
  );
}
