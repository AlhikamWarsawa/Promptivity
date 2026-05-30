'use client';

import { useState }                from 'react';
import Link                        from 'next/link';
import { useRouter }               from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn }                      from '@/lib/utils';
import { PTButton }                from '@/components/pt/PTButton';
import { ScoreBar }                from '@/components/pt/ScoreBar';
import { getFramework, getSortedFrameworkIds } from '@/lib/frameworkConfig';
import { hasGeneratedTasks }       from '@/lib/parsers';
import { usePTStore }              from '@/store/usePTStore';
import { EmptyState }              from '@/components/pt/EmptyState';
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
  const deepGenerate = usePTStore((s) => s.generateFrameworkTasks);
  const storeError = usePTStore((s) => s.error);
  
  const [localLoading, setLocalLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);

  const fwData   = session?.frameworks.find(
    (f) => f.frameworkId === frameworkId,
  );

  const isTopPick = session?.topRecommendation === frameworkId;
  const hasTasks = !!fwData && hasGeneratedTasks(frameworkId, fwData.rawData);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--pt-white)' }}>
        <header className="px-6 py-4 border-b-2 border-pt-black">
          <PTButton variant="outline" size="sm" onClick={() => router.push('/')}>← Back Home</PTButton>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <EmptyState 
            icon="🏜️"
            message="No active mission found"
            subMessage="You need to share your story first so Moti can build these frameworks for you."
          />
        </main>
      </div>
    );
  }

  const sortedIds  = session ? getSortedFrameworkIds(session.frameworks) : [];
  const currentIdx = sortedIds.indexOf(frameworkId);
  const prevId     = currentIdx > 0 ? sortedIds[currentIdx - 1] : null;
  const nextId     = currentIdx < sortedIds.length - 1 ? sortedIds[currentIdx + 1] : null;

  const prevMeta   = prevId ? getFramework(prevId) : null;
  const nextMeta   = nextId ? getFramework(nextId) : null;

  const prevScore  = prevId ? session?.frameworks.find(f => f.frameworkId === prevId)?.recommendationScore : null;
  const nextScore  = nextId ? session?.frameworks.find(f => f.frameworkId === nextId)?.recommendationScore : null;

  const handleGenerate = async () => {
    if (localLoading) return;
    setLocalLoading(true);
    await generate(frameworkId);
    setLocalLoading(false);
  };

  const handleDeepGenerate = async () => {
    if (deepLoading) return;
    setDeepLoading(true);
    await deepGenerate(frameworkId);
    setDeepLoading(false);
  };

  if (!meta) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pt-white)' }}>
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

      </motion.header>

      <section className="px-4 sm:px-6 py-10" style={{ background: `linear-gradient(135deg, ${meta.accentColor}18 0%, var(--pt-white) 60%)`, borderBottom: '2px solid var(--pt-black)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-sketch border-2 border-pt-black flex items-center justify-center shrink-0" style={{ backgroundColor: meta.accentColor + '30', boxShadow: '5px 5px 0px #2B2B2B' }}>
            {FrameworkIcon && <FrameworkIcon size={48} />}
          </div>
          <div className="flex-1">
            {isTopPick && <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold mb-2 bg-pt-yellow">⭐ Top Pick</div>}
            <h1 className="text-display leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}>{meta.name}</h1>
            <p className="mt-1 text-sm font-semibold italic" style={{ color: meta.accentColor }}>&ldquo;{meta.tagline}&rdquo;</p>
            
            {hasTasks && frameworkId !== 'pomodoro' && (
              <div className="mt-4">
                <PTButton
                  variant="outline"
                  size="sm"
                  onClick={handleDeepGenerate}
                  isLoading={deepLoading}
                  disabled={deepLoading}
                >
                  {deepLoading ? 'Regenerating...' : 'Regenerate'}
                </PTButton>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className={cn('px-4 sm:px-6 py-8', className)}>
        <div className="max-w-4xl mx-auto">
          {!hasTasks ? (
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

      <nav className="border-t-2 border-pt-black px-4 sm:px-6 py-6 bg-pt-cream">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex gap-3 sm:gap-4 order-2 sm:order-1">
            {prevMeta && (
              <Link href={prevMeta.route} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black font-bold text-sm bg-pt-white shadow-sketch transition-all hover:translate-y-[-2px]">
                <ChevronLeft /> <span className="sm:inline">{prevMeta.shortName} ({prevScore})</span>
              </Link>
            )}
            {nextMeta && (
              <Link href={nextMeta.route} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-sketch border-2 border-pt-black font-bold text-sm bg-pt-white shadow-sketch transition-all hover:translate-y-[-2px]">
                <span className="sm:inline">{nextMeta.shortName} ({nextScore})</span> <ChevronRight />
              </Link>
            )}
          </div>
          <PTButton variant="primary" size="sm" onClick={() => router.push('/dashboard')} className="order-1 sm:order-2">Dashboard</PTButton>
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
        Moti akan mengubah ceritamu menjadi task yang konkret di framework <strong>{meta.name}</strong>.
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
        {isLoading ? 'Generating...' : 'Generate Tasks'}
      </PTButton>
    </div>
  );
}

function ChevronLeft() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChevronRight() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

export function FrameworkEmptyState({ frameworkId, message }: { frameworkId: string; message?: string }) {
  return (
    <EmptyState 
      icon="🤖"
      message="Ready to generate tasks"
      subMessage={message ?? `Use Generate Tasks to build a ${frameworkId} action plan.`}
    />
  );
}
