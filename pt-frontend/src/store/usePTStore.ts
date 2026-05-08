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
import type { PTSession, Personalization, Task } from '@/types/pt.types';
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
  toggleTask:         (taskId: string) => void;
  moveKanbanCard:     (taskId: string, toColumn: 'backlog' | 'inProgress' | 'done') => void;
  updateKRProgress:   (krIndex: number, progress: number) => void;
  updateGoalProgress: (goalIndex: number, progress: number) => void;
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

    /**
     * Toggle task completion
     */
    toggleTask: (taskId) => {
      const { session } = get();
      if (!session) return;

      // Update task di masterTaskList
      const updatedMasterList = session.masterTaskList.map((task) =>
        task.id === taskId
          ? { ...task, isCompleted: !task.isCompleted }
          : task,
      );

      // Update task di semua framework rawData dan tasks
      const updatedFrameworks = session.frameworks.map((fw) => ({
        ...fw,
        tasks: fw.tasks.map((task) =>
          task.id === taskId
            ? { ...task, isCompleted: !task.isCompleted }
            : task,
        ),
      }));

      const updatedSession = {
        ...session,
        masterTaskList: updatedMasterList,
        frameworks:     updatedFrameworks,
      };

      set({ session: updatedSession });
      // Auto-save via subscriber
    },

    /**
     * Move a Kanban card between columns.
     * Updates rawData for the kanban framework.
     */
    moveKanbanCard: (taskId, toColumn) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'kanban') return fw;

        const rawData = fw.rawData as {
          backlog:    Task[];
          inProgress: Task[];
          done:       Task[];
        };

        // Remove task dari semua kolom
        let movedTask: Task | undefined;
        const newBacklog    = (rawData.backlog ?? []).filter((t) => {
          if (t.id === taskId) { movedTask = t; return false; } return true;
        });
        const newInProgress = (rawData.inProgress ?? []).filter((t) => {
          if (t.id === taskId) { movedTask = t; return false; } return true;
        });
        const newDone       = (rawData.done ?? []).filter((t) => {
          if (t.id === taskId) { movedTask = t; return false; } return true;
        });

        if (!movedTask) return fw;

        // Update isCompleted berdasarkan kolom
        const updatedTask = {
          ...movedTask,
          isCompleted: toColumn === 'done',
        };

        // Tambahkan ke kolom tujuan
        if (toColumn === 'backlog')    newBacklog.push(updatedTask);
        if (toColumn === 'inProgress') newInProgress.push(updatedTask);
        if (toColumn === 'done')       newDone.push(updatedTask);

        return {
          ...fw,
          rawData: { ...rawData, backlog: newBacklog, inProgress: newInProgress, done: newDone },
        };
      });

      set({ session: { ...session, frameworks: updatedFrameworks } });
    },

    updateKRProgress: (krIndex, progress) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'okrs') return fw;

        const rawData = fw.rawData as {
          objective:  string;
          keyResults: Array<{ kr: string; metric: string; deadline: string; progress: number }>;
        };

        const updatedKRs = (rawData.keyResults ?? []).map((kr, i) =>
          i === krIndex
            ? { ...kr, progress: Math.max(0, Math.min(100, progress)) }
            : kr,
        );

        return {
          ...fw,
          rawData: { ...rawData, keyResults: updatedKRs },
        };
      });

      set({ session: { ...session, frameworks: updatedFrameworks } });
      // Auto-save via subscriber
    },

    updateGoalProgress: (goalIndex, progress) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'smart-goals') return fw;

        const rawData = fw.rawData as {
          goals: Array<{
            title: string; specific: string; measurable: string;
            achievable: string; relevant: string; timeBound: string;
            progress: number;
          }>;
        };

        const updatedGoals = (rawData.goals ?? []).map((goal, i) =>
          i === goalIndex
            ? { ...goal, progress: Math.max(0, Math.min(100, progress)) }
            : goal,
        );

        return { ...fw, rawData: { ...rawData, goals: updatedGoals } };
      });

      set({ session: { ...session, frameworks: updatedFrameworks } });
    },
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
export const selectToggleTask  = (s: PTStoreState) => s.toggleTask;
export const selectMoveKanbanCard = (s: PTStoreState) => s.moveKanbanCard;
export const selectUpdateKRProgress = (s: PTStoreState) => s.updateKRProgress;
export const selectUpdateGoalProgress = (s: PTStoreState) => s.updateGoalProgress;

/* ---- Hook: useFramework (convenience) ---- */

export function useFramework(frameworkId: string) {
  return usePTStore((state) =>
    state.session?.frameworks.find((f) => f.frameworkId === frameworkId) ?? null,
  );
}
