'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MotiMascot, PTLogo } from '@/components/pt/icons';
import { PTButton } from '@/components/pt/PTButton';

export default function NotFound() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: 'var(--pt-white)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full space-y-8"
      >
        {/* Playful Confused Mascot */}
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-sketch border-[3px] border-pt-black bg-pt-cream flex items-center justify-center relative overflow-hidden">
             <motion.div
               animate={{ 
                 rotate: [0, 10, -10, 0],
                 y: [0, -5, 0]
               }}
               transition={{ repeat: Infinity, duration: 4 }}
             >
               <MotiMascot size={80} />
             </motion.div>
          </div>
          
          {/* Confused Question Marks */}
          <motion.span 
            animate={{ opacity: [0, 1, 0], y: [-10, -30] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            className="absolute -top-4 -right-2 text-4xl"
          >
            ❓
          </motion.span>
          <motion.span 
            animate={{ opacity: [0, 1, 0], y: [-5, -25] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
            className="absolute -top-2 -left-4 text-3xl"
          >
            🤔
          </motion.span>
        </div>

        <div className="space-y-4">
          <h1 
            className="text-display text-4xl sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--pt-black)' }}
          >
            Halaman ini <span className="text-pt-coral italic">hilang</span>.
          </h1>
          <p 
            className="text-lg text-pt-brown"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Oops! Moti sudah cari ke mana-mana tapi nggak ketemu. <br className="hidden sm:block" />
            Mungkin linknya salah atau halamannya sudah dihapus.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/">
            <PTButton variant="primary" size="lg" className="w-full sm:w-auto">
              🏠 Balik ke Home
            </PTButton>
          </Link>
          <Link href="/dashboard">
            <PTButton variant="outline" size="lg" className="w-full sm:w-auto">
              📊 Ke Dashboard
            </PTButton>
          </Link>
        </div>

        {/* Brand footer */}
        <div className="pt-8 flex items-center justify-center gap-2 opacity-30 grayscale">
          <PTLogo size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Promptivity</span>
        </div>
      </motion.div>
    </div>
  );
}
