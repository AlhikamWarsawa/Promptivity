'use client';

import { useMemo }          from 'react';
import { motion }           from 'framer-motion';
import { GTDListSection }   from './GTDListSection';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { getFramework }     from '@/lib/frameworkConfig';
import { useFramework, usePTStore } from '@/store/usePTStore';
import { TaskCard }       from '@/components/pt/TaskCard';
import type { Task }        from '@/types/pt.types';

/* ============================================
   GTDView — Getting Things Done content
   
   5 Buckets:
   1. Inbox       — semua hal yang perlu diproses
   2. Next Actions — task konkret yang bisa dilakukan sekarang
   3. Waiting For — menunggu dari orang lain
   4. Projects    — hal yang butuh lebih dari 1 step
   5. Someday/Maybe — ideas untuk nanti
   ============================================ */

export function GTDView() {
  const fwData = useFramework('gtd');
  const toggleTask = usePTStore((s) => s.toggleTask);
  const meta   = getFramework('gtd');

  const rawData = useMemo(() => {
    if (!fwData?.rawData) return null;
    return fwData.rawData as {
      inbox?:       Task[];
      nextActions?: Task[];
      waitingFor?:  Task[];
      projects?:    { name: string; tasks: Task[] }[];
      someday?:     Task[];
    };
  }, [fwData]);

  if (!fwData || !rawData) {
    return <FrameworkEmptyState frameworkId="gtd" />;
  }

  const accentColor = meta?.accentColor ?? 'var(--pt-blue)';

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* GTD Philosophy note */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: accentColor + '12' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          <strong>GTD memisahkan</strong> antara <em>capture</em> (catat semua),{' '}
          <em>clarify</em> (proses apa artinya), dan <em>engage</em> (kerjakan).
          Ikuti urutan dari atas ke bawah — mulai dari inbox, lalu tentukan next action untuk tiap item.
        </p>
      </motion.div>

      {/* 1. Inbox */}
      <motion.div variants={itemVariants}>
        <GTDListSection
          title="Inbox"
          icon="📥"
          items={rawData.inbox ?? []}
          accentColor="var(--pt-mustard)"
          type="text"
          emptyText="Inbox kosong — semua sudah diproses!"
        />
      </motion.div>

      {/* 2. Next Actions */}
      <motion.div variants={itemVariants}>
        <GTDListSection
          title="Next Actions"
          icon="⚡"
          items={fwData.tasks.length > 0 ? fwData.tasks : (rawData.nextActions ?? [])}
          accentColor={accentColor}
          type="task"
          defaultOpen={true}
          emptyText="Belum ada next action yang diekstrak."
        />
      </motion.div>

      {/* 3. Waiting For */}
      <motion.div variants={itemVariants}>
        <GTDListSection
          title="Waiting For"
          icon="⏳"
          items={rawData.waitingFor ?? []}
          accentColor="var(--pt-orange)"
          type="text"
          defaultOpen={false}
          emptyText="Tidak ada hal yang sedang ditunggu dari orang lain."
        />
      </motion.div>

      <HandDrawnDivider variant="dots" color="var(--pt-black)" className="opacity-20" />

      {/* 4. Projects */}
      <motion.div variants={itemVariants}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🗂️</span>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'var(--text-h4)',
                color:      'var(--pt-black)',
              }}
            >
              Projects
            </h3>
            <span
              className="px-2 py-0.5 rounded-full border-2 border-pt-black text-label font-bold"
              style={{ backgroundColor: 'var(--pt-cyan)', fontFamily: 'var(--font-body)' }}
            >
              {(rawData.projects ?? []).length}
            </span>
          </div>

          {(rawData.projects ?? []).length === 0 ? (
            <p
              className="text-sm py-3"
              style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
            >
              Tidak ada project yang teridentifikasi dari ceritamu.
            </p>
          ) : (
            <div className="space-y-3">
              {(rawData.projects ?? []).map((project, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="rounded-sketch border-2 border-pt-black overflow-hidden"
                >
                  {/* Project header */}
                  <div
                    className="flex items-center gap-2 px-4 py-2"
                    style={{ backgroundColor: 'var(--pt-cyan)' + '30', borderBottom: '1.5px solid #2B2B2B' }}
                  >
                    <span className="text-base" aria-hidden="true">📁</span>
                    <span
                      className="font-bold text-sm"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
                    >
                      {project.name}
                    </span>
                    <span
                      className="ml-auto text-label"
                      style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
                    >
                      {project.tasks?.length ?? 0} task
                    </span>
                  </div>
                  {/* Project tasks */}
                  <div className="p-3 space-y-2 bg-pt-white">
                    {(project.tasks ?? []).length === 0 ? (
                      <p className="text-xs" style={{ color: '#9B9B9B', fontFamily: 'var(--font-body)' }}>
                        Tidak ada task spesifik untuk project ini.
                      </p>
                    ) : (
                      project.tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} compact />
                      ))
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 5. Someday/Maybe */}
      <motion.div variants={itemVariants}>
        <GTDListSection
          title="Someday / Maybe"
          icon="🌱"
          items={rawData.someday ?? []}
          accentColor="var(--pt-lime)"
          type="text"
          defaultOpen={false}
          emptyText="Tidak ada ide Someday/Maybe yang diekstrak."
        />
      </motion.div>
    </motion.div>
  );
}
