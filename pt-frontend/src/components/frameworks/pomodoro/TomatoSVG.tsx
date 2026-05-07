'use client';

import { motion } from 'framer-motion';

/* ============================================
   TomatoSVG — Handmade tomat SVG mascot
   Style: kids book, sketch, imperfect, fun

   Props:
   - size:      px size
   - isActive:  apakah timer sedang berjalan (animasi berbeda)
   - progress:  0–1 (1 = full, 0 = empty)
   ============================================ */

interface TomatoSVGProps {
  size?:      number;
  isActive?:  boolean;
  progress?:  number;    // 0–1 (1 = full, 0 = empty)
  className?: string;
}

export function TomatoSVG({
  size      = 120,
  isActive  = false,
  progress  = 1,
  className,
}: TomatoSVGProps) {
  const cx = size / 2;
  const cy = size / 2 + size * 0.05;
  const r  = size * 0.38;

  // Progress arc — strokeDashoffset decreases as time runs
  const circumference = 2 * Math.PI * r;
  const dashOffset    = circumference * (1 - progress);

  return (
    <motion.div
      className={className}
      animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{ display: 'inline-block' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Tomato timer — Moti's Pomodoro mascot"
      >
        {/* Shadow */}
        <ellipse
          cx={cx + 3}
          cy={cy + 3 + r * 0.1}
          rx={r * 0.95}
          ry={r * 0.25}
          fill="#2B2B2B"
          opacity="0.12"
        />

        {/* Progress ring (track) */}
        <circle
          cx={cx} cy={cy} r={r}
          stroke="#2B2B2B"
          strokeWidth={size * 0.04}
          strokeOpacity={0.12}
          fill="none"
        />

        {/* Progress ring (fill) — drain as time passes */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          stroke="var(--pt-orange, #F28C28)"
          strokeWidth={size * 0.04}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform:       'rotate(-90deg)',
          }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />

        {/* Main tomato body */}
        <motion.circle
          cx={cx} cy={cy} r={r * 0.88}
          fill="#F04E59"
          stroke="#2B2B2B"
          strokeWidth={size * 0.03}
          animate={isActive
            ? { fill: ['#F04E59', '#F28C28', '#F04E59'] }
            : { fill: '#F04E59' }}
          transition={isActive ? { duration: 2, repeat: Infinity } : {}}
        />

        {/* Shine spot — top left */}
        <ellipse
          cx={cx - r * 0.25}
          cy={cy - r * 0.3}
          rx={r * 0.18}
          ry={r * 0.12}
          fill="white"
          opacity={0.35}
          transform={`rotate(-30 ${cx - r * 0.25} ${cy - r * 0.3})`}
        />

        {/* Stem */}
        <path
          d={`M${cx},${cy - r * 0.85} C${cx},${cy - r * 1.3} ${cx + r * 0.15},${cy - r * 1.45} ${cx + r * 0.1},${cy - r * 1.6}`}
          stroke="#17B66A"
          strokeWidth={size * 0.04}
          strokeLinecap="round"
          fill="none"
        />

        {/* Leaf left */}
        <path
          d={`M${cx},${cy - r * 0.88} C${cx - r * 0.35},${cy - r * 1.25} ${cx - r * 0.55},${cy - r * 1.0} ${cx - r * 0.3},${cy - r * 0.85}`}
          fill="#17B66A"
          stroke="#2B2B2B"
          strokeWidth={size * 0.025}
        />
        {/* Leaf right */}
        <path
          d={`M${cx},${cy - r * 0.88} C${cx + r * 0.35},${cy - r * 1.25} ${cx + r * 0.55},${cy - r * 1.0} ${cx + r * 0.3},${cy - r * 0.85}`}
          fill="#9AD84B"
          stroke="#2B2B2B"
          strokeWidth={size * 0.025}
        />

        {/* Face — changes based on isActive */}
        {isActive ? (
          // Active: focused/determined face
          <>
            <ellipse cx={cx - r * 0.28} cy={cy + r * 0.05} rx={r * 0.12} ry={r * 0.14}
              fill="#2B2B2B" />
            <ellipse cx={cx + r * 0.28} cy={cy + r * 0.05} rx={r * 0.12} ry={r * 0.14}
              fill="#2B2B2B" />
            {/* Determined mouth — flat line */}
            <path
              d={`M${cx - r * 0.2},${cy + r * 0.35} L${cx + r * 0.2},${cy + r * 0.35}`}
              stroke="#2B2B2B"
              strokeWidth={size * 0.03}
              strokeLinecap="round"
            />
          </>
        ) : (
          // Idle: happy eyes + smile
          <>
            <circle cx={cx - r * 0.28} cy={cy + r * 0.05} r={r * 0.1} fill="#2B2B2B" />
            <circle cx={cx + r * 0.28} cy={cy + r * 0.05} r={r * 0.1} fill="#2B2B2B" />
            {/* White eye glints */}
            <circle cx={cx - r * 0.24} cy={cy + r * 0.02} r={r * 0.035} fill="white" />
            <circle cx={cx + r * 0.32} cy={cy + r * 0.02} r={r * 0.035} fill="white" />
            {/* Smile */}
            <path
              d={`M${cx - r * 0.22},${cy + r * 0.3} Q${cx},${cy + r * 0.48} ${cx + r * 0.22},${cy + r * 0.3}`}
              stroke="#2B2B2B"
              strokeWidth={size * 0.03}
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </svg>
    </motion.div>
  );
}
