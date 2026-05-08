'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePTStore } from '@/store/usePTStore';

export function DemoBadge() {
  const isAuthenticated = usePTStore((s) => s.isAuthenticated);

  if (isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-20 right-4 z-50 pointer-events-auto"
    >
      <Link href="/auth/login" className="block group">
        <div className="bg-pt-yellow border-2 border-pt-black p-3 rounded-sketch shadow-sketch-sm hover:shadow-sketch transition-all rotate-3 group-hover:rotate-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-pt-black leading-tight">
                Mode Demo
              </p>
              <p className="text-[9px] font-body text-pt-brown leading-tight">
                Login untuk simpan sesi
              </p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] font-bold bg-pt-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
              Login →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
