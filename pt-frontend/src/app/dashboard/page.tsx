'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePTStore } from '@/store/usePTStore';
import { DashboardNav } from '@/components/pt/DashboardNav';
import { TaskCard } from '@/components/pt/TaskCard';
import { FrameworkCard } from '@/components/pt/FrameworkCard';
import { TodayPlanPanel } from '@/components/pt/TodayPlanPanel';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { PTButton } from '@/components/pt/PTButton';
import { getFramework } from '@/lib/frameworkConfig';
import PTStorage from '@/lib/storage';
import { MotiMascot, PTLogo } from '@/components/pt/icons';
import { AddTaskModal } from '@/components/pt/AddTaskModal';
import { EditTaskModal } from '@/components/pt/EditTaskModal';
import { EmptyState } from '@/components/pt/EmptyState';
import type { Task } from '@/types/pt.types';

type SortOrder = 'priority' | 'time' | 'category';

const PRIORITY_ORDER: Record<Task['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function DashboardPage() {
  const router = useRouter();
  const session = usePTStore((s) => s.session);
  const loadFromStorage = usePTStore((s) => s.loadFromStorage);
  const toggleTask = usePTStore((s) => s.toggleTask);
  const isLoading = usePTStore((s) => s.isLoading);
  const addMoreTasks = usePTStore((s) => s.addMoreTasks);
  const deleteTask = usePTStore((s) => s.deleteTask);
  const generateSubtasks = usePTStore((s) => s.generateSubtasks);

  const [sortBy, setSortBy] = useState<SortOrder>('priority');
  const [filterDone, setFilterDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hybrid Task Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Hydration safe
  useEffect(() => {
    setMounted(true);
    loadFromStorage();
  }, [loadFromStorage]);

  // Redirect if no session in store or localStorage
  useEffect(() => {
    if (mounted && !session && !PTStorage.getSession()) {
      router.replace('/');
    }
  }, [mounted, session, router]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    if (!session) return [];
    let tasks = [...session.masterTaskList];
    if (filterDone) tasks = tasks.filter((t) => !t.isCompleted);

    switch (sortBy) {
      case 'priority':
        return tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      case 'time':
        return tasks.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
      case 'category':
        return tasks.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return tasks;
    }
  }, [session, sortBy, filterDone]);

  // Framework sorted by score
  const sortedFrameworks = useMemo(() => {
    if (!session) return [];
    return [...session.frameworks].sort(
      (a, b) => b.recommendationScore - a.recommendationScore,
    );
  }, [session]);

  const topFramework = sortedFrameworks[0];

  if (!mounted || !session) return <DashboardSkeleton />;

  const persona = PTStorage.getPersona();
  const firstName = persona?.name?.split(' ')[0] || 'Friend';
  const userRole = persona?.role && persona.role !== 'lainnya' ? persona.role : null;

  const completedCount = session.masterTaskList.filter((t) => t.isCompleted).length;
  const totalCount = session.masterTaskList.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pt-white)' }}>
      <DashboardNav userName={persona?.name} />
      <HeroSection firstName={firstName} role={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-8">
            {topFramework && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <FrameworkCard framework={topFramework} isTop={true} variant="feature" className="mt-3" />
              </motion.section>
            )}

            <div className="lg:hidden">
              <TodayPlanPanel actions={session.todayPlan} />
            </div>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <SectionLabel
                  icon={<PTLogo size={24} />}
                  label={`Semua Task (${completedCount}/${totalCount} selesai)`}
                />

                <PTButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddTaskOpen(true)}
                  className="order-first sm:order-none w-full sm:w-auto"
                >
                  + Add Task
                </PTButton>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterDone((v) => !v)}
                    className={[
                      'px-3 py-1.5 rounded-sketch border-2 border-pt-black text-label font-bold transition-all',
                      filterDone ? 'bg-pt-black text-white' : 'bg-pt-white text-pt-black hover:bg-pt-cream',
                    ].join(' ')}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {filterDone ? '✓ Sembunyikan Selesai' : 'Sembunyikan Selesai'}
                  </button>
                  <SortControl value={sortBy} onChange={setSortBy} />
                </div>
              </div>

              <div className="w-full h-2.5 rounded-sketch border border-pt-black/20 overflow-hidden mb-4 bg-pt-cream">
                <motion.div
                  className="h-full bg-pt-green"
                  animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {sortedTasks.length === 0 ? (
                <EmptyState
                  message={filterDone ? 'Semua task sudah selesai! 🎉' : 'Tidak ada task yang ditemukan.'}
                  subMessage={filterDone ? 'Klik tombol di bawah untuk menambah tantangan baru!' : undefined}
                  icon={filterDone ? '🏆' : '🔍'}
                />
              ) : (
                <motion.div layout className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {sortedTasks.map((task, i) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <TaskCard
                          task={task}
                          onToggle={toggleTask}
                          onEdit={(t) => { setEditingTask(t); setIsEditTaskOpen(true); }}
                          onDelete={deleteTask}
                          onAskMoti={generateSubtasks}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {isAllCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-6 rounded-sketch border-2 border-dashed border-pt-black/30 bg-pt-cream/20 flex flex-col items-center text-center gap-4"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl">🚀</span>
                    <h4 className="font-display text-xl">Mantap! Semua selesai!</h4>
                    <p className="text-sm text-pt-brown" style={{ fontFamily: 'var(--font-body)' }}>
                      Mau lanjut produktif? Biarkan Moti carikan task baru berdasarkan situasimu.
                    </p>
                  </div>
                  <PTButton variant="primary" size="lg" onClick={addMoreTasks} disabled={isLoading}>
                    {isLoading ? '✨ Moti sedang mencari...' : '✨ Add More Tasks (AI)'}
                  </PTButton>
                </motion.div>
              )}
            </motion.section>

            <section className="mt-12">
              <HandDrawnDivider variant="wave" color="var(--pt-black)" className="opacity-20 mb-8" />
              <SectionLabel icon={<PTLogo size={24} />} label="Framework Recommendations" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
                {sortedFrameworks.map((fw, i) => (
                  <motion.div
                    key={fw.frameworkId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                  >
                    <FrameworkCard
                      framework={fw}
                      variant="grid"
                      rank={i + 1}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:w-80 space-y-6">
            <div className="hidden lg:block lg:sticky lg:top-24 space-y-6">
              <TodayPlanPanel actions={session.todayPlan} />
              <QuickStats totalTasks={totalCount} completedTasks={completedCount} topFramework={session.topRecommendation} processedAt={session.processedAt} />
            </div>
          </div>
        </div>
      </div>

      <AddTaskModal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} />
      <EditTaskModal isOpen={isEditTaskOpen} onClose={() => { setIsEditTaskOpen(false); setEditingTask(null); }} task={editingTask} />
    </div>
  );
}

function HeroSection({ firstName, role }: { firstName: string | null; role: string | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-8 mb-8 bg-pt-yellow border-b-2 border-pt-black"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-4xl sm:text-5xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}>
            {firstName ? `Welcome back, ${firstName}! 🎯` : 'Your Mission is Ready! 🎯'}
          </h1>
          <p className="mt-1.5 text-sm font-bold uppercase tracking-wide text-pt-brown" style={{ fontFamily: 'var(--font-body)' }}>
            {role ? `${role} mode activated` : 'Moti has analyzed your story and built 15 frameworks for you.'}
          </p>
        </div>
        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="shrink-0">
          <MotiMascot size={80} />
        </motion.div>
      </div>
    </motion.section>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <h2 className="font-display text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}>{label}</h2>
    </div>
  );
}

function SortControl({ value, onChange }: { value: SortOrder; onChange: (v: SortOrder) => void }) {
  const options: { value: SortOrder; label: string }[] = [
    { value: 'priority', label: 'Prioritas' },
    { value: 'time', label: 'Durasi' },
    { value: 'category', label: 'Kategori' },
  ];
  return (
    <div className="flex items-center gap-1 rounded-sketch border-2 border-pt-black overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1.5 text-label font-bold ${value === opt.value ? 'bg-pt-black text-white' : 'bg-pt-white text-pt-black hover:bg-pt-cream'}`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function QuickStats({ totalTasks, completedTasks, topFramework, processedAt }: any) {
  const meta = getFramework(topFramework);
  return (
    <div className="rounded-sketch border-2 border-pt-black p-4 space-y-3 bg-pt-cream">
      <p className="text-label font-bold uppercase tracking-wide text-pt-black" style={{ fontFamily: 'var(--font-body)' }}>📊 Quick Stats</p>
      <div className="space-y-2">
        <StatRow label="Total Task" value={`${totalTasks}`} />
        <StatRow label="Selesai" value={`${completedTasks}`} color="var(--pt-green)" />
        <StatRow label="Top Framework" value={meta?.shortName ?? topFramework} />
        <StatRow label="Diproses" value={new Date(processedAt).toLocaleDateString()} small />
      </div>
    </div>
  );
}

function StatRow({ label, value, color, small }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-pt-brown" style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
      <span className={`${small ? 'text-xs' : 'text-sm font-bold'}`} style={{ fontFamily: 'var(--font-body)', color: color ?? 'var(--pt-black)' }}>{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-pt-white">
      <div className="w-full h-16 border-b-2 border-pt-black" />
      <div className="w-full h-24 border-b-2 border-pt-black bg-pt-yellow animate-pulse" />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-sketch border-2 border-pt-black/20 bg-pt-cream animate-pulse" />)}
      </div>
    </div>
  );
}
