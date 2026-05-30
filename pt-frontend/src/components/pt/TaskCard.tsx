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
  onEdit?:    (task: Task) => void;
  onDelete?:  (id: string) => void;
  onAskMoti?: (id: string) => void;
  className?: string;
  compact?:   boolean;    // Compact mode untuk list panjang
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAskMoti,
  className,
  compact = false,
}: TaskCardProps) {
  const isCompleted = Boolean(task.isCompleted ?? task.completed);
  const canToggle = typeof onToggle === 'function';

  function handleToggle() {
    if (canToggle) onToggle(task.id);
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
      {canToggle && (
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
      )}

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

        {/* Subtasks */}
        <AnimatePresence>
          {!compact && task.subtasks && task.subtasks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pl-2 border-l-2 border-pt-black/10 space-y-1.5 overflow-hidden"
            >
              {task.subtasks.map((sub: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}>
                  <span className="text-pt-blue font-bold">↳</span>
                  <span className={isCompleted ? 'line-through opacity-50' : ''}>{sub}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meta row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>

          {/* Action buttons — show on hover on desktop, always on mobile */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-opacity">
            {onAskMoti && !isCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); onAskMoti(task.id); }}
                className="p-1.5 hover:bg-pt-yellowP rounded-full transition-colors text-pt-brown"
                title="Ask Moti to break this down"
              >
                <SparklesIcon size={16} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="p-1.5 hover:bg-pt-blue/10 rounded-full transition-colors text-pt-black/60 hover:text-pt-blue"
                title="Edit Task"
              >
                <EditIcon size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="p-1.5 hover:bg-pt-coral/10 rounded-full transition-colors text-pt-black/60 hover:text-pt-coral"
                title="Delete Task"
              >
                <TrashIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---- Helper functions ---- */

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hLabel = h === 1 ? 'hour' : 'hours';
  return m > 0 ? `${h} ${hLabel} ${m} min` : `${h} ${hLabel}`;
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

function SparklesIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.912 4.912L18.824 9.824 13.912 11.736 12 16.648l-1.912-4.912L5.176 9.824l4.912-1.912L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

function EditIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function TrashIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
