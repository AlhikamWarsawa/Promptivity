'use client';

import { useState }               from 'react';
import { motion, AnimatePresence }from 'framer-motion';
import { cn }                     from '@/lib/utils';
import { usePTStore }             from '@/store/usePTStore';
import type { Task }              from '@/types/pt.types';

/* ============================================
   PARAItem — Single item in a PARA section.
   
   Variants:
   - project:  has tasks count, progress indicator
   - area:     has description, no tasks
   - resource: has description, optional link icon
   - archive:  muted, strikethrough-ish aesthetic
   
   All variants:
   - Expandable description on click
   - Folder-style left icon
   ============================================ */

export type PARAItemType = 'project' | 'area' | 'resource' | 'archive';

interface PARAItemProps {
  id?:          string;
  name:        string;
  description: string;
  type:        PARAItemType;
  tasks?:      Task[];
  isCompleted?: boolean;
  completed?:  boolean;
  index:       number;
  accentColor: string;
}

const TYPE_CONFIG: Record<PARAItemType, {
  icon:       string;
  bgColor:    string;
  textMuted:  boolean;
}> = {
  project:  { icon: '📁', bgColor: '#E8F4FD', textMuted: false },
  area:     { icon: '🗂️', bgColor: '#F0FADF', textMuted: false },
  resource: { icon: '📎', bgColor: '#FDF5E0', textMuted: false },
  archive:  { icon: '📦', bgColor: '#F3F3F1', textMuted: true  },
};

export function PARAItem({
  id, name, description, type, tasks = [], isCompleted, completed, index, accentColor,
}: PARAItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleTask          = usePTStore((s) => s.toggleTask);
  const config              = TYPE_CONFIG[type];
  const hasContent          = description || tasks.length > 0;
  const itemCompleted       = Boolean(isCompleted ?? completed);
  const completedTasks      = tasks.filter((t) => t.isCompleted ?? t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{
        boxShadow:   hasContent ? '2px 2px 0px #2B2B2B' : 'none',
        opacity:     config.textMuted ? 0.75 : 1,
      }}
    >
      {/* Item row */}
      <button
        type="button"
        onClick={() => hasContent && setIsOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          hasContent ? 'cursor-pointer' : 'cursor-default',
        )}
        style={{ backgroundColor: config.bgColor }}
        aria-expanded={hasContent ? isOpen : undefined}
        disabled={!hasContent}
      >
        {id && (
          <span
            role="checkbox"
            aria-checked={itemCompleted}
            aria-label={itemCompleted ? `Mark "${name}" as incomplete` : `Mark "${name}" as complete`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTask(id);
            }}
            className={cn(
              'shrink-0 w-5 h-5 rounded border-2 border-pt-black flex items-center justify-center text-[11px] font-bold transition-colors',
              itemCompleted ? 'bg-pt-green border-pt-green text-white' : 'bg-white hover:bg-pt-yellowP',
            )}
          >
            {itemCompleted ? '✓' : ''}
          </span>
        )}

        {/* Folder icon */}
        <motion.span
          animate={isOpen ? { rotate: 10, scale: 1.1 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="text-2xl shrink-0"
          aria-hidden="true"
        >
          {isOpen ? '📂' : config.icon}
        </motion.span>

        {/* Name */}
        <span
          className={cn(
            'flex-1 text-left text-sm font-semibold leading-snug',
            (config.textMuted || itemCompleted) && 'line-through opacity-60',
          )}
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          {name}
        </span>

        {/* Task count badge (projects only) */}
        {type === 'project' && tasks.length > 0 && (
          <span
            className="shrink-0 px-2 py-0.5 rounded-full border border-pt-black/30 text-[10px] font-bold"
            style={{
              fontFamily:      'var(--font-body)',
              backgroundColor: accentColor + '30',
              color:           'var(--pt-black)',
            }}
          >
            {completedTasks}/{tasks.length}
          </span>
        )}

        {/* Expand chevron */}
        {hasContent && (
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 text-sm"
            style={{ color: '#9B9B9B' }}
            aria-hidden="true"
          >
            ▾
          </motion.span>
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t-2 border-pt-black/10 bg-pt-white space-y-2">
              {/* Description */}
              {description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
                >
                  {description}
                </p>
              )}

              {/* Task list (projects only) */}
              {tasks.length > 0 && (
                <div className="space-y-1 mt-2">
                  {tasks.map((task, ti) => {
                    const taskCompleted = Boolean(task.isCompleted ?? task.completed);
                    return (
                    <div
                      key={task.id ?? ti}
                      className="flex items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          'w-4 h-4 rounded border border-pt-black/30 flex items-center justify-center text-[10px]',
                          taskCompleted
                            ? 'bg-pt-green border-pt-green'
                            : 'bg-white',
                        )}
                        role="checkbox"
                        aria-checked={taskCompleted}
                        aria-label={taskCompleted ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                      >
                        {taskCompleted ? '✓' : ''}
                      </button>
                      <span
                        className={cn(
                          'text-xs',
                          taskCompleted && 'line-through opacity-50',
                        )}
                        style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
                      >
                        {task.title}
                      </span>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
