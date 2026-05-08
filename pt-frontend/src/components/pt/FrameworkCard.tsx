'use client';

import Link              from 'next/link';
import { motion }        from 'framer-motion';
import { cn }            from '@/lib/utils';
import { ScoreBar }      from '@/components/pt/ScoreBar';
import { getFramework }  from '@/lib/frameworkConfig';
import PTStorage         from '@/lib/storage';
import type { FrameworkOutput } from '@/types/pt.types';

/* ============================================
   FrameworkCard — Grid card untuk 13 framework
   
   Variants:
   - grid    → compact card untuk 13-grid di dashboard
   - feature → large card untuk TopRecommendation
   ============================================ */

interface FrameworkCardProps {
  framework:   FrameworkOutput;
  isTop?:      boolean;       // Top recommendation → special styling
  variant?:    'grid' | 'feature';
  className?:  string;
}

export function FrameworkCard({
  framework,
  isTop     = false,
  variant   = 'grid',
  className,
}: FrameworkCardProps) {
  const meta   = getFramework(framework.frameworkId);
  const FrameworkIcon = meta?.icon;
  const route  = meta?.route ?? `/frameworks/${framework.frameworkId}`;

  if (variant === 'feature') {
    return <FeatureFrameworkCard framework={framework} meta={meta} className={className} />;
  }

  return (
    <Link href={route} className="block focus-visible:outline-2 focus-visible:outline-pt-blue rounded-sketch">
      <motion.div
        whileHover={{
          y: -4,
          scale: 1.02,
          rotate: framework.frameworkId.length % 2 === 0 ? 1 : -1,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        whileTap={{ y: 0, scale: 0.98 }}
        className={cn(
          'relative h-full flex flex-col gap-2',
          'p-3 rounded-sketch border-2 border-pt-black',
          'bg-pt-white cursor-pointer',
          'transition-shadow duration-200',
          isTop
            ? 'shadow-sketch-lg ring-2 ring-pt-yellow'
            : 'shadow-sketch hover:shadow-[6px_6px_0px_#2B2B2B]',
          className,
        )}
        style={{
          borderTop: `4px solid ${meta?.accentColor ?? 'var(--pt-blue)'}`,
        }}
      >
        {/* Recommended star badge */}
        {isTop && (
          <div
            className="absolute -top-3 -right-2 w-8 h-8 rounded-full border-2 border-pt-black flex items-center justify-center text-base"
            style={{ backgroundColor: 'var(--pt-yellow)', boxShadow: '2px 2px 0 #2B2B2B' }}
            aria-label="Top recommended framework"
          >
            ⭐
          </div>
        )}

        {/* Icon */}
        <div className="shrink-0" aria-hidden="true">
          {FrameworkIcon && <FrameworkIcon size={24} />}
        </div>

        {/* Name */}
        <p
          className="text-sm font-bold leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          {meta?.shortName ?? framework.frameworkId}
        </p>

        {/* Score bar (compact) */}
        <ScoreBar
          score={framework.recommendationScore}
          variant="compact"
          color={meta?.accentColor}
          showLabel={false}
          className="mt-auto"
        />

        {/* Score number */}
        <p
          className="text-[10px] font-bold tabular-nums"
          style={{
            fontFamily: 'var(--font-body)',
            color:      meta?.accentColor ?? 'var(--pt-black)',
          }}
        >
          {framework.recommendationScore}/100
        </p>
      </motion.div>
    </Link>
  );
}

/* ---- Feature variant (Top Recommendation) ---- */

function FeatureFrameworkCard({
  framework,
  meta,
  className,
}: {
  framework: FrameworkOutput;
  meta:      ReturnType<typeof getFramework>;
  className?:string;
}) {
  const route = meta?.route ?? `/frameworks/${framework.frameworkId}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative rounded-sketch border-2 border-pt-black p-6',
        'shadow-sketch-xl',
        className,
      )}
      style={{
        backgroundColor: meta?.accentColor
          ? `${meta.accentColor}18`
          : 'var(--pt-yellowP)',
        borderTop: `6px solid ${meta?.accentColor ?? 'var(--pt-yellow)'}`,
      }}
    >
      {/* "Top Pick" ribbon */}
      <div
        className="absolute top-4 right-4 px-3 py-1 rounded-sketch border-2 border-pt-black text-label font-bold flex items-center gap-1"
        style={{ backgroundColor: 'var(--pt-yellow)', fontFamily: 'var(--font-body)' }}
      >
        ⭐ Top Pick
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5 pr-24">
        <div
          className="w-16 h-16 rounded-sketch border-2 border-pt-black flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'white', boxShadow: '3px 3px 0px #2B2B2B' }}
          aria-hidden="true"
        >
          {meta?.icon && <meta.icon size={40} />}
        </div>
        <div>
          <p
            className="text-label font-bold uppercase tracking-wide mb-0.5"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            Recommended Framework
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h3)',
              color:      'var(--pt-black)',
              lineHeight: 1.2,
            }}
          >
            {meta?.name ?? framework.frameworkId}
          </h3>
          <p
            className="text-sm mt-1 italic"
            style={{
              fontFamily: 'var(--font-body)',
              color:      meta?.accentColor ?? '#6B6B6B',
              fontWeight: 600,
            }}
          >
            &ldquo;{meta?.tagline ?? ''}&rdquo;
          </p>
          <PersonalizationBadge preferredStyle={PTStorage.getPersona()?.preferredStyle} />
        </div>
      </div>

      {/* Score */}
      <div className="mb-4">
        <ScoreBar
          score={framework.recommendationScore}
          variant="bar"
          color={meta?.accentColor}
          size="lg"
          showLabel={true}
        />
      </div>

      {/* Why this framework */}
      <div
        className="p-4 rounded-sketch border border-pt-black/20 mb-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
      >
        <p
          className="text-label font-bold mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
        >
          🧠 Kenapa ini cocok untukmu?
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          {framework.recommendationReason}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={route}
        className={cn(
          'inline-flex items-center gap-2',
          'px-5 py-2.5 rounded-sketch border-2 border-pt-black',
          'text-sm font-bold',
          'transition-all duration-150',
          'hover:-translate-x-px hover:-translate-y-px',
          'focus-visible:outline-2 focus-visible:outline-pt-blue',
        )}
        style={{
          fontFamily:      'var(--font-body)',
          backgroundColor: meta?.accentColor ?? 'var(--pt-yellow)',
          color:           'var(--pt-black)',
          boxShadow:       '3px 3px 0px #2B2B2B',
        }}
      >
        Buka {meta?.shortName ?? 'Framework'} →
      </Link>
    </motion.div>
  );
}

function PersonalizationBadge({ preferredStyle }: { preferredStyle?: string }) {
  if (!preferredStyle) return null;
  
  const text = preferredStyle === 'structured' 
    ? 'Matches your structured working style' 
    : 'Matches your flexible execution style';
    
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/50 border border-pt-black/10 text-[10px] font-bold text-pt-brown uppercase tracking-wider">
      ✨ {text}
    </div>
  );
}
