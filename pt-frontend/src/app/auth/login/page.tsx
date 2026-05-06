'use client';

import { useRouter } from 'next/navigation';
import { PTButton } from '@/components/pt/PTButton';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <div className="text-center max-w-sm w-full">
        <div
          className="text-5xl mb-4 p-6 rounded-sketch border-2 border-pt-black inline-block"
          style={{ backgroundColor: 'var(--pt-yellow)' }}
        >
          🔐
        </div>
        <h1
          className="mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            color: 'var(--pt-black)',
          }}
        >
          Login
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
        >
          Auth implementation coming Day 18.
          <br />
          Untuk sekarang, gunakan Skip Login.
        </p>
        <div className="flex flex-col gap-3">
          <PTButton
            variant="primary"
            size="lg"
            onClick={() => router.push('/onboarding')}
            className="w-full"
          >
            🚀 Skip Login — Mulai Sekarang
          </PTButton>
          <PTButton
            variant="ghost"
            size="md"
            onClick={() => router.back()}
            className="w-full"
          >
            ← Kembali
          </PTButton>
        </div>
      </div>
    </main>
  );
}
