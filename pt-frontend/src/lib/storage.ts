/* ============================================
   PT Storage — localStorage abstraction
   Versi awal (Day 3). Akan dikembangkan Day 7.
   ============================================ */

import type { PTSession, Personalization } from '@/types/pt.types';

const KEYS = {
  SESSION:      'pt_session',
  PERSONA:      'pt_persona',
  SKIP_LOGIN:   'pt_skip_login',
} as const;

export const PTStorage = {
  // Session
  saveSession: (session: PTSession): void => {
    try {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    } catch (e) {
      console.warn('PT: Failed to save session to localStorage', e);
    }
  },

  getSession: (): PTSession | null => {
    try {
      const raw = localStorage.getItem(KEYS.SESSION);
      return raw ? (JSON.parse(raw) as PTSession) : null;
    } catch {
      return null;
    }
  },

  // Personalization
  savePersona: (persona: Personalization): void => {
    try {
      localStorage.setItem(KEYS.PERSONA, JSON.stringify(persona));
    } catch (e) {
      console.warn('PT: Failed to save persona', e);
    }
  },

  getPersona: (): Personalization | null => {
    try {
      const raw = localStorage.getItem(KEYS.PERSONA);
      return raw ? (JSON.parse(raw) as Personalization) : null;
    } catch {
      return null;
    }
  },

  // Skip login flag
  setSkipLogin: (): void => {
    try {
      localStorage.setItem(KEYS.SKIP_LOGIN, 'true');
    } catch {
      /* noop */
    }
  },

  isSkipLogin: (): boolean => {
    try {
      return localStorage.getItem(KEYS.SKIP_LOGIN) === 'true';
    } catch {
      return false;
    }
  },

  // Clear everything
  clearAll: (): void => {
    try {
      Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    } catch {
      /* noop */
    }
  },
};
