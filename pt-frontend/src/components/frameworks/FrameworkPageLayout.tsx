'use client';

import { useState }                from 'react';
import Link                        from 'next/link';
import { useRouter }               from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn }                      from '@/lib/utils';
import { PTButton }                from '@/components/pt/PTButton';
import { ScoreBar }                from '@/components/pt/ScoreBar';
import { getFramework }            from '@/lib/frameworkConfig';
import { usePTStore }              from '@/store/usePTStore';
import type { FrameworkId }        from '@/types/pt.types';

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
  const FrameworkIcon = meta?.icon;
  const session  = usePTStore((s) => s.session);
  const generate = usePTStore((s) => s.generateFramework);
  const storeError = usePTStore((s) => s.error);
  
  const [localLoading, setLocalLoading] = useState(false);

  const fwData   = session?.frameworks.find(
    (f) => f.frameworkId === frameworkId,
  );

  const isTopPick = session?.topRecommendation === frameworkId;
  const isGenerated = fwData && fwData.rawData && Object.keys(fwData.rawData).length > 0;

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

  const handleGenerate = async () => {
    if (localLoading) return; // Debounce
    setLocalLoading(true);
    await generate(frameworkId);
    setLocalLoading(false);
  };

  if (!meta) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pt-white)' }}>
      {/* Sticky Header */}
      <motion.header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{ backgroundColor: 'var(--pt-white)', borderBottom: '2px solid var(--pt-black)' }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sketch border-2 border-pt-black text-label font-bold bg-pt-white hover:bg-pt-cream transition-colors"
        >
          <ChevronLeft /> <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sketch border-2 border-pt-black" style={{ backgroundColor: meta.accentColor + '25' }}>
          {FrameworkIcon && <FrameworkIcon size={20} />}
          <span className="text-label font-bold" style={{ color: 'var(--pt-black)' }}>{meta.shortName}</span>
          {isTopPick && <span>⭐</span>}
        </div>

        {fwData && (
          <div className="ml-auto hidden sm:block w-32">
            <ScoreBar score={fwData.recommendationScore} variant="compact" color={meta.accentColor} showLabel={false} />
          </div>
        )}

        <Link href="/onboarding/brain-dump" className="ml-auto sm:ml-2 text-label font-bold underline">✍️ Cerita Baru</Link>
      </motion.header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-10" style={{ background: `linear-gradient(135deg, ${meta.accentColor}18 0%, var(--pt-white) 60%)`, borderBottom: '2px solid var(--pt-black)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-sketch border-2 border-pt-black flex items-center justify-center shrink-0" style={{ backgroundColor: meta.accentColor + '30', boxShadow: '5px 5px 0px #2B2B2B' }}>
            {FrameworkIcon && <FrameworkIcon size={48} />}
          </div>
          <div className="flex-1">
            {isTopPick && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold mb-2 bg-pt-yellow">⭐ Top Pick</div>}
            <h1 className="text-display leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}>{meta.name}</h1>
            <p className="mt-1 text-sm font-semibold italic" style={{ color: meta.accentColor }}>&ldquo;{meta.tagline}&rdquo;</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={cn('px-4 sm:px-6 py-8', className)}>
        <div className="max-w-4xl mx-auto">
          {!isGenerated ? (
            <FrameworkPlaceholder 
              meta={meta} 
              isLoading={localLoading} 
              error={storeError}
              onGenerate={handleGenerate} 
            />
          ) : (
            children
          )}
        </div>
      </main>

      {/* Navigation */}
      <nav className="border-t-2 border-pt-black px-4 sm:px-6 py-5 bg-pt-cream">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {prevMeta ? (
            <Link href={prevMeta.route} className="flex items-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black font-bold text-sm bg-pt-white shadow-sketch transition-all hover:translate-y-[-2px]">
              <ChevronLeft /> <span className="hidden sm:inline">{prevMeta.shortName}</span>
            </Link>
          ) : <div />}
          <PTButton variant="primary" size="sm" onClick={() => router.push('/dashboard')}>Dashboard</PTButton>
          {nextMeta ? (
            <Link href={nextMeta.route} className="flex items-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black font-bold text-sm bg-pt-white shadow-sketch transition-all hover:translate-y-[-2px]">
              <span className="hidden sm:inline">{nextMeta.shortName}</span> <ChevronRight />
            </Link>
          ) : <div />}
        </div>
      </nav>
    </div>
  );
}

function FrameworkPlaceholder({ meta, isLoading, error, onGenerate }: any) {
  return (
    <div className="text-center py-20 rounded-sketch border-2 border-pt-black/20 bg-pt-cream relative overflow-hidden">
      <div className="text-6xl mb-6">✨</div>
      <h2 className="text-h2 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Siap membangun mission?</h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
        Moti perlu sedikit waktu untuk membedah ceritamu ke dalam framework <strong>{meta.name}</strong> secara mendalam.
      </p>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-sketch border-2 border-red-500 bg-red-50 text-red-700 text-sm font-bold max-w-md mx-auto"
        >
          ⚠️ {error}
        </motion.div>
      )}
      
      <PTButton 
        variant="primary" 
        onClick={onGenerate} 
        isLoading={isLoading}
        disabled={isLoading}
        className="px-10"
      >
        {isLoading ? 'Membangun...' : 'Bangun Framework Ini'}
      </PTButton>
      
      <p className="mt-4 text-[11px] text-gray-400 italic">
        *Membangun framework spesifik membutuhkan waktu sekitar 10-15 detik.
      </p>
    </div>
  );
}

function ChevronLeft() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChevronRight() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

export function FrameworkEmptyState({ frameworkId, message }: { frameworkId: string; message?: string }) {
  return (
    <div className="text-center py-16 rounded-sketch border-2 border-pt-black/20 bg-pt-cream">
      <p className="text-5xl mb-4">🤖</p>
      <h3 className="text-h3 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{frameworkId.toUpperCase()} Kosong</h3>
      <p className="text-sm max-w-sm mx-auto text-gray-500" style={{ fontFamily: 'var(--font-body)' }}>{message ?? 'Data tidak tersedia untuk framework ini.'}</p>
    </div>
  );
}
