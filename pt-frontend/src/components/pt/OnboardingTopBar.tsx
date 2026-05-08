'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ProgressSteps, PT_ONBOARDING_STEPS } from './ProgressSteps';

/* ============================================
   OnboardingTopBar — Shared bar untuk semua
   halaman onboarding.
   
   Berisi:
   - Logo PT (link ke home)
   - ProgressSteps indicator
   ============================================ */

interface OnboardingTopBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function OnboardingTopBar({ currentStep }: OnboardingTopBarProps) {
  return (
    <header
      className="w-full px-6 py-4"
      style={{
        borderBottom:    '2px solid var(--pt-black)',
        backgroundColor: 'var(--pt-white)',
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 flex items-center gap-2 font-display font-bold text-xl hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
        >
          <Image
            src="/promptivity.png"
            alt="Promptivity Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-sketch border-2 border-pt-black shadow-sketch-sm object-cover"
          />
          <span className="hidden sm:inline">Promptivity</span>
        </Link>

        {/* Progress steps */}
        <div className="flex-1 w-full sm:w-auto">
          <ProgressSteps
            steps={PT_ONBOARDING_STEPS}
            currentStep={currentStep}
          />
        </div>
      </div>
    </header>
  );
}
