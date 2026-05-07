'use client';

import { motion } from 'framer-motion';
import { cn }     from '@/lib/utils';

/* ============================================
   TimeBlock — Single block di timeline harian
   Height proporsional dengan durasi task
   ============================================ */

interface TimeBlockProps {
  time:        string;       // "09:00"
  task:        string;
  duration:    number;       // menit
  category:    string;
  priority?:   string;
  pixelsPerMinute: number;   // untuk kalkulasi height
  index:       number;       // untuk stagger animation
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  work:     { bg: '#E0F9FE', border: '#35D5F4', text: '#2B2B2B' },
  personal: { bg: '#F0FADF', border: '#9AD84B', text: '#2B2B2B' },
  health:   { bg: '#E0F8EE', border: '#17B66A', text: '#2B2B2B' },
  learning: { bg: '#E8F4FD', border: '#2196E8', text: '#2B2B2B' },
  other:    { bg: '#E9DCCF', border: '#E9B12A', text: '#2B2B2B' },
};

export function TimeBlock({
  time, task, duration, category, priority, pixelsPerMinute, index,
}: TimeBlockProps) {
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
  const height  = Math.max(duration * pixelsPerMinute, 40);   // Minimum 40px
  const isShort = height < 60;

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.7, originY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-sketch border-2 border-pt-black overflow-hidden',
        'group relative cursor-default',
        'transition-shadow duration-150 hover:shadow-sketch-lg',
      )}
      style={{
        height:          `${height}px`,
        backgroundColor: colors.bg,
        borderLeftColor: colors.border,
        borderLeftWidth: '5px',
        boxShadow:       '2px 2px 0px #2B2B2B',
      }}
      title={`${time} — ${task} (${duration}m)`}
    >
      {/* Content */}
      <div className="px-3 py-2 h-full flex flex-col justify-between overflow-hidden">
        <div>
          {/* Time */}
          <p
            className="text-[10px] font-bold"
            style={{ fontFamily: 'var(--font-body)', color: colors.border }}
          >
            {time}
          </p>
          {/* Task title */}
          <p
            className={cn(
              'font-semibold leading-tight',
              isShort ? 'text-[11px]' : 'text-sm',
            )}
            style={{
              fontFamily:  'var(--font-body)',
              color:       colors.text,
              overflow:    'hidden',
              display:     '-webkit-box',
              WebkitLineClamp: isShort ? 1 : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {task}
          </p>
        </div>

        {/* Bottom meta (only if tall enough) */}
        {!isShort && (
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-pt-black/20"
              style={{ fontFamily: 'var(--font-body)', backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              {category}
            </span>
            <span
              className="text-[10px] ml-auto"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              {duration}m
            </span>
          </div>
        )}
      </div>

      {/* Priority indicator — coral dot top-right */}
      {priority === 'critical' && (
        <div
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-pt-black"
          style={{ backgroundColor: 'var(--pt-coral)' }}
          aria-label="Critical priority"
        />
      )}
    </motion.div>
  );
}
