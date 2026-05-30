'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { TaskCard } from '@/components/pt/TaskCard';
import { getFramework } from '@/lib/frameworkConfig';
import { useFramework, usePTStore } from '@/store/usePTStore';
import { DeepWorkData, Task } from '@/types/pt.types';

export function DeepWorkView() {
  const fwData = useFramework('deep-work');
  const toggleTask = usePTStore((s) => s.toggleTask);
  const meta = getFramework('deep-work');

  const rawData = useMemo(() => {
    if (!fwData?.rawData) return null;
    return fwData.rawData as DeepWorkData;
  }, [fwData]);

  if (!fwData || !rawData) {
    return <FrameworkEmptyState frameworkId="deep-work" />;
  }

  const accentColor = meta?.accentColor ?? 'var(--pt-blue)';

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: accentColor + '12' }}
      >
        <p className="text-sm leading-relaxed text-pt-brown">
          <strong>Deep Work</strong> requires uninterrupted focus. This framework helps you lock in your focus goal, schedule intense work blocks, and handle shallow tasks separately.
        </p>
      </motion.div>

      {/* Focus Goal */}
      <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-pt-white shadow-sketch">
        <h3 className="font-display text-h4 mb-2 flex items-center gap-2">
          <span>🎯</span> Focus Goal
        </h3>
        <p className="text-lg font-bold text-pt-black">{rawData.focusGoal || "No specific goal defined."}</p>
      </motion.div>

      {/* Deep Work Blocks */}
      <motion.div variants={itemVariants}>
        <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
          <span>⏳</span> Deep Work Blocks
        </h3>
        <div className="space-y-3">
          {(rawData.deepBlocks ?? []).length === 0 ? (
            <p className="text-sm text-pt-brown">No deep work blocks scheduled.</p>
          ) : (
            rawData.deepBlocks.map((block, i) => (
              <div key={block.id ?? i} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-sketch border-2 border-pt-black bg-pt-cream ${block.isCompleted || block.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2 font-bold text-lg min-w-[140px]" style={{ color: accentColor }}>
                  {block.id && (
                    <button
                      type="button"
                      onClick={() => toggleTask(block.id!)}
                      className={`w-5 h-5 rounded border-2 border-pt-black flex items-center justify-center text-[11px] font-bold ${block.isCompleted || block.completed ? 'bg-pt-green border-pt-green text-white' : 'bg-white hover:bg-pt-yellowP'}`}
                      role="checkbox"
                      aria-checked={Boolean(block.isCompleted ?? block.completed)}
                      aria-label={block.isCompleted || block.completed ? `Mark "${block.task}" as incomplete` : `Mark "${block.task}" as complete`}
                    >
                      {block.isCompleted || block.completed ? '✓' : ''}
                    </button>
                  )}
                  {block.start} - {block.end}
                </div>
                <div className={`text-base text-pt-black flex-1 ${block.isCompleted || block.completed ? 'line-through' : ''}`}>{block.task}</div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <HandDrawnDivider variant="wave" color="var(--pt-black)" className="opacity-20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shallow Tasks */}
        <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-pt-white">
          <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
            <span>📝</span> Shallow Tasks
          </h3>
          <ul className="space-y-2">
            {(rawData.shallowTasks ?? []).length === 0 ? (
              <li className="text-sm text-pt-brown">No shallow tasks listed.</li>
            ) : (
              rawData.shallowTasks.map((task, i) => (
                <CheckableListItem key={typeof task === 'string' ? `${task}-${i}` : task.id} item={task} index={i} />
              ))
            )}
          </ul>
        </motion.div>

        {/* Distractions */}
        <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-[#FEE8EA]">
          <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
            <span>🚫</span> Distractions to Avoid
          </h3>
          <ul className="space-y-2">
            {(rawData.distractions ?? []).length === 0 ? (
              <li className="text-sm text-pt-brown">No specific distractions listed.</li>
            ) : (
              rawData.distractions.map((distraction, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#D32F2F]">
                  <span className="mt-0.5">•</span>
                  <span>{distraction}</span>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      {/* Shutdown Ritual */}
      <motion.div variants={itemVariants} className="p-5 rounded-sketch border-2 border-pt-black bg-[#E8F4FD]">
        <h3 className="font-display text-h4 mb-3 flex items-center gap-2">
          <span>🌙</span> Shutdown Ritual
        </h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          {(rawData.shutdownRitual ?? []).length === 0 ? (
            <li className="text-pt-brown list-none -ml-5">No shutdown ritual defined.</li>
          ) : (
            rawData.shutdownRitual.map((step, i) => (
              <li key={typeof step === 'string' ? `${step}-${i}` : step.id} className="list-none -ml-5">
                <CheckableListItem item={step} index={i} ordered />
              </li>
            ))
          )}
        </ol>
      </motion.div>
    </motion.div>
  );
}

function CheckableListItem({ item, index, ordered = false }: { item: string | Task; index: number; ordered?: boolean }) {
  const toggleTask = usePTStore((s) => s.toggleTask);
  if (typeof item !== 'string') {
    return <TaskCard task={item} onToggle={toggleTask} compact />;
  }

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-pt-brown">{ordered ? `${index + 1}.` : '•'}</span>
      <span>{item}</span>
    </li>
  );
}
