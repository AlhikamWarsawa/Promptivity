'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ============================================
   HandDrawnDivider — SVG wavy line separator
   
   Variants:
   - wave    → wavy line (default)
   - zigzag  → zigzag pattern
   - dots    → dotted line
   - scribble → hand-scribbled feel
   
   Colors diambil dari palette PT
   ============================================ */

type DividerVariant = 'wave' | 'zigzag' | 'dots' | 'scribble';

export interface HandDrawnDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DividerVariant;
  color?: string;
  height?: number;
  strokeWidth?: number;
  label?: string;
}

const DIVIDER_PATHS: Record<DividerVariant, string> = {
  wave: 'M0,6 C20,0 40,12 60,6 C80,0 100,12 120,6 C140,0 160,12 180,6 C200,0 220,12 240,6 C260,0 280,12 300,6',
  zigzag: 'M0,10 L30,2 L60,10 L90,2 L120,10 L150,2 L180,10 L210,2 L240,10 L270,2 L300,10',
  dots: 'M0,6 L300,6',
  scribble: 'M0,6 C10,3 15,9 25,5 C35,1 42,10 55,6 C68,2 72,11 85,5 C98,-1 108,12 120,6 C132,0 140,10 155,7 C170,4 175,9 190,5 C205,1 215,11 230,6 C245,1 255,10 270,7 C285,4 292,8 300,6',
};

export function HandDrawnDivider({
  variant = 'wave',
  color = '#2B2B2B',
  height = 12,
  strokeWidth = 2,
  label,
  className,
  ...props
}: HandDrawnDividerProps) {
  const path = DIVIDER_PATHS[variant];
  const isDots = variant === 'dots';

  return (
    <div
      className={cn('flex items-center gap-3 w-full my-4', className)}
      role="separator"
      aria-label={label ?? 'Section divider'}
      {...props}
    >
      {/* Left line */}
      <div className="flex-1 overflow-hidden">
        <svg
          viewBox={`0 0 300 ${height * 2}`}
          height={height}
          preserveAspectRatio="none"
          className="w-full"
          aria-hidden="true"
        >
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={isDots ? '1 12' : undefined}
          />
        </svg>
      </div>

      {/* Optional label */}
      {label && (
        <span
          className="text-xs font-bold whitespace-nowrap px-2 shrink-0"
          style={{ color, fontFamily: 'var(--font-display)' }}
        >
          {label}
        </span>
      )}

      {/* Right line (only when label present) */}
      {label && (
        <div className="flex-1 overflow-hidden">
          <svg
            viewBox={`0 0 300 ${height * 2}`}
            height={height}
            preserveAspectRatio="none"
            className="w-full"
            aria-hidden="true"
          >
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isDots ? '1 12' : undefined}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
