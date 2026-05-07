'use client';

import { useState, useCallback }    from 'react';
import { motion }                   from 'framer-motion';
import { usePTStore }               from '@/store/usePTStore';

/* ============================================
   KeyResultRow — Single Key Result dengan
   interactive progress slider.
   
   Props:
   - kr:       key result text
   - metric:   measurement description
   - deadline: target date string
   - progress: 0-100
   - index:    untuk Zustand action + animation
   ============================================ */

interface KeyResultRowProps {
  kr:       string;
  metric:   string;
  deadline: string;
  progress: number;
  index:    number;
}

export function KeyResultRow({
  kr, metric, deadline, progress, index,
}: KeyResultRowProps) {
  const updateKRProgress = usePTStore((s) => s.updateKRProgress);
  const [localProgress, setLocalProgress] = useState(progress);
  const [isDragging, setIsDragging]       = useState(false);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setLocalProgress(val);
    },
    [],
  );

  const handleSliderCommit = useCallback(() => {
    setIsDragging(false);
    updateKRProgress(index, localProgress);
  }, [index, localProgress, updateKRProgress]);

  // Progress color
  function getProgressColor(): string {
    if (localProgress >= 70) return 'var(--pt-green)';
    if (localProgress >= 40) return 'var(--pt-mustard)';
    if (localProgress >= 10) return 'var(--pt-orange)';
    return 'var(--pt-coral)';
  }

  function getProgressLabel(): string {
    if (localProgress === 0)   return 'Belum dimulai';
    if (localProgress < 25)    return 'Baru mulai';
    if (localProgress < 50)    return 'Dalam proses';
    if (localProgress < 75)    return 'Hampir setengah';
    if (localProgress < 100)   return 'Hampir selesai';
    return 'Selesai! 🎉';
  }

  const progressColor = getProgressColor();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{
        boxShadow:       '3px 3px 0px #2B2B2B',
        borderLeft:      `5px solid ${progressColor}`,
        backgroundColor: 'var(--pt-white)',
      }}
    >
      <div className="p-4">
        {/* KR number + text */}
        <div className="flex items-start gap-3 mb-3">
          {/* Index pill */}
          <span
            className="shrink-0 w-6 h-6 rounded-sketch border-2 border-pt-black flex items-center justify-center text-label font-bold mt-0.5"
            style={{
              backgroundColor: progressColor,
              color:           localProgress > 0 ? 'white' : 'var(--pt-black)',
              fontFamily:      'var(--font-body)',
            }}
          >
            {index + 1}
          </span>
          <div className="flex-1">
            <p
              className="font-semibold leading-snug"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
            >
              {kr}
            </p>
            {metric && (
              <p
                className="text-sm mt-1"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                📏 {metric}
              </p>
            )}
          </div>
        </div>

        {/* Progress slider */}
        <div className="space-y-2">
          {/* Track + thumb */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={localProgress}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={handleSliderCommit}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={handleSliderCommit}
              onKeyUp={handleSliderCommit}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${progressColor} ${localProgress}%, var(--pt-cream) ${localProgress}%)`,
                border:     '2px solid var(--pt-black)',
                outline:    'none',
              }}
              aria-label={`Progress untuk: ${kr}`}
              aria-valuenow={localProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Progress info row */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-body)', color: progressColor }}
            >
              {getProgressLabel()}
            </span>
            <motion.span
              key={localProgress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-label font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-body)', color: progressColor }}
            >
              {localProgress}%
            </motion.span>
          </div>
        </div>

        {/* Deadline */}
        {deadline && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-sm" aria-hidden="true">🗓️</span>
            <span
              className="text-sm"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              Target: <strong>{deadline}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Progress bar (visual, bottom) */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: 'var(--pt-cream)' }}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: progressColor }}
          animate={{ width: `${localProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
