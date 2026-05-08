'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { PTStorage }                                 from '@/lib/storage';

/* ============================================
   ReflectionNotes — Editable personal notes
   untuk Weekly Review.
   
   Auto-save ke localStorage dengan debounce.
   Terasa seperti jurnal — font display, warm bg.
   ============================================ */

const AUTO_SAVE_DELAY = 1000;
const PLACEHOLDER = `Tambahkan refleksi pribadimu di sini...

Contoh:
- Hal yang paling aku syukuri minggu ini adalah...
- Satu hal yang ingin aku lakukan berbeda minggu depan...
- Kata-kata yang ingin aku ingat...`;

export function ReflectionNotes() {
  const [notes, setNotes]       = useState('');
  const [isSaved, setIsSaved]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    setMounted(true);
    const saved = PTStorage.getWeeklyReflection?.() ?? '';
    setNotes(saved);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNotes(val);
      setIsSaved(false);

      // Auto-resize
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;

      // Debounced save
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        PTStorage.saveWeeklyReflection?.(val);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }, AUTO_SAVE_DELAY);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="rounded-sketch border-2 border-pt-black overflow-hidden"
      style={{ boxShadow: '3px 3px 0px #2B2B2B' }}
    >
      {/* Header bar — journal style */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b-2 border-pt-black"
        style={{ backgroundColor: 'var(--pt-cream)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">📝</span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-h4)',
              color:      'var(--pt-black)',
            }}
          >
            Refleksi Pribadimu
          </h3>
        </div>

        {/* Save indicator */}
        <AnimatePresence>
          {isSaved && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-green)' }}
            >
              ✓ Tersimpan
            </motion.span>
          )}
          {!isSaved && notes.length > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px]"
              style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
            >
              💾 auto-save
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Textarea — journal style */}
      <div style={{ backgroundColor: 'var(--pt-yellowP)' + '30' }}>
        {/* Ruled lines decoration */}
        <div className="relative px-5 py-4">
          {/* Horizontal guide lines (decorative) */}
          <div
            className="absolute inset-x-0 inset-y-0 pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(43,43,43,0.07) 27px, rgba(43,43,43,0.07) 28px)',
              backgroundPositionY: '8px',
            }}
          />
          {/* Red margin line */}
          <div
            className="absolute top-0 bottom-0 left-12 w-px pointer-events-none"
            style={{ backgroundColor: 'var(--pt-coral)', opacity: 0.3 }}
            aria-hidden="true"
          />

          <textarea
            value={notes}
            onChange={handleChange}
            placeholder={PLACEHOLDER}
            className="relative w-full bg-transparent resize-none focus:outline-none"
            style={{
              fontFamily:  'var(--font-body)',
              fontSize:    '0.9375rem',
              lineHeight:  '1.9',
              color:       'var(--pt-black)',
              minHeight:   '180px',
              paddingLeft: '28px',  // indent past margin line
              overflow:    'hidden',
            }}
            aria-label="Refleksi pribadi mingguan"
          />
        </div>
      </div>

      {/* Footer hint */}
      <div
        className="px-5 py-2 border-t border-pt-black/10"
        style={{ backgroundColor: 'var(--pt-white)' }}
      >
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-body)', color: '#9B9B9B' }}
        >
          Catatan ini hanya tersimpan di browser kamu. Tidak dikirim ke server.
        </p>
      </div>
    </div>
  );
}
