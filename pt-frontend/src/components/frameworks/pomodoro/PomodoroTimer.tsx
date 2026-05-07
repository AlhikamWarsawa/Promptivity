'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { TomatoSVG }                                 from './TomatoSVG';
import { PTButton }                                  from '@/components/pt/PTButton';

/* ============================================
   PomodoroTimer — Interactive countdown timer

   Modes: Work (25min) ↔ Break (5min)
   States: idle → running → paused → done

   Props:
   - currentTask:        nama task yang sedang dipomodoro
   - onSessionComplete:  callback saat satu sesi selesai
   ============================================ */

const WORK_SECONDS  = 25 * 60;   // 25 menit
const BREAK_SECONDS = 5  * 60;   // 5 menit

type TimerMode  = 'work' | 'break';
type TimerState = 'idle' | 'running' | 'paused' | 'done';

interface PomodoroTimerProps {
  currentTask?:       string;
  onSessionComplete?: () => void;
}

export function PomodoroTimer({
  currentTask,
  onSessionComplete,
}: PomodoroTimerProps) {
  const [mode, setMode]               = useState<TimerMode>('work');
  const [state, setState]             = useState<TimerState>('idle');
  const [secondsLeft, setSeconds]     = useState(WORK_SECONDS);
  const [sessionsToday, setSessions]  = useState(0);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  const progress     = secondsLeft / totalSeconds;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (state !== 'running') return;

    // Clear any existing interval before starting a new one
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setState('done');
          if (mode === 'work') setSessions((s) => s + 1);
          onSessionComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, mode, onSessionComplete]);

  const start = useCallback(() => setState('running'), []);
  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('paused');
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('idle');
    setSeconds(mode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode(newMode);
    setState('idle');
    setSeconds(newMode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  }, []);

  // Format mm:ss
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const isDone    = state === 'done';
  const isRunning = state === 'running';
  const isPaused  = state === 'paused';
  const isIdle    = state === 'idle';

  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-6 text-center"
      style={{
        backgroundColor: mode === 'work' ? '#F04E5912' : '#17B66A12',
        boxShadow: '4px 4px 0px #2B2B2B',
      }}
    >
      {/* Mode switcher */}
      <div className="flex justify-center gap-2 mb-5">
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
            {m === 'work' ? '🍅 Kerja 25m' : '☕ Istirahat 5m'}
          </button>
        ))}
      </div>

      {/* Current task label */}
      <AnimatePresence mode="wait">
        {currentTask && (
          <motion.p
            key={currentTask}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold mb-4 truncate max-w-xs mx-auto"
            style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
          >
            📝 {currentTask}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Tomato with progress */}
      <div className="flex justify-center mb-4">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-7xl"
              role="img"
              aria-label={mode === 'work' ? 'Sesi kerja selesai!' : 'Istirahat selesai!'}
            >
              {mode === 'work' ? '🎉' : '⚡'}
            </motion.div>
          ) : (
            <motion.div key="timer">
              <TomatoSVG
                size={140}
                isActive={isRunning}
                progress={progress}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Countdown display */}
      <AnimatePresence mode="wait">
        {!isDone ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.p
              animate={isRunning && secondsLeft <= 60
                ? { color: ['var(--pt-coral)', '#2B2B2B', 'var(--pt-coral)'] }
                : { color: 'var(--pt-black)' }
              }
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '3.5rem',
                lineHeight:    1,
                letterSpacing: '0.05em',
              }}
              aria-live="polite"
              aria-label={`${mm} menit ${ss} detik tersisa`}
            >
              {mm}:{ss}
            </motion.p>
            <p
              className="text-sm mt-1"
              style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
            >
              {mode === 'work' ? 'Waktu fokus' : 'Waktu istirahat'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="done-msg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-h3)',
                color:      mode === 'work' ? 'var(--pt-coral)' : 'var(--pt-green)',
              }}
            >
              {mode === 'work' ? 'Sesi Selesai! 🍅' : 'Siap Fokus Lagi! ⚡'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-5 flex-wrap">
        {isIdle && (
          <PTButton variant="danger" size="md" onClick={start}>
            ▶ Mulai
          </PTButton>
        )}
        {isRunning && (
          <>
            <PTButton variant="secondary" size="md" onClick={pause}>
              ⏸ Pause
            </PTButton>
            <PTButton variant="ghost" size="md" onClick={reset}>
              ↺ Reset
            </PTButton>
          </>
        )}
        {isPaused && (
          <>
            <PTButton variant="danger" size="md" onClick={start}>
              ▶ Lanjut
            </PTButton>
            <PTButton variant="ghost" size="md" onClick={reset}>
              ↺ Reset
            </PTButton>
          </>
        )}
        {isDone && (
          <>
            <PTButton
              variant="primary"
              size="md"
              onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}
            >
              {mode === 'work' ? '☕ Istirahat' : '🍅 Kerja Lagi'}
            </PTButton>
            <PTButton variant="ghost" size="md" onClick={reset}>
              ↺ Ulangi
            </PTButton>
          </>
        )}
      </div>

      {/* Sessions today counter */}
      <motion.div
        className="mt-4 flex items-center justify-center gap-1.5"
        animate={{ opacity: sessionsToday > 0 ? 1 : 0.4 }}
      >
        <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
          Sesi hari ini:
        </span>
        <div className="flex gap-1">
          {Array.from({ length: Math.max(sessionsToday, 4) }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: i < sessionsToday ? 1 : 0.6 }}
              transition={{ delay: i * 0.05 }}
              style={{
                fontSize: i < sessionsToday ? '1.1rem' : '0.8rem',
                opacity:  i < sessionsToday ? 1 : 0.25,
              }}
              aria-hidden="true"
            >
              🍅
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
