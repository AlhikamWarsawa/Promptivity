'use client';

import { motion }       from 'framer-motion';
import { cn }           from '@/lib/utils';
import { TaskCard }     from '@/components/pt/TaskCard';
import { usePTStore }   from '@/store/usePTStore';
import type { Task }    from '@/types/pt.types';

/* ============================================
   DayCard — One day in the Medium Method
   
   Layout:
   - Day label (Today / Tomorrow / Day 3)
   - Date string
   - ONE big main task (prominent)
   - 2-3 support tasks (smaller)
   
   Style:
   - "Today" card: yellow accent, larger
   - Future cards: cream, slightly muted
   ============================================ */

interface DayCardData {
  label:        string;   // "Hari Ini", "Besok", "Day 3"
  date?:        string;   // actual date string
  mainTask:     Task;
  supportTasks: Task[];
}

interface DayCardProps {
  data:       DayCardData;
  isToday?:   boolean;
  index:      number;
}

export function DayCard({ data, isToday = false, index }: DayCardProps) {
  const toggleTask = usePTStore((s) => s.toggleTask);
  const mainDone = Boolean(data.mainTask.isCompleted ?? data.mainTask.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay:    index * 0.12,
        duration: 0.45,
        ease:     [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'rounded-sketch border-2 border-pt-black overflow-hidden',
        isToday ? 'shadow-sketch-xl' : 'shadow-sketch',
      )}
    >
      {/* Card header */}
      <div
        className="px-5 py-3 border-b-2 border-pt-black flex items-center justify-between"
        style={{
          backgroundColor: isToday ? 'var(--pt-yellow)' : 'var(--pt-cream)',
        }}
      >
        <div className="flex items-center gap-2">
          {isToday && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg"
              aria-hidden="true"
            >
              ⭐
            </motion.span>
          )}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   isToday ? 'var(--text-h3)' : 'var(--text-h4)',
                color:      'var(--pt-black)',
              }}
            >
              {data.label}
            </h3>
            {data.date && (
              <p
                className="text-[11px] font-semibold"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                {data.date}
              </p>
            )}
          </div>
        </div>

        {isToday && (
          <span
            className="px-2.5 py-1 rounded-sketch border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: 'var(--pt-coral)', color: 'white', fontFamily: 'var(--font-body)' }}
          >
            SEKARANG
          </span>
        )}
      </div>

      {/* Main task — THE ONE BIG THING */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ backgroundColor: isToday ? 'var(--pt-yellowP)' + '50' : 'var(--pt-white)' }}
      >
        {/* Label */}
        <p
          className="text-label font-bold uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-body)', color: isToday ? 'var(--pt-coral)' : '#6B6B6B' }}
        >
          🎯 Satu Hal Terpenting
        </p>

        {/* Main task card — larger, more prominent */}
        <div
          className={cn(
            'rounded-sketch border-2 border-pt-black p-4',
            isToday ? 'shadow-sketch' : '',
          )}
          style={{
            backgroundColor: isToday ? 'var(--pt-white)' : 'var(--pt-cream)',
            borderLeft:      `5px solid ${isToday ? 'var(--pt-coral)' : 'var(--pt-mustard)'}`,
          }}
        >
          <button
            type="button"
            onClick={() => toggleTask(data.mainTask.id)}
            className={`float-left mr-3 mt-0.5 w-6 h-6 rounded border-2 border-pt-black flex items-center justify-center text-[12px] font-bold ${mainDone ? 'bg-pt-green border-pt-green text-white' : 'bg-white hover:bg-pt-yellowP'}`}
            role="checkbox"
            aria-checked={mainDone}
            aria-label={mainDone ? `Mark "${data.mainTask.title}" as incomplete` : `Mark "${data.mainTask.title}" as complete`}
          >
            {mainDone ? '✓' : ''}
          </button>
          <p
            className={cn(
              'font-bold leading-snug',
              isToday ? 'text-body' : 'text-sm',
              mainDone && 'line-through opacity-50',
            )}
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            {data.mainTask.title}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs font-semibold"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              ⏱️ {formatDuration(data.mainTask.estimatedMinutes)}
            </span>
            {data.mainTask.category && data.mainTask.category !== 'general' && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-pt-black/20"
                style={{
                  fontFamily:      'var(--font-body)',
                  backgroundColor: getCategoryBg(data.mainTask.category),
                  color:           'var(--pt-black)',
                }}
              >
                {data.mainTask.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Support tasks */}
      {data.supportTasks.length > 0 && (
        <div
          className="px-5 pb-5"
          style={{ backgroundColor: 'var(--pt-white)' }}
        >
          <p
            className="text-label font-bold uppercase tracking-wide mb-2"
            style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
          >
            Support Tasks
          </p>
          <div className="space-y-2">
            {data.supportTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function formatDuration(minutes: number): string {
  if (!minutes) return '?';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    work: '#E0F9FE', personal: '#F0FADF',
    health: '#E0F8EE', learning: '#E8F4FD', other: '#E9DCCF',
  };
  return map[category] ?? '#E9DCCF';
}
