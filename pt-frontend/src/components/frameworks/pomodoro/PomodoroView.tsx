'use client';

import { useState, useMemo }           from 'react';
import { motion }                      from 'framer-motion';
import { PomodoroTimer }               from './PomodoroTimer';
import { FrameworkEmptyState }         from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }            from '@/components/pt/HandDrawnDivider';
import { useFramework }                from '@/store/usePTStore';

/* ============================================
   PomodoroView — Pomodoro Technique page

   Layout:
   1. Info bar
   2. Timer (kiri sticky, desktop) + session list (kanan)
   3. Quick stats bawah timer
   ============================================ */

interface PomodoroSession {
  task:             string;
  pomodoroCount:    number;
  estimatedMinutes: number;
  priority:         string;
  category:         string;
}

export function PomodoroView() {
  const fwData = useFramework('pomodoro');
  const [activeSessionIdx, setActiveSessionIdx]   = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState<Set<number>>(new Set());

  const sessions = useMemo((): PomodoroSession[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as { sessions?: PomodoroSession[] };
    return raw.sessions ?? [];
  }, [fwData]);

  if (!fwData || sessions.length === 0) {
    return (
      <FrameworkEmptyState
        frameworkId="pomodoro"
        message="Moti tidak bisa mengidentifikasi sesi Pomodoro dari ceritamu. Sebutkan task spesifik yang butuh fokus mendalam."
      />
    );
  }

  const currentTask = activeSessionIdx !== null
    ? sessions[activeSessionIdx]?.task
    : undefined;

  function handleSessionComplete() {
    if (activeSessionIdx === null) return;
    setCompletedSessions((prev) => new Set([...prev, activeSessionIdx]));
  }

  const totalPomodoros = sessions.reduce((sum, s) => sum + (s.pomodoroCount ?? 1), 0);
  const totalMinutes   = sessions.reduce((sum, s) => sum + (s.estimatedMinutes ?? 25), 0);

  return (
    <div className="space-y-8">

      {/* Info bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 rounded-sketch border-2 border-pt-black text-sm"
        style={{
          backgroundColor: '#F28C2815',
          fontFamily:      'var(--font-body)',
          color:           '#4B4B4B',
        }}
      >
        🍅 <strong>Teknik Pomodoro:</strong> Kerja 25 menit fokus penuh → istirahat 5 menit →
        ulangi. Setiap 4 sesi = istirahat panjang 15 menit.
      </motion.div>

      {/* Main layout — timer kiri, list kanan (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">

        {/* Timer — sticky di desktop */}
        <div className="lg:sticky lg:top-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <PomodoroTimer
              currentTask={currentTask}
              onSessionComplete={handleSessionComplete}
            />
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 grid grid-cols-2 gap-3"
          >
            <MiniStat label="Total Sesi" value={`${totalPomodoros} 🍅`} />
            <MiniStat label="Total Waktu" value={`~${Math.round(totalMinutes / 60)}j`} />
          </motion.div>
        </div>

        {/* Session list */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-h4)',
                color:      'var(--pt-black)',
              }}
            >
              Urutan Sesi Hari Ini
            </h3>
            <span
              className="px-2 py-0.5 rounded-full border-2 border-pt-black text-label font-bold"
              style={{ backgroundColor: '#F28C28', fontFamily: 'var(--font-body)', color: 'white' }}
            >
              {sessions.length}
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map((session, i) => {
              const isActive    = activeSessionIdx === i;
              const isCompleted = completedSessions.has(i);

              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => setActiveSessionIdx(isActive ? null : i)}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ x: 2 }}
                  className="w-full text-left rounded-sketch border-2 border-pt-black p-4 transition-all"
                  style={{
                    backgroundColor: isActive
                      ? '#F28C2820'
                      : isCompleted
                      ? '#17B66A15'
                      : 'var(--pt-white)',
                    boxShadow:   isActive ? '4px 4px 0px #2B2B2B' : '2px 2px 0px #2B2B2B',
                    outline:     isActive ? '2px dashed #F28C28' : 'none',
                    outlineOffset: '2px',
                  }}
                  aria-pressed={isActive}
                  aria-label={`${isActive ? 'Deselect' : 'Select'} session: ${session.task}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Sequence number + task info */}
                    <div className="flex items-center gap-3">
                      <span
                        className="shrink-0 w-7 h-7 rounded-sketch border-2 border-pt-black flex items-center justify-center text-sm font-bold"
                        style={{
                          fontFamily:      'var(--font-body)',
                          backgroundColor: isCompleted
                            ? 'var(--pt-green)'
                            : isActive
                            ? '#F28C28'
                            : 'var(--pt-cream)',
                          color: isCompleted || isActive ? 'white' : 'var(--pt-black)',
                        }}
                      >
                        {isCompleted ? '✓' : i + 1}
                      </span>
                      <div>
                        <p
                          className="font-semibold text-sm leading-snug"
                          style={{
                            fontFamily:     'var(--font-body)',
                            color:          'var(--pt-black)',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            opacity:        isCompleted ? 0.6 : 1,
                          }}
                        >
                          {session.task}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
                        >
                          {session.category && session.category !== 'general' && `${session.category} · `}
                          ~{session.estimatedMinutes}m
                        </p>
                      </div>
                    </div>

                    {/* Pomodoro tomatoes */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: session.pomodoroCount ?? 1 }).map((_, ti) => (
                        <span
                          key={ti}
                          style={{ fontSize: '1rem' }}
                          aria-hidden="true"
                          title={`Sesi ${ti + 1} dari ${session.pomodoroCount}`}
                        >
                          🍅
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 text-xs font-bold"
                      style={{ fontFamily: 'var(--font-body)', color: '#F28C28' }}
                    >
                      ⚡ Timer berjalan untuk task ini — klik untuk berhenti
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>

          <HandDrawnDivider variant="dots" color="var(--pt-black)" className="opacity-20 mt-6" />

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            {[
              { emoji: '🍅', label: '= 1 sesi 25 menit' },
              { emoji: '☕', label: '= 5 menit istirahat' },
            ].map((l) => (
              <span
                key={l.label}
                className="text-xs"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                {l.emoji} {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-3 text-center"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <p
        className="text-h4"
        style={{ fontFamily: 'var(--font-display)', color: '#F28C28' }}
      >
        {value}
      </p>
      <p
        className="text-label"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {label}
      </p>
    </div>
  );
}
