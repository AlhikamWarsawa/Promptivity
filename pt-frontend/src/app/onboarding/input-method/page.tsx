'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PTCard } from '@/components/pt/PTCard';
import { PTButton } from '@/components/pt/PTButton';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { OnboardingTopBar } from '@/components/pt/OnboardingTopBar';

export default function InputMethodPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <OnboardingTopBar currentStep={3} />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-lg flex flex-col items-center text-center gap-8"
        >
          <motion.div variants={itemVariants} className="space-y-3">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                color: 'var(--pt-black)',
                lineHeight: 1.15,
              }}
            >
              Gimana caramu mau cerita?
            </h1>
            <p
              className="text-body max-w-sm mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              Pilih cara yang paling pas dengan kondisimu sekarang.
            </p>
          </motion.div>

          <HandDrawnDivider variant="dots" color="var(--pt-black)" className="w-full opacity-30" />

          <motion.div variants={itemVariants} className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brain Dump */}
            <motion.div whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
              <PTCard
                variant="white" padding="lg" accentColor="var(--pt-blue)" accentHeight={5}
                className="h-full flex flex-col gap-4 relative text-left"
              >
                <div
                  className="w-14 h-14 rounded-sketch border-2 border-pt-black flex items-center justify-center text-3xl shadow-sketch-sm"
                  style={{ backgroundColor: 'var(--pt-yellow)' }}
                >
                  📝
                </div>
                <div>
                  <h3 className="mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', color: 'var(--pt-black)' }}>
                    Brain Dump
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
                    Aku sudah tahu apa yang ada di kepalaku. Biar aku tulis semuanya sekaligus.
                  </p>
                </div>
                <PTButton variant="primary" size="md" onClick={() => router.push('/onboarding/brain-dump')} className="w-full mt-auto">
                  Tulis Bebas →
                </PTButton>
              </PTCard>
            </motion.div>

            {/* Confused Mode */}
            <motion.div whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
              <PTCard
                variant="white" padding="lg" accentColor="var(--pt-coral)" accentHeight={5}
                className="h-full flex flex-col gap-4 relative text-left"
              >
                <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-sketch border-2 border-pt-black text-label font-bold bg-pt-yellow text-pt-black z-10">
                  ✨ Baru
                </div>
                <div
                  className="w-14 h-14 rounded-sketch border-2 border-pt-black flex items-center justify-center text-3xl shadow-sketch-sm"
                  style={{ backgroundColor: 'var(--pt-cream)' }}
                >
                  💭
                </div>
                <div>
                  <h3 className="mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', color: 'var(--pt-black)' }}>
                    Confused Mode
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
                    Aku bingung mulai dari mana. Moti bantu tanya pelan-pelan ya.
                  </p>
                </div>
                <PTButton variant="outline" size="md" onClick={() => router.push('/onboarding/confused-mode')} className="w-full mt-auto">
                  Ngobrol Sama Moti →
                </PTButton>
              </PTCard>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
