'use client';

import { motion } from 'framer-motion';
import { cn }     from '@/lib/utils';

/* ============================================
   CommitmentFilter — Filter pills untuk
   commitment list (All / Continue / Delegate / Drop)
   ============================================ */

export type FilterType = 'all' | 'continue' | 'delegate' | 'schedule' | 'drop';

interface FilterConfig {
  value:    FilterType;
  label:    string;
  icon:     string;
  color:    string;
  bgActive: string;
}

const FILTERS: FilterConfig[] = [
  { value: 'all',      label: 'Semua',     icon: '📋', color: 'var(--pt-black)',   bgActive: 'var(--pt-black)'   },
  { value: 'continue', label: 'Lanjutkan', icon: '✅', color: 'var(--pt-green)',   bgActive: 'var(--pt-green)'   },
  { value: 'delegate', label: 'Delegasi',  icon: '🤝', color: 'var(--pt-mustard)', bgActive: 'var(--pt-mustard)' },
  { value: 'schedule', label: 'Jadwalkan', icon: '📅', color: 'var(--pt-blue)',    bgActive: 'var(--pt-blue)'    },
  { value: 'drop',     label: 'Drop',      icon: '🗑️', color: 'var(--pt-coral)',   bgActive: 'var(--pt-coral)'   },
];

interface CommitmentFilterProps {
  active:   FilterType;
  onChange: (f: FilterType) => void;
  counts:   Record<FilterType, number>;
}

export function CommitmentFilter({ active, onChange, counts }: CommitmentFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter komitmen">
      {FILTERS.map((filter) => {
        const isActive = active === filter.value;
        return (
          <motion.button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'rounded-sketch border-2 border-pt-black',
              'text-label font-bold transition-all duration-150',
            )}
            style={{
              fontFamily:      'var(--font-body)',
              backgroundColor: isActive ? filter.bgActive : 'var(--pt-white)',
              color:           isActive ? 'white'         : 'var(--pt-black)',
              boxShadow:       isActive ? 'none'          : '2px 2px 0px #2B2B2B',
              transform:       isActive ? 'translate(1px, 1px)' : 'none',
            }}
            aria-pressed={isActive}
          >
            <span aria-hidden="true">{filter.icon}</span>
            <span>{filter.label}</span>
            {/* Count badge */}
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : filter.bgActive + '30',
                color:           isActive ? 'white'                 : filter.color,
              }}
            >
              {counts[filter.value]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
