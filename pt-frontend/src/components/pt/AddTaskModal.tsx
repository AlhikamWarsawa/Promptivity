'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PTButton } from './PTButton';
import { PTInput } from './PTInput';
import { usePTStore } from '@/store/usePTStore';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  const addTask = usePTStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState('Personal');
  const [durationOption, setDurationOption] = useState('30');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      description,
      priority,
      category,
      estimatedMinutes,
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-pt-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-pt-white border-[3px] border-pt-black shadow-sketch-xl rounded-sketch p-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative corner */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-pt-yellow rotate-45 border-b-2 border-pt-black" />

          <h2 className="text-2xl font-display mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            ✨ Add New Task
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PTInput
              label="Task Title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-bold mb-1 font-display">Description (Optional)</label>
              <textarea
                className="w-full p-3 rounded-sketch border-2 border-pt-black font-body text-sm focus:ring-2 focus:ring-pt-blue outline-none resize-none"
                rows={3}
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1 font-display">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 rounded-sketch border-2 border-pt-black font-body text-sm bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 font-display">Duration</label>
                <select
                  value={durationOption}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDurationOption(val);
                    if (val !== 'custom') {
                      setEstimatedMinutes(parseInt(val));
                    }
                  }}
                  className="w-full p-2 rounded-sketch border-2 border-pt-black font-body text-sm bg-white"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                  <option value="custom">Custom</option>
                </select>
                {durationOption === 'custom' && (
                  <input
                    type="number"
                    className="w-full mt-2 p-2 rounded-sketch border-2 border-pt-black font-body text-sm"
                    placeholder="Minutes"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 font-display">Category</label>
              <input
                type="text"
                className="w-full p-2 rounded-sketch border-2 border-pt-black font-body text-sm"
                placeholder="e.g. Work"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <PTButton variant="ghost" type="button" onClick={onClose} className="flex-1">
                Cancel
              </PTButton>
              <PTButton variant="primary" type="submit" className="flex-1">
                Save Task
              </PTButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
