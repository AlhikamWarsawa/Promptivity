'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PTCard } from './PTCard';
import { HandDrawnDivider } from './HandDrawnDivider';

/* ============================================
   HintCard — Sidebar card berisi tips
   apa yang perlu user ceritakan.
   
   Features:
   - Collapsible di mobile (expand/collapse)
   - Tips dibagi per kategori dengan icon
   - Example phrases yang bisa diklik untuk copy
   ============================================ */

export interface HintItem {
  icon:     string;
  category: string;
  prompts:  string[];
}

export const BRAIN_DUMP_HINTS: HintItem[] = [
  {
    icon:     '📋',
    category: 'Tugas & Pekerjaan',
    prompts: [
      'Tugas apa saja yang belum selesai?',
      'Deadline apa yang paling dekat?',
      'Project apa yang sedang berjalan?',
    ],
  },
  {
    icon:     '🔥',
    category: 'Hambatan & Problem',
    prompts: [
      'Apa yang paling bikin stuck sekarang?',
      'Skill atau resource apa yang kurang?',
      'Apa yang sering bikin distraksi?',
    ],
  },
  {
    icon:     '🎯',
    category: 'Target & Goal',
    prompts: [
      'Apa yang ingin dicapai bulan ini?',
      'Goal jangka pendek vs jangka panjang?',
      'Apa definisi "sukses" untukmu sekarang?',
    ],
  },
  {
    icon:     '💡',
    category: 'Kondisi & Situasi',
    prompts: [
      'Berapa jam tersedia per hari?',
      'Ada komitmen lain yang perlu dipertimbangkan?',
      'Bagaimana kondisi energi dan motivasimu?',
    ],
  },
];

interface HintCardProps {
  hints?:      HintItem[];
  className?:  string;
}

export function HintCard({ hints = BRAIN_DUMP_HINTS, className }: HintCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <PTCard
      variant="default"
      padding="md"
      accentColor="var(--pt-mustard)"
      accentHeight={4}
      className={className}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-2 group"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">💡</span>
          <span
            className="font-display text-h4 text-left leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
          >
            Apa yang perlu diceritakan?
          </span>
        </div>
        <motion.span
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-lg opacity-50 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        >
          ▾
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {hints.map((hint, i) => (
                <div key={hint.category}>
                  {i > 0 && (
                    <HandDrawnDivider
                      variant="dots"
                      color="var(--pt-black)"
                      className="opacity-20 mb-4"
                    />
                  )}
                  <HintSection hint={hint} />
                </div>
              ))}

              {/* Bottom note */}
              <div
                className="mt-2 p-3 rounded-sketch border border-pt-black/20 text-sm"
                style={{ backgroundColor: 'var(--pt-yellowP)', fontFamily: 'var(--font-body)' }}
              >
                <p style={{ color: 'var(--pt-black)' }}>
                  <strong>Tips:</strong> Tidak perlu rapi atau terstruktur.
                  Tulis apa adanya — PT yang akan mengorganisirnya.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PTCard>
  );
}

function HintSection({ hint }: { hint: HintItem }) {
  return (
    <div>
      {/* Category label */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base" aria-hidden="true">{hint.icon}</span>
        <span
          className="text-label font-bold uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          {hint.category}
        </span>
      </div>

      {/* Prompts */}
      <ul className="space-y-1.5">
        {hint.prompts.map((prompt) => (
          <li key={prompt} className="flex items-start gap-2">
            <span
              className="shrink-0 mt-0.5 text-pt-mustard font-bold"
              aria-hidden="true"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              →
            </span>
            <span
              className="text-sm leading-snug"
              style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
            >
              {prompt}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
