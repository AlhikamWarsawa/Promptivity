'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PTButton } from '@/components/pt/PTButton';
import { PTCard } from '@/components/pt/PTCard';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import PTStorage from '@/lib/storage';
import { OnboardingTopBar } from '@/components/pt/OnboardingTopBar';

/* ============================================
   /onboarding — Decision Screen
   
   "Mau setup personalisasi dulu?"
   → Ya, setup → /onboarding/personalization
   → Langsung mulai → /onboarding/brain-dump
   ============================================ */

export default function OnboardingDecisionPage() {
  const router = useRouter();

  function handleSetupPersonalization() {
    router.push('/onboarding/personalization');
  }

  function handleSkipPersonalization() {
    // Simpan default persona hanya jika belum ada data sebelumnya
    // agar data lama user tetap tersimpan (sesuai request: "inget data")
    const existing = PTStorage.getPersona();
    if (!existing) {
      PTStorage.savePersona(PTStorage.DEFAULT_PERSONA);
    }
    PTStorage.setSkipLogin();
    router.push('/onboarding/brain-dump');
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      {/* Top bar */}
      <OnboardingTopBar currentStep={1} />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-lg flex flex-col items-center text-center gap-8"
        >
          {/* Illustration */}
          <motion.div variants={itemVariants}>
            <DecisionIllustration />
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                color: 'var(--pt-black)',
                lineHeight: 1.15,
              }}
            >
              Mau PT kenal kamu dulu?
            </h1>
            <p
              className="text-body max-w-sm mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              Dengan 6 pertanyaan singkat, PT bisa membuat mission yang
              jauh lebih personal dan relevan untukmu.
              Atau langsung cerita aja — tetap jalan!
            </p>
          </motion.div>

          <HandDrawnDivider variant="dots" color="var(--pt-black)" className="w-full opacity-30" />

          {/* Choice Cards */}
          <motion.div
            variants={itemVariants}
            className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* Option A: Setup personalization */}
            <ChoiceCard
              icon="✏️"
              title="Ya, setup dulu"
              description="6 pertanyaan singkat. ~2 menit. Mission lebih personal."
              accentColor="var(--pt-blue)"
              recommended
              onClick={handleSetupPersonalization}
              buttonLabel="Setup Personalisasi →"
              buttonVariant="primary"
              bgColor="var(--pt-yellow)"
            />

            {/* Option B: Skip */}
            <ChoiceCard
              icon="⚡"
              title="Langsung mulai"
              description="Skip setup. Langsung cerita. Cepat dan ringan."
              accentColor="var(--pt-green)"
              onClick={handleSkipPersonalization}
              buttonLabel="Langsung Mulai →"
              buttonVariant="outline"
              bgColor="var(--pt-cream)"
            />
          </motion.div>

          {/* Micro-copy */}
          <motion.p
            variants={itemVariants}
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            💡 Bisa diubah kapan saja. Tidak ada jawaban yang salah.
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}

/* ---- Choice Card ---- */

interface ChoiceCardProps {
  icon:          string;
  title:         string;
  description:   string;
  accentColor:   string;
  bgColor:       string;
  onClick:       () => void;
  buttonLabel:   string;
  buttonVariant: 'primary' | 'outline';
  recommended?:  boolean;
}

function ChoiceCard({
  icon, title, description,
  accentColor, bgColor,
  onClick, buttonLabel, buttonVariant, recommended,
}: ChoiceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ y: 0 }}
    >
      <PTCard
        variant="white"
        padding="lg"
        accentColor={accentColor}
        accentHeight={5}
        className="h-full flex flex-col gap-4 relative text-left"
      >
        {/* Recommended badge */}
        {recommended && (
          <div
            className="absolute -top-3 left-4 px-2 py-0.5 rounded-sketch border-2 border-pt-black text-label font-bold"
            style={{ backgroundColor: 'var(--pt-coral)', color: 'white', fontFamily: 'var(--font-body)' }}
          >
            ✨ Rekomendasi
          </div>
        )}

        {/* Icon in colored bg */}
        <div
          className="w-14 h-14 rounded-sketch border-2 border-pt-black flex items-center justify-center text-3xl shadow-sketch-sm"
          style={{ backgroundColor: bgColor }}
        >
          {icon}
        </div>

        {/* Text */}
        <div>
          <h3
            className="mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h4)',
              color: 'var(--pt-black)',
            }}
          >
            {title}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            {description}
          </p>
        </div>

        {/* CTA */}
        <PTButton
          variant={buttonVariant}
          size="md"
          onClick={onClick}
          className="w-full mt-auto"
        >
          {buttonLabel}
        </PTButton>
      </PTCard>
    </motion.div>
  );
}

/* ---- Decision Illustration ---- */

function DecisionIllustration() {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        width="120" height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Personalization illustration"
      >
        {/* Background circle */}
        <circle cx="60" cy="60" r="52" fill="#F5D60D" stroke="#2B2B2B" strokeWidth="2.5" />
        <circle cx="63" cy="63" r="52" fill="none" stroke="#2B2B2B" strokeWidth="1" opacity="0.15" />
        {/* Question mark */}
        <text
          x="60" y="75"
          textAnchor="middle"
          fontFamily="'Gaegu', cursive"
          fontSize="52"
          fontWeight="700"
          fill="#2B2B2B"
        >
          ?
        </text>
        {/* Stars */}
        <text x="15" y="30" fontSize="16" fill="#F04E59">✦</text>
        <text x="92" y="25" fontSize="12" fill="#35D5F4">✦</text>
        <text x="100" y="90" fontSize="14" fill="#17B66A">✦</text>
        <text x="10" y="95" fontSize="10" fill="#F28C28">✦</text>
      </svg>
    </motion.div>
  );
}
