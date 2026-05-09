'use client';

import { motion }           from 'framer-motion';
import { TaskCard }         from '@/components/pt/TaskCard';
import { usePTStore }       from '@/store/usePTStore';
import type { Task }        from '@/types/pt.types';

/* ============================================
   EisenhowerQuadrant — Single quadrant cell

   4 quadrants:
   - doNow:     Urgent + Penting        (coral)
   - schedule:  Tidak Urgent + Penting  (blue)
   - delegate:  Urgent + Tidak Penting  (mustard)
   - eliminate: Tidak Urgent + Tidak Penting (lime)
   ============================================ */

export type QuadrantId = 'doNow' | 'schedule' | 'delegate' | 'eliminate';

interface QuadrantConfig {
  id:          QuadrantId;
  title:       string;
  subtitle:    string;
  icon:        string;
  bgColor:     string;
  accentColor: string;
  textColor:   string;
  actionText:  string;
  emptyText:   string;
}

export const QUADRANT_CONFIG: Record<QuadrantId, QuadrantConfig> = {
  doNow: {
    id:          'doNow',
    title:       'Kerjakan Sekarang',
    subtitle:    'Urgent + Penting',
    icon:        '🔥',
    bgColor:     '#FEE8EA',
    accentColor: '#F04E59',
    textColor:   '#2B2B2B',
    actionText:  'Task ini HARUS selesai hari ini.',
    emptyText:   'Tidak ada task yang sangat mendesak. Bagus!',
  },
  schedule: {
    id:          'schedule',
    title:       'Jadwalkan',
    subtitle:    'Tidak Urgent + Penting',
    icon:        '📅',
    bgColor:     '#E8F4FD',
    accentColor: '#2196E8',
    textColor:   '#2B2B2B',
    actionText:  'Blok waktu khusus untuk task ini.',
    emptyText:   'Tidak ada task yang perlu dijadwalkan.',
  },
  delegate: {
    id:          'delegate',
    title:       'Delegasikan',
    subtitle:    'Urgent + Tidak Penting',
    icon:        '🤝',
    bgColor:     '#FDF5E0',
    accentColor: '#E9B12A',
    textColor:   '#2B2B2B',
    actionText:  'Cari orang lain yang bisa mengerjakan ini.',
    emptyText:   'Tidak ada task yang bisa didelegasikan.',
  },
  eliminate: {
    id:          'eliminate',
    title:       'Eliminasi',
    subtitle:    'Tidak Urgent + Tidak Penting',
    icon:        '🗑️',
    bgColor:     '#F0FADF',
    accentColor: '#9AD84B',
    textColor:   '#2B2B2B',
    actionText:  'Pertimbangkan untuk menghapus task ini.',
    emptyText:   'Tidak ada task yang perlu dieliminasi.',
  },
};

interface EisenhowerQuadrantProps {
  quadrantId: QuadrantId;
  tasks:      Task[];
  index:      number;      // untuk stagger animation
}

export function EisenhowerQuadrant({
  quadrantId,
  tasks,
  index,
}: EisenhowerQuadrantProps) {
  const config     = QUADRANT_CONFIG[quadrantId];
  const toggleTask = usePTStore((s) => s.toggleTask);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            delay: index * 0.1,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.08,
            delayChildren: (index * 0.1) + 0.2,
          },
        },
      }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden flex flex-col"
      style={{
        backgroundColor: config.bgColor,
        boxShadow:       '2px 2px 0px #2B2B2B',
        minHeight:       '160px',
      }}
    >
      {/* Quadrant header */}
      <div
        className="px-2 sm:px-4 py-2 sm:py-3 border-b-2 border-pt-black"
        style={{ backgroundColor: config.accentColor + '30' }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
          <span className="text-lg sm:text-2xl" aria-hidden="true">{config.icon}</span>
          <h3
            className="text-sm sm:text-h4"
            style={{
              fontFamily: 'var(--font-display)',
              color:      config.textColor,
              lineHeight: 1.1,
            }}
          >
            {config.title}
          </h3>
        </div>
        <p
          className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: config.accentColor }}
        >
          {config.subtitle}
        </p>

        {/* Task count pill + action text */}
        <div className="flex items-center justify-between mt-1 sm:mt-2">
          <span
            className="px-1.5 py-0.5 rounded-full border border-pt-black text-[9px] sm:text-label font-bold"
            style={{
              backgroundColor: tasks.length > 0 ? config.accentColor : 'var(--pt-cream)',
              color:           tasks.length > 0 ? 'white'            : 'var(--pt-black)',
              fontFamily:      'var(--font-body)',
            }}
          >
            {tasks.length}
          </span>
          {tasks.length > 0 && (
            <p
              className="hidden sm:block text-[10px] font-semibold text-right max-w-[120px]"
              style={{ fontFamily: 'var(--font-body)', color: config.accentColor }}
            >
              {config.actionText}
            </p>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[80px]">
            <p
              className="text-xs text-center"
              style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
            >
              {config.emptyText}
            </p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.id}
              variants={{
                hidden: { opacity: 0, scale: 0.8, y: 10 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <TaskCard
                task={task}
                onToggle={toggleTask}
                compact
              />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
