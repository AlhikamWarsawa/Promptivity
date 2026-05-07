'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence }       from 'framer-motion';
import { FrameworkEmptyState }           from '@/components/frameworks/FrameworkPageLayout';
import { TaskCard }                      from '@/components/pt/TaskCard';
import { PTButton }                      from '@/components/pt/PTButton';
import { HandDrawnDivider }              from '@/components/pt/HandDrawnDivider';
import { useFramework, usePTStore }      from '@/store/usePTStore';
import type { Task }                     from '@/types/pt.types';

/* ============================================
   EatTheFrogView — Eat the Frog framework page

   Layout:
   1. Motivational header copy (random quote)
   2. THE FROG card — besar, bold, dominan
   3. Alasan kenapa ini si katak
   4. "Frog selesai?" toggle button → celebration
   5. Secondary tasks (setelah katak selesai)
   6. Micro-copy motivational
   ============================================ */

interface FrogData {
  title:            string;
  reason:           string;
  estimatedMinutes: number;
  priority:         string;
  category:         string;
}

const FROG_QUOTES = [
  'Makan katakmu di pagi hari, dan tidak ada hal buruk lain yang akan terjadi sepanjang hari.',
  'Katak terbesar dan paling jelek adalah tugas yang paling mungkin kamu tunda.',
  'Satu katak. Satu fokus. Satu hari yang luar biasa.',
  'Ketakutan yang kamu tunda hanya akan tumbuh lebih besar. Makan sekarang.',
];

export function EatTheFrogView() {
  const fwData     = useFramework('eat-the-frog');
  const toggleTask = usePTStore((s) => s.toggleTask);
  const [frogDone, setFrogDone] = useState(false);

  // Fix hydration mismatch — set random quote after mount
  const [quote, setQuote] = useState(FROG_QUOTES[0]);
  useEffect(() => {
    setQuote(FROG_QUOTES[Math.floor(Math.random() * FROG_QUOTES.length)]);
  }, []);

  const rawData = useMemo(() => {
    if (!fwData?.rawData) return null;
    return fwData.rawData as {
      frog?:           FrogData;
      secondaryTasks?: Task[];
    };
  }, [fwData]);

  if (!fwData || !rawData?.frog) {
    return (
      <FrameworkEmptyState
        frameworkId="eat-the-frog"
        message="Moti tidak bisa menemukan 'katak' dari ceritamu. Coba sebutkan tugas terbesar atau yang paling kamu hindari."
      />
    );
  }

  const { frog, secondaryTasks = [] } = rawData;

  return (
    <div className="space-y-8">

      {/* ---- MOTIVATIONAL HEADER ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p
          className="text-sm italic max-w-md mx-auto"
          style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
        >
          &ldquo;{quote}&rdquo;
        </p>
        <p
          className="text-xs mt-1"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          — Brian Tracy
        </p>
      </motion.div>

      {/* ---- THE FROG CARD ---- */}
      <AnimatePresence mode="wait">
        {!frogDone ? (
          <motion.div
            key="frog-active"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <TheFrogCard
              frog={frog}
              onDone={() => setFrogDone(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="frog-done"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <FrogCelebration onUndo={() => setFrogDone(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- SECONDARY TASKS ---- */}
      {secondaryTasks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: frogDone ? 1 : 0.5, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <HandDrawnDivider
            variant="wave"
            color="var(--pt-black)"
            label="SETELAH KATAK SELESAI"
            className="mb-4 opacity-50"
          />

          {/* Lock overlay kalau katak belum selesai */}
          {!frogDone && (
            <div
              className="text-center py-2 mb-3 rounded-sketch border border-pt-black/20 text-sm"
              style={{ backgroundColor: 'var(--pt-cream)', fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
            >
              🔒 Selesaikan katakmu dulu sebelum lanjut ke task ini
            </div>
          )}

          <div className="space-y-3">
            {secondaryTasks.map((task) => (
              <div
                key={task.id}
                style={{ opacity: frogDone ? 1 : 0.5, pointerEvents: frogDone ? 'auto' : 'none' }}
              >
                <TaskCard
                  task={task}
                  onToggle={toggleTask}
                  compact
                />
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ---- BOTTOM MICRO-COPY ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          🐸 Satu katak per hari membuat extraordinary career.
        </p>
      </motion.div>
    </div>
  );
}

/* ---- The Frog Card ---- */

function TheFrogCard({
  frog,
  onDone,
}: {
  frog:   FrogData;
  onDone: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      animate={isPressed ? { scale: 0.98 } : { scale: 1 }}
      className="relative rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '6px 6px 0px #2B2B2B' }}
    >
      {/* Background accent — coral gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #F04E5918 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Top accent bar */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: 'var(--pt-coral)' }}
        aria-hidden="true"
      />

      <div className="relative p-6 sm:p-8">
        {/* Frog emoji — large, centered */}
        <motion.div
          className="text-center mb-6"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span
            className="inline-block"
            style={{ fontSize: '5rem', lineHeight: 1 }}
            role="img"
            aria-label="Frog — your biggest task"
          >
            🐸
          </span>
        </motion.div>

        {/* Label */}
        <div className="text-center mb-3">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: 'var(--pt-coral)', color: 'white', fontFamily: 'var(--font-body)' }}
          >
            🎯 KATAK HARI INI
          </span>
        </div>

        {/* Task title — BIG */}
        <h2
          className="text-center mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize:   'clamp(1.5rem, 4vw, 2.25rem)',
            color:      'var(--pt-black)',
            lineHeight: 1.15,
          }}
        >
          {frog.title}
        </h2>

        {/* Meta row */}
        <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
          <MetaPill icon="⏱️" label={formatDuration(frog.estimatedMinutes)} />
          {frog.category && frog.category !== 'general' && (
            <MetaPill icon="📁" label={frog.category} />
          )}
          <MetaPill icon="🔴" label="Critical" color="var(--pt-coral)" />
        </div>

        {/* Reason card */}
        <div
          className="rounded-sketch border-2 border-pt-black p-4 mb-6"
          style={{ backgroundColor: 'var(--pt-yellowP)' }}
        >
          <p
            className="text-label font-bold mb-1.5 uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            🧠 Kenapa ini si katak?
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
          >
            {frog.reason}
          </p>
        </div>

        {/* CTA button */}
        <div className="text-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <PTButton
              variant="danger"
              size="lg"
              onClick={onDone}
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              className="text-lg px-8"
            >
              ✅ Katak Selesai!
            </PTButton>
          </motion.div>
          <p
            className="mt-2 text-xs"
            style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
          >
            Klik saat kamu benar-benar selesai mengerjakan ini
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ---- Frog Celebration ---- */

function FrogCelebration({ onUndo }: { onUndo: () => void }) {
  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-8 text-center"
      style={{ backgroundColor: 'var(--pt-green)', boxShadow: '6px 6px 0px #2B2B2B' }}
    >
      {/* Confetti emoji row */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl mb-4 flex justify-center gap-2"
        aria-hidden="true"
      >
        {(['🎉', '🐸', '⭐', '🎊', '🏆'] as const).map((e, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {e}
          </motion.span>
        ))}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-white mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'clamp(1.5rem, 4vw, 2rem)',
        }}
      >
        Katak berhasil dimakan! 🐸
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-white/90 mb-6 text-sm"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Sisanya hari ini akan terasa jauh lebih ringan.
        Kamu sudah selesaikan hal yang paling penting.
      </motion.p>

      <button
        type="button"
        onClick={onUndo}
        className="text-white/60 underline text-xs"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Tandai belum selesai
      </button>
    </div>
  );
}

/* ---- Helper components ---- */

function MetaPill({
  icon, label, color,
}: {
  icon:   string;
  label:  string;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sketch border-2 border-pt-black text-sm font-semibold"
      style={{
        fontFamily:      'var(--font-body)',
        backgroundColor: color ? color + '25' : 'var(--pt-cream)',
        color:           color ?? 'var(--pt-black)',
      }}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

function formatDuration(minutes: number): string {
  if (!minutes) return '?m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}
