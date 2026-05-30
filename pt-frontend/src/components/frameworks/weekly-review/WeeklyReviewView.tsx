'use client';

import { useMemo }             from 'react';
import { motion }              from 'framer-motion';
import { ReviewSection }       from './ReviewSection';
import { ReflectionNotes }     from './ReflectionNotes';
import { FrameworkEmptyState } from '@/components/frameworks/FrameworkPageLayout';
import { HandDrawnDivider }    from '@/components/pt/HandDrawnDivider';
import { useFramework }        from '@/store/usePTStore';
import type { Task }           from '@/types/pt.types';

/* ============================================
   WeeklyReviewView — Weekly Review framework
   
   Layout:
   1. Context card (ini untuk review minggu ini)
   2. Wins this week
   3. Lessons learned
   4. Next week focus
   5. Personal reflection notes (editable)
   6. Closing affirmation
   ============================================ */

interface WeeklyReviewRawData {
  winsThisWeek?:   string[];
  lessonsLearned?: string[];
  nextWeekFocus?:  (string | Task)[];
}

export function WeeklyReviewView() {
  const fwData = useFramework('weekly-review');

  const rawData = useMemo((): WeeklyReviewRawData => {
    if (!fwData?.rawData) return {};
    return fwData.rawData as WeeklyReviewRawData;
  }, [fwData]);

  const hasContent =
    (rawData.winsThisWeek?.length ?? 0) > 0 ||
    (rawData.lessonsLearned?.length ?? 0) > 0 ||
    (rawData.nextWeekFocus?.length ?? 0) > 0;

  if (!fwData || !hasContent) {
    return <FrameworkEmptyState frameworkId="weekly-review" />;
  }

  // Get week range string
  const now       = new Date();
  const dayOfWeek = now.getDay();                             // 0=Sun
  const monday    = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday    = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const weekRange = `${fmt(monday)} – ${fmt(sunday)}`;

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Context card — week identification */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-4 p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: '#FAF0EC', boxShadow: '3px 3px 0px #2B2B2B' }}
      >
        <div
          className="w-14 h-14 rounded-sketch border-2 border-pt-black flex flex-col items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--pt-brown)' }}
        >
          <span className="text-xl" aria-hidden="true">📅</span>
        </div>
        <div>
          <p
            className="text-label font-bold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            Weekly Review
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h4)',
              color:      'var(--pt-black)',
            }}
          >
            {weekRange}
          </p>
          <p
            className="text-sm mt-0.5"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            Berdasarkan cerita yang kamu sampaikan ke Moti
          </p>
        </div>
      </motion.div>

      {/* Intro note */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-sketch border-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-blue)' + '12' }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}
        >
          📖 <strong>Weekly Review</strong> adalah ritual mingguan untuk menutup minggu
          yang lalu dan membuka minggu baru dengan clarity. Baca bagian ini perlahan —
          ini bukan checklist, ini refleksi.
        </p>
      </motion.div>

      {/* 1. Wins */}
      <motion.div variants={itemVariants}>
        <ReviewSection
          title="Yang Berhasil Minggu Ini"
          icon="🏆"
          items={rawData.winsThisWeek ?? []}
          accentColor="var(--pt-green)"
          bgColor="var(--pt-lime)"
          emptyText="Small wins will appear here after generation."
          itemStyle="win"
          defaultOpen={true}
        />
      </motion.div>

      {/* 2. Lessons */}
      <motion.div variants={itemVariants}>
        <ReviewSection
          title="Yang Bisa Dipelajari"
          icon="💡"
          items={rawData.lessonsLearned ?? []}
          accentColor="var(--pt-mustard)"
          bgColor="var(--pt-yellowP)"
          emptyText="Lessons will appear here after generation."
          itemStyle="lesson"
          defaultOpen={true}
        />
      </motion.div>

      {/* Divider */}
      <HandDrawnDivider
        variant="scribble"
        label="MINGGU DEPAN"
        color="var(--pt-black)"
        className="opacity-30"
      />

      {/* 3. Next Week Focus */}
      <motion.div variants={itemVariants}>
        <ReviewSection
          title="Fokus Minggu Depan"
          icon="🎯"
          items={rawData.nextWeekFocus ?? []}
          accentColor="var(--pt-blue)"
          bgColor="var(--pt-cyan)"
          emptyText="Next focus items will appear here after generation."
          itemStyle="focus"
          defaultOpen={true}
        />
      </motion.div>

      {/* 4. Stats quick summary */}
      <motion.div variants={itemVariants}>
        <WeekStatsBar
          wins={rawData.winsThisWeek?.length ?? 0}
          lessons={rawData.lessonsLearned?.length ?? 0}
          focus={rawData.nextWeekFocus?.length ?? 0}
        />
      </motion.div>

      <HandDrawnDivider
        variant="dots"
        color="var(--pt-black)"
        className="opacity-20"
      />

      {/* 5. Reflection notes — editable */}
      <motion.div variants={itemVariants}>
        <ReflectionNotes />
      </motion.div>

      {/* 6. Closing affirmation */}
      <motion.div
        variants={itemVariants}
        className="text-center py-4"
      >
        <p
          className="text-base italic"
          style={{ fontFamily: 'var(--font-display)', color: '#6B6B6B' }}
        >
          &ldquo;Done is better than perfect. Progress beats perfection every time.&rdquo;
        </p>
        <p
          className="text-xs mt-2"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          Lihat minggu ini bukan sebagai yang kurang, tapi sebagai fondasi minggu depan.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ---- Week Stats Bar ---- */
function WeekStatsBar({
  wins, lessons, focus,
}: {
  wins: number; lessons: number; focus: number;
}) {
  const items = [
    { label: 'Wins',        count: wins,    icon: '🏆', color: 'var(--pt-green)'   },
    { label: 'Pelajaran',   count: lessons, icon: '💡', color: 'var(--pt-mustard)' },
    { label: 'Fokus Depan', count: focus,   icon: '🎯', color: 'var(--pt-blue)'    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-3 rounded-sketch border-2 border-pt-black p-4"
      style={{ backgroundColor: '#FAF0EC' }}
    >
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p className="text-xl mb-0.5" aria-hidden="true">{item.icon}</p>
          <p
            className="text-h3"
            style={{ fontFamily: 'var(--font-display)', color: item.color }}
          >
            {item.count}
          </p>
          <p
            className="text-[10px]"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
