'use client';

import { motion } from 'framer-motion';
import { PTButton } from '@/components/pt/PTButton';
import { getFramework } from '@/lib/frameworkConfig';
import { hasAllFrameworkTasksCompleted } from '@/lib/frameworkTasks';
import { useFramework, usePTStore } from '@/store/usePTStore';
import type { FrameworkId } from '@/types/pt.types';

interface FrameworkGenerateMoreTasksProps {
  frameworkId: FrameworkId;
}

export function FrameworkGenerateMoreTasks({ frameworkId }: FrameworkGenerateMoreTasksProps) {
  const framework = useFramework(frameworkId);
  const isLoading = usePTStore((s) => s.isLoading);
  const generateMore = usePTStore((s) => s.generateMoreFrameworkTasks);
  const meta = getFramework(frameworkId);

  if (!framework || !hasAllFrameworkTasksCompleted(frameworkId, framework.rawData)) return null;

  const name = meta?.shortName ?? meta?.name ?? frameworkId;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-sketch border-2 border-pt-black p-5 text-center bg-pt-green/10 shadow-sketch"
    >
      <p className="font-display text-h4 text-pt-green mb-1">
        All {name} tasks are done!
      </p>
      <p className="text-sm text-pt-black/60 mb-4 font-body">
        Want Moti to find more?
      </p>
      <PTButton
        type="button"
        variant="primary"
        isLoading={isLoading}
        onClick={() => generateMore(frameworkId)}
      >
        Generate More Tasks
      </PTButton>
    </motion.section>
  );
}
