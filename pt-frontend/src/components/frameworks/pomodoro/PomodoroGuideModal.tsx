'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

interface PomodoroGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PomodoroGuideModal({ isOpen, onClose }: PomodoroGuideModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-pt-black/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[400px] bg-pt-white border-4 border-pt-black rounded-[2rem] shadow-[8px_8px_0px_#2B2B2B] pointer-events-auto overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b-4 border-pt-black bg-pt-coral/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pt-coral border-2 border-pt-black flex items-center justify-center shadow-[2px_2px_0px_#2B2B2B]">
                    <BookOpen size={20} className="text-pt-white" />
                  </div>
                  <h2 className="text-xl font-bold font-display text-pt-black">Pomodoro Technique 🍅</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full border-2 border-pt-black flex items-center justify-center hover:bg-pt-cream transition-colors shadow-[2px_2px_0px_#2B2B2B] active:translate-y-[2px] active:shadow-none"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Steps */}
                <div className="space-y-5">
                  {[
                    { step: 1, text: "Pick 1 task you want to focus on." },
                    { step: 2, text: "Work for 25 minutes with full focus." },
                    { step: 3, text: "Take a 5 minute break." },
                    { step: 4, text: "Repeat 4 sessions, then take a longer break (15-30 min)." }
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-pt-black bg-pt-yellow flex items-center justify-center font-bold font-display shadow-[2px_2px_0px_#2B2B2B]">
                        {item.step}
                      </div>
                      <p className="text-sm font-semibold leading-relaxed pt-1 text-pt-black/80">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-pt-black/20 pt-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-pt-coral">💡</span> Tips:
                  </h3>
                  <ul className="space-y-3">
                    {['avoid multitasking', 'mute notifications', 'focus on one small task at a time'].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-pt-black/70 italic font-medium">
                        <CheckCircle size={18} className="mt-0.5 text-pt-green shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-pt-cyan/10 border-2 border-pt-black/10">
                  <h3 className="font-bold text-sm mb-3 text-pt-black/90">Why use this?</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { icon: '🚀', text: 'reduce procrastination' },
                      { icon: '🧠', text: 'improve focus stamina' },
                      { icon: '✅', text: 'make large tasks less overwhelming' }
                    ].map((why, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-pt-black/60">
                        <span className="text-sm">{why.icon}</span>
                        {why.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-pt-cream/30 border-t-2 border-pt-black/10">
                <button
                  onClick={onClose}
                  className="w-full min-h-[48px] py-3 rounded-2xl border-2 border-pt-black bg-pt-coral text-pt-white font-bold shadow-[4px_4px_0px_#2B2B2B] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#2B2B2B] active:translate-y-[2px] active:shadow-none transition-all text-base"
                >
                  Got it, let's focus!
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
