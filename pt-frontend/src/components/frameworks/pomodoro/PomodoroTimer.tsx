'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { TomatoSVG }                                 from './TomatoSVG';
import { PTButton }                                  from '@/components/pt/PTButton';
import { usePTStore }                                 from '@/store/usePTStore';
import { ShieldCheck, Bell, Coffee, Sparkles, CheckCircle2 } from 'lucide-react';

/* ============================================
   PomodoroTimer — Background Persistent Timer
   ============================================ */

const STORAGE_KEY   = 'pt_pomodoro_timer_v2';

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
  sessionEndTime: number;    // absolute timestamp
  remainingAtPause: number;  // seconds left when paused
  autoMode: boolean;
  isMuted: boolean;
  sessionsToday: number;
  taskId: string | undefined;
  currentTask: string | undefined;
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

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [breakHint, setBreakHint]     = useState('');

  // --- Refs ---
  const hasHydratedRef                = useRef(false);
  const completionHandledRef          = useRef(false);
  const nextSessionLockRef            = useRef(false);
  const audioRef                      = useRef<HTMLAudioElement | null>(null);
  const tickAudioRef                  = useRef<HTMLAudioElement | null>(null);
  const lastTickPlayedRef             = useRef<number | null>(null);
  const bellPlayedRef                 = useRef(false);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
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
      taskId,
      currentTask,
      ...overrides
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [mode, state, sessionEndTime, remainingAtPause, autoMode, isMuted, sessionsToday, taskId, currentTask]);

  const loadState = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const data: PersistentState = JSON.parse(saved);
      
      // Restore basic settings
      setMode(data.mode);
      setAutoMode(data.autoMode);
      setIsMuted(data.isMuted);
      setSessions(data.sessionsToday || 0);

      const now = Date.now();
      
      if (data.state === 'running') {
        if (data.sessionEndTime > now) {
          // Still running
          setEndTime(data.sessionEndTime);
          setState('running');
          setSeconds(Math.max(0, Math.floor((data.sessionEndTime - now) / 1000)));
        } else {
          // Finished while away
          setEndTime(0);
          setState('done');
          setSeconds(0);
          // If auto-mode was on, we might have missed multiple sessions, 
          // but for now, just mark the current one done.
        }
      } else {
        setState(data.state);
        setRemaining(data.remainingAtPause);
        setSeconds(data.remainingAtPause);
      }
    } catch (e) {
      console.error('Failed to load timer state', e);
    }
  }, []);

  // --- Audio & Notifications ---
  const playTickSound = useCallback(() => {
    if (!isMuted && tickAudioRef.current) {
      tickAudioRef.current.currentTime = 0;
      tickAudioRef.current.play().catch(e => console.log('Tick play failed:', e));
    }
  }, [isMuted]);

  const playBellSound = useCallback(() => {
    if (!isMuted && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Bell play failed:', e));
    }
  }, [isMuted]);

  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // --- Hydration ---
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    loadState();
  }, [loadState]);

  // --- Sync on Focus/Visibility ---
  const syncTimer = useCallback(() => {
    if (state !== 'running' || !sessionEndTime) return;
    
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((sessionEndTime - now) / 1000));
    setSeconds(remaining);
    
    if (remaining === 0) {
      setState('done');
    }
  }, [state, sessionEndTime]);

  // --- Initial Setup ---
  useEffect(() => {
    // Setup Audio
    audioRef.current = new Audio('/sounds/bell.mp3');
    audioRef.current.volume = 0.7;
    
    tickAudioRef.current = new Audio('/sounds/tick.mp3');
    tickAudioRef.current.volume = 0.35;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    window.addEventListener('focus', syncTimer);
    document.addEventListener('visibilitychange', syncTimer);
    
    return () => {
      window.removeEventListener('focus', syncTimer);
      document.removeEventListener('visibilitychange', syncTimer);
    };
  }, [syncTimer]);

  // --- The Core Interval (Background Safe) ---
  useEffect(() => {
    if (state !== 'running' || isTransitioning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((sessionEndTime - now) / 1000));
      setSeconds(left);

      // Play tick sound for final 5 seconds
      if (left <= 5 && left > 0 && lastTickPlayedRef.current !== left) {
        playTickSound();
        lastTickPlayedRef.current = left;
      }

      if (left <= 0 && !completionHandledRef.current) {
        completionHandledRef.current = true;
        
        // Play bell sound exactly once at completion
        if (!bellPlayedRef.current) {
          playBellSound();
          bellPlayedRef.current = true;
        }

        clearInterval(intervalRef.current!);
        setState('done');
        showNotification(
          mode === 'work' ? 'Focus Session Done! 🍅' : 'Break Done! ☕',
          mode === 'work' ? 'Time for a short break.' : 'Ready for the next focus session?'
        );
        
        if (mode === 'work') setSessions(s => s + 1);
        
        onSessionCompleteRef.current?.(mode, mode === 'work' ? workDuration : breakDuration);

        if (autoMode) {
          setIsTransitioning(true);
          setAutoCountdown(3);
        }
      }
    }, 1000); // lightweight check

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, sessionEndTime, mode, playTickSound, playBellSound, showNotification, autoMode, workDuration, breakDuration, isTransitioning]);

  // Handle auto transition countdown
  useEffect(() => {
    if (autoCountdown === null) {
      if (transitionRef.current) clearInterval(transitionRef.current);
      return;
    }

    if (autoCountdown <= 0) {
      if (nextSessionLockRef.current) return;
      nextSessionLockRef.current = true;
      
      const nextMode = mode === 'work' ? 'break' : 'work';
      const duration = nextMode === 'work' ? workDuration : breakDuration;
      const end = Date.now() + duration * 60 * 1000;
      
      setMode(nextMode);
      setEndTime(end);
      setSeconds(duration * 60);
      setState('running');
      setAutoCountdown(null);
      setIsTransitioning(false);
      completionHandledRef.current = false;
      bellPlayedRef.current = false;
      lastTickPlayedRef.current = null;
      
      setTimeout(() => {
        nextSessionLockRef.current = false;
      }, 500);
      return;
    }

    transitionRef.current = setInterval(() => {
      setAutoCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (transitionRef.current) clearInterval(transitionRef.current);
    };
  }, [autoCountdown, mode, workDuration, breakDuration]);

  // Sync state to storage whenever it changes
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (isTransitioning) return;
    if (state !== 'idle') {
      saveState();
    }
  }, [mode, state, sessionEndTime, remainingAtPause, autoMode, isMuted, sessionsToday, saveState, isTransitioning]);

  // --- Actions ---
  const start = useCallback(() => {
    if (isTransitioning) return;
    const end = Date.now() + (secondsLeft || totalSeconds) * 1000;
    setEndTime(end);
    setState('running');
    completionHandledRef.current = false;
    bellPlayedRef.current = false;
    lastTickPlayedRef.current = null;
    saveState({ state: 'running', sessionEndTime: end });
  }, [secondsLeft, totalSeconds, saveState, isTransitioning]);

  const pause = useCallback(() => {
    const left = Math.max(0, Math.floor((sessionEndTime - Date.now()) / 1000));
    setRemaining(left);
    setEndTime(0);
    setState('paused');
    saveState({ state: 'paused', remainingAtPause: left, sessionEndTime: 0 });
  }, [sessionEndTime, saveState]);

  const reset = useCallback(() => {
    setState('idle');
    setEndTime(0);
    const duration = mode === 'work' ? workDuration : breakDuration;
    setSeconds(duration * 60);
    setRemaining(duration * 60);
    localStorage.removeItem(STORAGE_KEY);
  }, [mode, workDuration, breakDuration]);

  const switchMode = useCallback((newMode: TimerMode) => {
    if (isTransitioning) return;
    setMode(newMode);
    setState('idle');
    setEndTime(0);
    completionHandledRef.current = false;
    bellPlayedRef.current = false;
    lastTickPlayedRef.current = null;
    const duration = newMode === 'work' ? workDuration : breakDuration;
    setSeconds(duration * 60);
    setRemaining(duration * 60);
    saveState({ mode: newMode, state: 'idle', sessionEndTime: 0, remainingAtPause: duration * 60 });
  }, [workDuration, breakDuration, saveState, isTransitioning]);

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
      <div 
        className="absolute top-3 left-4 flex items-center gap-1 group cursor-help"
        title="Timer tetap berjalan walaupun kamu pindah tab."
      >
        <ShieldCheck className="w-3.5 h-3.5 text-pt-green" />
        <span className="text-[10px] font-bold uppercase tracking-tighter text-pt-green/80">Background Safe ✓</span>
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
              {autoCountdown !== null ? (
                <motion.div key="auto" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-pt-coral">Next Phase In</p>
                  <p className="text-5xl font-display text-pt-black">{autoCountdown}</p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full border border-pt-black ${3 - i < autoCountdown ? 'bg-pt-cream' : 'bg-pt-coral'}`} />
                    ))}
                  </div>
                </motion.div>
              ) : isDone ? (
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

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-5 flex-wrap">
        {/* Hide manual buttons during auto countdown and transition to prevent flicker/wrong state */}
        {!isTransitioning && autoCountdown === null && (
          <>
            {isIdle && <PTButton variant="danger" size="md" onClick={start}>▶ Start</PTButton>}
            {isRunning && <PTButton variant="secondary" size="md" onClick={pause}>⏸ Pause</PTButton>}
            {isPaused && <PTButton variant="danger" size="md" onClick={start}>▶ Resume</PTButton>}
            {isDone && (
              <PTButton variant="primary" size="md" onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}>
                {mode === 'work' ? '☕ Take Break' : '🍅 Back to Focus'}
              </PTButton>
            )}
            {!isIdle && <PTButton variant="ghost" size="md" onClick={reset}>↺ Reset</PTButton>}
          </>
        )}
      </div>

      {/* Distraction Modal removed */}

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
