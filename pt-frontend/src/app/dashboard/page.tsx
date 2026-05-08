'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePTStore } from '@/store/usePTStore';
import { DashboardNav } from '@/components/pt/DashboardNav';
import { TaskCard } from '@/components/pt/TaskCard';
import { FrameworkCard } from '@/components/pt/FrameworkCard';
import { TodayPlanPanel } from '@/components/pt/TodayPlanPanel';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { PTButton } from '@/components/pt/PTButton';
import { PriorityBadge } from '@/components/pt/PTBadge';
import { getFramework, FRAMEWORK_LIST } from '@/lib/frameworkConfig';
import PTStorage from '@/lib/storage';
import type { Task, FrameworkId } from '@/types/pt.types';

/* ============================================
   Dashboard — Mission Results Page
   
   Sections:
   1. DashboardNav (sticky)
   2. HeroSection — "Your Mission is Ready!"
   3. TodayPlanPanel (sidebar sticky on desktop)
   4. TopRecommendationCard
   5. MasterTaskList (sortable)
   6. FrameworkGrid (13 cards)
   ============================================ */

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

  const [sortBy, setSortBy] = useState<SortOrder>('priority');
  const [filterDone, setFilterDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration safe
  useEffect(() => {
    setMounted(true);
    loadFromStorage();
  }, [loadFromStorage]);

  // Redirect kalau tidak ada session setelah load
  useEffect(() => {
    if (mounted && !session) {
      const stored = PTStorage.getSession();
      if (!stored) router.push('/');
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

  if (!mounted || !session) {
    return <DashboardSkeleton />;
  }

  const persona = PTStorage.getPersona();
  const firstName = persona?.name && persona.name !== 'Friend'
    ? persona.name.split(' ')[0]
    : null;

  const completedCount = session.masterTaskList.filter((t) => t.isCompleted).length;
  const totalCount = session.masterTaskList.length;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      {/* Sticky Nav */}
      <DashboardNav userName={persona?.name} />

      {/* Hero section */}
      <HeroSection firstName={firstName} />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ===== LEFT / MAIN COLUMN ===== */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Top Recommendation */}
            {topFramework && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                aria-label="Top recommended framework"
              >
                {/* <SectionLabel icon="🏆" label="Framework Terpilih untuk Kamu" /> */}
                <FrameworkCard
                  framework={topFramework}
                  isTop={true}
                  variant="feature"
                  className="mt-3"
                />
              </motion.section>
            )}

            {/* Today's Plan — mobile only (di atas task list) */}
            <div className="lg:hidden">
              <TodayPlanPanel actions={session.todayPlan} />
            </div>

            {/* Master Task List */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              aria-label="All tasks"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <SectionLabel
                  icon="📋"
                  label={`Semua Task (${completedCount}/${totalCount} selesai)`}
                />

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter done */}
                  <button
                    type="button"
                    onClick={() => setFilterDone((v) => !v)}
                    className={[
                      'px-3 py-1.5 rounded-sketch border-2 border-pt-black text-label font-bold',
                      'transition-all duration-150',
                      filterDone
                        ? 'bg-pt-black text-white shadow-none translate-x-[1px] translate-y-[1px]'
                        : 'bg-pt-white text-pt-black shadow-sketch hover:-translate-x-px hover:-translate-y-px',
                    ].join(' ')}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {filterDone ? '✓ Sembunyikan Selesai' : 'Sembunyikan Selesai'}
                  </button>

                  {/* Sort */}
                  <SortControl value={sortBy} onChange={setSortBy} />
                </div>
              </div>

              {/* Overall progress bar */}
              <div
                className="w-full h-2.5 rounded-sketch border border-pt-black/20 overflow-hidden mb-4"
                style={{ backgroundColor: 'var(--pt-cream)' }}
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemax={totalCount}
              >
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: 'var(--pt-green)' }}
                  animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Task cards */}
              {sortedTasks.length === 0 ? (
                <EmptyState
                  message={filterDone
                    ? 'Semua task sudah selesai! 🎉'
                    : 'Tidak ada task yang ditemukan.'}
                />
              ) : (
                <motion.div
                  layout
                  className="space-y-3"
                >
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
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.section>

            {/* Framework Grid — semua 13 */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              aria-label="All 13 frameworks"
            >
              <HandDrawnDivider variant="wave" color="var(--pt-black)" className="opacity-20 mb-6" />
              <SectionLabel icon="🗂️" label="Semua 13 Framework" />
              <p
                className="text-sm mt-1 mb-4"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                Klik framework untuk melihat mission plan detailnya.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {sortedFrameworks.map((fw, i) => (
                  <motion.div
                    key={fw.frameworkId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
                  >
                    <FrameworkCard
                      framework={fw}
                      isTop={fw.frameworkId === session.topRecommendation}
                      variant="grid"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded border-2 border-pt-black"
                    style={{ backgroundColor: 'var(--pt-yellow)' }}
                  />
                  <span className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
                    Top Pick
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-full max-w-[40px] h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--pt-green)' }}
                  />
                  <span className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
                    Score tinggi = cocok denganmu
                  </span>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ===== RIGHT / SIDEBAR ===== */}
          <div className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              <TodayPlanPanel actions={session.todayPlan} />

              {/* Quick stats */}
              <QuickStats
                totalTasks={totalCount}
                completedTasks={completedCount}
                topFramework={session.topRecommendation}
                processedAt={session.processedAt}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */

/* ---- Hero Section ---- */

function HeroSection({ firstName }: { firstName: string | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-6 py-8"
      style={{ backgroundColor: 'var(--pt-yellow)', borderBottom: '2px solid var(--pt-black)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: 'var(--pt-black)',
              lineHeight: 1.15,
            }}
          >
            {firstName
              ? `Mission siap, ${firstName}! 🎯`
              : 'Your Mission is Ready! 🎯'}
          </h1>
          <p
            className="mt-1.5 text-sm"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-brown)' }}
          >
            Moti sudah menganalisis ceritamu dan membangun 13 framework productivity untukmu.
          </p>
        </div>

        {/* Moti mini mascot */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="shrink-0 text-5xl"
          aria-label="Moti, maskot Promptivity"
        >
          🧠
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ---- Section Label ---- */

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h4)',
          color: 'var(--pt-black)',
        }}
      >
        {label}
      </h2>
    </div>
  );
}

/* ---- Sort Control ---- */

function SortControl({
  value,
  onChange,
}: {
  value: SortOrder;
  onChange: (v: SortOrder) => void;
}) {
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
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'px-2.5 py-1.5 text-label font-bold transition-colors duration-100',
            value === opt.value
              ? 'bg-pt-black text-white'
              : 'bg-pt-white text-pt-black hover:bg-pt-cream',
          ].join(' ')}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---- Quick Stats ---- */

function QuickStats({
  totalTasks,
  completedTasks,
  topFramework,
  processedAt,
}: {
  totalTasks: number;
  completedTasks: number;
  topFramework: FrameworkId;
  processedAt: string;
}) {
  const meta = getFramework(topFramework);
  const processedDate = new Date(processedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-4 space-y-3"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      <p
        className="text-label font-bold uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
      >
        📊 Quick Stats
      </p>

      <div className="space-y-2">
        <StatRow label="Total Task" value={`${totalTasks}`} />
        <StatRow label="Selesai" value={`${completedTasks}`} color="var(--pt-green)" />
        <StatRow label="Top Framework" value={meta?.shortName ?? topFramework} />
        <StatRow label="Diproses" value={processedDate} small />
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-sm"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {label}
      </span>
      <span
        className={small ? 'text-xs' : 'text-sm font-bold'}
        style={{ fontFamily: 'var(--font-body)', color: color ?? 'var(--pt-black)' }}
      >
        {value}
      </span>
    </div>
  );
}

/* ---- Empty State ---- */

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="text-center py-12 rounded-sketch border-2 border-pt-black/20"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      <p className="text-4xl mb-3" aria-hidden="true">🎉</p>
      <p style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>{message}</p>
    </div>
  );
}

/* ---- Dashboard Skeleton ---- */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pt-white)' }}>
      <div
        className="w-full h-16 border-b-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-white)' }}
      />
      <div
        className="w-full h-24 border-b-2 border-pt-black animate-pulse"
        style={{ backgroundColor: 'var(--pt-yellow)' }}
      />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-sketch border-2 border-pt-black/20 animate-pulse"
            style={{ backgroundColor: 'var(--pt-cream)' }}
          />
        ))}
      </div>
    </div>
  );
}
