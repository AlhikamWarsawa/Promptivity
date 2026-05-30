'use client';

import { useState, useMemo }           from 'react';
import { motion, AnimatePresence }     from 'framer-motion';
import { BookOpen, HelpCircle }        from 'lucide-react';
import { PomodoroTimer }               from './PomodoroTimer';
import { PomodoroGuideModal }          from './PomodoroGuideModal';
import { HandDrawnDivider }            from '@/components/pt/HandDrawnDivider';
import { useEffect }                   from 'react';
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
  completedSessions: number;
  isCompleted?:  boolean;
  completed?:    boolean;
}

export function PomodoroView() {
  const fwData = useFramework('pomodoro');
  
  const addPomTask    = usePTStore(s => s.addPomodoroTask);
  const editPomTask   = usePTStore(s => s.editPomodoroTask);
  const deletePomTask = usePTStore(s => s.deletePomodoroTask);
  const togglePomTask = usePTStore(s => s.togglePomodoroTask);
  const reorderPom    = usePTStore(s => s.reorderPomodoroTasks);
  const addMoreTasks  = usePTStore(s => s.addMorePomodoroTasks);
  const completeSess  = usePTStore(s => s.completePomodoroSession);
  const isLoading     = usePTStore(s => s.isLoading);

  // Task Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSessions, setNewTaskSessions] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Guide State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('pomodoro_guide_seen');
    if (!seen) {
      setShowNewBadge(true);
    }
  }, []);

  const openGuide = () => {
    setIsGuideOpen(true);
    setShowNewBadge(false);
    localStorage.setItem('pomodoro_guide_seen', 'true');
  };

  const tasks = useMemo((): PomodoroTask[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as { tasks?: PomodoroTask[] };
    return raw.tasks ?? [];
  }, [fwData]);

  // Sequential Queue Logic
  // First task that is not completed is the active task
  const activeTask = useMemo(() => {
    return tasks.find(t => !(t.isCompleted ?? t.completed));
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    if (!activeTask) return tasks.filter(t => !(t.isCompleted ?? t.completed));
    return tasks.filter(t => !(t.isCompleted ?? t.completed) && t.id !== activeTask.id);
  }, [tasks, activeTask]);

  const totalSessionsInQueue = useMemo(() => {
    return tasks.filter(t => !(t.isCompleted ?? t.completed)).reduce((acc, t) => acc + (t.sessions - t.completedSessions), 0);
  }, [tasks]);

  const completedSessionsTotal = useMemo(() => {
    return tasks.reduce((acc, t) => acc + t.completedSessions, 0);
  }, [tasks]);

  function handleSessionComplete(mode: 'work' | 'break') {
    if (mode === 'work' && activeTask) {
      completeSess(activeTask.id);
    }
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const sessionsNum = typeof newTaskSessions === 'number' ? newTaskSessions : 1;

    if (sessionsNum > 20) {
      setFormError('Maximum 20 Pomodoro sessions per task.');
      return;
    }

    addPomTask({ 
      title: newTaskTitle, 
      duration: 25, 
      breakDuration: 5, 
      sessions: Math.max(1, sessionsNum)
    });
    setNewTaskTitle('');
    setNewTaskSessions('');
    setFormError(null);
    setIsAdding(false);
  };

  const getIntensity = (s: number) => {
    if (s <= 4) return { label: 'Light', color: 'bg-pt-green/20 text-pt-green border-pt-green/30' };
    if (s <= 8) return { label: 'Medium', color: 'bg-pt-yellow/20 text-pt-yellow border-pt-yellow/30' };
    if (s <= 12) return { label: 'Heavy', color: 'bg-pt-coral/20 text-pt-coral border-pt-coral/30' };
    return { label: 'Extreme', color: 'bg-red-100 text-red-600 border-red-200' };
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
          <form onSubmit={handleAddTask} className="mt-6 max-w-sm mx-auto space-y-3 p-4 border-2 border-pt-black rounded-sketch bg-white">
            <div className="text-left">
              <label className="text-xs font-bold block mb-1">Task Name</label>
              <input 
                autoFocus
                className="w-full px-3 py-2 border-2 border-pt-black rounded-sketch outline-none focus:border-pt-coral" 
                placeholder="Apa yang mau difokuskan?" 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
              />
            </div>
            <div className="text-left">
              <label className="text-xs font-bold block mb-2">Sessions (Pomodoros)</label>
              <div className="flex items-center gap-3">
                {/* Custom Stepper */}
                <div className="flex items-center border-2 border-pt-black rounded-xl overflow-hidden bg-white shadow-[2px_2px_0px_#2B2B2B]">
                  <button 
                    type="button"
                    onClick={() => {
                      const val = typeof newTaskSessions === 'number' ? newTaskSessions : 1;
                      setNewTaskSessions(Math.max(1, val - 1));
                    }}
                    className="w-11 h-11 flex items-center justify-center hover:bg-pt-cream border-r-2 border-pt-black transition-colors font-bold text-lg"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    className="w-16 h-11 text-center font-semibold text-lg outline-none bg-transparent" 
                    placeholder="1"
                    value={newTaskSessions} 
                    onChange={e => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      setNewTaskSessions(val);
                      if (typeof val === 'number' && val <= 20) setFormError(null);
                    }} 
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const val = typeof newTaskSessions === 'number' ? newTaskSessions : 1;
                      setNewTaskSessions(Math.min(20, val + 1));
                      setFormError(null);
                    }}
                    className="w-11 h-11 flex items-center justify-center hover:bg-pt-cream border-l-2 border-pt-black transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>

                {/* Intensity Badge */}
                {typeof newTaskSessions === 'number' && newTaskSessions > 0 && (
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm transition-colors ${getIntensity(newTaskSessions).color}`}>
                    {getIntensity(newTaskSessions).label}
                  </div>
                )}
              </div>
              
              <div className="mt-2 min-h-[1.5rem]">
                {formError ? (
                  <p className="text-[10px] font-bold text-red-500">⚠️ {formError}</p>
                ) : (
                  <p className="text-[10px] font-bold text-gray-400">
                    {typeof newTaskSessions === 'number' && newTaskSessions > 12 
                      ? "⚠️ Large task detected. Consider splitting task." 
                      : "Recommended 1-12 sessions per task"}
                  </p>
                )}
              </div>
              
              {typeof newTaskSessions === 'number' && newTaskSessions > 12 && newTaskSessions <= 20 && (
                <div className="mt-1 p-2 bg-pt-yellow/10 border-2 border-dashed border-pt-yellow/30 rounded-sketch">
                  <PTButton variant="outline" size="sm" className="w-full text-[10px] h-7" onClick={() => {}}>
                    Split Task (AI Preview)
                  </PTButton>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <PTButton variant="primary" type="submit" className="flex-1" disabled={!!formError}>Save Task</PTButton>
              <PTButton variant="ghost" onClick={() => { setIsAdding(false); setFormError(null); }}>Cancel</PTButton>
            </div>
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
        className="p-3 rounded-sketch border-2 border-pt-black text-sm flex flex-col sm:flex-row gap-3 justify-between items-center relative overflow-hidden"
        style={{ backgroundColor: '#F28C2815', fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
      >
        <div className="flex items-center gap-2">
          <span>
            🍅 <strong>Pomodoro Mission:</strong> Tetap fokus, selesaikan sesi, hancurkan target.
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="font-bold text-pt-coral">
            Sessions Completed: {completedSessionsTotal}
          </span>
          
          <button
            onClick={openGuide}
            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-pt-black bg-pt-white hover:bg-pt-cream transition-all shadow-[2px_2px_0px_#2B2B2B] active:translate-y-[2px] active:shadow-none"
          >
            <HelpCircle size={16} className="text-pt-coral" />
            <span className="text-xs font-bold font-display">How it works</span>
            
            {showNewBadge && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-pt-yellow border-2 border-pt-black text-[10px] font-black shadow-sm"
              >
                NEW
              </motion.span>
            )}
          </button>
        </div>
      </motion.div>

      <PomodoroGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <style jsx global>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">
        
        {/* Timer Left Column */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <PomodoroTimer
              taskId={activeTask?.id}
              currentTask={activeTask ? `${activeTask.title} (${activeTask.completedSessions + 1}/${activeTask.sessions})` : 'All tasks completed!'}
              onSessionComplete={handleSessionComplete}
            />
          </motion.div>
          
          {/* Active Task Card */}
          {activeTask && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-sketch border-2 border-pt-black bg-pt-coral/5 shadow-[4px_4px_0px_#F28C28]"
            >
              <div className="flex flex-col gap-4 w-full">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-pt-coral mb-1 opacity-70">Current Active Task</p>
                  <h4 className="text-h4 font-display leading-tight">{activeTask.title}</h4>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-stone-600 mb-2">Progress: {activeTask.completedSessions} / {activeTask.sessions} sessions</p>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border-2 border-pt-black/10 bg-white/40">
                    {Array.from({ length: activeTask.sessions }).map((_, i) => (
                      <span key={i} className="text-xl transition-all">
                        {i < activeTask.completedSessions ? '🍅' : '⭕'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-pt-black/5">
                  <PTButton variant="primary" size="sm" onClick={() => completeSess(activeTask.id)} className="flex-1">
                    ✓ Complete Session
                  </PTButton>
                  <PTButton variant="ghost" size="sm" onClick={() => togglePomTask(activeTask.id)}>
                    {Boolean(activeTask.isCompleted ?? activeTask.completed) ? 'Reopen' : 'Skip Task'}
                  </PTButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* Generate More Fallback */}
          {!activeTask && (
            <div className="p-6 rounded-sketch border-2 border-pt-black text-center bg-pt-green/10">
              <p className="text-h4 font-display text-pt-green mb-3">Semua fokus session selesai 🎉</p>
              <p className="text-sm text-gray-600 mb-4">Masih mau lanjut?</p>
              <PTButton variant="primary" onClick={addMoreTasks} isLoading={isLoading}>+ Generate More Tasks</PTButton>
            </div>
          )}
        </div>

        {/* Right Column: Task Management & Queue */}
        <div className="space-y-8">
          
          {/* Upcoming Queue Preview */}
          <div className="rounded-sketch border-2 border-pt-black bg-pt-cream p-5">
            <h3 className="font-display text-h4 mb-4 flex items-center gap-2">
              <span>Upcoming Queue Preview</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pt-coral text-white font-bold">{totalSessionsInQueue} left</span>
            </h3>
            
            <div className="space-y-4">
              {activeTask && activeTask.sessions - activeTask.completedSessions > 1 && (
                <div className="p-3 bg-white/60 border-2 border-dashed border-pt-black/20 rounded-sketch">
                  <p className="text-xs font-bold text-gray-400 mb-2">Remaining in current task:</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: activeTask.sessions - activeTask.completedSessions - 1 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-500 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-pt-coral/30" />
                        Session {activeTask.completedSessions + 2 + i} of {activeTask.sessions}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400">Next tasks:</p>
                  {upcomingTasks.slice(0, 3).map((task, i) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-white border-2 border-pt-black rounded-sketch shadow-[2px_2px_0px_#2B2B2B]">
                      <span className="text-lg">Next</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.sessions} sessions total</p>
                      </div>
                    </div>
                  ))}
                  {upcomingTasks.length > 3 && (
                    <p className="text-center text-xs font-bold text-gray-400">And {upcomingTasks.length - 3} more tasks...</p>
                  )}
                </div>
              ) : (
                !activeTask && <p className="text-sm text-gray-500 italic text-center py-4">No more tasks in queue.</p>
              )}
            </div>
          </div>

          <HandDrawnDivider variant="dots" color="var(--pt-black)" className="opacity-20" />

          {/* Task Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-h4">Urutan Sesi Hari Ini</h3>
              <PTButton variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
                {isAdding ? 'Cancel' : '+ Add Task'}
              </PTButton>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddTask} 
                  className="mb-6 space-y-3 p-4 border-2 border-pt-black rounded-sketch bg-pt-cream"
                >
                  <div>
                    <label className="text-xs font-bold block mb-1">Task Name</label>
                    <input 
                      autoFocus
                      className="w-full px-3 py-2 border-2 border-pt-black rounded-sketch outline-none focus:border-pt-coral" 
                      placeholder="Apa misi selanjutnya?" 
                      value={newTaskTitle} 
                      onChange={e => setNewTaskTitle(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-2">Sessions (Pomodoros)</label>
                    <div className="flex items-center gap-3">
                      {/* Custom Stepper */}
                      <div className="flex items-center border-2 border-pt-black rounded-xl overflow-hidden bg-white shadow-[2px_2px_0px_#2B2B2B]">
                        <button 
                          type="button"
                          onClick={() => {
                            const val = typeof newTaskSessions === 'number' ? newTaskSessions : 1;
                            setNewTaskSessions(Math.max(1, val - 1));
                          }}
                          className="w-11 h-11 flex items-center justify-center hover:bg-pt-cream border-r-2 border-pt-black transition-colors font-bold text-lg"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          className="w-16 h-11 text-center font-semibold text-lg outline-none bg-transparent" 
                          placeholder="1"
                          value={newTaskSessions} 
                          onChange={e => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setNewTaskSessions(val);
                            if (typeof val === 'number' && val <= 20) setFormError(null);
                          }} 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const val = typeof newTaskSessions === 'number' ? newTaskSessions : 1;
                            setNewTaskSessions(Math.min(20, val + 1));
                            setFormError(null);
                          }}
                          className="w-11 h-11 flex items-center justify-center hover:bg-pt-cream border-l-2 border-pt-black transition-colors font-bold text-lg"
                        >
                          +
                        </button>
                      </div>

                      {/* Intensity Badge */}
                      {typeof newTaskSessions === 'number' && newTaskSessions > 0 && (
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm transition-colors ${getIntensity(newTaskSessions).color}`}>
                          {getIntensity(newTaskSessions).label}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 min-h-[1.5rem]">
                      {formError ? (
                        <p className="text-xs font-bold text-red-500">⚠️ {formError}</p>
                      ) : (
                        <p className="text-xs font-bold text-gray-400">
                          {typeof newTaskSessions === 'number' && newTaskSessions > 12 
                            ? "⚠️ Large task detected. Consider splitting task." 
                            : "Recommended 1-12 sessions per task"}
                        </p>
                      )}
                    </div>
                    
                    {typeof newTaskSessions === 'number' && newTaskSessions > 12 && newTaskSessions <= 20 && (
                      <div className="mt-2 p-3 bg-pt-yellow/10 border-2 border-dashed border-pt-yellow/30 rounded-sketch">
                        <PTButton variant="outline" size="sm" className="w-full text-xs" onClick={() => {}}>
                          Split Task (AI Preview)
                        </PTButton>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <PTButton variant="primary" type="submit" className="flex-1" disabled={!!formError}>Save Task</PTButton>
                    <PTButton variant="ghost" onClick={() => { setIsAdding(false); setFormError(null); }}>Cancel</PTButton>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={task.id} className="group flex items-center gap-3 p-3 border-2 border-pt-black rounded-sketch bg-pt-white shadow-[2px_2px_0px_#2B2B2B] transition-all hover:translate-y-[-1px]">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-pt-coral cursor-pointer"
                    checked={Boolean(task.isCompleted ?? task.completed)}
                    onChange={() => togglePomTask(task.id)} 
                  />
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${Boolean(task.isCompleted ?? task.completed) ? 'line-through text-gray-400' : 'text-pt-black'}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">{task.completedSessions}/{task.sessions} sessions</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: task.sessions }).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < task.completedSessions ? 'bg-pt-coral' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveTask(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-pt-black disabled:opacity-30">↑</button>
                    <button onClick={() => moveTask(idx, 1)} disabled={idx === tasks.length - 1} className="p-1 text-gray-400 hover:text-pt-black disabled:opacity-30">↓</button>
                    <button onClick={() => deletePomTask(task.id)} className="p-1 text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
