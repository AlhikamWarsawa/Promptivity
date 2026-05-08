'use client';

import { motion } from 'framer-motion';
import { cn }     from '@/lib/utils';

/* ============================================
   ScoreBar — Visual score display
   Dipakai di TopRecommendationCard dan FrameworkCard
   
   Variants:
   - bar    → horizontal progress bar
   - stars  → 5-star rating (score/20)
   - number → simple "87/100" display
   ============================================ */

interface ScoreBarProps {
  score:     number;      // 0–100
  variant?:  'bar' | 'stars' | 'compact';
  color?:    string;      // hex override
  showLabel?:boolean;
  className?:string;
  size?:     'sm' | 'md' | 'lg';
}

export function ScoreBar({
  score,
  variant   = 'bar',
  color,
  showLabel = true,
  className,
  size      = 'md',
}: ScoreBarProps) {
  // Auto-color berdasarkan score
  function getScoreColor(): string {
    if (color) return color;
    if (score >= 80) return 'var(--pt-green)';
    if (score >= 60) return 'var(--pt-mustard)';
    if (score >= 40) return 'var(--pt-orange)';
    return 'var(--pt-coral)';
  }

  function getScoreLabel(): string {
    if (score >= 85) return 'Sangat Cocok';
    if (score >= 70) return 'Cocok';
    if (score >= 50) return 'Cukup Cocok';
    if (score >= 30) return 'Kurang Cocok';
    return 'Tidak Cocok';
  }

  const scoreColor = getScoreColor();

  if (variant === 'stars') {
    const filledStars = Math.round(score / 20);
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base',
            )}
            style={{ color: i < filledStars ? scoreColor : '#D1D1CF' }}
            aria-hidden="true"
          >
            ★
          </motion.span>
        ))}
        {showLabel && (
          <span
            className="ml-1 text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: scoreColor }}
          >
            {score}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className="relative flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--pt-cream)' }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: scoreColor }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </div>
        <span
          className="text-label font-bold tabular-nums shrink-0"
          style={{ fontFamily: 'var(--font-body)', color: scoreColor, minWidth: '28px' }}
        >
          {score}
        </span>
      </div>
    );
  }

  // Default: 'bar'
  const barHeight = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: scoreColor }}
          >
            {getScoreLabel()}
          </span>
          <span
            className="text-label font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-body)', color: scoreColor }}
          >
            {score}/100
          </span>
        </div>
      )}
      <div
        className={cn('w-full rounded-sketch border border-pt-black/20 overflow-hidden', barHeight)}
        style={{ backgroundColor: 'var(--pt-cream)' }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match score: ${score} out of 100`}
      >
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: scoreColor }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
    </div>
  );
}
