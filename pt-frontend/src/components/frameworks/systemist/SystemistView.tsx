'use client';

import { useMemo }               from 'react';
import { motion }                from 'framer-motion';
import { RoutineSection }        from './RoutineSection';
import { CategoryTaskList }      from './CategoryTaskList';
import { FrameworkEmptyState }   from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }      from '@/components/pt/HandDrawnDivider';
import { useFramework }          from '@/store/usePTStore';
import type { Task }             from '@/types/pt.types';

/* ============================================
   SystemistView — Daily system framework
   
   Layout:
   1. Philosophy note
   2. Rutinitas Pagi (collapsible checklist)
   3. Tugas Hari Ini (grouped by category)
   4. Rutinitas Malam (collapsible checklist)
   5. Recurring Tasks
   ============================================ */

interface SystemistRawData {
  morning?:   string[];
  workTasks?: Task[];
  evening?:   string[];
  recurring?: Task[];
}

export function SystemistView() {
  const fwData = useFramework('systemist');

  const rawData = useMemo((): SystemistRawData => {
    if (!fwData?.rawData) return {};
    return fwData.rawData as SystemistRawData;
  }, [fwData]);

  const hasContent =
    (rawData.morning?.length ?? 0) > 0 ||
    (rawData.workTasks?.length ?? 0) > 0 ||
    (rawData.evening?.length ?? 0) > 0 ||
    (rawData.recurring?.length ?? 0) > 0;

  if (!fwData || !hasContent) {
    return (
      <FrameworkEmptyState
        frameworkId="systemist"
        message="Moti tidak bisa membangun sistem harian dari ceritamu. Coba sebutkan rutinitas harian, jam kerja, dan kegiatan yang kamu lakukan berulang."
      />
    );
  }

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Philosophy note */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-green)' + '15' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          ⚙️ <strong>Systemist</strong> membantu kamu membangun sistem harian yang konsisten,
          bukan sekadar daftar tugas. Rutinitas yang kuat adalah fondasi produktivitas jangka panjang.
          Ikuti urutan dari pagi ke malam.
        </p>
      </motion.div>

      {/* Rutinitas Pagi */}
      {(rawData.morning?.length ?? 0) > 0 && (
        <motion.div variants={itemVariants}>
          <RoutineSection
            title="Rutinitas Pagi"
            icon="🌅"
            items={rawData.morning ?? []}
            accentColor="var(--pt-mustard)"
            bgColor="var(--pt-yellowP)"
            timeLabel="Mulai hari dengan baik"
            defaultOpen={true}
          />
        </motion.div>
      )}

      {/* Tugas Hari Ini */}
      {(rawData.workTasks?.length ?? 0) > 0 && (
        <motion.div variants={itemVariants}>
          <HandDrawnDivider
            variant="wave"
            label="TUGAS HARI INI"
            color="var(--pt-black)"
            className="opacity-30"
          />
          <div className="mt-4">
            <CategoryTaskList
              tasks={rawData.workTasks ?? []}
              title="Task Terjadwal"
              icon="📋"
            />
          </div>
        </motion.div>
      )}

      {/* Rutinitas Malam */}
      {(rawData.evening?.length ?? 0) > 0 && (
        <motion.div variants={itemVariants}>
          <HandDrawnDivider
            variant="dots"
            color="var(--pt-black)"
            className="opacity-20"
          />
          <div className="mt-4">
            <RoutineSection
              title="Rutinitas Malam"
              icon="🌙"
              items={rawData.evening ?? []}
              accentColor="var(--pt-blue)"
              bgColor="var(--pt-cream)"
              timeLabel="Tutup hari dengan refleksi"
              defaultOpen={false}
            />
          </div>
        </motion.div>
      )}

      {/* Recurring Tasks */}
      {(rawData.recurring?.length ?? 0) > 0 && (
        <motion.div variants={itemVariants}>
          <HandDrawnDivider
            variant="zigzag"
            label="RECURRING"
            color="var(--pt-black)"
            className="opacity-25"
          />
          <div className="mt-4">
            <div
              className="rounded-sketch border-2 border-pt-black overflow-hidden"
              style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2 border-b-2 border-pt-black"
                style={{ backgroundColor: 'var(--pt-lime)' + '40' }}
              >
                <span className="text-xl" aria-hidden="true">🔄</span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize:   'var(--text-h4)',
                    color:      'var(--pt-black)',
                  }}
                >
                  Task Berulang
                </h3>
                <span
                  className="ml-auto px-2 py-0.5 rounded-full border-2 border-pt-black text-label font-bold"
                  style={{ backgroundColor: 'var(--pt-lime)', fontFamily: 'var(--font-body)' }}
                >
                  {rawData.recurring?.length}
                </span>
              </div>
              <div className="p-3 space-y-2 bg-pt-white">
                {(rawData.recurring ?? []).map((task) => (
                  <RecurringTaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* System health summary */}
      <motion.div variants={itemVariants}>
        <SystemHealthBar
          morning={(rawData.morning?.length ?? 0)}
          tasks={(rawData.workTasks?.length ?? 0)}
          evening={(rawData.evening?.length ?? 0)}
          recurring={(rawData.recurring?.length ?? 0)}
        />
      </motion.div>
    </motion.div>
  );
}

/* ---- Recurring Task Row ---- */
function RecurringTaskRow({ task }: { task: Task }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded border border-pt-black/15"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      <span className="text-base shrink-0" aria-hidden="true">🔄</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          {task.title}
        </p>
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
        >
          {task.category !== 'general' ? task.category : ''}{' '}
          {task.estimatedMinutes ? `· ${task.estimatedMinutes}m` : ''}
        </p>
      </div>
      {/* Frequency pill — just decoration */}
      <span
        className="shrink-0 px-2 py-0.5 rounded-sketch border border-pt-black/20 text-[10px] font-bold"
        style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--pt-lime)' + '40', color: 'var(--pt-black)' }}
      >
        Harian
      </span>
    </div>
  );
}

/* ---- System Health Bar ---- */
function SystemHealthBar({
  morning, tasks, evening, recurring,
}: {
  morning: number; tasks: number; evening: number; recurring: number;
}) {
  const items = [
    { label: 'Rutinitas Pagi',  count: morning,   icon: '🌅', color: 'var(--pt-mustard)' },
    { label: 'Tugas Harian',   count: tasks,     icon: '📋', color: 'var(--pt-blue)' },
    { label: 'Rutinitas Malam', count: evening,   icon: '🌙', color: 'var(--pt-blue)' },
    { label: 'Berulang',        count: recurring, icon: '🔄', color: 'var(--pt-lime)' },
  ];

  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-4"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      <p
        className="text-label font-bold mb-3 uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
      >
        📊 Ringkasan Sistem Harianmu
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-xl mb-0.5" aria-hidden="true">{item.icon}</p>
            <p
              className="text-h3"
              style={{ fontFamily: 'var(--font-display)', color: item.color }}
            >
              {item.count}
            </p>
            <p
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
