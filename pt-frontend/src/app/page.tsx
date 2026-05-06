'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { PTButton } from '@/components/pt/PTButton';
import { PTCard } from '@/components/pt/PTCard';
import { HandDrawnDivider } from '@/components/pt/HandDrawnDivider';
import { FRAMEWORK_LIST } from '@/lib/frameworkConfig';
import { PTStorage } from '@/lib/storage';

/* ============================================
   PT Welcome Page
   
   Sections:
   1. Navbar
   2. Hero (tagline + mascot + CTA)
   3. How It Works (3 langkah)
   4. Framework Preview (3 card)
   5. Footer CTA
   6. Footer
   ============================================ */

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return skeleton yang sama persis dengan Navbar
    // agar tidak ada layout shift
    return (
      <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--pt-white)' }}>
        <div
          className="w-full px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '2px solid var(--pt-black)', height: '64px' }}
        />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <Navbar onLogin={() => router.push('/auth/login')} />
      <HeroSection
        onLogin={() => router.push('/auth/login')}
        onSkip={() => {
          PTStorage.setSkipLogin();
          router.push('/onboarding');
        }}
      />
      <HowItWorksSection />
      <FrameworkPreviewSection />
      <FooterCTA onStart={() => {
        PTStorage.setSkipLogin();
        router.push('/onboarding');
      }} />
      <PageFooter />
    </main>
  );
}

/* ============================================
   SECTION 1: Navbar
   ============================================ */

function Navbar({
  onLogin,
}: {
  onLogin: () => void;
}) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full px-6 py-4 flex items-center justify-between"
      style={{ borderBottom: '2px solid var(--pt-black)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <PTLogo />
        <span
          className="text-2xl font-bold leading-none"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
        >
          PT
        </span>
        <span
          className="hidden sm:inline text-sm text-[#6B6B6B] font-body"
          style={{ marginLeft: '4px', marginTop: '2px' }}
        >
          Promptivity
        </span>
      </div>

      {/* Nav right */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLogin}
          className="font-body text-sm font-semibold underline decoration-2 decoration-pt-black underline-offset-2 hover:text-pt-coral transition-colors"
          style={{ color: 'var(--pt-black)' }}
        >
          Login
        </button>
        <PTButton
          variant="outline"
          size="sm"
          onClick={onLogin}
          className="hidden sm:flex"
        >
          Sign Up
        </PTButton>
      </div>
    </motion.nav>
  );
}

/* ============================================
   SECTION 2: Hero
   ============================================ */

function HeroSection({
  onLogin,
  onSkip,
}: {
  onLogin: () => void;
  onSkip: () => void;
}) {
  // Staggered animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: 'var(--pt-yellow)',
        borderBottom: '2px solid var(--pt-black)',
      }}
    >
      {/* Background pattern — sketch dots */}
      <SketchDotsBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Eyebrow label */}
            <motion.div variants={itemVariants}>
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-sketch text-label font-bold border-2 border-pt-black"
                style={{ backgroundColor: 'var(--pt-coral)', color: 'white' }}
              >
                ✨ AI Productivity Mission Builder
              </span>
            </motion.div>

            {/* Main tagline */}
            <motion.div variants={itemVariants}>
              <h1
                className="leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                  color: 'var(--pt-black)',
                  lineHeight: 1.1,
                }}
              >
                Tell your story.
                <br />
                <span style={{ color: 'var(--pt-brown)' }}>
                  We build your mission.
                </span>
              </h1>
            </motion.div>

            {/* Subtitle — max 3 kalimat */}
            <motion.div variants={itemVariants}>
              <p
                className="text-body leading-relaxed max-w-md"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
              >
                Ceritakan hidup, kerjaan, dan deadlinemu dalam satu paragraf.
                PT memproses ceritamu menjadi task, prioritas, dan jadwal menggunakan
                13 framework produktivitas terbukti.
                Tidak perlu tahu GTD, Kanban, atau Pomodoro — biarkan AI yang memilih.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3"
            >
              <PTButton
                variant="secondary"
                size="lg"
                onClick={onSkip}
                className="group"
              >
                <span>🚀 Start Without Account</span>
              </PTButton>
              <PTButton
                variant="ghost"
                size="lg"
                onClick={onLogin}
              >
                Login →
              </PTButton>
            </motion.div>

            {/* Micro-copy under buttons */}
            <motion.p
              variants={itemVariants}
              className="text-sm"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)', opacity: 0.65 }}
            >
              Skip login → data tersimpan di browser kamu. Gratis. Tidak perlu kartu kredit.
            </motion.p>
          </motion.div>

          {/* Right: Mascot / Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex justify-center lg:justify-end"
          >
            <PTMascotIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   SECTION 3: How It Works
   ============================================ */

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const steps = [
    {
      number: '01',
      icon: '📖',
      title: 'Cerita',
      description:
        'Tulis bebas tentang kerjaan, kuliah, deadline, hambatan, dan kondisi hidupmu sekarang. Tidak perlu rapi.',
      color: 'var(--pt-cyan)',
    },
    {
      number: '02',
      icon: '⚡',
      title: 'Proses',
      description:
        'AI membaca ceritamu, mengidentifikasi task, prioritas, dan pola produktivitasmu secara otomatis.',
      color: 'var(--pt-coral)',
    },
    {
      number: '03',
      icon: '🎯',
      title: 'Mission',
      description:
        'Kamu mendapat task breakdown, jadwal, dan framework yang paling cocok untukmu — siap dieksekusi hari ini.',
      color: 'var(--pt-green)',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section className="w-full py-20 px-6" style={{ backgroundColor: 'var(--pt-white)' }}>
      <div className="max-w-5xl mx-auto" ref={ref}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h2)',
              color: 'var(--pt-black)',
            }}
          >
            Cara kerja PT
          </h2>
          <p
            className="mt-3 text-body max-w-lg mx-auto"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            Tiga langkah. Satu cerita. Satu mission plan yang bisa langsung dieksekusi.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {steps.map((step, index) => (
            <motion.div key={step.number} variants={itemVariants}>
              <PTCard
                variant="white"
                padding="lg"
                accentColor={step.color}
                accentHeight={5}
                className="h-full relative"
              >
                {/* Step number — big background */}
                <span
                  className="absolute top-4 right-4 font-display font-bold opacity-10 select-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '4rem',
                    color: 'var(--pt-black)',
                    lineHeight: 1,
                  }}
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Title */}
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-h3)',
                    color: 'var(--pt-black)',
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
                >
                  {step.description}
                </p>

                {/* Connector arrow (except last) */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-2xl"
                    aria-hidden="true"
                  >
                    →
                  </div>
                )}
              </PTCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================
   SECTION 4: Framework Preview
   ============================================ */

function FrameworkPreviewSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  // Pilih 3 framework yang paling visual menarik untuk preview
  const previewFrameworks = [
    FRAMEWORK_LIST.find((f) => f.id === 'eisenhower')!,
    FRAMEWORK_LIST.find((f) => f.id === 'kanban')!,
    FRAMEWORK_LIST.find((f) => f.id === 'eat-the-frog')!,
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, rotate: 0 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotate: i === 0 ? -1.5 : i === 1 ? 0.5 : 1,
      transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <section
      className="w-full py-20 px-6"
      style={{
        backgroundColor: 'var(--pt-cream)',
        borderTop: '2px solid var(--pt-black)',
        borderBottom: '2px solid var(--pt-black)',
      }}
    >
      <div className="max-w-5xl mx-auto" ref={ref}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h2)',
              color: 'var(--pt-black)',
            }}
          >
            13 framework. Satu cerita.
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-body mb-12 max-w-xl mx-auto"
          style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
        >
          PT membangun 13 framework produktivitas dari ceritamu secara bersamaan,
          lalu merekomendasikan yang paling cocok.
        </motion.p>

        <HandDrawnDivider variant="wave" color="var(--pt-black)" className="mb-12" />

        {/* 3 Framework Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {previewFrameworks.map((fw, i) => (
            <motion.div
              key={fw?.id || i}
              custom={i}
              variants={cardVariants}
            >
              {fw && <FrameworkPreviewCard framework={fw} />}
            </motion.div>
          ))}
        </motion.div>

        {/* "+10 more" indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-3 mt-10"
        >
          <span
            className="text-sm font-body"
            style={{ color: '#6B6B6B', fontFamily: 'var(--font-body)' }}
          >
            + 10 framework lainnya
          </span>
          <div className="flex gap-1">
            {FRAMEWORK_LIST.slice(3).map((fw) => (
              <span
                key={fw.id}
                title={fw.name}
                className="text-xl"
                aria-label={fw.name}
              >
                {fw.icon}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FrameworkPreviewCard({
  framework,
}: {
  framework: (typeof FRAMEWORK_LIST)[0];
}) {
  return (
    <PTCard
      variant="white"
      padding="lg"
      accentColor={framework.accentColor}
      accentHeight={5}
      className="h-full"
    >
      {/* Icon */}
      <div className="text-5xl mb-4">{framework.icon}</div>

      {/* Framework name */}
      <h3
        className="mb-1"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h4)',
          color: 'var(--pt-black)',
        }}
      >
        {framework.name}
      </h3>

      {/* Tagline */}
      <p
        className="text-sm italic mb-4"
        style={{
          fontFamily: 'var(--font-body)',
          color: framework.accentColor,
          fontWeight: 600,
        }}
      >
        &ldquo;{framework.tagline}&rdquo;
      </p>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {framework.description}
      </p>

      {/* Best for tags */}
      <div className="flex flex-wrap gap-1.5 mt-4">
        {framework.bestFor.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-label px-2 py-0.5 rounded-sketch border border-pt-black/30"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--pt-black)',
              backgroundColor: framework.accentColor + '22',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Mock content preview — decorative */}
      <FrameworkMockContent frameworkId={framework.id} color={framework.accentColor} />
    </PTCard>
  );
}

function FrameworkMockContent({
  frameworkId,
  color,
}: {
  frameworkId: string;
  color: string;
}) {
  // Konten mock dekoratif yang berbeda per framework
  const mockContents: Record<string, React.ReactNode> = {
    eisenhower: (
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {[
          { label: 'Do Now', bg: '#FEE8EA' },
          { label: 'Schedule', bg: '#FFFCE0' },
          { label: 'Delegate', bg: '#E0F9FE' },
          { label: 'Eliminate', bg: '#F0FADF' },
        ].map((q) => (
          <div
            key={q.label}
            className="rounded p-2 text-center border border-pt-black/20"
            style={{ backgroundColor: q.bg }}
          >
            <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>
              {q.label}
            </span>
            <div className="mt-1 space-y-1">
              <div className="h-1.5 rounded bg-pt-black/20 w-full" />
              <div className="h-1.5 rounded bg-pt-black/15 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    ),
    kanban: (
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {[
          { label: 'Backlog', count: 3 },
          { label: 'Doing', count: 2 },
          { label: 'Done', count: 1 },
        ].map((col) => (
          <div
            key={col.label}
            className="rounded p-1.5 border border-pt-black/20"
            style={{ backgroundColor: color + '15' }}
          >
            <span className="text-[9px] font-bold block mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
              {col.label}
            </span>
            <div className="space-y-1">
              {Array.from({ length: col.count }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded border border-pt-black/20 bg-white"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
    'eat-the-frog': (
      <div className="mt-4">
        <div
          className="rounded-sketch border-2 border-pt-black p-3 text-center"
          style={{ backgroundColor: color + '20' }}
        >
          <div className="text-2xl">🐸</div>
          <div className="text-[10px] font-bold mt-1" style={{ fontFamily: 'var(--font-body)' }}>
            YOUR FROG TODAY
          </div>
          <div className="mt-2 space-y-1">
            <div className="h-2 rounded bg-pt-black/20 w-full" />
            <div className="h-2 rounded bg-pt-black/10 w-2/3 mx-auto" />
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-2 rounded bg-pt-black/10 w-full" />
          <div className="h-2 rounded bg-pt-black/10 w-4/5" />
        </div>
      </div>
    ),
  };

  return (
    <>{mockContents[frameworkId] ?? null}</>
  );
}

/* ============================================
   SECTION 5: Footer CTA
   ============================================ */

function FooterCTA({ onStart }: { onStart: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      className="w-full py-24 px-6 text-center"
      style={{ backgroundColor: 'var(--pt-blue)' }}
      ref={ref}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="max-w-2xl mx-auto"
      >
        <h2
          className="text-white mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            lineHeight: 1.15,
          }}
        >
          Ceritamu menunggu untuk jadi mission.
        </h2>
        <p
          className="text-white/80 mb-10 text-body"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Gratis. Tidak perlu akun. Mulai sekarang dalam 30 detik.
        </p>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <PTButton
            variant="primary"
            size="lg"
            onClick={onStart}
            className="text-xl px-10 py-5"
          >
            🚀 Mulai Sekarang — Gratis
          </PTButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ============================================
   SECTION 6: Footer
   ============================================ */

function PageFooter() {
  return (
    <footer
      className="w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2"
      style={{
        borderTop: '2px solid var(--pt-black)',
        backgroundColor: 'var(--pt-white)',
      }}
    >
      <div className="flex items-center gap-2">
        <PTLogo size={20} />
        <span
          className="font-body text-sm font-semibold"
          style={{ color: 'var(--pt-black)' }}
        >
          PT — Promptivity
        </span>
      </div>
      <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
        Built with ☕ + AI. Tell your story.
      </p>
    </footer>
  );
}

/* ============================================
   VISUAL COMPONENTS
   (Mascot, Logo, Background, Wave)
   ============================================ */

/**
 * PTLogo — SVG logo sketch style
 * "PT" dalam kotak dengan border sketch
 */
function PTLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 rounded-sketch border-2 border-pt-black shadow-sketch-sm overflow-hidden bg-pt-yellow"
    >
      <Image
        src="/promptivity.png"
        alt="Promptivity Logo"
        fill
        className="object-cover"
        sizes={`${size}px`}
      />
    </div>
  );
}

/**
 * PTMascotIllustration — SVG mascot untuk hero section
 * Karakter storyteller kecil yang sedang menulis/bercerita
 * Style: kids book, hand-drawn, MS Paint vibe
 */
function PTMascotIllustration() {
  return (
    <div className="relative">
      {/* Main illustration container */}
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width="320"
          height="340"
          viewBox="0 0 320 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="PT Mascot — a storyteller character"
          className="w-full max-w-[320px]"
        >
          {/* ---- BACKGROUND CARD (notebook) ---- */}
          <rect
            x="40" y="60" width="240" height="260"
            rx="8"
            fill="#F3F3F1"
            stroke="#2B2B2B"
            strokeWidth="2.5"
          />
          {/* Shadow */}
          <rect
            x="45" y="65" width="240" height="260"
            rx="8"
            fill="#2B2B2B"
            opacity="0.08"
          />
          {/* Notebook lines */}
          {[100, 120, 140, 160, 180, 200, 220, 240, 260, 280].map((y) => (
            <line
              key={y}
              x1="65" y1={y} x2="255" y2={y}
              stroke="#2B2B2B"
              strokeWidth="1"
              opacity="0.12"
            />
          ))}
          {/* Notebook red margin line */}
          <line
            x1="85" y1="70" x2="85" y2="310"
            stroke="#F04E59"
            strokeWidth="1.5"
            opacity="0.4"
          />
          {/* Spiral rings on top */}
          {[80, 110, 140, 170, 200, 230].map((x) => (
            <ellipse
              key={x}
              cx={x} cy="62"
              rx="7" ry="10"
              fill="none"
              stroke="#2B2B2B"
              strokeWidth="2"
            />
          ))}

          {/* ---- HANDWRITTEN TEXT LINES (decorative) ---- */}
          {/* Line 1 — yellow highlight */}
          <rect x="92" y="94" width="140" height="12" rx="2" fill="#F6E37A" opacity="0.8" />
          <line x1="92" y1="100" x2="232" y2="100" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" />
          {/* Line 2 */}
          <line x1="92" y1="120" x2="210" y2="120" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          {/* Line 3 */}
          <line x1="92" y1="140" x2="225" y2="140" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          {/* Line 4 */}
          <line x1="92" y1="160" x2="195" y2="160" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

          {/* ---- TASK CHECKBOXES (decorative) ---- */}
          {/* Checkbox 1 — checked */}
          <rect x="92" y="178" width="12" height="12" rx="2" fill="#17B66A" stroke="#2B2B2B" strokeWidth="1.5" />
          <polyline points="94,184 97,188 102,181" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="110" y1="184" x2="195" y2="184" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          {/* Strikethrough */}
          <line x1="110" y1="184" x2="195" y2="184" stroke="#2B2B2B" strokeWidth="1" opacity="0.3" />

          {/* Checkbox 2 — checked */}
          <rect x="92" y="198" width="12" height="12" rx="2" fill="#17B66A" stroke="#2B2B2B" strokeWidth="1.5" />
          <polyline points="94,204 97,208 102,201" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="110" y1="204" x2="215" y2="204" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

          {/* Checkbox 3 — unchecked, priority coral */}
          <rect x="92" y="218" width="12" height="12" rx="2" fill="white" stroke="#F04E59" strokeWidth="2" />
          <line x1="110" y1="224" x2="220" y2="224" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          {/* Priority dot */}
          <circle cx="238" cy="224" r="5" fill="#F04E59" />

          {/* Checkbox 4 — unchecked */}
          <rect x="92" y="238" width="12" height="12" rx="2" fill="white" stroke="#2B2B2B" strokeWidth="1.5" />
          <line x1="110" y1="244" x2="200" y2="244" stroke="#2B2B2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

          {/* ---- CHARACTER MASCOT (top right) ---- */}
          {/* Body */}
          <ellipse cx="225" cy="50" rx="30" ry="32" fill="#F6E37A" stroke="#2B2B2B" strokeWidth="2.5" />
          {/* Eyes */}
          <circle cx="215" cy="44" r="4" fill="white" stroke="#2B2B2B" strokeWidth="2" />
          <circle cx="235" cy="44" r="4" fill="white" stroke="#2B2B2B" strokeWidth="2" />
          <circle cx="216" cy="45" r="2" fill="#2B2B2B" />
          <circle cx="236" cy="45" r="2" fill="#2B2B2B" />
          {/* Smile */}
          <path d="M213,56 Q225,64 237,56" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <ellipse cx="210" cy="54" rx="5" ry="3" fill="#F04E59" opacity="0.3" />
          <ellipse cx="240" cy="54" rx="5" ry="3" fill="#F04E59" opacity="0.3" />
          {/* Pencil in hand */}
          <rect x="248" y="58" width="5" height="28" rx="2" fill="#F5D60D" stroke="#2B2B2B" strokeWidth="1.5" transform="rotate(25 248 58)" />
          <polygon points="255,82 259,88 251,88" fill="#F3F3F1" stroke="#2B2B2B" strokeWidth="1" transform="rotate(25 255 82)" />
          <rect x="249" y="56" width="5" height="4" rx="1" fill="#F04E59" stroke="#2B2B2B" strokeWidth="1" transform="rotate(25 249 56)" />

          {/* ---- FLOATING BADGES (decorative) ---- */}
          {/* GTD badge */}
          <rect x="8" y="100" width="42" height="20" rx="4" fill="#2196E8" stroke="#2B2B2B" strokeWidth="1.5" />
          <text x="29" y="114" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fontWeight="700" fill="white">GTD</text>

          {/* Pomodoro badge */}
          <rect x="268" y="140" width="48" height="20" rx="4" fill="#F28C28" stroke="#2B2B2B" strokeWidth="1.5" />
          <text x="292" y="154" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="8" fontWeight="700" fill="white">🍅 25min</text>

          {/* Priority badge */}
          <rect x="10" y="180" width="58" height="20" rx="4" fill="#F04E59" stroke="#2B2B2B" strokeWidth="1.5" />
          <text x="39" y="194" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="8" fontWeight="700" fill="white">🔴 Critical</text>

          {/* OKR badge */}
          <rect x="268" y="200" width="44" height="20" rx="4" fill="#17B66A" stroke="#2B2B2B" strokeWidth="1.5" />
          <text x="290" y="214" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fontWeight="700" fill="white">OKRs</text>
        </svg>
      </motion.div>

      {/* Floating stars decoration */}
      <FloatingStar x={10} y={20} delay={0} />
      <FloatingStar x={290} y={60} delay={0.5} size={16} />
      <FloatingStar x={30} y={280} delay={1} size={12} />
    </div>
  );
}

function FloatingStar({
  x,
  y,
  delay = 0,
  size = 20,
}: {
  x: number;
  y: number;
  delay?: number;
  size?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y, fontSize: size }}
      animate={{
        rotate: [0, 15, -10, 0],
        scale: [1, 1.2, 0.9, 1],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    >
      ✦
    </motion.div>
  );
}

/**
 * SketchDotsBackground — polka dot pattern untuk hero
 */
function SketchDotsBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(43,43,43,0.08) 1.5px, transparent 1.5px)`,
        backgroundSize: '28px 28px',
      }}
    />
  );
}

/**
 * HeroBottomWave — wavy SVG border di bawah hero section
 */
function HeroBottomWave() {
  return (
    <div
      className="w-full overflow-hidden"
      style={{ marginBottom: '-2px' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-12"
      >
        <path
          d="M0,24 C120,48 240,0 360,24 C480,48 600,0 720,24 C840,48 960,0 1080,24 C1200,48 1320,0 1440,24 L1440,48 L0,48 Z"
          fill="#F3F3F1"
        />
        <path
          d="M0,24 C120,48 240,0 360,24 C480,48 600,0 720,24 C840,48 960,0 1080,24 C1200,48 1320,0 1440,24"
          fill="none"
          stroke="#2B2B2B"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
