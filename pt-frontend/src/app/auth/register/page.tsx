'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePTStore } from '@/store/usePTStore';
import { PTButton } from '@/components/pt/PTButton';
import { PTInput } from '@/components/pt/PTInput';
import { PTLogo } from '@/components/pt/icons';

export default function RegisterPage() {
  const router = useRouter();
  const register = usePTStore((s) => s.register);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) {
      setError('Password minimal 6 karakter ya.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const res = await register(name, email, password);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Pendaftaran gagal. Email mungkin sudah terdaftar.');
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
          <h1 className="text-h2 font-display">Daftar Akun</h1>
          <p className="text-sm text-pt-brown mt-1">Simpan setiap mission & history missionmu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PTInput
            label="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Siapa namamu?"
            required
          />
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
            placeholder="Minimal 6 karakter"
            required
          />

          {error && (
            <div className="p-3 bg-red-50 border-2 border-pt-coral text-pt-coral text-xs font-bold rounded-sketch">
              ⚠️ {error}
            </div>
          )}

          <PTButton variant="primary" className="w-full" isLoading={isLoading} type="submit">
            Buat Akun 🎨
          </PTButton>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-pt-black/10 text-center space-y-3">
          <p className="text-xs text-pt-brown">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="font-bold underline text-pt-blue">
              Login saja
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
