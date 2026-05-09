'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PTCard } from './PTCard';
import { PTButton } from './PTButton';
import { MotiMascot } from './icons';
import PTStorage from '@/lib/storage';

/**
 * StorageFullModal — Muncul saat localStorage penuh (QuotaExceededError).
 * Memberikan opsi untuk menghapus session lama.
 */
export function StorageFullModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);

  useEffect(() => {
    const handleStorageFull = () => {
      setIsOpen(true);
    };

    window.addEventListener('pt_storage_full', handleStorageFull);
    return () => window.removeEventListener('pt_storage_full', handleStorageFull);
  }, []);

  const handleClear = () => {
    const count = PTStorage.clearOldSessions();
    setClearedCount(count);
    if (count > 0) {
      setTimeout(() => {
        setIsOpen(false);
        setClearedCount(0);
      }, 2000);
    } else {
      // Jika tidak ada yang bisa dihapus (misal cuma ada 1 session)
      setIsOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pt-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            <PTCard variant="white" accentColor="var(--pt-coral)" padding="lg">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-sketch border-2 border-pt-black bg-pt-cream flex items-center justify-center">
                  <MotiMascot size={48} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl text-pt-black">
                    {clearedCount > 0 ? 'Storage Melega! ✨' : 'Storage Hampir Penuh! 📦'}
                  </h3>
                  <p className="text-body text-pt-brown" style={{ fontFamily: 'var(--font-body)' }}>
                    {clearedCount > 0 
                      ? `${clearedCount} session lama telah dihapus. Kamu bisa lanjut sekarang.`
                      : 'Promptivity menyimpan mission kamu di browser, tapi sepertinya sudah mencapai batas. Hapus beberapa session lama?'}
                  </p>
                </div>

                {clearedCount === 0 && (
                  <div className="flex flex-col w-full gap-2 mt-4">
                    <PTButton variant="primary" onClick={handleClear} className="w-full">
                      🗑️ Hapus 5 Session Terlama
                    </PTButton>
                    <PTButton variant="outline" onClick={() => setIsOpen(false)} className="w-full">
                      Batal
                    </PTButton>
                  </div>
                )}

                {clearedCount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-pt-green font-bold text-sm mt-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    ✅ Berhasil membersihkan storage.
                  </motion.div>
                )}
              </div>
            </PTCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
