'use client';

import { motion } from 'framer-motion';

/* ============================================
   ObjectiveCard — Displays the main Objective
   
   Style: Large, inspiring, full-width banner
   dengan accent color OKR (blue)
   ============================================ */

interface ObjectiveCardProps {
  objective:   string;
  totalKRs:    number;
  avgProgress: number;
}

export function ObjectiveCard({
  objective, totalKRs, avgProgress,
}: ObjectiveCardProps) {
  function getOverallStatus(): { label: string; color: string } {
    if (avgProgress >= 70) return { label: 'On Track 🚀',    color: 'var(--pt-green)'  };
    if (avgProgress >= 40) return { label: 'In Progress ⚡', color: 'var(--pt-mustard)' };
    if (avgProgress >= 10) return { label: 'Just Started 🌱', color: 'var(--pt-orange)' };
    return                        { label: 'Not Started 💤',  color: 'var(--pt-coral)'  };
  }

  const status = getOverallStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '5px 5px 0px #2B2B2B' }}
    >
      {/* Top accent */}
      <div
        className="h-2"
        style={{ backgroundColor: 'var(--pt-blue)' }}
        aria-hidden="true"
      />

      <div
        className="p-6"
        style={{ backgroundColor: 'var(--pt-blue)' + '12' }}
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: 'var(--pt-blue)', color: 'white', fontFamily: 'var(--font-body)' }}
          >
            🏆 Objective
          </span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-sketch border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: status.color + '25', color: status.color, fontFamily: 'var(--font-body)' }}
          >
            {status.label}
          </span>
        </div>

        {/* Objective text — big and inspiring */}
        <h2
          className="mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize:   'clamp(1.25rem, 3vw, 1.75rem)',
            color:      'var(--pt-black)',
            lineHeight: 1.3,
          }}
        >
          {objective}
        </h2>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              Overall Progress ({totalKRs} Key Results)
            </span>
            <span
              className="text-label font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-body)', color: status.color }}
            >
              {Math.round(avgProgress)}%
            </span>
          </div>
          <div
            className="w-full h-4 rounded-sketch border-2 border-pt-black overflow-hidden"
            style={{ backgroundColor: 'var(--pt-cream)' }}
          >
            <motion.div
              className="h-full"
              style={{ backgroundColor: status.color }}
              initial={{ width: 0 }}
              animate={{ width: `${avgProgress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
