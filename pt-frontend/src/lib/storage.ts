/* ============================================
   PT Storage — localStorage abstraction

   Semua operasi localStorage di-centralize di sini.
   Kalau di masa depan pindah ke backend/IndexedDB,
   cukup update file ini saja.
   ============================================ */

import type { PTSession, Personalization } from '@/types/pt.types';

// ---- Storage Keys ----
export const STORAGE_KEYS = {
  SESSION:           'pt_session',
  PERSONA:           'pt_persona',
  STORY_DRAFT:       'pt_story_draft',       // Draft cerita yang belum disubmit
  WEEKLY_REFLECTION: 'pt_weekly_reflection', // Personal reflection notes
  CONFUSED_MESSAGES: 'pt_confused_messages', // History percakapan Confused Mode
  ONBOARDED:         'pt_has_onboarded',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ---- Default Persona (kalau user skip personalization) ----
export const DEFAULT_PERSONA: Personalization = {
  name:           'Friend',
  role:           'lainnya',
  bigGoal:        '',
  currentProblem: '',
  energyPattern:  'variable',
  preferredStyle: 'flexible',
};

// ---- Generic Save / Load / Delete ----

/**
 * Simpan data apapun ke localStorage dengan key tertentu.
 * Data di-serialize ke JSON.
 * Tidak throw — kalau gagal (misal storage penuh), log warning saja.
 */
export function save(key: string, data: unknown): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('PT Storage: localStorage quota exceeded. Consider clearing old sessions.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pt_storage_full'));
      }
    } else {
      console.warn('PT Storage: Failed to save', key, e);
    }
    return false;
  }
}

/**
 * Load data dari localStorage.
 * Return null kalau key tidak ada atau JSON parsing gagal.
 * Generic — caller tentukan type T.
 */
export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Hapus satu key dari localStorage.
 */
export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

/**
 * Hapus semua data PT dari localStorage.
 * Berguna untuk "clear session" atau "start over".
 */
export function clear(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {
    /* noop */
  }
}

// ---- Typed Helpers ----

/** Cek apakah localStorage tersedia (SSR safe) */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__pt_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ---- Session ----

export function saveSession(session: PTSession): boolean {
  return save(STORAGE_KEYS.SESSION, session);
}

export function getSession(): PTSession | null {
  return load<PTSession>(STORAGE_KEYS.SESSION);
}

export function clearSession(): void {
  remove(STORAGE_KEYS.SESSION);
}

// ---- Persona ----

export function savePersona(persona: Personalization): boolean {
  return save(STORAGE_KEYS.PERSONA, persona);
}

export function getPersona(): Personalization | null {
  return load<Personalization>(STORAGE_KEYS.PERSONA);
}

export function getPersonaOrDefault(): Personalization {
  return getPersona() ?? DEFAULT_PERSONA;
}

// ---- Story Draft (untuk auto-save textarea) ----

export function saveStoryDraft(text: string): void {
  save(STORAGE_KEYS.STORY_DRAFT, text);
}

export function getStoryDraft(): string {
  return load<string>(STORAGE_KEYS.STORY_DRAFT) ?? '';
}

export function clearStoryDraft(): void {
  remove(STORAGE_KEYS.STORY_DRAFT);
}

// ---- Weekly Reflection (Local-only personal notes) ----

export function saveWeeklyReflection(notes: string): void {
  save(STORAGE_KEYS.WEEKLY_REFLECTION, notes);
}

export function getWeeklyReflection(): string {
  return load<string>(STORAGE_KEYS.WEEKLY_REFLECTION) ?? '';
}

// ---- Confused Messages ----

export function getConfusedMessages(): { role: 'user' | 'model'; content: string }[] {
  return load<{ role: 'user' | 'model'; content: string }[]>(STORAGE_KEYS.CONFUSED_MESSAGES) ?? [];
}

export function saveConfusedMessages(messages: { role: 'user' | 'model'; content: string }[]): void {
  save(STORAGE_KEYS.CONFUSED_MESSAGES, messages);
}

export function clearConfusedMessages(): void {
  remove(STORAGE_KEYS.CONFUSED_MESSAGES);
}

/**
 * Hapus session aktif untuk melegakan storage jika penuh.
 */
export function clearOldSessions(): number {
  try {
    clearSession();
    return 1;
  } catch {
    return 0;
  }
}

// ---- PTStorage Namespace Object (untuk backward compat & convenience) ----

export const PTStorage = {
  save,
  load,
  remove,
  clear,
  isAvailable: isStorageAvailable,
  // Session
  saveSession,
  getSession,
  clearSession,
  // Persona
  savePersona,
  getPersona,
  getPersonaOrDefault,
  // Story draft
  saveStoryDraft,
  getStoryDraft,
  clearStoryDraft,
  // Weekly reflection
  saveWeeklyReflection,
  getWeeklyReflection,
  // Keys & defaults
  KEYS: STORAGE_KEYS,
  DEFAULT_PERSONA,
  // Confused Messages
  saveConfusedMessages,
  getConfusedMessages,
  clearConfusedMessages,
  clearOldSessions,
} as const;

export default PTStorage;
