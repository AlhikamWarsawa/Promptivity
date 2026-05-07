'use client';

import Link                        from 'next/link';
import { useRouter }               from 'next/navigation';
import { motion }                  from 'framer-motion';
import { cn }                      from '@/lib/utils';
import { PTButton }                from '@/components/pt/PTButton';
import { ScoreBar }                from '@/components/pt/ScoreBar';
import { getFramework }            from '@/lib/frameworkConfig';
import { usePTStore }              from '@/store/usePTStore';
import type { FrameworkId }        from '@/types/pt.types';

/* ============================================
   FrameworkPageLayout — Generic wrapper untuk
   semua 13 halaman framework.
   
   Berisi:
   - Sticky header: back button + framework info
   - Hero: icon besar, nama, tagline, score
   - Recommendation banner (jika top pick)
   - Today's actions panel
   - Slot untuk konten spesifik framework (children)
   - Footer navigation antar framework
   ============================================ */

interface FrameworkPageLayoutProps {
  frameworkId: FrameworkId;
  children:    React.ReactNode;
  className?:  string;
}

export function FrameworkPageLayout({
  frameworkId,
  children,
  className,
}: FrameworkPageLayoutProps) {
  const router   = useRouter();
  const meta     = getFramework(frameworkId);
  const session  = usePTStore((s) => s.session);

  const fwData   = session?.frameworks.find(
    (f) => f.frameworkId === frameworkId,
  );

  const isTopPick = session?.topRecommendation === frameworkId;

  // Hitung index untuk prev/next navigation
  const FRAMEWORK_ORDER: FrameworkId[] = [
    'gtd', 'kanban', 'time-blocking', 'eat-the-frog', 'pomodoro',
    'eisenhower', 'systemist', 'medium-method', 'okrs',
    'weekly-review', 'commitment-inventory', 'smart-goals', 'para',
  ];
  const currentIdx = FRAMEWORK_ORDER.indexOf(frameworkId);
  const prevId     = currentIdx > 0 ? FRAMEWORK_ORDER[currentIdx - 1] : null;
  const nextId     = currentIdx < FRAMEWORK_ORDER.length - 1 ? FRAMEWORK_ORDER[currentIdx + 1] : null;
  const prevMeta   = prevId ? getFramework(prevId) : null;
  const nextMeta   = nextId ? getFramework(nextId) : null;

  if (!meta) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ fontFamily: 'var(--font-body)' }}>Framework not found.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pt-white)' }}>

      {/* ---- STICKY HEADER ---- */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{
          backgroundColor: 'var(--pt-white)',
          borderBottom:    '2px solid var(--pt-black)',
        }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5',
            'rounded-sketch border-2 border-pt-black text-label font-bold',
            'bg-pt-white hover:bg-pt-cream transition-colors duration-150',
            'shadow-sketch-sm active:translate-x-px active:translate-y-px active:shadow-none',
          )}
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="Kembali ke dashboard"
        >
          <ChevronLeft />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* Framework pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-sketch border-2 border-pt-black"
          style={{ backgroundColor: meta.accentColor + '25' }}
        >
          <span className="text-base leading-none" aria-hidden="true">
            {meta.icon}
          </span>
          <span
            className="text-label font-bold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            {meta.shortName}
          </span>
          {isTopPick && (
            <span className="text-xs" aria-label="Top recommended">⭐</span>
          )}
        </div>

        {/* Score compact */}
        {fwData && (
          <div className="ml-auto hidden sm:block w-32">
            <ScoreBar
              score={fwData.recommendationScore}
              variant="compact"
              color={meta.accentColor}
              showLabel={false}
            />
          </div>
        )}

        {/* New Story shortcut */}
        <Link
          href="/onboarding/brain-dump"
          className="ml-auto sm:ml-2 text-label font-bold underline decoration-2 underline-offset-2"
          style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
        >
          ✍️ Cerita Baru
        </Link>
      </motion.header>

      {/* ---- HERO SECTION ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="px-4 sm:px-6 py-10"
        style={{
          background:   `linear-gradient(135deg, ${meta.accentColor}18 0%, var(--pt-white) 60%)`,
          borderBottom: '2px solid var(--pt-black)',
        }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 rounded-sketch border-2 border-pt-black flex items-center justify-center text-5xl shrink-0"
            style={{
              backgroundColor: meta.accentColor + '30',
              boxShadow:       '5px 5px 0px #2B2B2B',
            }}
            aria-hidden="true"
          >
            {meta.icon}
          </motion.div>

          {/* Info */}
          <div className="flex-1">
            {isTopPick && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold mb-2"
                style={{ backgroundColor: 'var(--pt-yellow)', fontFamily: 'var(--font-body)' }}
              >
                ⭐ Top Pick untuk kamu
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'clamp(1.75rem, 4vw, 2.5rem)',
                color:      'var(--pt-black)',
                lineHeight: 1.15,
              }}
            >
              {meta.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-1 text-sm font-semibold italic"
              style={{ fontFamily: 'var(--font-body)', color: meta.accentColor }}
            >
              &ldquo;{meta.tagline}&rdquo;
            </motion.p>

            {fwData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-3 max-w-sm"
              >
                <ScoreBar
                  score={fwData.recommendationScore}
                  variant="bar"
                  color={meta.accentColor}
                  size="sm"
                  showLabel={true}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Recommendation reason */}
        {fwData?.recommendationReason && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mt-5 p-4 rounded-sketch border border-pt-black/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
          >
            <p
              className="text-label font-bold mb-1"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              🧠 Kenapa Moti pilih framework ini untukmu?
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
            >
              {fwData.recommendationReason}
            </p>
          </motion.div>
        )}
      </motion.section>

      {/* ---- TODAY'S ACTIONS (jika ada) ---- */}
      {fwData?.todayActions && fwData.todayActions.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-4 sm:px-6 py-4"
          style={{ backgroundColor: 'var(--pt-yellowP)', borderBottom: '2px solid var(--pt-black)' }}
        >
          <div className="max-w-4xl mx-auto">
            <p
              className="text-label font-bold mb-2"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
            >
              🎯 Aksi hari ini dengan {meta.shortName}:
            </p>
            <div className="flex flex-wrap gap-2">
              {fwData.todayActions.map((action, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sketch border-2 border-pt-black text-sm font-medium"
                  style={{ backgroundColor: 'white', fontFamily: 'var(--font-body)' }}
                >
                  <span style={{ color: meta.accentColor }}>→</span>
                  {action}
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ---- MAIN CONTENT SLOT ---- */}
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className={cn('px-4 sm:px-6 py-8', className)}
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </motion.main>

      {/* ---- FRAMEWORK NAVIGATION ---- */}
      <nav
        className="border-t-2 border-pt-black px-4 sm:px-6 py-5"
        style={{ backgroundColor: 'var(--pt-cream)' }}
        aria-label="Framework navigation"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Prev */}
          {prevMeta ? (
            <Link
              href={prevMeta.route}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black',
                'text-sm font-bold bg-pt-white hover:bg-pt-cream transition-colors',
                'shadow-sketch hover:-translate-x-px hover:-translate-y-px hover:shadow-sketch-lg',
                'focus-visible:outline-2 focus-visible:outline-pt-blue',
              )}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ChevronLeft />
              <span className="hidden sm:inline">{prevMeta.shortName}</span>
              <span className="sm:hidden">{prevMeta.icon}</span>
            </Link>
          ) : (
            <div />
          )}

          {/* Back to dashboard */}
          <PTButton
            variant="primary"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            Kembali ke Dashboard
          </PTButton>

          {/* Next */}
          {nextMeta ? (
            <Link
              href={nextMeta.route}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black',
                'text-sm font-bold bg-pt-white hover:bg-pt-cream transition-colors',
                'shadow-sketch hover:-translate-x-px hover:-translate-y-px hover:shadow-sketch-lg',
                'focus-visible:outline-2 focus-visible:outline-pt-blue',
              )}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <span className="hidden sm:inline">{nextMeta.shortName}</span>
              <span className="sm:hidden">{nextMeta.icon}</span>
              <ChevronRight />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </nav>
    </div>
  );
}

/* ---- Icon helpers ---- */

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ---- Empty state untuk framework yang tidak punya data ---- */

export function FrameworkEmptyState({
  frameworkId,
  message,
}: {
  frameworkId: FrameworkId;
  message?:    string;
}) {
  return (
    <div
      className="text-center py-16 rounded-sketch border-2 border-pt-black/20"
      style={{ backgroundColor: 'var(--pt-cream)' }}
    >
      <p className="text-5xl mb-4" aria-hidden="true">🤖</p>
      <p
        className="text-h4 mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
      >
        Moti belum punya data untuk {frameworkId.toUpperCase()}
      </p>
      <p
        className="text-sm max-w-sm mx-auto"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {message ?? 'Coba ceritakan lebih detail tentang tugas, project, dan deadlinemu agar Moti bisa mengisi framework ini.'}
      </p>
      <div className="mt-6">
        <Link
          href="/onboarding/brain-dump"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black font-bold text-sm bg-pt-yellow hover:bg-pt-yellow/80 shadow-sketch"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          ✍️ Cerita lagi dengan lebih detail
        </Link>
      </div>
    </div>
  );
}
