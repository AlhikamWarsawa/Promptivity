'use client';

import { useMemo }             from 'react';
import { motion }              from 'framer-motion';
import { ObjectiveCard }       from './ObjectiveCard';
import { KeyResultRow }        from './KeyResultRow';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }    from '@/components/pt/HandDrawnDivider';
import { useFramework }        from '@/store/usePTStore';

/* ============================================
   OKRView — Objectives & Key Results page
   
   Layout:
   1. How OKRs work note
   2. ObjectiveCard (large, inspiring)
   3. Key Results list with progress sliders
   4. OKR tips at bottom
   ============================================ */

interface KR {
  kr:       string;
  metric:   string;
  deadline: string;
  progress: number;
}

interface OKRRawData {
  objective?:  string;
  keyResults?: KR[];
}

export function OKRView() {
  const fwData = useFramework('okrs');

  const rawData = useMemo((): OKRRawData => {
    if (!fwData?.rawData) return {};
    return fwData.rawData as OKRRawData;
  }, [fwData]);

  const keyResults  = rawData.keyResults ?? [];
  const avgProgress = keyResults.length > 0
    ? Math.round(keyResults.reduce((sum, kr) => sum + (kr.progress ?? 0), 0) / keyResults.length)
    : 0;

  if (!fwData || !rawData.objective) {
    return (
      <FrameworkEmptyState
        frameworkId="okrs"
        message="Moti tidak bisa mengidentifikasi Objective dari ceritamu. Sebutkan tujuan besar yang ingin kamu capai dalam ceritamu."
      />
    );
  }

  return (
    <div className="space-y-8">

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-blue)' + '12' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          🏆 <strong>OKR</strong> terdiri dari satu <em>Objective</em> yang inspiring
          dan beberapa <em>Key Results</em> yang terukur.{' '}
          <strong>Update progress slider</strong> saat kamu mencapai milestone
          — perubahan tersimpan otomatis.
        </p>
      </motion.div>

      {/* Objective */}
      <ObjectiveCard
        objective={rawData.objective}
        totalKRs={keyResults.length}
        avgProgress={avgProgress}
      />

      {/* Key Results */}
      {keyResults.length > 0 ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <HandDrawnDivider
            variant="wave"
            label="KEY RESULTS"
            color="var(--pt-black)"
            className="opacity-30 mb-5"
          />

          <div className="space-y-4">
            {keyResults.map((kr, i) => (
              <KeyResultRow
                key={i}
                kr={kr.kr}
                metric={kr.metric}
                deadline={kr.deadline}
                progress={kr.progress ?? 0}
                index={i}
              />
            ))}
          </div>
        </motion.section>
      ) : (
        <p
          className="text-sm text-center py-4"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          Tidak ada Key Results yang teridentifikasi.
        </p>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-sketch border-2 border-pt-black p-5"
        style={{ backgroundColor: 'var(--pt-cream)' }}
      >
        <p
          className="text-label font-bold mb-3 uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          💡 Tips OKR yang Efektif
        </p>
        <ul className="space-y-2">
          {[
            'Objective harus inspiring dan sedikit "stretch" — tidak terlalu mudah.',
            'Key Results harus binary (bisa diukur jelas selesai atau tidak).',
            'Review OKR setiap minggu — bukan hanya di akhir kuartal.',
            'Kalau semua KR sudah 100%, berarti targetmu terlalu rendah.',
          ].map((tip, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="flex items-start gap-2"
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full border-2 border-pt-black flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ backgroundColor: 'var(--pt-blue)', color: 'white', fontFamily: 'var(--font-body)' }}
              >
                {i + 1}
              </span>
              <p
                className="text-sm leading-snug"
                style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
              >
                {tip}
              </p>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* OKR cadence reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          🗓️ Review progress ini setiap Jumat. Commit ke KR-mu, bukan hanya kepada Objective.
        </p>
      </motion.div>
    </div>
  );
}
