'use client';

import { useEffect } from 'react';
import { usePTStore } from '@/store/usePTStore';

/**
 * StoreInitializer — Komponen invisible yang
 * mengisi store dari localStorage saat app pertama load.
 *
 * Pasang di layout.tsx agar berjalan di semua halaman.
 */
export function StoreInitializer() {
  const loadFromStorage = usePTStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return null;
}
