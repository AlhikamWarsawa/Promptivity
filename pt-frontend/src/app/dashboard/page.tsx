'use client';

import { useEffect }    from 'react';
import { useRouter }    from 'next/navigation';
import { motion }       from 'framer-motion';
import { usePTStore }   from '@/store/usePTStore';
import { PTButton }     from '@/components/pt/PTButton';

export default function DashboardPage() {
  const router  = useRouter();
  const session = usePTStore((s) => s.session);

  // Load dari storage kalau belum ada di store
  const loadFromStorage = usePTStore((s) => s.loadFromStorage);
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Redirect ke welcome kalau tidak ada session
  useEffect(() => {
    if (session === null && usePTStore.getState().loadedFromStorage) {
      router.push('/');
    }
  }, [session, router]);

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--pt-white)' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
          Loading your mission...
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* M1 Success Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-sketch border-2 border-pt-black p-6 mb-8"
          style={{ backgroundColor: 'var(--pt-green)', boxShadow: '4px 4px 0px #2B2B2B' }}
        >
          <h1
            className="text-white mb-1"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)' }}
          >
            ✅ Milestone M1 Selesai!
          </h1>
          <p className="text-white/90" style={{ fontFamily: 'var(--font-body)' }}>
            Stack berjalan end-to-end: Cerita → Gemini → Parser → Store → localStorage → Dashboard
          </p>
        </motion.div>

        {/* Session info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InfoCard
            title="Top Recommendation"
            value={session.topRecommendation.toUpperCase()}
            accent="var(--pt-blue)"
          />
          <InfoCard
            title="Total Tasks"
            value={`${session.masterTaskList.length} tasks`}
            accent="var(--pt-coral)"
          />
          <InfoCard
            title="Frameworks Built"
            value={`${session.frameworks.length}/13`}
            accent="var(--pt-green)"
          />
          <InfoCard
            title="Today's Actions"
            value={`${session.todayPlan.length} actions`}
            accent="var(--pt-mustard)"
          />
        </div>

        {/* Top recommendation reason */}
        <div
          className="rounded-sketch border-2 border-pt-black p-5 mb-6"
          style={{ backgroundColor: 'var(--pt-cream)' }}
        >
          <p
            className="text-label font-bold mb-2"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            WHY {session.topRecommendation.toUpperCase()}?
          </p>
          <p style={{ fontFamily: 'var(--font-body)', color: '#4B4B4B' }}>
            {session.topRecommendationReason}
          </p>
        </div>

        {/* Today's plan */}
        <div
          className="rounded-sketch border-2 border-pt-black p-5 mb-6"
          style={{ backgroundColor: 'var(--pt-yellowP)' }}
        >
          <p
            className="text-label font-bold mb-3"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
          >
            🎯 RENCANA HARI INI
          </p>
          <ul className="space-y-2">
            {session.todayPlan.map((action, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
              >
                <span style={{ color: 'var(--pt-brown)' }}>→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Session ID (dev info) */}
        <p
          className="text-xs text-center mt-4"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          Session ID: {session.sessionId} · Processed: {new Date(session.processedAt).toLocaleString()}
        </p>

        {/* Dev actions */}
        <div className="flex gap-3 mt-6 justify-center">
          <PTButton
            variant="outline"
            size="sm"
            onClick={() => router.push('/onboarding/brain-dump')}
          >
            ← Cerita Baru
          </PTButton>
          <PTButton
            variant="ghost"
            size="sm"
            onClick={() => {
              usePTStore.getState().clearSession();
              router.push('/');
            }}
          >
            🗑️ Clear Session
          </PTButton>
        </div>

        {/* Coming soon note */}
        <div
          className="mt-10 rounded-sketch border-2 border-pt-black p-4 text-center"
          style={{ backgroundColor: 'var(--pt-cream)' }}
        >
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            🚧 Dashboard penuh dengan 13 framework pages dibangun di Day 8–14.
            <br />Data session sudah tersimpan dan siap dipakai.
          </p>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title, value, accent,
}: {
  title:  string;
  value:  string;
  accent: string;
}) {
  return (
    <div
      className="rounded-sketch border-2 border-pt-black p-4"
      style={{ backgroundColor: 'var(--pt-white)', borderTop: `4px solid ${accent}` }}
    >
      <p
        className="text-label font-bold mb-1"
        style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
      >
        {title}
      </p>
      <p
        className="text-h3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
      >
        {value}
      </p>
    </div>
  );
}
