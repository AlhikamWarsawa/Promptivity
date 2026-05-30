'use client';

import { useMemo }                            from 'react';
import { motion }                             from 'framer-motion';
import { EisenhowerQuadrant, QUADRANT_CONFIG } from './EisenhowerQuadrant';
import { FrameworkEmptyState }                from '@/components/frameworks/FrameworkPageLayout';
import { FrameworkAddTaskButton }             from '@/components/frameworks/shared/FrameworkAddTaskButton';
import { FrameworkGenerateMoreTasks }         from '@/components/frameworks/shared/FrameworkGenerateMoreTasks';
import { useFramework }                       from '@/store/usePTStore';
import type { Task }                          from '@/types/pt.types';

/* ============================================
   EisenhowerView — Eisenhower Matrix 2×2 grid

   Axis layout:
            | Urgent       | Tidak Urgent |
   Penting  | doNow (Q1)   | schedule (Q2)|
   Tdk Pntg | delegate (Q3)| eliminate(Q4)|

   Desktop: 2×2 grid dengan axis labels di tepi
   Mobile:  4 card vertikal (priority order)
   ============================================ */

interface EisenhowerRawData {
  doNow?:     Task[];
  schedule?:  Task[];
  delegate?:  Task[];
  eliminate?: Task[];
}

// Priority order for mobile view (most to least urgent/important)
const QUADRANT_ORDER = ['doNow', 'schedule', 'delegate', 'eliminate'] as const;

const COLUMN_LABELS = [
  { title: 'Mendesak', subtitle: 'Perlu ditangani segera' },
  { title: 'Tidak Mendesak', subtitle: 'Perlu dijadwalkan' },
];

const ROW_LABELS = [
  { title: 'Penting', subtitle: 'Prioritas utama', strong: true },
  { title: 'Tidak Penting', subtitle: 'Sekunder', strong: false },
];

export function EisenhowerView() {
  const fwData = useFramework('eisenhower');

  const rawData = useMemo((): EisenhowerRawData => {
    if (!fwData?.rawData) return {};
    return fwData.rawData as EisenhowerRawData;
  }, [fwData]);

  const totalTasks = QUADRANT_ORDER.reduce(
    (sum, q) => sum + (rawData[q]?.length ?? 0),
    0,
  );

  if (!fwData || totalTasks === 0) {
    return <FrameworkEmptyState frameworkId="eisenhower" />;
  }

  return (
    <div className="space-y-6">

      {/* Instruction bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 rounded-sketch border-2 border-pt-black text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{
          backgroundColor: '#F5D60D25',
          fontFamily:      'var(--font-body)',
          color:           '#4B4B4B',
        }}
      >
        <span>
          ⚡ Matriks Eisenhower memisahkan yang <strong>mendesak</strong> dari yang{' '}
          <strong>penting</strong>. Fokuslah pada kuadran kiri atas dulu.
        </span>
        <FrameworkAddTaskButton frameworkId="eisenhower" className="shrink-0 min-h-[44px]" />
      </motion.div>

      {/* Matrix Grid (2x2) */}
      <div className="flex flex-col gap-4">
        {/* Urgent/Not Urgent Labels */}
        <div className="flex pl-16 sm:pl-[92px] gap-2 sm:gap-3">
          {COLUMN_LABELS.map((label) => (
            <div key={label.title} className="flex-1 text-center">
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wide text-pt-black/70">
                {label.title}
              </span>
              <span className="hidden sm:block text-[9px] font-semibold text-pt-black/40">
                {label.subtitle}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 sm:gap-3">
          {/* Important/Not Important Row Labels */}
          <div className="flex flex-col gap-2 sm:gap-3 w-14 sm:w-20 shrink-0">
            {ROW_LABELS.map((label) => (
              <div key={label.title} className="flex-1 flex items-center justify-center">
                <div className="text-center leading-tight">
                  <span className={`block uppercase tracking-wide ${label.strong ? 'text-[11px] sm:text-sm font-black text-pt-black/75' : 'text-[10px] sm:text-xs font-bold text-pt-black/55'}`}>
                    {label.title}
                  </span>
                  <span className="block text-[8px] sm:text-[9px] font-semibold text-pt-black/35 normal-case tracking-normal">
                    {label.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
            <EisenhowerQuadrant quadrantId="doNow"    tasks={rawData.doNow    ?? []} index={0} />
            <EisenhowerQuadrant quadrantId="schedule" tasks={rawData.schedule ?? []} index={1} />
            <EisenhowerQuadrant quadrantId="delegate"  tasks={rawData.delegate  ?? []} index={2} />
            <EisenhowerQuadrant quadrantId="eliminate" tasks={rawData.eliminate ?? []} index={3} />
          </div>
        </div>
      </div>

      {/* Summary row — always visible */}
      <MatrixSummary rawData={rawData} />
      <FrameworkGenerateMoreTasks frameworkId="eisenhower" />
    </div>
  );
}

/* ---- Matrix with axis labels (desktop only) ---- */

function MatrixWithAxisLabels({ rawData }: { rawData: EisenhowerRawData }) {
  return (
    <div>
      {/* Column axis labels (top) — Urgent | Tidak Urgent */}
      <div className="flex pl-12 gap-3 mb-2">
        {COLUMN_LABELS.map((label) => (
          <div key={label.title} className="flex-1 text-center">
            <span
              className="text-label font-bold uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              {label.title}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {/* Row axis labels (left) — Penting | Tidak Penting */}
        <div className="flex flex-col gap-3 w-10 shrink-0">
          {ROW_LABELS.map((label) => (
            <div key={label.title} className="flex-1 flex items-center justify-center">
              <span
                className={label.strong ? 'text-sm font-black uppercase tracking-wide' : 'text-label font-bold uppercase tracking-wide'}
                style={{
                  fontFamily:      'var(--font-body)',
                  color:           label.strong ? 'var(--pt-black)' : '#6B6B6B',
                  writingMode:     'vertical-rl',
                  textOrientation: 'mixed',
                  transform:       'rotate(180deg)',
                }}
              >
                {label.title}
              </span>
            </div>
          ))}
        </div>

        {/* 2×2 Grid
            Row 1 (Penting):      doNow (Urgent+Penting) | schedule (Tidak Urgent+Penting)
            Row 2 (Tidak Penting): delegate (Urgent+Tidak Penting) | eliminate (Tidak Urgent+Tidak Penting)
        */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3">
          {/* Row 1: Penting */}
          <EisenhowerQuadrant quadrantId="doNow"    tasks={rawData.doNow    ?? []} index={0} />
          <EisenhowerQuadrant quadrantId="schedule" tasks={rawData.schedule ?? []} index={1} />
          {/* Row 2: Tidak Penting */}
          <EisenhowerQuadrant quadrantId="delegate"  tasks={rawData.delegate  ?? []} index={2} />
          <EisenhowerQuadrant quadrantId="eliminate" tasks={rawData.eliminate ?? []} index={3} />
        </div>
      </div>

      {/* Bottom axis label */}
      <div className="relative pl-12 mt-1" aria-hidden="true">
        <p
          className="text-center text-[10px]"
          style={{ fontFamily: 'var(--font-body)', color: '#D1D1CF' }}
        >
          ← Tingkat Urgensi →
        </p>
      </div>
    </div>
  );
}

/* ---- Summary row ---- */

function MatrixSummary({ rawData }: { rawData: EisenhowerRawData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {QUADRANT_ORDER.map((quadrantId) => {
        const config = QUADRANT_CONFIG[quadrantId];
        const count  = rawData[quadrantId]?.length ?? 0;
        return (
          <div
            key={quadrantId}
            className="rounded-sketch border-2 border-pt-black p-3 text-center"
            style={{ backgroundColor: config.bgColor }}
          >
            <p className="text-2xl mb-1" aria-hidden="true">{config.icon}</p>
            <p
              className="text-h4"
              style={{ fontFamily: 'var(--font-display)', color: config.accentColor }}
            >
              {count}
            </p>
            <p
              className="text-label"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B', fontSize: '10px' }}
            >
              {config.title}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
}
