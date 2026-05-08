'use client';

import { useState, useEffect } from 'react';
import Link             from 'next/link';
import { useRouter }    from 'next/navigation';
import { motion }       from 'framer-motion';
import { PTButton }     from '@/components/pt/PTButton';
import { usePTStore }   from '@/store/usePTStore';
import PTStorage         from '@/lib/storage';
import { PTLogo }     from './icons';

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

export function DashboardNav({ userName: propName }: DashboardNavProps) {
  const router       = useRouter();
  const clearSession = usePTStore((s) => s.clearSession);
  const resetConfusedMessages = usePTStore((s) => s.resetConfusedMessages);

  // Fetch name from storage if not provided as prop
  const [userName, setUserName] = useState<string | undefined>(propName);

  useEffect(() => {
    if (!userName) {
      const persona = PTStorage.getPersona();
      if (persona?.name) setUserName(persona.name);
    }
  }, [userName]);

  function handleNewStory() {
    clearSession();
    resetConfusedMessages();
    router.push('/onboarding/input-method');
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
        <PTLogo size={32} />
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
