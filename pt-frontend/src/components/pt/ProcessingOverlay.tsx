'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================
   ProcessingOverlay — Full-screen loading overlay
   saat AI sedang memproses cerita user.
   
   Features:
   - Progress messages berubah tiap 2 detik
   - Progress bar animasi
   - Bisa dikonfigurasi dengan custom messages
   - Tidak bisa di-dismiss oleh user (intentional)
   
   Props:
   - isVisible:  tampilkan/sembunyikan overlay
   - messages:   array of { text, icon, durationMs }
   - onComplete: callback setelah semua messages selesai
   ============================================ */

export interface ProcessingMessage {
  text:       string;
  icon:       string;
  durationMs: number;   // Berapa lama message ini tampil
}

export const PT_PROCESSING_MESSAGES: ProcessingMessage[] = [
  { text: 'Reading your story...',              icon: '📖', durationMs: 2000 },
  { text: 'Identifying your priorities...',     icon: '🎯', durationMs: 2000 },
  { text: 'Building your mission...',           icon: '🏗️', durationMs: 2500 },
  { text: 'Selecting the best frameworks...',   icon: '✨', durationMs: 2000 },
  { text: 'Crafting your task breakdown...',    icon: '📋', durationMs: 2000 },
  { text: 'Almost there...',                    icon: '⚡', durationMs: 1500 },
];

interface ProcessingOverlayProps {
  isVisible:   boolean;
  messages?:   ProcessingMessage[];
  onComplete?: () => void;
}

export function ProcessingOverlay({
  isVisible,
  messages = PT_PROCESSING_MESSAGES,
  onComplete,
}: ProcessingOverlayProps) {
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDone, setIsDone]                 = useState(false);

  // Reset saat overlay ditampilkan ulang
  useEffect(() => {
    if (isVisible) {
      setCurrentIndex(0);
      setOverallProgress(0);
      setIsDone(false);
    }
  }, [isVisible]);

  // Cycle through messages
  useEffect(() => {
    if (!isVisible || isDone) return;

    const msg = messages[currentIndex];
    if (!msg) return;

    // Update progress
    const progressPerStep = 100 / messages.length;
    const targetProgress  = (currentIndex + 1) * progressPerStep;

    const progressTimer = setTimeout(() => {
      setOverallProgress(targetProgress);
    }, 100);

    // Advance ke message berikutnya
    const advanceTimer = setTimeout(() => {
      if (currentIndex < messages.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        // Semua messages selesai
        setOverallProgress(100);
        setIsDone(true);
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }
    }, msg.durationMs);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(advanceTimer);
    };
  }, [isVisible, currentIndex, isDone, messages, onComplete]);

  const currentMessage = messages[currentIndex] ?? messages[messages.length - 1];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(43, 43, 43, 0.85)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Processing your story"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1,    y: 0  }}
            exit={{ scale: 0.9,    y: 10  }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className="w-full max-w-md rounded-sketch border-2 border-pt-black p-8 flex flex-col items-center gap-6"
            style={{ backgroundColor: 'var(--pt-white)', boxShadow: '8px 8px 0px #000000' }}
          >
            {/* Spinning mascot / icon */}
            <div className="relative">
              <AnimatingStar />
            </div>

            {/* Current message */}
            <div className="text-center space-y-2 min-h-[80px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{ opacity: 0,   y: -12, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-4xl" role="img" aria-label={currentMessage.icon}>
                    {currentMessage.icon}
                  </span>
                  <p
                    className="text-h4 text-center"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--pt-black)',
                    }}
                  >
                    {currentMessage.text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Overall progress bar */}
            <div className="w-full space-y-2">
              <div
                className="w-full h-3 rounded-sketch border-2 border-pt-black overflow-hidden"
                style={{ backgroundColor: 'var(--pt-cream)' }}
              >
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: 'var(--pt-yellow)' }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Step indicators */}
              <div className="flex justify-between">
                {messages.map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full border border-pt-black"
                    animate={{
                      backgroundColor:
                        i < currentIndex
                          ? 'var(--pt-green)'
                          : i === currentIndex
                          ? 'var(--pt-yellow)'
                          : 'var(--pt-cream)',
                      scale: i === currentIndex ? 1.3 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p
              className="text-sm text-center"
              style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
            >
              Biasanya butuh 10–20 detik. Jangan tutup halaman ini.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Animating star / mascot ---- */
function AnimatingStar() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      className="relative w-20 h-20"
    >
      {/* Outer ring */}
      <svg
        width="80" height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <circle
          cx="40" cy="40" r="36"
          stroke="#2B2B2B"
          strokeWidth="2"
          strokeDasharray="8 6"
          fill="none"
        />
      </svg>
      {/* Center icon — does NOT rotate (counter-rotate) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div
          className="w-12 h-12 rounded-sketch border-2 border-pt-black flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--pt-yellow)' }}
        >
          🧠
        </div>
      </motion.div>
    </motion.div>
  );
}
