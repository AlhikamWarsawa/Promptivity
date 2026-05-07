'use client';

import { useMemo }      from 'react';
import { motion }       from 'framer-motion';
import { TaskCard }     from '@/components/pt/TaskCard';
import { usePTStore }   from '@/store/usePTStore';
import type { Task }    from '@/types/pt.types';

/* ============================================
   CategoryTaskList — Tasks grouped by category
   with color-coded section headers.
   ============================================ */

const CATEGORY_CONFIG: Record<string, {
  label:  string;
  icon:   string;
  color:  string;
  bgColor:string;
}> = {
  work:     { label: 'Pekerjaan',   icon: '💼', color: 'var(--pt-blue)',    bgColor: '#E8F4FD' },
  personal: { label: 'Personal',    icon: '👤', color: 'var(--pt-lime)',    bgColor: '#F0FADF' },
  health:   { label: 'Kesehatan',   icon: '💪', color: 'var(--pt-green)',   bgColor: '#E0F8EE' },
  learning: { label: 'Belajar',     icon: '📚', color: 'var(--pt-cyan)',    bgColor: '#E0F9FE' },
  other:    { label: 'Lainnya',     icon: '✨', color: 'var(--pt-mustard)', bgColor: '#FDF5E0' },
};

interface CategoryTaskListProps {
  tasks:     Task[];
  title?:    string;
  icon?:     string;
}

export function CategoryTaskList({ tasks, title, icon }: CategoryTaskListProps) {
  const toggleTask = usePTStore((s) => s.toggleTask);

  // Group tasks by category
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      const cat = task.category ?? 'other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(task);
    }
    // Sort: work first, then personal, health, learning, other
    const ORDER = ['work', 'personal', 'health', 'learning', 'other'];
    return Object.entries(map).sort(
      ([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b),
    );
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-center py-4"
        style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}>
        Tidak ada task yang terdeteksi.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h4)',
              color:      'var(--pt-black)',
            }}
          >
            {title}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: 'var(--pt-cream)', fontFamily: 'var(--font-body)' }}
          >
            {tasks.length}
          </span>
        </div>
      )}

      {grouped.map(([category, catTasks], gi) => {
        const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.07, duration: 0.3 }}
          >
            {/* Category label */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-t-sketch border-2 border-pt-black border-b-0"
              style={{ backgroundColor: config.bgColor }}
            >
              <span className="text-base" aria-hidden="true">{config.icon}</span>
              <span
                className="text-label font-bold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-body)', color: config.color }}
              >
                {config.label}
              </span>
              <span
                className="ml-auto text-label font-bold"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                {catTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div
              className="rounded-b-sketch border-2 border-pt-black border-t-0 divide-y divide-pt-black/10"
              style={{ backgroundColor: 'var(--pt-white)' }}
            >
              {catTasks.map((task) => (
                <div key={task.id} className="p-2">
                  <TaskCard task={task} onToggle={toggleTask} compact />
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
