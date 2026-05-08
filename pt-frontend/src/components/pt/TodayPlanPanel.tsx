'use client';

import { useState }  from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn }        from '@/lib/utils';

/* ============================================
   TodayPlanPanel — Sticky note style panel
   Menampilkan 3-5 aksi yang perlu dilakukan hari ini.
   
   Design: sticky note kuning, slight rotation,
   border sketch, Gaegu font.
   ============================================ */

interface TodayPlanPanelProps {
  actions:    string[];
  className?: string;
}

export function TodayPlanPanel({ actions, className }: TodayPlanPanelProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggleAction(index: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const allDone    = actions.length > 0 && checked.size === actions.length;
  const doneCount  = checked.size;

  return (
    <motion.div
      initial={{ opacity: 0, rotate: 0, y: 20 }}
      animate={{ opacity: 1, rotate: -1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative', className)}
    >
      {/* Tape at top — decorative */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 rounded-sm border border-pt-black/20 z-10"
        style={{ backgroundColor: 'rgba(249, 231, 122, 0.7)' }}
        aria-hidden="true"
      />

      <div
        className="rounded-sketch border-2 border-pt-black p-5"
        style={{
          backgroundColor: 'var(--pt-yellowP)',
          boxShadow:       '4px 4px 0px #2B2B2B',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h4)',
              color:      'var(--pt-black)',
            }}
          >
            🎯 Rencana Hari Ini
          </h3>
          {actions.length > 0 && (
            <span
              className="text-label font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              {doneCount}/{actions.length}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {actions.length > 0 && (
          <div
            className="w-full h-2 rounded-full border border-pt-black/20 overflow-hidden mb-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--pt-green)' }}
              animate={{ width: `${(doneCount / actions.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        {/* Actions list */}
        {actions.length === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            Belum ada rencana hari ini.
          </p>
        ) : (
          <ul className="space-y-3">
            {actions.map((action, i) => {
              const isDone = checked.has(i);
              return (
                <motion.li
                  key={i}
                  layout
                  className="flex items-start gap-2.5 cursor-pointer group"
                  onClick={() => toggleAction(i)}
                >
                  {/* Checkbox dot */}
                  <div
                    className={cn(
                      'shrink-0 mt-0.5 w-5 h-5 rounded border-2 border-pt-black',
                      'flex items-center justify-center transition-colors duration-150',
                      isDone ? 'bg-pt-green border-pt-green' : 'bg-white group-hover:bg-pt-white',
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
                          transition={{ duration: 0.2 }}
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

                  {/* Action text */}
                  <p
                    className={cn(
                      'text-sm leading-snug transition-all duration-200',
                      isDone && 'line-through opacity-50',
                    )}
                    style={{
                      fontFamily: 'var(--font-body)',
                      color:      'var(--pt-black)',
                    }}
                  >
                    {action}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        )}

        {/* All done celebration */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-4 text-center"
            >
              <p
                className="text-base font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-green)' }}
              >
                🎉 Semua selesai! Luar biasa!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
