'use client';

import { motion } from 'framer-motion';

/* ============================================
   SMARTCriterion — Single S/M/A/R/T row
   
   Displays one dimension of the SMART framework
   with letter badge, label, and description.
   ============================================ */

interface SMARTCriterionConfig {
  letter:      string;
  word:        string;
  description: string;  // what the user's answer says
  color:       string;
  bgColor:     string;
  question:    string;  // the question this answers
  isEmpty:     boolean;
}

interface SMARTCriterionProps extends SMARTCriterionConfig {
  index: number;
}

export function SMARTCriterion({
  letter, word, description, color, bgColor, question, isEmpty, index,
}: SMARTCriterionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="flex items-start gap-3"
    >
      {/* Letter badge */}
      <div
        className="shrink-0 w-10 h-10 rounded-sketch border-2 border-pt-black flex flex-col items-center justify-center"
        style={{ backgroundColor: color, boxShadow: '2px 2px 0px #2B2B2B' }}
        aria-hidden="true"
      >
        <span
          className="text-lg font-bold leading-none text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {letter}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Word label */}
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span
            className="text-label font-bold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-body)', color }}
          >
            {word}
          </span>
          <span
            className="text-[10px]"
            style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
          >
            — {question}
          </span>
        </div>

        {/* Description */}
        <div
          className="rounded border border-pt-black/15 px-3 py-2"
          style={{ backgroundColor: isEmpty ? 'var(--pt-cream)' : bgColor }}
        >
          <p
            className="text-sm leading-snug"
            style={{
              fontFamily: 'var(--font-body)',
              color:      isEmpty ? '#9B9B9B' : 'var(--pt-black)',
              fontStyle:  isEmpty ? 'italic' : 'normal',
            }}
          >
            {isEmpty ? 'Belum teridentifikasi dari ceritamu.' : description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ---- SMART Config builder ---- */

interface SMARTData {
  specific:   string;
  measurable: string;
  achievable: string;
  relevant:   string;
  timeBound:  string;
}

export function buildSMARTCriteria(data: SMARTData): Omit<SMARTCriterionConfig, 'index'>[] {
  return [
    {
      letter:      'S',
      word:        'Specific',
      description: data.specific,
      color:       'var(--pt-blue)',
      bgColor:     '#E8F4FD',
      question:    'Apa tepatnya yang ingin dicapai?',
      isEmpty:     !data.specific || data.specific === 'To be defined',
    },
    {
      letter:      'M',
      word:        'Measurable',
      description: data.measurable,
      color:       'var(--pt-cyan)',
      bgColor:     '#E0F9FE',
      question:    'Bagaimana mengukur keberhasilan?',
      isEmpty:     !data.measurable || data.measurable === 'To be defined',
    },
    {
      letter:      'A',
      word:        'Achievable',
      description: data.achievable,
      color:       'var(--pt-green)',
      bgColor:     '#E0F8EE',
      question:    'Apakah ini realistis?',
      isEmpty:     !data.achievable || data.achievable === 'To be defined',
    },
    {
      letter:      'R',
      word:        'Relevant',
      description: data.relevant,
      color:       'var(--pt-mustard)',
      bgColor:     '#FDF5E0',
      question:    'Mengapa ini penting untukmu?',
      isEmpty:     !data.relevant || data.relevant === 'To be defined',
    },
    {
      letter:      'T',
      word:        'Time-bound',
      description: data.timeBound,
      color:       'var(--pt-coral)',
      bgColor:     '#FEE8EA',
      question:    'Kapan harus selesai?',
      isEmpty:     !data.timeBound || data.timeBound === 'To be defined',
    },
  ];
}
