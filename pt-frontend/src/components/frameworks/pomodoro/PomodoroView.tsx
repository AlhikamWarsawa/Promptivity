'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence }     from 'framer-motion';
import { PomodoroTimer }               from './PomodoroTimer';
import { HandDrawnDivider }            from '@/components/pt/HandDrawnDivider';
import { useFramework, usePTStore }    from '@/store/usePTStore';
import { PTButton }                    from '@/components/pt/PTButton';
import { PomodoroGuideModal }          from './PomodoroGuideModal';
import { BookOpen, BarChart3, Target, History, Settings2, ShieldAlert, Sparkles } from 'lucide-react';

/* ============================================
   PomodoroView — Full Focus Workflow
   ============================================ */

const PRESETS = [
  { name: 'Standard', work: 25, break: 5, label: '25/5' },
  { name: 'Deep Work', work: 50, break: 10, label: '50/10' },
  { name: 'Flow', work: 90, break: 20, label: '90/20' },
];

export function PomodoroView() {
  const fwData = useFramework('pomodoro');
  
  const addPomTask    = usePTStore(s => s.addPomodoroTask);
  const deletePomTask = usePTStore(s => s.deletePomodoroTask);
  const togglePomTask = usePTStore(s => s.togglePomodoroTask);
  const reorderPom    = usePTStore(s => s.reorderPomodoroTasks);
  const addMoreTasks  = usePTStore(s => s.addMorePomodoroTasks);
  const completeSess  = usePTStore(s => s.completePomodoroSession);
  const logInt        = usePTStore(s => s.logPomodoroInterruption);
  const saveReflect   = usePTStore(s => s.savePomodoroReflection);
  const updateStats   = usePTStore(s => s.updatePomodoroStats);
  const isLoading     = usePTStore(s => s.isLoading);

  // UI States
  const [isAdding, setIsAdding] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isReflectOpen, setIsReflectOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  // Add Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSessions, setNewTaskSessions] = useState<number | string>(1);
  const [newBuffer, setNewBuffer] = useState(0);
  const [newPreset, setNewPreset] = useState(PRESETS[0]);

  // Reflection Form State
  const [reflectData, setReflectData] = useState({ wentWell: '', distractions: '', improvements: '' });

  useEffect(() => {
    const seen = localStorage.getItem('pomodoro_guide_seen');
    if (!seen) setShowBadge(true);
  }, []);

  const rawData = fwData?.rawData as any || {};
  const tasks = useMemo(() => rawData.tasks || [], [rawData.tasks]);

  const activeTask = useMemo(() => tasks.find((t: any) => !t.isCompleted), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((t: any) => !t.isCompleted && t.id !== activeTask?.id), [tasks, activeTask]);

  // Stats Calculations
  const completedSessionsTotal = useMemo(() => tasks.reduce((acc: number, t: any) => acc + t.completedSessions, 0), [tasks]);
  const plannedSessionsTotal = useMemo(() => tasks.reduce((acc: number, t: any) => acc + t.sessions, 0), [tasks]);
  const totalInterruptionCount = useMemo(() => tasks.reduce((acc: number, t: any) => acc + (t.interruptionLog?.length || 0), 0), [tasks]);
  
  const focusScore = useMemo(() => {
    if (plannedSessionsTotal === 0) return 0;
    const base = (completedSessionsTotal / plannedSessionsTotal) * 100;
    const penalty = totalInterruptionCount * 5;
    return Math.max(0, Math.min(100, Math.round(base - penalty)));
  }, [completedSessionsTotal, plannedSessionsTotal, totalInterruptionCount]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addPomTask({ 
      title: newTaskTitle, 
      duration: newPreset.work, 
      breakDuration: newPreset.break, 
      sessions: Number(newTaskSessions) || 1,
      bufferSessions: newBuffer,
      presetName: newPreset.name
    } as any);
    setNewTaskTitle('');
    setNewTaskSessions(1);
    setNewBuffer(0);
    setIsAdding(false);
  };

  const handleSessionComplete = (mode: 'work' | 'break', duration: number) => {
    updateStats(duration, mode === 'break');
    if (mode === 'work' && activeTask) {
      completeSess(activeTask.id);
    }
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveReflect(reflectData);
    setIsReflectOpen(false);
    setReflectData({ wentWell: '', distractions: '', improvements: '' });
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. CAPACITY & FOCUS SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-sketch border-2 border-pt-black bg-pt-coral/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-pt-black bg-pt-coral flex items-center justify-center text-white font-display text-xl">
             {completedSessionsTotal}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today's Capacity</p>
            <p className="text-sm font-bold">{completedSessionsTotal} / {plannedSessionsTotal} Sessions</p>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
               <div className="h-full bg-pt-coral" style={{ width: `${(completedSessionsTotal / Math.max(plannedSessionsTotal, 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-sketch border-2 border-pt-black bg-pt-yellow/5 flex items-center gap-4">
          <BarChart3 className="w-8 h-8 text-pt-yellow" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Focus Score</p>
            <p className="text-sm font-bold">{focusScore}/100 <span className="text-[10px] text-gray-400 font-normal">{(focusScore > 80 ? 'Perfect' : focusScore > 50 ? 'Good' : 'Keep going')}</span></p>
          </div>
        </div>

        <div className="p-4 rounded-sketch border-2 border-pt-black bg-pt-cyan/5 flex items-center gap-4">
          <Target className="w-8 h-8 text-pt-cyan" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Focus</p>
            <p className="text-sm font-bold">{rawData.totalFocusMinutes || 0} min</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE TIMER & MANAGEMENT */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <PomodoroTimer
              currentTask={activeTask?.title}
              taskId={activeTask?.id}
              workDuration={activeTask?.duration || 25}
              breakDuration={activeTask?.breakDuration || 5}
              onSessionComplete={handleSessionComplete}
              onInterrupted={(type, note) => activeTask && logInt(activeTask.id, type, note)}
            />
          </motion.div>

          <div className="flex items-center justify-between">
            <h3 className="font-display text-h4">Planned Sessions</h3>
            <div className="flex gap-2">
               <PTButton variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
                 {isAdding ? 'Close' : '+ New Task'}
               </PTButton>
               <PTButton variant="ghost" size="sm" onClick={() => setIsGuideOpen(true)}>
                 <BookOpen className="w-4 h-4 mr-1" /> Help
               </PTButton>
            </div>
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddTask}
                className="p-5 border-2 border-pt-black rounded-sketch bg-pt-cream space-y-4 overflow-hidden shadow-[4px_4px_0px_#2B2B2B]"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Task Focus Name</label>
                  <input autoFocus className="w-full p-2.5 border-2 border-pt-black rounded-sketch outline-none focus:border-pt-coral" placeholder="What are we focusing on?" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Estimate Sessions</label>
                    <input type="number" min="1" max="20" className="w-full p-2.5 border-2 border-pt-black rounded-sketch outline-none focus:border-pt-coral" value={newTaskSessions} onChange={e => setNewTaskSessions(e.target.value)} />
                    {Number(newTaskSessions) > 4 && (
                      <p className="text-[10px] text-pt-coral font-bold mt-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Break this task down?
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Buffer Sessions</label>
                    <input type="number" min="0" className="w-full p-2.5 border-2 border-pt-black rounded-sketch outline-none focus:border-pt-coral" value={newBuffer} onChange={e => setNewBuffer(Number(e.target.value))} />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">Focus Style (Presets)</label>
                   <div className="flex gap-2">
                     {PRESETS.map(p => (
                       <button key={p.name} type="button" onClick={() => setNewPreset(p)} className={`flex-1 p-2 border-2 rounded-sketch text-[10px] font-bold transition-all ${newPreset.name === p.name ? 'border-pt-black bg-pt-coral text-white' : 'border-pt-black/10 bg-white hover:border-pt-black'}`}>
                         {p.name} ({p.label})
                       </button>
                     ))}
                   </div>
                </div>

                <PTButton variant="primary" className="w-full" type="submit">Add Focus Session</PTButton>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-3">
             {tasks.map((task: any, idx: number) => (
               <div key={task.id} className={`group p-4 border-2 border-pt-black rounded-sketch bg-white shadow-[2px_2px_0px_#2B2B2B] flex items-center gap-4 transition-all hover:translate-y-[-2px] ${task.isCompleted ? 'opacity-50 grayscale' : ''}`}>
                  <div className={`w-8 h-8 rounded-full border-2 border-pt-black flex items-center justify-center font-display ${task.isCompleted ? 'bg-pt-green text-white' : 'bg-pt-cream'}`}>
                    {task.isCompleted ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-bold text-pt-coral">{task.completedSessions}/{task.sessions} 🍅</span>
                       {task.bufferSessions > 0 && <span className="text-[10px] font-bold text-pt-yellow">+{task.bufferSessions} Buffer</span>}
                       <span className="text-[10px] text-gray-400">• {task.presetName || 'Standard'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => deletePomTask(task.id)} className="p-1.5 text-red-400 hover:text-red-600">✕</button>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* RIGHT COLUMN: QUEUE & INSIGHTS */}
        <div className="space-y-8 lg:sticky lg:top-20">
          
          {/* UPCOMING QUEUE */}
          <div className="p-6 rounded-sketch border-2 border-pt-black bg-pt-white shadow-[6px_6px_0px_#2B2B2B]">
            <h4 className="font-display text-h4 mb-4 flex items-center gap-2">
              <History className="w-5 h-5" /> Queue Roadmap
            </h4>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.slice(0, 4).map((t: any, i: number) => (
                  <div key={t.id} className="flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-pt-coral" />
                     <p className="text-sm font-medium text-gray-600 truncate">{t.title}</p>
                     <span className="ml-auto text-[10px] font-bold text-gray-400">{t.sessions} sess</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No tasks waiting in queue.</p>
            )}
          </div>

          {/* INTERRUPTION LOG */}
          <div className="p-6 rounded-sketch border-2 border-pt-black bg-pt-yellow/5">
             <h4 className="font-display text-h4 mb-4 flex items-center gap-2">
               <ShieldAlert className="w-5 h-5 text-pt-yellow" /> Distraction Log
             </h4>
             <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {tasks.flatMap((t: any) => t.interruptionLog || []).length > 0 ? (
                  tasks.flatMap((t: any) => t.interruptionLog || []).sort((a: any, b: any) => b.timestamp - a.timestamp).map((log: any) => (
                    <div key={log.id} className="text-[10px] p-2 bg-white border border-pt-black/10 rounded-sketch flex justify-between">
                       <span>{log.type === 'internal' ? '🧠 Internal' : '📢 External'}: {log.note || 'No note'}</span>
                       <span className="text-gray-300">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Focused so far. No distractions logged!</p>
                )}
             </div>
          </div>

          {/* REFLECTION TRIGGER */}
          <div className="p-6 rounded-sketch border-2 border-pt-black bg-pt-cyan/5 text-center">
             <Sparkles className="w-8 h-8 text-pt-cyan mx-auto mb-3" />
             <h4 className="font-display text-sm mb-2">Done for the day?</h4>
             <p className="text-[10px] text-gray-500 mb-4">Reflect on your focus sessions to improve tomorrow.</p>
             <PTButton variant="outline" className="w-full" onClick={() => setIsReflectOpen(true)}>End Day Reflection</PTButton>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <PomodoroGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      
      <AnimatePresence>
        {isReflectOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pt-black/60 backdrop-blur-sm">
             <motion.form 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               onSubmit={handleReflectionSubmit}
               className="w-full max-w-md bg-white border-4 border-pt-black rounded-[2rem] p-8 space-y-6 shadow-[8px_8px_0px_#2B2B2B]"
             >
                <div className="text-center">
                  <h3 className="font-display text-h3 mb-1">Focus Reflection 🧘‍♂️</h3>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Growth comes from reflection</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold mb-1 block">What went well today?</label>
                    <textarea required className="w-full p-3 border-2 border-pt-black rounded-sketch text-sm" rows={2} value={reflectData.wentWell} onChange={e => setReflectData({...reflectData, wentWell: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block">What distracted you the most?</label>
                    <textarea required className="w-full p-3 border-2 border-pt-black rounded-sketch text-sm" rows={2} value={reflectData.distractions} onChange={e => setReflectData({...reflectData, distractions: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block">What will you improve tomorrow?</label>
                    <textarea required className="w-full p-3 border-2 border-pt-black rounded-sketch text-sm" rows={2} value={reflectData.improvements} onChange={e => setReflectData({...reflectData, improvements: e.target.value})} />
                  </div>
                </div>

                <div className="flex gap-3">
                   <PTButton variant="primary" type="submit" className="flex-1">Save Reflection</PTButton>
                   <PTButton variant="ghost" onClick={() => setIsReflectOpen(false)}>Maybe Later</PTButton>
                </div>
             </motion.form>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
