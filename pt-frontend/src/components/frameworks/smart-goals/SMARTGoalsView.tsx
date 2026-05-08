'use client';

import { useMemo }             from 'react';
import { motion }              from 'framer-motion';
import { SMARTGoalCard }       from './SMARTGoalCard';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }    from '@/components/pt/HandDrawnDivider';
import { useFramework }        from '@/store/usePTStore';

/* ============================================
   SMARTGoalsView — SMART Goals framework page
   
   Layout:
   1. What SMART means (brief)
   2. Goals overview stats
   3. SMARTGoalCards (one per goal, expandable)
   4. SMART reminder footer
   ============================================ */

interface SMARTGoal {
  title:      string;
  specific:   string;
  measurable: string;
  achievable: string;
  relevant:   string;
  timeBound:  string;
  progress:   number;
}

interface SMARTRawData {
  goals?: SMARTGoal[];
}

export function SMARTGoalsView() {
  const fwData = useFramework('smart-goals');

  const goals = useMemo((): SMARTGoal[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as SMARTRawData;
    return raw.goals ?? [];
  }, [fwData]);

  if (!fwData || goals.length === 0) {
    return (
      <FrameworkEmptyState
        frameworkId="smart-goals"
        message="Moti tidak menemukan goal yang bisa diparsing ke SMART. Sebutkan target spesifik dengan deadline dalam ceritamu."
      />
    );
  }

  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / goals.length)
    : 0;

  const completedGoals = goals.filter((g) => (g.progress ?? 0) === 100).length;

  return (
    <div className="space-y-6">

      {/* What SMART means */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-sketch border-2 border-pt-black overflow-hidden"
        style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
      >
        {/* Header */}
        <div
          className="px-4 py-2 border-b-2 border-pt-black"
          style={{ backgroundColor: 'var(--pt-cyan)' + '30' }}
        >
          <p
            className="text-label font-bold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            ⭐ Apa itu SMART?
          </p>
        </div>

        {/* Letter breakdown — compact horizontal */}
        <div className="flex divide-x-2 divide-pt-black/15 bg-pt-white">
          {[
            { l: 'S', w: 'Specific',   c: 'var(--pt-blue)'    },
            { l: 'M', w: 'Measurable', c: 'var(--pt-cyan)'    },
            { l: 'A', w: 'Achievable', c: 'var(--pt-green)'   },
            { l: 'R', w: 'Relevant',   c: 'var(--pt-mustard)' },
            { l: 'T', w: 'Time-bound', c: 'var(--pt-coral)'   },
          ].map((item) => (
            <div key={item.l} className="flex-1 text-center py-3 px-1">
              <p
                className="font-bold text-lg"
                style={{ fontFamily: 'var(--font-display)', color: item.c }}
              >
                {item.l}
              </p>
              <p
                className="text-[9px] font-bold leading-tight mt-0.5"
                style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
              >
                {item.w}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Overview stats */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <OverviewStat label="Total Goals"   value={goals.length}      icon="🎯" color="var(--pt-blue)"    />
        <OverviewStat label="Avg Progress"  value={`${avgProgress}%`} icon="📊" color="var(--pt-mustard)" />
        <OverviewStat label="Tercapai"      value={completedGoals}    icon="🏆" color="var(--pt-green)"   />
      </motion.div>

      <HandDrawnDivider
        variant="wave"
        label="GOAL KAMU"
        color="var(--pt-black)"
        className="opacity-25"
      />

      {/* Goal cards */}
      <div className="space-y-4">
        {goals.map((goal, i) => (
          <SMARTGoalCard
            key={i}
            goal={goal}
            goalIndex={i}
            totalGoals={goals.length}
          />
        ))}
      </div>

      {/* SMART reminder footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-cream)' }}
      >
        <p
          className="text-label font-bold mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          💡 Reminder
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          Goal yang tidak memiliki deadline hanyalah angan-angan.
          Update progress setiap minggu — perubahan tersimpan otomatis.
          Kalau progress stagnan 2 minggu berturut-turut, waktunya review ulang goalmu.
        </p>
      </motion.div>
    </div>
  );
}

/* ---- Overview Stat ---- */
function OverviewStat({
  label, value, icon, color,
}: {
  label: string; value: string | number; icon: string; color: string;
}) {
  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-3 text-center"
      style={{ backgroundColor: 'var(--pt-white)', boxShadow: '2px 2px 0px #2B2B2B' }}
    >
      <p className="text-xl mb-0.5" aria-hidden="true">{icon}</p>
      <p
        className="text-h3"
        style={{ fontFamily: 'var(--font-display)', color }}
      >
        {value}
      </p>
      <p
        className="text-label"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B', fontSize: '10px' }}
      >
        {label}
      </p>
    </div>
  );
}
