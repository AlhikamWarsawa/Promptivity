'use client';

import { useState }                from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn }                      from '@/lib/utils';
import { usePTStore }              from '@/store/usePTStore';
import type { Task }               from '@/types/pt.types';

/* ============================================
   ReviewSection — Collapsible section untuk
   Weekly Review (Wins / Lessons / Next Week).
   
   Setiap item tampil sebagai read-only card
   yang bisa di-expand untuk detail.
   ============================================ */

interface ReviewSectionProps {
  title:       string;
  icon:        string;
  items:       (string | Task)[];
  accentColor: string;
  bgColor:     string;
  emptyText:   string;
  defaultOpen?: boolean;
  itemStyle?:  'win' | 'lesson' | 'focus';
}

export function ReviewSection({
  title, icon, items,
  accentColor, bgColor,
  emptyText,
  defaultOpen = true,
  itemStyle   = 'win',
}: ReviewSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggleTask = usePTStore((s) => s.toggleTask);

  // Item prefix icon per style
  const PREFIX: Record<string, string> = {
    win:    '✅',
    lesson: '💡',
    focus:  '→',
  };
  const prefix = PREFIX[itemStyle] ?? '•';

  return (
    <div
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5"
        style={{
          backgroundColor: bgColor,
          borderBottom:    isOpen ? '2px solid var(--pt-black)' : 'none',
          cursor:          'pointer',
        }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <div className="text-left">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-h4)',
                color:      'var(--pt-black)',
              }}
            >
              {title}
            </h3>
            <p
              className="text-[11px] font-bold"
              style={{ fontFamily: 'var(--font-body)', color: accentColor }}
            >
              {items.length} item
            </p>
          </div>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-pt-black/50 text-lg"
          aria-hidden="true"
        >
          ▾
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2.5 bg-pt-white">
              {items.length === 0 ? (
                <p
                  className="text-sm text-center py-4"
                  style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
                >
                  {emptyText}
                </p>
              ) : (
                items.map((item, i) => {
                  const isTask = typeof item !== 'string';
                  const title = isTask ? item.title : item;
                  const isCompleted = isTask ? Boolean(item.isCompleted ?? item.completed) : false;

                  return (
                  <motion.div
                    key={isTask ? item.id : `${item}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-sketch border border-pt-black/15',
                    )}
                    style={{ backgroundColor: bgColor + '60' }}
                  >
                    {isTask ? (
                      <button
                        type="button"
                        onClick={() => toggleTask(item.id)}
                        className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 border-pt-black flex items-center justify-center text-[11px] font-bold ${isCompleted ? 'bg-pt-green border-pt-green text-white' : 'bg-white hover:bg-pt-yellowP'}`}
                        role="checkbox"
                        aria-checked={isCompleted}
                        aria-label={isCompleted ? `Mark "${title}" as incomplete` : `Mark "${title}" as complete`}
                      >
                        {isCompleted ? '✓' : ''}
                      </button>
                    ) : (
                      <span
                        className="shrink-0 text-base mt-0.5"
                        aria-hidden="true"
                      >
                        {itemStyle === 'focus' ? (
                          <span
                            className="font-bold text-sm"
                            style={{ color: accentColor }}
                          >
                            {i + 1}.
                          </span>
                        ) : (
                          prefix
                        )}
                      </span>
                    )}

                    <p
                      className={`text-sm leading-relaxed ${isCompleted ? 'line-through opacity-50' : ''}`}
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
                    >
                      {title}
                    </p>
                  </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
