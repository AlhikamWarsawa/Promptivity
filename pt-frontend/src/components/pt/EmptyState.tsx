'use client';

import { motion } from 'framer-motion';
import { MotiMascot } from './icons';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  icon?: string | React.ReactNode;
  className?: string;
}

/**
 * EmptyState — Tampilan saat list (task, journal, dll) kosong.
 */
export function EmptyState({ 
  message, 
  subMessage, 
  icon = '✨', 
  className = '' 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center rounded-sketch border-2 border-pt-black/10 bg-pt-cream/30 ${className}`}
    >
      <div className="w-16 h-16 rounded-sketch border-2 border-pt-black/20 bg-white flex items-center justify-center text-3xl mb-4">
        {typeof icon === 'string' ? (
          <span role="img" aria-label="empty state icon">{icon}</span>
        ) : (
          icon
        )}
      </div>

      <h3 
        className="font-display text-xl text-pt-black"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {message}
      </h3>
      
      {subMessage && (
        <p 
          className="mt-2 text-sm text-pt-brown max-w-xs mx-auto"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {subMessage}
        </p>
      )}
    </motion.div>
  );
}
