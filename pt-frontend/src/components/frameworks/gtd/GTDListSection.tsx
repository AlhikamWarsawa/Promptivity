'use client';

import { useState }         from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn }               from '@/lib/utils';
import { TaskCard }         from '@/components/pt/TaskCard';
import { usePTStore }       from '@/store/usePTStore';
import type { Task }        from '@/types/pt.types';

/* ============================================
   GTDListSection — Reusable section untuk
   setiap "bucket" dalam GTD:
   Inbox / Next Actions / Waiting For / Projects / Someday
   
   Props:
   - title:      Nama section (e.g. "Next Actions")
   - icon:       Emoji icon
   - items:      Array of string atau Task
   - accentColor:untuk left border
   - type:       'task' | 'text' — render TaskCard atau string item
   - collapsible:bisa di-collapse/expand
   ============================================ */

interface GTDListSectionProps {
  title:       string;
  icon:        string;
  items:       (Task | string)[];
  accentColor: string;
  type?:       'task' | 'text';
  collapsible?:boolean;
  defaultOpen?:boolean;
  emptyText?:  string;
  className?:  string;
}

export function GTDListSection({
  title,
  icon,
  items,
  accentColor,
  type        = 'task',
  collapsible = true,
  defaultOpen = true,
  emptyText   = 'Tidak ada item di sini.',
  className,
}: GTDListSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggleTask           = usePTStore((s) => s.toggleTask);

  return (
    <div
      className={cn('rounded-sketch border-2 border-pt-black overflow-hidden', className)}
      style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
    >
      {/* Section header */}
      <button
        type="button"
        onClick={() => collapsible && setIsOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          collapsible && 'cursor-pointer hover:brightness-95 transition-all',
        )}
        style={{ backgroundColor: accentColor + '25', borderBottom: isOpen ? '2px solid #2B2B2B' : 'none' }}
        aria-expanded={isOpen}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h4)',
              color:      'var(--pt-black)',
            }}
          >
            {title}
          </h3>
          {/* Count badge */}
          <span
            className="px-2 py-0.5 rounded-full border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: items.length > 0 ? accentColor : 'var(--pt-cream)', fontFamily: 'var(--font-body)' }}
          >
            {items.length}
          </span>
        </div>

        {collapsible && (
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-pt-black/50"
            aria-hidden="true"
          >
            ▾
          </motion.span>
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 bg-pt-white">
              {items.length === 0 ? (
                <p
                  className="text-sm text-center py-4"
                  style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
                >
                  {emptyText}
                </p>
              ) : type === 'task' ? (
                // Render TaskCards
                (items as Task[]).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    compact
                  />
                ))
              ) : (
                items.map((item, i) => (
                  typeof item === 'string' ? (
                    <motion.div
                      key={`${item}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-2.5"
                    >
                      <span
                        className="shrink-0 w-5 h-5 rounded-full border-2 border-pt-black mt-0.5 flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: accentColor + '40', fontFamily: 'var(--font-body)' }}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <p
                        className="text-sm leading-snug"
                        style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
                      >
                        {item}
                      </p>
                    </motion.div>
                  ) : (
                    <TaskCard
                      key={item.id}
                      task={item}
                      onToggle={toggleTask}
                      compact
                    />
                  )
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
