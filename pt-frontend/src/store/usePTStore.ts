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

  generateFramework: (frameworkId: string) => Promise<{ success: boolean; error?: string }>;

  loadFromStorage:    () => void;
  setSession:         (session: PTSession) => void;
  clearSession:       () => void;
  clearError:         () => void;
  toggleTask:         (taskId: string) => void;
  moveKanbanCard:     (taskId: string, toColumn: 'backlog' | 'inProgress' | 'done') => void;
  updateKRProgress:   (krIndex: number, progress: number) => void;
  updateGoalProgress: (goalIndex: number, progress: number) => void;

  // Confused Mode
  confusedMessages:   { role: 'user' | 'model'; content: string }[];
  addConfusedMessage: (role: 'user' | 'model', content: string) => void;
  addGreetingMessage: () => void;
  resetConfusedMessages:  () => void;
  clearConfusedSession: () => void;
}

/* ---- Store Implementation ---- */

export const usePTStore = create<PTStoreState>()(
  subscribeWithSelector((set, get) => ({

    // ---- Initial State ----
    session:          null,
    isLoading:        false,
    error:            null,
    loadedFromStorage:false,
    confusedMessages: [],

    // ---- Actions ----

    /**
     * Main action: process user story via Gemini.
     * Handles loading state, error state, and auto-save.
     */
    processStory: async (storyText, personalization) => {
      const { isLoading } = get();
      if (isLoading) return { success: false };

      // Clear previous error
      set({ isLoading: true, error: null });

      // Get personalization from storage if not provided
      const finalPersonalization = personalization ?? PTStorage.getPersonaOrDefault();

      try {
        const result = await processStoryAPI({
          rawText:         storyText,
          personalization: finalPersonalization,
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
        
        // Save to Journal
        const localDate = new Date().toLocaleDateString('en-CA');
        PTStorage.saveSessionByDate(localDate, result.session);

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
     * Generate data for a specific framework on demand.
     */
    generateFramework: async (frameworkId) => {
      const { session, isLoading } = get();
      if (!session || isLoading) return { success: false, error: 'No active session or already loading' };

      // Check if already generated
      const fw = session.frameworks.find(f => f.frameworkId === frameworkId);
      if (fw && fw.rawData && Object.keys(fw.rawData).length > 0) {
        return { success: true };
      }

      set({ isLoading: true, error: null });

      try {
        const { generateFrameworkAPI } = await import('@/lib/gemini');
        const result = await generateFrameworkAPI(session.sessionId, frameworkId as any);

        if (!result.success || !result.data) {
          const errMsg = result.error ?? `Moti gagal membangun framework ${frameworkId}.`;
          set({ isLoading: false, error: errMsg });
          return { success: false, error: errMsg };
        }

        // Update framework in session
        const updatedFrameworks = session.frameworks.map(f => 
          f.frameworkId === frameworkId ? result.data : f
        );

        const updatedSession = { ...session, frameworks: updatedFrameworks };
        set({ session: updatedSession, isLoading: false });

        return { success: true };
      } catch (err) {
        const errMsg = 'Terjadi kesalahan saat membangun framework.';
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

      const storedSession = PTStorage.getSession();
      const storedConfused = PTStorage.getConfusedMessages();

      set({
        session:          storedSession,
        confusedMessages: storedConfused,
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

    // ---- Confused Mode Actions ----
    addConfusedMessage: (role, content) => {
      set((state) => ({
        confusedMessages: [...state.confusedMessages, { role, content }],
      }));
    },
    addGreetingMessage: () => {
      const { confusedMessages } = get();
      if (confusedMessages.length === 0) {
        set({
          confusedMessages: [{
            role: 'model',
            content: 'Halo! Aku Moti. Kamu lagi merasa stuck, bingung, atau kewalahan ya? Coba ceritain pelan-pelan ke aku, apa yang paling bikin pusing sekarang?'
          }]
        });
      }
    },
    resetConfusedMessages: () => {
      set({ confusedMessages: [] });
      PTStorage.clearConfusedMessages();
    },
    clearConfusedSession: () => {
      set({ confusedMessages: [] });
    },
  })),
);

// Middleware untuk auto-save session dan confusedMessages ke localStorage setiap berubah
usePTStore.subscribe(
  (state) => ({ session: state.session, confusedMessages: state.confusedMessages }),
  (current) => {
    if (current.session) {
      PTStorage.saveSession(current.session);
    } else {
      PTStorage.clearSession();
    }
    PTStorage.saveConfusedMessages(current.confusedMessages);
  },
  { equalityFn: (a, b) => a.session === b.session && a.confusedMessages === b.confusedMessages }
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
