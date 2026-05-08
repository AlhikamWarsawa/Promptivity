'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn }                      from '@/lib/utils';
import { PriorityBadge }           from '@/components/pt/PTBadge';
import type { Task }               from '@/types/pt.types';

/* ============================================
   TaskCard — Interactive task display card
   
   Features:
   - Animated checkbox (sketch-style)
   - Priority badge dengan warna
   - Estimasi waktu + kategori label
   - Strikethrough animation saat completed
   - Hover lift effect
   ============================================ */

interface TaskCardProps {
  task:       Task;
  onToggle?:  (id: string) => void;
  className?: string;
  compact?:   boolean;    // Compact mode untuk list panjang
}

export function TaskCard({
  task,
  onToggle,
  className,
  compact = false,
}: TaskCardProps) {
  const isCompleted = task.isCompleted;

  function handleToggle() {
    onToggle?.(task.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={!isCompleted ? { y: -1 } : {}}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group flex items-start gap-3',
        compact ? 'p-3' : 'p-4',
        'rounded-sketch border-2 border-pt-black',
        'transition-all duration-200',
        isCompleted
          ? 'opacity-60'
          : 'bg-pt-white shadow-sketch hover:shadow-sketch-lg hover:-translate-x-px hover:-translate-y-px',
        className,
      )}
      style={isCompleted ? { backgroundColor: 'var(--pt-cream)' } : {}}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'shrink-0 mt-0.5',
          compact ? 'w-5 h-5' : 'w-6 h-6',
          'rounded border-2 border-pt-black',
          'flex items-center justify-center',
          'transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-pt-blue focus-visible:outline-offset-2',
          isCompleted
            ? 'bg-pt-green border-pt-green'
            : 'bg-white hover:bg-pt-yellowP',
        )}
        aria-label={isCompleted ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
        aria-checked={isCompleted}
        role="checkbox"
      >
        <AnimatePresence>
          {isCompleted && (
            <motion.svg
              key="check"
              width="12" height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                points="2,6 5,9 10,3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'font-semibold leading-snug relative inline-block',
              compact ? 'text-sm' : 'text-body',
              'transition-colors duration-300',
              isCompleted ? 'text-[#9B9B9B]' : 'text-pt-black',
            )}
            style={{
              fontFamily: 'var(--font-body)',
              backgroundImage: 'linear-gradient(currentColor, currentColor)',
              backgroundSize: isCompleted ? '100% 2px' : '0% 2px',
              backgroundPosition: '0 50%',
              backgroundRepeat: 'no-repeat',
              transition: 'background-size 0.3s ease-out, color 0.3s ease-out',
            }}
          >
            {task.title}
          </p>

          {/* Priority badge — only show if not compact, or critical */}
          {(!compact || task.priority === 'critical') && (
            <PriorityBadge
              priority={task.priority}
              size="sm"
              showIcon={!compact}
              className="shrink-0"
            />
          )}
        </div>

        {/* Description (non-compact only) */}
        {!compact && task.description && (
          <p
            className="mt-1 text-sm leading-snug"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Time estimate */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            <ClockIcon />
            {formatDuration(task.estimatedMinutes)}
          </span>

          {/* Category */}
          {task.category && task.category !== 'general' && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-pt-black/20"
              style={{
                fontFamily:      'var(--font-body)',
                color:           'var(--pt-black)',
                backgroundColor: getCategoryBg(task.category),
              }}
            >
              {task.category}
            </span>
          )}

          {/* Deadline */}
          {task.deadline && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{
                fontFamily: 'var(--font-body)',
                color:      isDeadlineSoon(task.deadline)
                  ? 'var(--pt-coral)'
                  : '#6B6B6B',
              }}
            >
              <CalendarIcon />
              {task.deadline}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ---- Helper functions ---- */

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    work:     'var(--pt-cyan)',
    personal: 'var(--pt-lime)',
    health:   'var(--pt-green)',
    learning: 'var(--pt-blue)',
    other:    'var(--pt-cream)',
  };
  return map[category] ?? 'var(--pt-cream)';
}

function isDeadlineSoon(deadline: string): boolean {
  try {
    const d = new Date(deadline);
    const now = new Date();
    const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  } catch {
    return false;
  }
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
