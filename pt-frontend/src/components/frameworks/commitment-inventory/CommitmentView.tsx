'use client';

import { useMemo, useState }   from 'react';
import { motion }              from 'framer-motion';
import { CommitmentCard }      from './CommitmentCard';
import { CommitmentFilter }    from './CommitmentFilter';
import type { FilterType }     from './CommitmentFilter';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }    from '@/components/pt/HandDrawnDivider';
import { useFramework }        from '@/store/usePTStore';
import type { Priority }       from '@/types/pt.types';

/* ============================================
   CommitmentView — Commitment Inventory page
   
   Layout:
   1. Philosophy note
   2. Filter pills (All / Continue / Delegate / Drop)
   3. Summary stats donut-style
   4. Filtered commitment cards
   5. Action prompt
   ============================================ */

interface Commitment {
  name:           string;
  urgency:        Priority;
  category:       string;
  recommendation: 'continue' | 'drop' | 'delegate';
  reason:         string;
}

interface CommitmentRawData {
  commitments?: Commitment[];
}

export function CommitmentView() {
  const fwData = useFramework('commitment-inventory');
  const [filter, setFilter] = useState<FilterType>('all');

  const commitments = useMemo((): Commitment[] => {
    if (!fwData?.rawData) return [];
    const raw = fwData.rawData as CommitmentRawData;
    return raw.commitments ?? [];
  }, [fwData]);

  if (!fwData || commitments.length === 0) {
    return (
      <FrameworkEmptyState
        frameworkId="commitment-inventory"
        message="Moti tidak mendeteksi komitmen dari ceritamu. Sebutkan semua hal yang kamu 'wajib' lakukan — pekerjaan, janji, proyek, tanggung jawab."
      />
    );
  }

  // Counts per filter
  const counts: Record<FilterType, number> = {
    all:      commitments.length,
    continue: commitments.filter((c) => c.recommendation === 'continue').length,
    delegate: commitments.filter((c) => c.recommendation === 'delegate').length,
    drop:     commitments.filter((c) => c.recommendation === 'drop').length,
  };

  // Filtered list
  const filtered = filter === 'all'
    ? commitments
    : commitments.filter((c) => c.recommendation === filter);

  // Sort: drop first (most important to address), then delegate, then continue
  const sortOrder = { drop: 0, delegate: 1, continue: 2 };
  const sortedAll = [...commitments].sort(
    (a, b) => sortOrder[a.recommendation] - sortOrder[b.recommendation],
  );
  const displayList = filter === 'all' ? sortedAll : filtered;

  // Overcommit check
  const dropCount     = counts.drop;
  const delegateCount = counts.delegate;
  const isOvercommitted = dropCount + delegateCount >= commitments.length * 0.4;

  return (
    <div className="space-y-6">

      {/* Philosophy note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-mustard)' + '18' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          📋 <strong>Commitment Inventory</strong> membantu kamu melihat semua hal yang
          kamu setujui untuk lakukan — dan membuat keputusan jujur tentang mana yang worth
          it. Setiap &ldquo;ya&rdquo; adalah &ldquo;tidak&rdquo; untuk sesuatu yang lain.
        </p>
      </motion.div>

      {/* Overcommit warning */}
      {isOvercommitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-sketch border-2 border-pt-coral"
          style={{ backgroundColor: 'var(--pt-coral)' + '12' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-coral)' }}
          >
            ⚠️ Moti mendeteksi kamu mungkin <strong>overcommitted</strong>.
            Lebih dari 40% komitmenmu sebaiknya di-drop atau di-delegasikan.
            Kurangi beban untuk fokus pada yang benar-benar penting.
          </p>
        </motion.div>
      )}

      {/* Summary donut-style */}
      <CommitmentSummary counts={counts} total={commitments.length} />

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <CommitmentFilter
          active={filter}
          onChange={setFilter}
          counts={counts}
        />
      </motion.div>

      {/* List */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <p
            className="text-sm text-center py-6"
            style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
          >
            Tidak ada komitmen dengan filter ini.
          </p>
        ) : (
          displayList.map((commitment, i) => (
            <CommitmentCard
              key={`${commitment.name}-${i}`}
              name={commitment.name}
              urgency={commitment.urgency}
              category={commitment.category}
              recommendation={commitment.recommendation}
              reason={commitment.reason}
              index={i}
            />
          ))
        )}
      </div>

      {/* Action prompt */}
      {counts.drop > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-sketch border-2 border-pt-black text-center"
          style={{ backgroundColor: 'var(--pt-coral)' + '12' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            🐸 Langkah pertama: Hubungi {counts.drop} pihak yang perlu tahu
            kamu tidak bisa lanjutkan komitmen tersebut.
            Jujur lebih baik dari silent commitment.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ---- Commitment Summary ---- */
function CommitmentSummary({
  counts, total,
}: {
  counts: Record<FilterType, number>;
  total:  number;
}) {
  const items = [
    { key: 'continue' as const, label: 'Lanjutkan', color: 'var(--pt-green)',   icon: '✅' },
    { key: 'delegate' as const, label: 'Delegasi',  color: 'var(--pt-mustard)', icon: '🤝' },
    { key: 'drop'     as const, label: 'Drop',      color: 'var(--pt-coral)',   icon: '🗑️' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
    >
      {/* Progress bar breakdown */}
      <div className="flex h-5 overflow-hidden border-b-2 border-pt-black">
        {items.map((item) => {
          const pct = total > 0 ? (counts[item.key] / total) * 100 : 0;
          return pct > 0 ? (
            <motion.div
              key={item.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundColor: item.color }}
              title={`${item.label}: ${counts[item.key]}`}
            />
          ) : null;
        })}
      </div>

      {/* Counts */}
      <div
        className="grid grid-cols-3 divide-x-2 divide-pt-black"
        style={{ backgroundColor: 'var(--pt-white)' }}
      >
        {items.map((item) => (
          <div key={item.key} className="p-3 text-center">
            <p className="text-xl mb-0.5" aria-hidden="true">{item.icon}</p>
            <p
              className="text-h3"
              style={{ fontFamily: 'var(--font-display)', color: item.color }}
            >
              {counts[item.key]}
            </p>
            <p
              className="text-label"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B', fontSize: '10px' }}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
