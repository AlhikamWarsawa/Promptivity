'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePTStore } from '@/store/usePTStore';

/**
 * AuthGuard — Melindungi route yang butuh login.
 * Menunggu isAuthHydrated sebelum melakukan redirect.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = usePTStore((s) => s.isAuthenticated);
  const isAuthHydrated = usePTStore((s) => s.isAuthHydrated);

  useEffect(() => {
    // Tunggu sampai store selesai load dari localStorage
    if (!isAuthHydrated) return;

    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isPublicRoute = pathname === '/' || isAuthRoute;

    // Jika sudah login dan di halaman public/auth, pindah ke dashboard
    if (isAuthenticated && (isAuthRoute || pathname === '/')) {
      router.replace('/dashboard');
    }

    // Jika belum login dan di halaman yang butuh auth, pindah ke login (opsional, karena ada demo mode)
    // Untuk Promptivity, kita izinkan demo mode di dashboard, tapi mungkin ada halaman yang strictly private nanti.
  }, [isAuthenticated, isAuthHydrated, pathname, router]);

  // Jika belum hydrated, tampilkan null atau loading (untuk mencegah flash of unauthenticated content)
  if (!isAuthHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pt-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-pt-black border-t-pt-blue animate-spin" />
          <p className="font-display text-pt-brown">Loading your mission...</p>
        </div>
      </div>
    );
  }

  // Jika sudah login tapi di halaman public/auth, jangan render apa-apa (sedang redirect)
  const isAuthRoute = pathname.startsWith('/auth');
  if (isAuthenticated && (isAuthRoute || pathname === '/')) {
    return null;
  }

  return <>{children}</>;
}
