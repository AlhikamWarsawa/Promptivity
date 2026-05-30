'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState }                from 'react';
import { cn }                      from '@/lib/utils';
import { usePTStore }              from '@/store/usePTStore';
import type { Task }               from '@/types/pt.types';

/* ============================================
   RoutineSection — Displays morning or evening
   routine items as a checklist.
   
   Props:
   - title:       "Rutinitas Pagi" / "Rutinitas Malam"
   - icon:        emoji
   - items:       string[] — routine steps
   - accentColor: border + checked color
   - timeLabel:   "06:00 – 09:00" etc.
   ============================================ */

interface RoutineSectionProps {
  title:       string;
  icon:        string;
  items:       (string | Task)[];
  accentColor: string;
  bgColor:     string;
  timeLabel?:  string;
  defaultOpen?:boolean;
}

export function RoutineSection({
  title,
  icon,
  items,
  accentColor,
  bgColor,
  timeLabel,
  defaultOpen = true,
}: RoutineSectionProps) {
  const [isOpen, setIsOpen]     = useState(defaultOpen);
  const [checked, setChecked]   = useState<Set<number>>(new Set());
  const toggleTask = usePTStore((s) => s.toggleTask);

  function toggleItem(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const doneCount = items.reduce((sum, item, index) => {
    if (typeof item === 'string') return sum + (checked.has(index) ? 1 : 0);
    return sum + (item.isCompleted || item.completed ? 1 : 0);
  }, 0);
  const allDone   = items.length > 0 && doneCount === items.length;

  return (
    <div
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{
          backgroundColor: allDone ? 'var(--pt-green)' : bgColor,
          borderBottom:    isOpen ? '2px solid var(--pt-black)' : 'none',
          transition:      'background-color 0.3s',
        }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <div className="text-left">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-h4)',
                color:      allDone ? 'white' : 'var(--pt-black)',
              }}
            >
              {title}
            </h3>
            {timeLabel && (
              <p
                className="text-[11px] font-bold"
                style={{ fontFamily: 'var(--font-body)', color: allDone ? 'rgba(255,255,255,0.8)' : accentColor }}
              >
                {timeLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress */}
          <span
            className="text-label font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-body)', color: allDone ? 'white' : '#6B6B6B' }}
          >
            {doneCount}/{items.length}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: allDone ? 'white' : 'var(--pt-black)', opacity: 0.6 }}
            aria-hidden="true"
          >
            ▾
          </motion.span>
        </div>
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
            <div className="p-4 space-y-2 bg-pt-white">
              {items.length === 0 ? (
                <p className="text-sm text-center py-3"
                  style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}>
                  Tidak ada rutinitas yang terdeteksi dari ceritamu.
                </p>
              ) : (
                items.map((item, i) => {
                  const isTask = typeof item !== 'string';
                  const title = isTask ? item.title : item;
                  const isDone = isTask ? Boolean(item.isCompleted ?? item.completed) : checked.has(i);
                  return (
                    <motion.button
                      key={isTask ? item.id : `${item}-${i}`}
                      type="button"
                      onClick={() => isTask ? toggleTask(item.id) : toggleItem(i)}
                      whileHover={{ x: 2 }}
                      className="w-full flex items-start gap-3 text-left group"
                      aria-pressed={isDone}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'shrink-0 mt-0.5 w-5 h-5 rounded border-2 border-pt-black',
                          'flex items-center justify-center transition-colors duration-150',
                          isDone ? 'bg-pt-green border-pt-green' : 'bg-white group-hover:bg-pt-cream',
                        )}
                        aria-hidden="true"
                      >
                        <AnimatePresence>
                          {isDone && (
                            <motion.svg
                              key="check"
                              width="10" height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.18 }}
                            >
                              <polyline
                                points="1.5,5 4,7.5 8.5,2"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Item text */}
                      <p
                        className="text-sm leading-snug transition-all duration-200"
                        style={{
                          fontFamily:     'var(--font-body)',
                          color:          isDone ? '#9B9B9B' : 'var(--pt-black)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {title}
                      </p>
                    </motion.button>
                  );
                })
              )}

              {/* All done micro-copy */}
              <AnimatePresence>
                {allDone && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-sm font-bold pt-1"
                    style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-green)' }}
                  >
                    🎉 Rutinitas selesai!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
