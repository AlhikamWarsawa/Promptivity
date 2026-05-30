'use client';

import { useMemo }              from 'react';
import { motion }               from 'framer-motion';
import { DayCard }              from './DayCard';
import { FrameworkEmptyState }  from '@/components/frameworks/FrameworkPageLayout';
import { useFramework }         from '@/store/usePTStore';
import type { Task }            from '@/types/pt.types';

/* ============================================
   MediumMethodView — The Medium Method page
   
   Core principle: One main thing per day.
   A few support things. That's it.
   
   Layout:
   - Philosophy note (brief)
   - 3 DayCards (Today, Tomorrow, Day 3)
   - Bottom philosophy reminder
   ============================================ */

interface DayData {
  label:        string;
  mainTask:     Task;
  supportTasks: Task[];
}

const DAY_LABELS = ['Hari Ini', 'Besok', 'Lusa'];

export function MediumMethodView() {
  const fwData = useFramework('medium-method');

  const days = useMemo((): (DayData & { date: string })[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as { days?: DayData[] };
    const rawDays = raw.days ?? [];

    // Map ke 3 hari ke depan dengan tanggal aktual
    return rawDays.slice(0, 3).map((day, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
      });

      return {
        ...day,
        label: DAY_LABELS[i] ?? `Hari ${i + 1}`,
        date:  dateStr,
      };
    });
  }, [fwData]);

  if (!fwData || days.length === 0) {
    return <FrameworkEmptyState frameworkId="medium-method" />;
  }

  // Count total tasks across all days
  const totalMainTasks    = days.length;
  const totalSupportTasks = days.reduce((sum, d) => sum + d.supportTasks.length, 0);

  return (
    <div className="space-y-8">

      {/* Philosophy note */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-lime)' + '20' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          🌿 <strong>Medium Method:</strong> Pilih <em>satu</em> hal terpenting per hari
          dan selesaikan itu dulu sebelum yang lain. Bukan 10 task — cukup 1 utama + 2-3 pendukung.
          Sederhana, fokus, sustainable.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-6 flex-wrap"
      >
        <StatPill icon="🎯" label="Main Tasks" value={totalMainTasks} color="var(--pt-coral)" />
        <StatPill icon="📌" label="Support Tasks" value={totalSupportTasks} color="var(--pt-blue)" />
        <StatPill icon="📅" label="Hari Direncanakan" value={days.length} color="var(--pt-green)" />
      </motion.div>

      {/* Day cards */}
      <div className="space-y-6">
        {days.map((day, i) => (
          <DayCard
            key={i}
            data={day}
            isToday={i === 0}
            index={i}
          />
        ))}
      </div>

      {/* Bottom wisdom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center pt-4"
      >
        <p
          className="text-sm italic"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          &ldquo;You don't need more hours. You need better focus.&rdquo;
        </p>
        <p
          className="text-xs mt-1"
          style={{ fontFamily: 'var(--font-body)', color: '#B0B0B0' }}
        >
          — The Medium Method philosophy
        </p>
      </motion.div>
    </div>
  );
}

/* ---- Stat Pill ---- */
function StatPill({
  icon, label, value, color,
}: {
  icon: string; label: string; value: number; color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <span
        className="text-h4"
        style={{ fontFamily: 'var(--font-display)', color }}
      >
        {value}
      </span>
      <span
        className="text-sm"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {label}
      </span>
    </div>
  );
}
