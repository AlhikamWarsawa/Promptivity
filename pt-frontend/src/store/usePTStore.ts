/* ============================================
   Promptivity — Global State Store (Zustand)
   
   Single source of truth untuk:
   - PTSession (hasil AI processing)
   - Loading state
   - Error state
   
   Auto-save ke localStorage setiap kali session
   berubah via middleware subscribe.
   ============================================ */

import { create }     from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PTSession, Personalization } from '@/types/pt.types';
import { processStoryAPI }                 from '@/lib/gemini';
import PTStorage                           from '@/lib/storage';

/* ---- Store State Type ---- */

export interface PTStoreState {
  // Data
  session:     PTSession | null;
  isLoading:   boolean;
  error:       string | null;
  loadedFromStorage: boolean;   // Apakah session di-load dari localStorage

  // Actions
  processStory: (
    storyText:        string,
    personalization?: Partial<Personalization>,
  ) => Promise<{ success: boolean; error?: string }>;

  loadFromStorage:    () => void;
  setSession:         (session: PTSession) => void;
  clearSession:       () => void;
  clearError:         () => void;
}

/* ---- Store Implementation ---- */

export const usePTStore = create<PTStoreState>()(
  subscribeWithSelector((set, get) => ({

    // ---- Initial State ----
    session:          null,
    isLoading:        false,
    error:            null,
    loadedFromStorage:false,

    // ---- Actions ----

    /**
     * Main action: process user story via Gemini.
     * Handles loading state, error state, and auto-save.
     */
    processStory: async (storyText, personalization) => {
      // Clear previous error
      set({ isLoading: true, error: null });

      try {
        const result = await processStoryAPI({
          rawText:         storyText,
          personalization: personalization,
        });

        if (!result.success || !result.session) {
          const errMsg = result.error ?? 'Moti gagal membangun missionmu. Coba lagi.';
          set({ isLoading: false, error: errMsg });
          return { success: false, error: errMsg };
        }

        // Success — update store & save to localStorage
        set({
          session:   result.session,
          isLoading: false,
          error:     null,
        });

        // Auto-save (triggered by subscriber below, but also explicit here)
        PTStorage.saveSession(result.session);

        return { success: true };

      } catch (err) {
        const errMsg = err instanceof Error
          ? err.message
          : 'Terjadi kesalahan tidak terduga.';
        set({ isLoading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    },

    /**
     * Load existing session from localStorage.
     * Called on app init / page mount.
     */
    loadFromStorage: () => {
      if (get().loadedFromStorage) return;   // Jangan load dua kali

      const stored = PTStorage.getSession();
      set({
        session:          stored,
        loadedFromStorage: true,
      });
    },

    /**
     * Manually set session (untuk testing / demo mode).
     */
    setSession: (session) => {
      set({ session });
      PTStorage.saveSession(session);
    },

    /**
     * Clear session dari store + localStorage.
     */
    clearSession: () => {
      set({ session: null, error: null });
      PTStorage.clearSession();
    },

    /**
     * Clear error state.
     */
    clearError: () => set({ error: null }),
  })),
);

/* ---- Auto-save Subscriber ----
   Setiap kali session berubah di store,
   otomatis save ke localStorage.
   Ini sebagai safety net di luar explicit save di processStory.
*/
usePTStore.subscribe(
  (state) => state.session,
  (session) => {
    if (session) {
      PTStorage.saveSession(session);
    }
  },
);

/* ---- Selectors (untuk cleaner component code) ---- */

export const selectSession     = (s: PTStoreState) => s.session;
export const selectIsLoading   = (s: PTStoreState) => s.isLoading;
export const selectError       = (s: PTStoreState) => s.error;
export const selectTopFramework = (s: PTStoreState) =>
  s.session?.topRecommendation ?? null;
export const selectTodayPlan   = (s: PTStoreState) =>
  s.session?.todayPlan ?? [];
export const selectMasterTasks = (s: PTStoreState) =>
  s.session?.masterTaskList ?? [];

/* ---- Hook: useFramework (convenience) ---- */

export function useFramework(frameworkId: string) {
  return usePTStore((state) =>
    state.session?.frameworks.find((f) => f.frameworkId === frameworkId) ?? null,
  );
}
