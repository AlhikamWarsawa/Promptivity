'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PTButton } from '@/components/pt/PTButton';
import { cn } from '@/lib/utils';
import type { FrameworkId, Priority } from '@/types/pt.types';
import type { EisenhowerQuadrantId, FrameworkTaskDraft } from '@/lib/frameworkTasks';

interface FrameworkAddTaskModalProps {
  frameworkId: FrameworkId;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: FrameworkTaskDraft) => void;
}

const QUADRANTS: Array<{ id: EisenhowerQuadrantId; label: string; hint: string }> = [
  { id: 'doNow', label: 'Do Now', hint: 'Penting + Mendesak' },
  { id: 'schedule', label: 'Schedule', hint: 'Penting + Tidak Mendesak' },
  { id: 'delegate', label: 'Delegate', hint: 'Tidak Penting + Mendesak' },
  { id: 'eliminate', label: 'Eliminate', hint: 'Tidak Penting + Tidak Mendesak' },
];

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

export function FrameworkAddTaskModal({
  frameworkId,
  isOpen,
  onClose,
  onAdd,
}: FrameworkAddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState<EisenhowerQuadrantId>('doNow');
  const [priority, setPriority] = useState<Priority>('medium');
  const [duration, setDuration] = useState<number | ''>('');

  function reset() {
    setTitle('');
    setDescription('');
    setQuadrant('doNow');
    setPriority('medium');
    setDuration('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onAdd({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      estimatedMinutes: typeof duration === 'number' ? duration : 30,
      category: 'work',
      completed: false,
      isCompleted: false,
      source: 'manual',
      frameworkId,
      framework: frameworkId,
      quadrant: frameworkId === 'eisenhower' ? quadrant : undefined,
    });

    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-pt-black/30 px-3 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="framework-add-task-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-sketch border-2 border-pt-black bg-pt-white shadow-sketch-xl overflow-hidden"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="px-5 py-4 border-b-2 border-pt-black bg-pt-cream">
              <h2 id="framework-add-task-title" className="font-display text-h4 text-pt-black">
                Add Framework Task
              </h2>
              <p className="text-xs font-semibold text-pt-black/50 mt-1">
                Keep it concrete enough to check off later.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wide text-pt-black/60 mb-1">
                  Task title
                </span>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="min-h-[44px] w-full rounded-sketch border-2 border-pt-black bg-white px-3 py-2 font-body outline-none focus:border-pt-blue"
                  placeholder="Write one clear next action"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wide text-pt-black/60 mb-1">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[88px] w-full rounded-sketch border-2 border-pt-black bg-white px-3 py-2 font-body outline-none focus:border-pt-blue"
                  placeholder="Optional note"
                />
              </label>

              {frameworkId === 'eisenhower' && (
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-pt-black/60 mb-2">
                    Quadrant
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUADRANTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setQuadrant(item.id)}
                        className={cn(
                          'min-h-[52px] rounded-sketch border-2 border-pt-black px-3 py-2 text-left transition-all',
                          quadrant === item.id ? 'bg-pt-yellow shadow-sketch' : 'bg-pt-white hover:bg-pt-cream',
                        )}
                      >
                        <span className="block text-sm font-bold text-pt-black">{item.label}</span>
                        <span className="block text-[11px] font-semibold text-pt-black/50">{item.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-bold uppercase tracking-wide text-pt-black/60 mb-1">
                    Priority
                  </span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="min-h-[44px] w-full rounded-sketch border-2 border-pt-black bg-white px-3 py-2 font-body outline-none focus:border-pt-blue"
                  >
                    {PRIORITIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-bold uppercase tracking-wide text-pt-black/60 mb-1">
                    Duration
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    className="min-h-[44px] w-full rounded-sketch border-2 border-pt-black bg-white px-3 py-2 font-body outline-none focus:border-pt-blue"
                    placeholder="30"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 px-5 py-4 border-t-2 border-pt-black bg-pt-cream">
              <PTButton type="button" variant="ghost" className="min-h-[44px] sm:ml-auto" onClick={onClose}>
                Cancel
              </PTButton>
              <PTButton type="submit" variant="primary" className="min-h-[44px]" disabled={!title.trim()}>
                Add Task
              </PTButton>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
