'use client';

import Link             from 'next/link';
import { useRouter }    from 'next/navigation';
import { motion }       from 'framer-motion';
import { PTButton }     from '@/components/pt/PTButton';
import { usePTStore }   from '@/store/usePTStore';

/* ============================================
   DashboardNav — Top navigation for dashboard
   
   Contains:
   - Promptivity logo (link ke home)
   - User greeting
   - "New Story" button (clear session, back to brain dump)
   ============================================ */

interface DashboardNavProps {
  userName?: string;
}

export function DashboardNav({ userName }: DashboardNavProps) {
  const router       = useRouter();
  const clearSession = usePTStore((s) => s.clearSession);

  function handleNewStory() {
    clearSession();
    router.push('/onboarding/brain-dump');
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full px-6 py-4 flex items-center justify-between"
      style={{
        borderBottom:    '2px solid var(--pt-black)',
        backgroundColor: 'var(--pt-white)',
        position:        'sticky',
        top:             0,
        zIndex:          30,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div
          className="w-8 h-8 rounded-sketch border-2 border-pt-black flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: 'var(--pt-yellow)', fontFamily: 'var(--font-display)' }}
        >
          P
        </div>
        <span
          className="font-bold text-lg hidden sm:inline"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
        >
          Promptivity
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {userName && userName !== 'Friend' && (
          <span
            className="hidden sm:inline text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            Hei, {userName}! 👋
          </span>
        )}
        <PTButton
          variant="outline"
          size="sm"
          onClick={handleNewStory}
        >
          ✍️ Cerita Baru
        </PTButton>
      </div>
    </motion.nav>
  );
}
