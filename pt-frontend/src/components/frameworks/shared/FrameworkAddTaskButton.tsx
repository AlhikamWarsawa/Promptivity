'use client';

import { useState } from 'react';
import { PTButton } from '@/components/pt/PTButton';
import { usePTStore } from '@/store/usePTStore';
import type { FrameworkId } from '@/types/pt.types';
import { FrameworkAddTaskModal } from './FrameworkAddTaskModal';

interface FrameworkAddTaskButtonProps {
  frameworkId: FrameworkId;
  className?: string;
}

export function FrameworkAddTaskButton({ frameworkId, className }: FrameworkAddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addFrameworkTask = usePTStore((s) => s.addFrameworkTask);

  return (
    <>
      <PTButton
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setIsOpen(true)}
      >
        + Add Task
      </PTButton>
      <FrameworkAddTaskModal
        frameworkId={frameworkId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={(task) => addFrameworkTask(frameworkId, task)}
      />
    </>
  );
}
