'use client';

import { useSortable }     from '@dnd-kit/sortable';
import { CSS }             from '@dnd-kit/utilities';
import { motion }          from 'framer-motion';
import { PriorityBadge }   from '@/components/pt/PTBadge';
import { usePTStore }      from '@/store/usePTStore';
import type { Task }       from '@/types/pt.types';

/* ============================================
   KanbanCard — Draggable card untuk Kanban board
   Memakai @dnd-kit/sortable untuk drag behavior
   ============================================ */

interface KanbanCardProps {
  task:     Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const toggleTask = usePTStore((s) => s.toggleTask);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortableDragging ? 0.4 : 1,
  };
  const isCompleted = Boolean(task.isCompleted ?? task.completed);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        className="p-3 rounded-sketch border-2 border-pt-black bg-pt-white cursor-grab active:cursor-grabbing"
        style={{
          boxShadow: isSortableDragging ? '5px 5px 0px #2B2B2B' : '2px 2px 0px #2B2B2B',
          userSelect: 'none',
          opacity: isCompleted ? 0.65 : 1,
        }}
        whileHover={{ y: -1 }}
        {...listeners}
      >
        {/* Priority dot */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleTask(task.id);
            }}
            className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 border-pt-black flex items-center justify-center transition-colors ${isCompleted ? 'bg-pt-green border-pt-green text-white' : 'bg-white hover:bg-pt-yellowP'}`}
            role="checkbox"
            aria-checked={isCompleted}
            aria-label={isCompleted ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
          >
            {isCompleted ? '✓' : ''}
          </button>
          <p
            className={`text-sm font-semibold leading-snug flex-1 ${isCompleted ? 'line-through' : ''}`}
            style={{ fontFamily: 'var(--font-body)', color: isCompleted ? '#9B9B9B' : 'var(--pt-black)' }}
          >
            {task.title}
          </p>
          <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {task.category && task.category !== 'general' && (
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border border-pt-black/20"
              style={{
                fontFamily:      'var(--font-body)',
                backgroundColor: getCategoryBg(task.category),
                color:           'var(--pt-black)',
              }}
            >
              {task.category}
            </span>
          )}
          <span
            className="text-[10px] font-medium ml-auto"
            style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
          >
            {formatDuration(task.estimatedMinutes)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ---- Drag overlay (shown while dragging) ---- */
export function KanbanCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className="p-3 rounded-sketch border-2 border-pt-black bg-pt-white rotate-2"
      style={{
        boxShadow:  '6px 6px 0px #2B2B2B',
        userSelect: 'none',
        cursor:     'grabbing',
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
      >
        {task.title}
      </p>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    work:     '#E0F9FE', personal: '#F0FADF',
    health:   '#E0F8EE', learning: '#E8F4FD', other: '#E9DCCF',
  };
  return map[category] ?? '#E9DCCF';
}
