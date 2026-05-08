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
  SKIP_LOGIN:        'pt_skip_login',
  STORY_DRAFT:       'pt_story_draft',    // Draft cerita yang belum disubmit
  WEEKLY_REFLECTION: 'pt_weekly_reflection', // Personal reflection notes (Weekly Review)
  CONFUSED_MESSAGES: 'pt_confused_messages', // History percakapan Confused Mode
  JOURNAL_INDEX:     'pt_journal_index',     // List of dates with sessions
  SESSION_BY_DATE:   'pt_session_',          // Prefix for session by date: pt_session_YYYY-MM-DD
  TOKEN:             'pt_token',
  USER:              'pt_user',
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

// ---- Skip Login Flag ----

export function setSkipLogin(): void {
  save(STORAGE_KEYS.SKIP_LOGIN, true);
}

export function isSkipLogin(): boolean {
  return load<boolean>(STORAGE_KEYS.SKIP_LOGIN) === true;
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

// ---- Journal ----

/**
 * Save a session by date (YYYY-MM-DD).
 * Also updates the journal index.
 */
export function saveSessionByDate(date: string, session: PTSession): void {
  const key = `${STORAGE_KEYS.SESSION_BY_DATE}${date}`;
  
  // Load existing sessions for this date
  const existing = load<PTSession[]>(key) ?? [];
  
  // To avoid duplicates of the same session (by sessionId), though unlikely here
  const updated = [...existing.filter(s => s.sessionId !== session.sessionId), session];
  
  save(key, updated);
  
  // Update index
  const index = load<string[]>(STORAGE_KEYS.JOURNAL_INDEX) ?? [];
  if (!index.includes(date)) {
    index.push(date);
    save(STORAGE_KEYS.JOURNAL_INDEX, index.sort());
  }
}

export function getSessionsByDate(date: string): PTSession[] {
  const key = `${STORAGE_KEYS.SESSION_BY_DATE}${date}`;
  return load<PTSession[]>(key) ?? [];
}

export function getAllSessionDates(): string[] {
  return load<string[]>(STORAGE_KEYS.JOURNAL_INDEX) ?? [];
}

// ---- Auth ----

export function saveToken(token: string): void {
  save(STORAGE_KEYS.TOKEN, token);
}

export function getToken(): string | null {
  return load<string>(STORAGE_KEYS.TOKEN);
}

export function saveUser(user: any): void {
  save(STORAGE_KEYS.USER, user);
}

export function getUser(): any | null {
  return load<any>(STORAGE_KEYS.USER);
}

export function clearAuth(): void {
  remove(STORAGE_KEYS.TOKEN);
  remove(STORAGE_KEYS.USER);
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
  // Skip login
  setSkipLogin,
  isSkipLogin,
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
  // Journal
  saveSessionByDate,
  getSessionsByDate,
  getAllSessionDates,
  // Auth
  saveToken,
  getToken,
  saveUser,
  getUser,
  clearAuth,
} as const;

export default PTStorage;
