'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PTButton } from './PTButton';
import { PTInput } from './PTInput';
import { usePTStore } from '@/store/usePTStore';
import type { Task } from '@/types/pt.types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function EditTaskModal({ isOpen, onClose, task }: EditTaskModalProps) {
  const editTask = usePTStore((s) => s.editTask);
  const deleteTask = usePTStore((s) => s.deleteTask);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [durationOption, setDurationOption] = useState('30');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setCategory(task.category || '');
      setEstimatedMinutes(task.estimatedMinutes || 30);
      
      const common = ['15', '30', '60', '120', '240'];
      if (common.includes(String(task.estimatedMinutes))) {
        setDurationOption(String(task.estimatedMinutes));
      } else {
        setDurationOption('custom');
      }
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    editTask(task.id, {
      title,
      description,
      priority,
      category,
      estimatedMinutes,
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
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
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-display" style={{ fontFamily: 'var(--font-display)' }}>
              ✏️ Edit Task
            </h2>
            <button 
              onClick={handleDelete}
              className="p-2 text-pt-coral hover:bg-pt-coral/10 rounded-full transition-colors"
              title="Delete Task"
            >
              <TrashIcon size={20} />
            </button>
          </div>

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
                Save Changes
              </PTButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TrashIcon({ size = 24 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
