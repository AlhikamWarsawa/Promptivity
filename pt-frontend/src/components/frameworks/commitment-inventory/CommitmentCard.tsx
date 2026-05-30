'use client';

import { motion }        from 'framer-motion';
import { PriorityBadge } from '@/components/pt/PTBadge';
import { usePTStore }    from '@/store/usePTStore';
import type { Priority } from '@/types/pt.types';

/* ============================================
   CommitmentCard — Single commitment display
   
   Shows:
   - Commitment name
   - Urgency badge
   - Category pill
   - Recommendation (continue/drop/delegate/schedule)
     with strong visual differentiation
   - Reason tooltip/expand
   ============================================ */

type Recommendation = 'continue' | 'drop' | 'delegate' | 'schedule';

interface CommitmentCardProps {
  id?:             string;
  name:           string;
  urgency:        Priority;
  category:       string;
  recommendation: Recommendation;
  reason:         string;
  isCompleted?:   boolean;
  completed?:     boolean;
  index:          number;
}

const REC_CONFIG: Record<Recommendation, {
  label:   string;
  icon:    string;
  color:   string;
  bgColor: string;
  border:  string;
  advice:  string;
}> = {
  continue: {
    label:   'Lanjutkan',
    icon:    '✅',
    color:   'var(--pt-green)',
    bgColor: '#E0F8EE',
    border:  'var(--pt-green)',
    advice:  'Komitmen ini worth it. Pertahankan dan optimalkan.',
  },
  delegate: {
    label:   'Delegasikan',
    icon:    '🤝',
    color:   'var(--pt-mustard)',
    bgColor: '#FDF5E0',
    border:  'var(--pt-mustard)',
    advice:  'Cari orang lain yang bisa handle ini. Energimu lebih berharga di tempat lain.',
  },
  schedule: {
    label:   'Jadwalkan',
    icon:    '📅',
    color:   'var(--pt-blue)',
    bgColor: '#E8F4FD',
    border:  'var(--pt-blue)',
    advice:  'Taruh komitmen ini di kalender agar tidak terus dibawa di kepala.',
  },
  drop: {
    label:   'Drop',
    icon:    '🗑️',
    color:   'var(--pt-coral)',
    bgColor: '#FEE8EA',
    border:  'var(--pt-coral)',
    advice:  'Lepaskan ini. Setiap "tidak" adalah "ya" untuk hal yang lebih penting.',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  work:     '💼',
  personal: '👤',
  learning: '📚',
  health:   '💪',
  social:   '👥',
  other:    '✨',
};

export function CommitmentCard({
  id, name, urgency, category, recommendation, reason, isCompleted, completed, index,
}: CommitmentCardProps) {
  const toggleTask = usePTStore((s) => s.toggleTask);
  const config = REC_CONFIG[recommendation];
  const done = Boolean(isCompleted ?? completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{
        boxShadow:       '3px 3px 0px #2B2B2B',
        borderLeft:      `6px solid ${config.border}`,
        backgroundColor: 'var(--pt-white)',
      }}
    >
      <div className="p-4">
        {/* Top row: name + recommendation badge */}
        <div className="flex items-start justify-between gap-3">
          {id && (
            <button
              type="button"
              onClick={() => toggleTask(id)}
              className={`shrink-0 mt-1 w-5 h-5 rounded border-2 border-pt-black flex items-center justify-center text-[11px] font-bold ${done ? 'bg-pt-green border-pt-green text-white' : 'bg-white hover:bg-pt-yellowP'}`}
              role="checkbox"
              aria-checked={done}
              aria-label={done ? `Mark "${name}" as incomplete` : `Mark "${name}" as complete`}
            >
              {done ? '✓' : ''}
            </button>
          )}
          <div className="flex-1 min-w-0">
            {/* Category + urgency */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-pt-black/20"
                style={{
                  fontFamily:      'var(--font-body)',
                  backgroundColor: config.bgColor,
                  color:           'var(--pt-black)',
                }}
              >
                {CATEGORY_ICONS[category] ?? '✨'} {category}
              </span>
              <PriorityBadge
                priority={urgency}
                showIcon={false}
                size="sm"
              />
            </div>

            {/* Commitment name */}
            <p
              className={`font-semibold leading-snug ${done ? 'line-through opacity-50' : ''}`}
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
            >
              {name}
            </p>
          </div>

          {/* Recommendation badge */}
          <div
            className="shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-sketch border-2 border-pt-black text-center"
            style={{ backgroundColor: config.bgColor, minWidth: '80px' }}
          >
            <span className="text-xl" aria-hidden="true">{config.icon}</span>
            <span
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-body)', color: config.color }}
            >
              {config.label}
            </span>
          </div>
        </div>

        {/* Reason from AI */}
        {reason && (
          <div
            className="mt-3 pt-3 border-t border-pt-black/10 flex items-start gap-2"
          >
            <span className="text-sm shrink-0" aria-hidden="true">🧠</span>
            <p
              className="text-sm leading-snug"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              {reason}
            </p>
          </div>
        )}

        {/* General advice per recommendation type */}
        <div
          className="mt-2 px-3 py-2 rounded border border-pt-black/10 text-xs italic"
          style={{
            backgroundColor: config.bgColor,
            fontFamily:      'var(--font-body)',
            color:           config.color,
          }}
        >
          {config.advice}
        </div>
      </div>
    </motion.div>
  );
}
