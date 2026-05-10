'use client';

import { useState, useMemo }           from 'react';
import { motion, AnimatePresence }     from 'framer-motion';
import { PomodoroTimer }               from './PomodoroTimer';
import { HandDrawnDivider }            from '@/components/pt/HandDrawnDivider';
import { useFramework, usePTStore }    from '@/store/usePTStore';
import { PTButton }                    from '@/components/pt/PTButton';

/* ============================================
   PomodoroView — Pomodoro Technique page
   ============================================ */

interface PomodoroTask {
  id:            string;
  title:         string;
  duration:      number;
  breakDuration: number;
  sessions:      number;
  isCompleted?:  boolean;
}

export function PomodoroView() {
  const fwData = useFramework('pomodoro');
  
  const addPomTask    = usePTStore(s => s.addPomodoroTask);
  const editPomTask   = usePTStore(s => s.editPomodoroTask);
  const deletePomTask = usePTStore(s => s.deletePomodoroTask);
  const togglePomTask = usePTStore(s => s.togglePomodoroTask);
  const reorderPom    = usePTStore(s => s.reorderPomodoroTasks);
  const addMoreTasks  = usePTStore(s => s.addMorePomodoroTasks);
  const isLoading     = usePTStore(s => s.isLoading);

  const [activeSessionIdx, setActiveSessionIdx]   = useState<number>(0);
  const [completedSessions, setCompletedSessions] = useState<Set<number>>(new Set());

  // Task Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const tasks = useMemo((): PomodoroTask[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as { tasks?: PomodoroTask[] };
    return raw.tasks ?? [];
  }, [fwData]);

  // Flatten logic
  const flattenedQueue = useMemo(() => {
    return tasks.filter(t => !t.isCompleted).flatMap((task) => 
      Array.from({ length: task.sessions }).map((_, i) => ({
        taskId: task.id,
        title: task.title,
        duration: task.duration,
        breakDuration: task.breakDuration,
        sessionIndex: i + 1,
        totalSessions: task.sessions,
        globalIndex: 0 // Will be set below
      }))
    ).map((sess, idx) => ({ ...sess, globalIndex: idx }));
  }, [tasks]);

  const totalSessions = flattenedQueue.length;
  const isAllDone = totalSessions > 0 && completedSessions.size === totalSessions;

  const currentSession = flattenedQueue[activeSessionIdx];

  function handleSessionComplete(mode: 'work' | 'break') {
    if (mode === 'work') {
      setCompletedSessions((prev) => {
        const next = new Set(prev);
        next.add(activeSessionIdx);
        return next;
      });
      // Auto-advance logic could be placed here if needed, but the timer will auto-start break.
    } else if (mode === 'break') {
      // Advance to next session
      if (activeSessionIdx < flattenedQueue.length - 1) {
         setActiveSessionIdx(prev => prev + 1);
      }
    }
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addPomTask({ title: newTaskTitle, duration: 25, breakDuration: 5, sessions: 1 });
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const moveTask = (idx: number, dir: 1 | -1) => {
    const newTasks = [...tasks];
    if (idx + dir < 0 || idx + dir >= newTasks.length) return;
    const temp = newTasks[idx];
    newTasks[idx] = newTasks[idx + dir];
    newTasks[idx + dir] = temp;
    reorderPom(newTasks);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 rounded-sketch border-2 border-pt-black bg-pt-cream">
        <h2 className="text-h3 mb-4 font-display">No focus tasks yet 🍅</h2>
        <div className="flex justify-center gap-3">
          <PTButton variant="primary" onClick={() => setIsAdding(true)}>+ Add Task</PTButton>
          <PTButton variant="outline" onClick={addMoreTasks} isLoading={isLoading}>Generate Tasks</PTButton>
        </div>
        {isAdding && (
          <form onSubmit={handleAddTask} className="mt-6 flex justify-center gap-2">
            <input 
              autoFocus
              className="px-3 py-2 border-2 border-pt-black rounded-sketch" 
              placeholder="Task title..." 
              value={newTaskTitle} 
              onChange={e => setNewTaskTitle(e.target.value)} 
            />
            <PTButton variant="primary" type="submit">Save</PTButton>
            <PTButton variant="ghost" onClick={() => setIsAdding(false)}>Cancel</PTButton>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Info bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 rounded-sketch border-2 border-pt-black text-sm flex justify-between items-center"
        style={{ backgroundColor: '#F28C2815', fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
      >
        <span>
          🍅 <strong>Teknik Pomodoro:</strong> Kerja 25m fokus penuh → istirahat 5m → ulangi.
        </span>
        {totalSessions > 0 && (
          <span className="font-bold text-pt-coral">
            Current Session: {Math.min(completedSessions.size + 1, totalSessions)} / {totalSessions}
          </span>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">
        
        {/* Timer Left Column */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <PomodoroTimer
              currentTask={currentSession ? `${currentSession.title} (${currentSession.sessionIndex}/${currentSession.totalSessions})` : 'All tasks completed!'}
              onSessionComplete={handleSessionComplete}
            />
          </motion.div>
          
          {/* Generate More Fallback */}
          {(isAllDone || flattenedQueue.length === 0) && (
            <div className="p-6 rounded-sketch border-2 border-pt-black text-center bg-pt-green/10">
              <p className="text-h4 font-display text-pt-green mb-3">Semua fokus session selesai 🎉</p>
              <p className="text-sm text-gray-600 mb-4">Masih mau lanjut?</p>
              <PTButton variant="primary" onClick={addMoreTasks} isLoading={isLoading}>+ Generate More Tasks</PTButton>
            </div>
          )}
        </div>

        {/* Right Column: Task Management & Queue */}
        <div className="space-y-8">
          
          {/* Task Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-h4">Task Management</h3>
              <PTButton variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
                {isAdding ? 'Cancel' : '+ Add Task'}
              </PTButton>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddTask} 
                  className="mb-4 flex gap-2"
                >
                  <input 
                    autoFocus
                    className="flex-1 px-3 py-2 border-2 border-pt-black rounded-sketch outline-none focus:border-pt-coral" 
                    placeholder="Task title..." 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                  />
                  <PTButton variant="primary" type="submit">Save</PTButton>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={task.id} className="flex items-center gap-3 p-3 border-2 border-pt-black rounded-sketch bg-pt-white shadow-[2px_2px_0px_#2B2B2B]">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-pt-coral cursor-pointer"
                    checked={task.isCompleted} 
                    onChange={() => togglePomTask(task.id)} 
                  />
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-pt-black'}`}>{task.title}</p>
                    <p className="text-xs text-gray-500">{task.duration}m work · {task.breakDuration}m break · {task.sessions} sessions</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveTask(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-pt-black disabled:opacity-30">↑</button>
                    <button onClick={() => moveTask(idx, 1)} disabled={idx === tasks.length - 1} className="p-1 text-gray-400 hover:text-pt-black disabled:opacity-30">↓</button>
                    <button onClick={() => deletePomTask(task.id)} className="p-1 text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HandDrawnDivider variant="dots" color="var(--pt-black)" className="opacity-20" />

          {/* Queue Preview */}
          <div>
            <h3 className="font-display text-h4 mb-4">Upcoming Queue Preview</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {flattenedQueue.map((sess, i) => {
                const isActive = activeSessionIdx === sess.globalIndex;
                const isCompleted = completedSessions.has(sess.globalIndex);
                return (
                  <div 
                    key={sess.globalIndex} 
                    onClick={() => setActiveSessionIdx(sess.globalIndex)}
                    className={`flex items-center gap-3 p-2 rounded-sketch border-2 cursor-pointer transition-colors ${
                      isActive ? 'border-pt-coral bg-pt-coral/10' : 
                      isCompleted ? 'border-pt-green/50 bg-pt-green/5 text-gray-400' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className="w-6 text-center font-bold text-xs">{sess.globalIndex + 1}.</span>
                    <span className="flex-1 text-sm truncate">{sess.title}</span>
                    <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full">
                      {sess.sessionIndex}/{sess.totalSessions}
                    </span>
                  </div>
                );
              })}
              {flattenedQueue.length === 0 && (
                <p className="text-sm text-gray-500 italic">Queue empty. Add tasks to populate.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
