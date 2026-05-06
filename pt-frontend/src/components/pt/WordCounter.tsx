'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ============================================
   WordCounter — Animated word count display
   dengan progress bar menuju minimum threshold
   
   Props:
   - wordCount:   current word count
   - minWords:    minimum untuk enable submit (50)
   - className:   optional
   ============================================ */

interface WordCounterProps {
  wordCount:  number;
  minWords:   number;
  className?: string;
}

export function WordCounter({ wordCount, minWords, className }: WordCounterProps) {
  const isReady      = wordCount >= minWords;
  const progress     = Math.min((wordCount / minWords) * 100, 100);
  const remaining    = Math.max(minWords - wordCount, 0);

  // Status text
  function getStatusText(): string {
    if (wordCount === 0)       return 'Mulai cerita kamu...';
    if (wordCount < 10)        return 'Bagus, lanjutkan! 📝';
    if (wordCount < 25)        return 'Semakin detail, semakin baik!';
    if (wordCount < minWords)  return `${remaining} kata lagi untuk mulai proses`;
    if (wordCount < 100)       return 'PT siap memproses ceritamu! ✅';
    if (wordCount < 200)       return 'Cerita yang detail, mission akan lebih akurat! 🎯';
    return 'Cerita lengkap! AI akan punya banyak konteks. 🚀';
  }

  // Progress bar color
  function getProgressColor(): string {
    if (progress < 40) return 'var(--pt-coral)';
    if (progress < 80) return 'var(--pt-mustard)';
    return 'var(--pt-green)';
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full border border-pt-black/20 overflow-hidden"
        style={{ backgroundColor: 'var(--pt-cream)' }}
        role="progressbar"
        aria-valuenow={wordCount}
        aria-valuemin={0}
        aria-valuemax={minWords}
        aria-label={`${wordCount} dari ${minWords} kata minimum`}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getProgressColor() }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Counter row */}
      <div className="flex items-center justify-between">
        {/* Status message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={getStatusText()}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-sm"
            style={{
              fontFamily: 'var(--font-body)',
              color: isReady ? 'var(--pt-green)' : '#6B6B6B',
              fontWeight: isReady ? 600 : 400,
            }}
          >
            {getStatusText()}
          </motion.p>
        </AnimatePresence>

        {/* Word count number */}
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.span
            key={wordCount}
            initial={{ scale: 1.3, color: 'var(--pt-blue)' }}
            animate={{ scale: 1, color: isReady ? '#17B66A' : '#2B2B2B' }}
            transition={{ duration: 0.25 }}
            className="text-sm font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {wordCount}
          </motion.span>
          <span
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            / {minWords} kata min
          </span>
        </div>
      </div>
    </div>
  );
}
