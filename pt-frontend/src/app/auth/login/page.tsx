'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePTStore } from '@/store/usePTStore';
import { PTButton } from '@/components/pt/PTButton';
import { PTInput } from '@/components/pt/PTInput';
import { PTLogo } from '@/components/pt/icons';

export default function LoginPage() {
  const router = useRouter();
  const login = usePTStore((s) => s.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    
    const res = await login(email, password);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Login gagal. Cek email/password kamu.');
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-pt-cream p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border-2 border-pt-black p-8 rounded-sketch shadow-sketch"
      >
        <div className="flex flex-col items-center mb-8">
          <PTLogo size={48} className="mb-4" />
          <h1 className="text-h2 font-display">Selamat Datang!</h1>
          <p className="text-sm text-pt-brown mt-1">Login untuk simpan progres missionmu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PTInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            required
          />
          <PTInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="p-3 bg-red-50 border-2 border-pt-coral text-pt-coral text-xs font-bold rounded-sketch">
              ⚠️ {error}
            </div>
          )}

          <PTButton variant="primary" className="w-full" isLoading={isLoading} type="submit">
            Login 🚀
          </PTButton>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-pt-black/10 text-center space-y-3">
          <p className="text-xs text-pt-brown">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="font-bold underline text-pt-blue">
              Daftar di sini
            </Link>
          </p>
          <p className="text-xs">
            <Link href="/" className="text-gray-400 hover:text-pt-black transition-colors">
              ← Kembali ke Beranda
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
