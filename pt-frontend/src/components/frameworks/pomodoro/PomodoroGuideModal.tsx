'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, CheckCircle2, Lightbulb, Info } from 'lucide-react';
import { PTButton } from '@/components/pt/PTButton';

interface PomodoroGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PomodoroGuideModal({ isOpen, onClose }: PomodoroGuideModalProps) {
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
            className="fixed inset-0 z-50 bg-pt-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-pt-white border-4 border-pt-black rounded-[2rem] shadow-[8px_8px_0px_#2B2B2B] pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-pt-black bg-pt-coral/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pt-coral rounded-sketch border-2 border-pt-black">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display text-h4">Pomodoro Technique 🍅</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-pt-black/5 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Steps */}
                <div className="space-y-4">
                  {[
                    { step: 1, text: 'Pick 1 task you want to focus on.' },
                    { step: 2, text: 'Work for 25 minutes with full focus.' },
                    { step: 3, text: 'Take a 5 minute break.' },
                    { step: 4, text: 'Repeat 4 sessions, then take a longer break (15-30 min).' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-pt-black bg-pt-yellow flex items-center justify-center font-display font-bold text-sm">
                        {item.step}
                      </div>
                      <p className="text-sm font-medium leading-relaxed pt-1">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div className="p-4 rounded-sketch border-2 border-pt-black bg-pt-cyan/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-pt-cyan" />
                    <span className="font-bold text-xs uppercase tracking-wider">Expert Tips</span>
                  </div>
                  <ul className="space-y-2">
                    {['Avoid multitasking', 'Mute notifications', 'Focus on one small task at a time'].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-pt-cyan mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Why Use This */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-400">Why use this?</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Reduce procrastination',
                      'Improve focus stamina',
                      'Make large tasks less overwhelming'
                    ].map((reason, i) => (
                      <div key={i} className="px-3 py-2 rounded-sketch border-2 border-pt-black/10 bg-pt-cream/50 text-xs font-medium">
                        • {reason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t-2 border-pt-black bg-pt-cream/30">
                <PTButton variant="primary" className="w-full" onClick={onClose}>
                  Got it, let's focus!
                </PTButton>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
