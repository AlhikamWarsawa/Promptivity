'use client';

import { useState, useCallback }   from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SMARTCriterion, buildSMARTCriteria } from './SMARTCriterion';
import { usePTStore }              from '@/store/usePTStore';

/* ============================================
   SMARTGoalCard — One goal with expandable
   S-M-A-R-T breakdown and progress slider.
   ============================================ */

interface SMARTGoal {
  id?:         string;
  title:      string;
  specific:   string;
  measurable: string;
  achievable: string;
  relevant:   string;
  timeBound:  string;
  progress:   number;
  isCompleted?: boolean;
  completed?:   boolean;
}

interface SMARTGoalCardProps {
  goal:       SMARTGoal;
  goalIndex:  number;
  totalGoals: number;
}

export function SMARTGoalCard({ goal, goalIndex, totalGoals }: SMARTGoalCardProps) {
  const updateGoalProgress          = usePTStore((s) => s.updateGoalProgress);
  const [isExpanded, setIsExpanded] = useState(goalIndex === 0);   // First goal open by default
  const [localProgress, setLocal]   = useState(goal.isCompleted || goal.completed ? 100 : goal.progress ?? 0);

  const criteria = buildSMARTCriteria(goal);
  const completeCriteria = criteria.filter((c) => !c.isEmpty).length;

  // Progress color
  function getProgressColor(): string {
    if (localProgress >= 75) return 'var(--pt-green)';
    if (localProgress >= 40) return 'var(--pt-blue)';
    if (localProgress >= 10) return 'var(--pt-mustard)';
    return 'var(--pt-coral)';
  }

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setLocal(Number(e.target.value)),
    [],
  );
  const handleSliderCommit = useCallback(() => {
    updateGoalProgress(goalIndex, localProgress);
  }, [goalIndex, localProgress, updateGoalProgress]);

  const progressColor = getProgressColor();
  const isDone = localProgress >= 100;

  function handleToggleGoal(e: React.MouseEvent) {
    e.stopPropagation();
    const next = isDone ? 0 : 100;
    setLocal(next);
    updateGoalProgress(goalIndex, next);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: goalIndex * 0.1, duration: 0.4 }}
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '4px 4px 0px #2B2B2B' }}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-left"
        style={{
          backgroundColor: localProgress === 100 ? 'var(--pt-green)' + '20' : 'var(--pt-white)',
          borderBottom:    isExpanded ? '2px solid var(--pt-black)' : 'none',
          cursor:          'pointer',
        }}
        aria-expanded={isExpanded}
      >
        {/* Goal completion */}
        <div
          className="shrink-0 w-10 h-10 rounded-sketch border-2 border-pt-black flex items-center justify-center font-bold text-sm mt-0.5"
          style={{
            fontFamily:      'var(--font-display)',
            backgroundColor: isDone ? 'var(--pt-green)' : 'var(--pt-yellow)',
            color:           'var(--pt-black)',
            fontSize:        '1.1rem',
          }}
          role="checkbox"
          aria-checked={isDone}
          aria-label={isDone ? `Mark "${goal.title}" as incomplete` : `Mark "${goal.title}" as complete`}
          onClick={handleToggleGoal}
        >
          {isDone ? '✓' : goalIndex + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`leading-snug mb-2 ${isDone ? 'line-through opacity-60' : ''}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h4)',
              color:      'var(--pt-black)',
            }}
          >
            {goal.title}
          </h3>

          {/* Progress bar */}
          <div className="space-y-1">
            <div
              className="w-full h-2.5 rounded-sketch border border-pt-black/20 overflow-hidden"
              style={{ backgroundColor: 'var(--pt-cream)' }}
            >
              <motion.div
                className="h-full rounded-sm"
                style={{ backgroundColor: progressColor }}
                animate={{ width: `${localProgress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
              >
                {completeCriteria}/5 kriteria SMART terisi
              </span>
              <span
                className="text-label font-bold"
                style={{ fontFamily: 'var(--font-body)', color: progressColor }}
              >
                {localProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Expand chevron */}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-lg mt-1"
          style={{ color: 'var(--pt-black)', opacity: 0.4 }}
          aria-hidden="true"
        >
          ▾
        </motion.span>
      </button>

      {/* Expanded: SMART breakdown + slider */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-3 bg-pt-white border-b-2 border-pt-black">
              {/* SMART criteria */}
              {criteria.map((criterion, i) => (
                <SMARTCriterion
                  key={criterion.letter}
                  {...criterion}
                  index={i}
                />
              ))}
            </div>

            {/* Progress slider */}
            <div
              className="p-5"
              style={{ backgroundColor: 'var(--pt-cream)' }}
            >
              <p
                className="text-label font-bold mb-3 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
              >
                📊 Update Progress Goal Ini
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={localProgress}
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                onKeyUp={handleSliderCommit}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, ${progressColor} ${localProgress}%, var(--pt-white) ${localProgress}%)`,
                  border:     '2px solid var(--pt-black)',
                  borderRadius: '8px',
                  height:     '12px',
                  outline:    'none',
                }}
                aria-label={`Progress untuk goal: ${goal.title}`}
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-sm"
                  style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
                >
                  {localProgress === 0   ? 'Belum dimulai'          :
                   localProgress < 25    ? 'Baru mulai 🌱'           :
                   localProgress < 50    ? 'Dalam progress ⚡'        :
                   localProgress < 75    ? 'Lebih dari setengah 🔥'  :
                   localProgress < 100   ? 'Hampir selesai 🚀'       :
                                          'Goal tercapai! 🏆'}
                </span>
                <span
                  className="text-label font-bold"
                  style={{ fontFamily: 'var(--font-body)', color: progressColor }}
                >
                  {localProgress}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
