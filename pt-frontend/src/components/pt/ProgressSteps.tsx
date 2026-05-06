'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ============================================
   ProgressSteps — Step indicator untuk onboarding
   
   3 step: Welcome → Personalize → Brain Dump
   Style: sketch border, playful, clear
   
   Props:
   - currentStep: 1 | 2 | 3
   - steps: array of { label, icon }
   ============================================ */

export interface Step {
  label: string;
  icon:  string;
}

export interface ProgressStepsProps {
  steps:       Step[];
  currentStep: number;   // 1-indexed
  className?:  string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <nav
      aria-label="Onboarding progress"
      className={cn('w-full', className)}
    >
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const stepNumber  = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent   = stepNumber === currentStep;
          const isUpcoming  = stepNumber > currentStep;
          const isLast      = index === steps.length - 1;

          return (
            <div key={step.label} className="flex items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale:           isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? '#17B66A'  // pt-green
                      : isCurrent
                      ? '#F5D60D'  // pt-yellow
                      : '#E9DCCF', // pt-cream
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={cn(
                    'w-10 h-10 rounded-sketch border-2 border-pt-black',
                    'flex items-center justify-center',
                    'font-body font-bold text-sm',
                    isCurrent  && 'shadow-sketch',
                    isUpcoming && 'opacity-50',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <CheckIcon />
                  ) : (
                    <span
                      className="leading-none"
                      style={{ color: 'var(--pt-black)' }}
                    >
                      {step.icon}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[11px] font-body font-bold text-center whitespace-nowrap',
                    isUpcoming && 'opacity-40',
                    isCurrent  && 'text-pt-black',
                    isCompleted && 'text-pt-green',
                  )}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div className="relative mx-2 flex-shrink-0" style={{ width: '48px', marginTop: '-18px' }}>
                  {/* Base line */}
                  <div
                    className="h-0.5 w-full"
                    style={{
                      backgroundColor: 'var(--pt-black)',
                      opacity: 0.2,
                    }}
                  />
                  {/* Progress line */}
                  <motion.div
                    className="absolute top-0 left-0 h-0.5"
                    initial={false}
                    animate={{
                      width: isCompleted ? '100%' : '0%',
                      backgroundColor: '#17B66A',
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16" height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polyline
        points="3,8 6.5,12 13,4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- Preset: PT Onboarding Steps ----

export const PT_ONBOARDING_STEPS: Step[] = [
  { label: 'Welcome',     icon: '👋' },
  { label: 'Personalize', icon: '✏️' },
  { label: 'Brain Dump',  icon: '🧠' },
];
