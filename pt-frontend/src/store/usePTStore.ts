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
import type { PTSession, Personalization, Task, FrameworkId } from '@/types/pt.types';
import { processStoryAPI }                 from '@/lib/gemini';
import { hasGeneratedTasks, parseFrameworkOutput, parseSession, parseTasks } from '@/lib/parsers';
import {
  appendFrameworkTasks,
  extractFrameworkTasks,
  toggleTaskInRawData,
  type EisenhowerQuadrantId,
  type FrameworkTaskDraft,
} from '@/lib/frameworkTasks';
import PTStorage                           from '@/lib/storage';
import { API }                             from '@/lib/api';

function buildFrameworkGenerateMoreFallback(frameworkId: FrameworkId): FrameworkTaskDraft[] {
  if (frameworkId === 'eisenhower') {
    return [
      {
        title: 'Choose the next urgent important action',
        description: 'Pick the next task that needs attention today.',
        priority: 'high',
        estimatedMinutes: 30,
        category: 'work',
        quadrant: 'doNow',
      },
      {
        title: 'Schedule one important follow-up',
        description: 'Protect time for important work before it becomes urgent.',
        priority: 'medium',
        estimatedMinutes: 45,
        category: 'work',
        quadrant: 'schedule',
      },
      {
        title: 'Simplify one low-impact responsibility',
        description: 'Reduce work that does not need your full attention.',
        priority: 'low',
        estimatedMinutes: 20,
        category: 'work',
        quadrant: 'delegate',
      },
    ];
  }

  return [
    { title: 'Clarify the next useful action', priority: 'medium', estimatedMinutes: 25, category: 'general' },
    { title: 'Work on the highest-impact follow-up', priority: 'high', estimatedMinutes: 45, category: 'general' },
    { title: 'Review progress and choose the next step', priority: 'medium', estimatedMinutes: 20, category: 'general' },
  ];
}

/* ---- Store State Type ---- */

export interface PTStoreState {
  // Data
  session:     PTSession | null;
  isLoading:   boolean;
  error:       string | null;
  loadedFromStorage: boolean;   // Apakah session di-load dari localStorage
  hasCompletedOnboarding: boolean;

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
  toggleTaskComplete: (taskId: string) => void;
  toggleFrameworkTaskComplete: (frameworkId: FrameworkId, taskId: string) => void;
  addFrameworkTask:   (frameworkId: FrameworkId, task: FrameworkTaskDraft) => void;
  generateMoreFrameworkTasks: (frameworkId: FrameworkId) => Promise<{ success: boolean; error?: string }>;
  moveKanbanCard:     (taskId: string, toColumn: 'backlog' | 'inProgress' | 'done') => void;
  updateKRProgress:   (krIndex: number, progress: number) => void;
  updateGoalProgress: (goalIndex: number, progress: number) => void;

  // Confused Mode
  confusedMessages:   { role: 'user' | 'model'; content: string }[];
  addConfusedMessage: (role: 'user' | 'model', content: string) => void;
  addGreetingMessage: () => void;
  resetConfusedMessages:  () => void;
  clearConfusedSession: () => void;

  generateFrameworkTasks: (frameworkId: string) => Promise<{ success: boolean; error?: string }>;
  setHasCompletedOnboarding: (val: boolean) => void;

  // Task Operations
  addTask: (task: Partial<Task>) => void;
  editTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  generateSubtasks: (taskId: string) => Promise<void>;
  addMoreTasks: () => Promise<void>;

  // Pomodoro Specific Actions
  addPomodoroTask: (task: Partial<{ title: string; duration: number; breakDuration: number; sessions: number }>) => void;
  editPomodoroTask: (taskId: string, updates: Partial<{ title: string; duration: number; breakDuration: number; sessions: number }>) => void;
  deletePomodoroTask: (taskId: string) => void;
  togglePomodoroTask: (taskId: string) => void;
  reorderPomodoroTasks: (newTasks: any[]) => void;
  addMorePomodoroTasks: () => Promise<void>;
  completePomodoroSession: (taskId: string) => void;
  logPomodoroDistraction: (taskId: string, note: string) => void;
  skipPomodoroSession: (taskId: string) => void;
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
    hasCompletedOnboarding: false,

    // ---- Actions ----

    processStory: async (storyText, personalization) => {
      const { isLoading } = get();
      if (isLoading) return { success: false };

      set({ isLoading: true, error: null });
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

        set({
          session:   result.session,
          isLoading: false,
          error:     null,
        });

        PTStorage.saveSession(result.session);

        set({ hasCompletedOnboarding: true });
        PTStorage.save(PTStorage.KEYS.ONBOARDED, true);

        return { success: true };

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga.';
        set({ isLoading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    },

    generateFramework: async (frameworkId) => {
      const { session, isLoading } = get();
      if (!session || isLoading) return { success: false, error: 'No active session or already loading' };

      const fw = session.frameworks.find(f => f.frameworkId === frameworkId);
      if (fw && hasGeneratedTasks(frameworkId as FrameworkId, fw.rawData)) {
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

        const updatedFrameworks = session.frameworks.map(f =>
          f.frameworkId === frameworkId
            ? {
              ...f,
              ...result.data,
              isRecommended: f.isRecommended,
              recommendationScore: f.recommendationScore,
              recommendationReason: f.recommendationReason,
            }
            : f
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

    loadFromStorage: () => {
      if (get().loadedFromStorage) return;
      const storedSession = PTStorage.getSession();
      const normalizedSession = storedSession
        ? parseSession(
          storedSession,
          storedSession.story?.rawText ?? '',
          storedSession.story?.personalization,
        )
        : null;
      const storedConfused = PTStorage.getConfusedMessages();
      const hasOnboarded = PTStorage.load<boolean>(PTStorage.KEYS.ONBOARDED) || false;

      set({
        session:          normalizedSession,
        confusedMessages: storedConfused,
        loadedFromStorage: true,
        hasCompletedOnboarding: normalizedSession ? true : hasOnboarded,
      });

      if (normalizedSession) PTStorage.saveSession(normalizedSession);
    },

    setSession: (session) => {
      set({ session });
      PTStorage.saveSession(session);
    },

    clearSession: () => {
      set({ session: null, error: null });
      PTStorage.clearSession();
    },

    clearError: () => set({ error: null }),

    toggleTask: (taskId) => {
      const { session } = get();
      if (!session) return;

      const toggleTaskObject = (task: Task): Task => {
        const completed = !(task.isCompleted ?? task.completed);
        return { ...task, isCompleted: completed, completed };
      };

      const updatedMasterList = session.masterTaskList.map((task) =>
        task.id === taskId ? toggleTaskObject(task) : task,
      );

      const updatedFrameworks = session.frameworks.map((fw) => {
        const updatedTasks = fw.tasks.map((task) =>
          task.id === taskId ? toggleTaskObject(task) : task,
        );
        const rawResult = toggleTaskInRawData(fw.rawData, taskId);

        return {
          ...fw,
          tasks: updatedTasks,
          rawData: rawResult.changed ? rawResult.rawData as any : fw.rawData,
        };
      });

      const updatedSession = {
        ...session,
        masterTaskList: updatedMasterList,
        frameworks:     updatedFrameworks,
      };

      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    toggleTaskComplete: (taskId) => {
      get().toggleTask(taskId);
    },

    toggleFrameworkTaskComplete: (frameworkId, taskId) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== frameworkId) return fw;

        const updatedTasks = fw.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const completed = !(task.isCompleted ?? task.completed);
          return { ...task, isCompleted: completed, completed };
        });
        const rawResult = toggleTaskInRawData(fw.rawData, taskId);

        return {
          ...fw,
          tasks: updatedTasks,
          rawData: rawResult.changed ? rawResult.rawData as any : fw.rawData,
        };
      });

      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    addFrameworkTask: (frameworkId, taskData) => {
      const { session } = get();
      if (!session) return;

      const defaultQuadrant: EisenhowerQuadrantId | undefined =
        frameworkId === 'eisenhower' ? taskData.quadrant ?? 'doNow' : undefined;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== frameworkId) return fw;

        const rawData = appendFrameworkTasks(
          frameworkId,
          fw.rawData,
          [{ ...taskData, source: taskData.source ?? 'manual', quadrant: defaultQuadrant }],
          { source: 'manual', defaultQuadrant },
        );

        return {
          ...fw,
          rawData,
          tasks: extractFrameworkTasks(frameworkId, rawData),
        };
      });

      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    generateMoreFrameworkTasks: async (frameworkId) => {
      const { session, isLoading } = get();
      if (!session || isLoading) return { success: false, error: 'Already loading or no session' };

      const framework = session.frameworks.find((fw) => fw.frameworkId === frameworkId);
      if (!framework) return { success: false, error: 'Framework not found' };

      const currentTasks = extractFrameworkTasks(frameworkId, framework.rawData);

      set({ isLoading: true, error: null });
      try {
        const res = await API.post<any>('/api/add-more-tasks', {
          sessionId: session.sessionId,
          frameworkId,
          existingTasks: currentTasks,
          completedTasks: currentTasks.filter((task) => task.isCompleted || task.completed),
          storyContext: session.story.rawText,
          frameworkData: framework.rawData,
        });

        const incomingTasks = Array.isArray(res.newTasks) && res.newTasks.length > 0
          ? res.newTasks
          : buildFrameworkGenerateMoreFallback(frameworkId);

        const updatedFrameworks = session.frameworks.map((fw) => {
          if (fw.frameworkId !== frameworkId) return fw;
          const rawData = appendFrameworkTasks(frameworkId, fw.rawData, incomingTasks, {
            source: 'ai',
            defaultQuadrant: frameworkId === 'eisenhower' ? 'doNow' : undefined,
          });
          return {
            ...fw,
            rawData,
            tasks: extractFrameworkTasks(frameworkId, rawData),
          };
        });

        const updatedSession = { ...session, frameworks: updatedFrameworks };
        set({ session: updatedSession, isLoading: false });
        PTStorage.saveSession(updatedSession);
        return { success: true };
      } catch (e: any) {
        const errMsg = e?.message ?? 'Failed to generate more framework tasks.';
        set({ isLoading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    },

    moveKanbanCard: (taskId, toColumn) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'kanban') return fw;

        const rawData = fw.rawData as any;
        let movedTask: Task | undefined;

        const newBacklog = (rawData.backlog ?? []).filter((t: any) => {
          if (t.id === taskId) { movedTask = t; return false; } return true;
        });
        const newInProgress = (rawData.inProgress ?? []).filter((t: any) => {
          if (t.id === taskId) { movedTask = t; return false; } return true;
        });
        const newDone = (rawData.done ?? []).filter((t: any) => {
          if (t.id === taskId) { movedTask = t; return false; } return true;
        });

        if (!movedTask) return fw;

        const updatedTask = { ...movedTask, isCompleted: toColumn === 'done', completed: toColumn === 'done' };
        if (toColumn === 'backlog')    newBacklog.push(updatedTask);
        if (toColumn === 'inProgress') newInProgress.push(updatedTask);
        if (toColumn === 'done')       newDone.push(updatedTask);

        return { ...fw, rawData: { ...rawData, backlog: newBacklog, inProgress: newInProgress, done: newDone } };
      });

      set({ session: { ...session, frameworks: updatedFrameworks } });
    },

    updateKRProgress: (krIndex, progress) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'okrs') return fw;
        const rawData = fw.rawData as any;
        const nextProgress = Math.max(0, Math.min(100, progress));
        const updatedKRs = (rawData.keyResults ?? []).map((kr: any, i: number) =>
          i === krIndex ? { ...kr, progress: nextProgress, isCompleted: nextProgress >= 100, completed: nextProgress >= 100 } : kr,
        );
        return { ...fw, rawData: { ...rawData, keyResults: updatedKRs } };
      });

      set({ session: { ...session, frameworks: updatedFrameworks } });
    },

    updateGoalProgress: (goalIndex, progress) => {
      const { session } = get();
      if (!session) return;

      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'smart-goals') return fw;
        const rawData = fw.rawData as any;
        const nextProgress = Math.max(0, Math.min(100, progress));
        const updatedGoals = (rawData.goals ?? []).map((goal: any, i: number) =>
          i === goalIndex ? { ...goal, progress: nextProgress, isCompleted: nextProgress >= 100, completed: nextProgress >= 100 } : goal,
        );
        return { ...fw, rawData: { ...rawData, goals: updatedGoals } };
      });

      set({ session: { ...session, frameworks: updatedFrameworks } });
    },

    addConfusedMessage: (role, content) => {
      set((state) => ({ confusedMessages: [...state.confusedMessages, { role, content }] }));
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
      PTStorage.clearConfusedMessages();
    },

    setHasCompletedOnboarding: (val) => {
      set({ hasCompletedOnboarding: val });
      PTStorage.save(PTStorage.KEYS.ONBOARDED, val);
    },

    addTask: (taskData) => {
      const { session } = get();
      if (!session) return;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'General',
        estimatedMinutes: taskData.estimatedMinutes || 30,
        isCompleted: false,
        completed: false,
        framework: 'gtd',
        frameworkId: 'gtd',
        source: 'manual',
        subtasks: [],
        ...taskData,
      };

      const updatedSession = { ...session, masterTaskList: [newTask, ...session.masterTaskList] };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    editTask: (taskId, updates) => {
      const { session } = get();
      if (!session) return;

      const updatedList = session.masterTaskList.map(t => t.id === taskId ? { ...t, ...updates } : t);
      const updatedSession = { ...session, masterTaskList: updatedList };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    deleteTask: (taskId) => {
      const { session } = get();
      if (!session) return;

      const updatedList = session.masterTaskList.filter(t => t.id !== taskId);
      const updatedSession = { ...session, masterTaskList: updatedList };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    generateSubtasks: async (taskId) => {
      const { session, isLoading } = get();
      if (!session || isLoading) return;

      const task = session.masterTaskList.find(t => t.id === taskId);
      if (!task) return;

      set({ isLoading: true, error: null });
      try {
        const res = await API.post<any>('/api/generate-subtasks', {
          taskId,
          taskTitle: task.title,
          context: session.story.rawText
        });

        if (res.success && res.subtasks) {
          const updatedList = session.masterTaskList.map(t => t.id === taskId ? { ...t, subtasks: res.subtasks } : t);
          const updatedSession = { ...session, masterTaskList: updatedList };
          set({ session: updatedSession, isLoading: false });
          PTStorage.saveSession(updatedSession);
        } else {
          set({ isLoading: false, error: 'Failed to generate subtasks' });
        }
      } catch (e) {
        set({ isLoading: false, error: 'Moti is sleeping. Try again later.' });
      }
    },

    addMoreTasks: async () => {
      const { session, isLoading } = get();
      if (!session || isLoading) return;

      set({ isLoading: true, error: null });
      try {
        const res = await API.post<any>('/api/add-more-tasks', {
          sessionId: session.sessionId,
          existingTasks: session.masterTaskList,
          storyContext: session.story.rawText
        });

        if (res.success && res.newTasks) {
          const newTasks = parseTasks(res.newTasks, 'gtd');
          const existingIds = new Set(session.masterTaskList.map(t => t.id));
          const uniqueNewTasks = newTasks.filter((t: Task) => !existingIds.has(t.id));

          if (uniqueNewTasks.length === 0) {
             set({ isLoading: false, error: 'No new unique tasks were generated yet.' });
             return;
          }

          const updatedSession = { ...session, masterTaskList: [...session.masterTaskList, ...uniqueNewTasks] };
          set({ session: updatedSession, isLoading: false });
          PTStorage.saveSession(updatedSession);
        } else {
          set({ isLoading: false, error: res.error || 'Failed to find more tasks.' });
        }
      } catch (e) {
        set({ isLoading: false, error: 'Moti is tired. Try again later.' });
      }
    },

    generateFrameworkTasks: async (frameworkId) => {
      const { session, isLoading } = get();
      if (!session || isLoading) return { success: false, error: 'Already loading or no session' };

      set({ isLoading: true, error: null });
      try {
        const res = await API.post<any>('/api/generate-framework-tasks', {
          frameworkId,
          sessionId: session.sessionId,
          personalization: PTStorage.getPersonaOrDefault()
        });

        if (res.success && res.data) {
          const parsedFramework = parseFrameworkOutput(
            frameworkId as FrameworkId,
            res.data,
            { ensureContent: true },
          );
          const updatedFrameworks = session.frameworks.map(fw =>
            fw.frameworkId === frameworkId
              ? {
                ...fw,
                ...parsedFramework,
                isRecommended: fw.isRecommended,
                recommendationScore: fw.recommendationScore,
                recommendationReason: fw.recommendationReason,
              }
              : fw
          );
          const updatedSession = { ...session, frameworks: updatedFrameworks };
          set({ session: updatedSession, isLoading: false });
          PTStorage.saveSession(updatedSession);
          return { success: true };
        }
        throw new Error(res.error || 'Failed to generate tasks');
      } catch (e: any) {
        set({ isLoading: false, error: e.message });
        return { success: false, error: e.message };
      }
    },

    // Pomodoro Specific Actions
    addPomodoroTask: (taskData) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const newTask = {
          id: `pomodoro-${Date.now()}`,
          title: taskData.title || 'Focus session',
          duration: taskData.duration || 25,
          breakDuration: taskData.breakDuration || 5,
          sessions: taskData.sessions || 1,
          completedSessions: 0,
          isCompleted: false,
          completed: false,
          source: 'manual',
          frameworkId: 'pomodoro',
        };
        return { ...fw, rawData: { ...rawData, tasks: [...(rawData.tasks || []), newTask] } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    editPomodoroTask: (taskId, updates) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const updatedTasks = (rawData.tasks || []).map((t: any) =>
          t.id === taskId ? { ...t, ...updates } : t
        );
        return { ...fw, rawData: { ...rawData, tasks: updatedTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    deletePomodoroTask: (taskId) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const updatedTasks = (rawData.tasks || []).filter((t: any) => t.id !== taskId);
        return { ...fw, rawData: { ...rawData, tasks: updatedTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    togglePomodoroTask: (taskId) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const updatedTasks = (rawData.tasks || []).map((t: any) =>
          t.id === taskId ? { ...t, isCompleted: !(t.isCompleted ?? t.completed), completed: !(t.isCompleted ?? t.completed) } : t
        );
        return { ...fw, rawData: { ...rawData, tasks: updatedTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    reorderPomodoroTasks: (newTasks) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        return { ...fw, rawData: { ...rawData, tasks: newTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    addMorePomodoroTasks: async () => {
      const { session, isLoading } = get();
      if (!session || isLoading) return;

      set({ isLoading: true, error: null });
      try {
        const fw = session.frameworks.find(f => f.frameworkId === 'pomodoro');
        const existingTasks = fw ? ((fw.rawData as any).tasks || []) : [];
        const mappedExisting = existingTasks.map((t: any) => ({
          title: t.title,
          estimatedMinutes: t.duration * t.sessions,
        }));

        const res = await API.post<any>('/api/add-more-tasks', {
          sessionId: session.sessionId,
          existingTasks: mappedExisting,
          storyContext: session.story.rawText
        });

        if (res.success && res.newTasks) {
          const newGenericTasks = parseTasks(res.newTasks, 'pomodoro');

          const newPomTasks = newGenericTasks.map((t: Task, idx: number) => ({
            id: `pomodoro-new-${Date.now()}-${idx}`,
            title: t.title,
            duration: 25,
            breakDuration: 5,
            sessions: Math.max(1, Math.ceil((t.estimatedMinutes || 25) / 25)),
            completedSessions: 0,
            isCompleted: false,
            completed: false,
            source: 'ai',
            frameworkId: 'pomodoro',
          }));

          const updatedFrameworks = session.frameworks.map((fw) => {
            if (fw.frameworkId !== 'pomodoro') return fw;
            const rawData = fw.rawData as any;
            return { ...fw, rawData: { ...rawData, tasks: [...(rawData.tasks || []), ...newPomTasks] } };
          });

          const updatedSession = { ...session, frameworks: updatedFrameworks };
          set({ session: updatedSession, isLoading: false });
          PTStorage.saveSession(updatedSession);
        } else {
          set({ isLoading: false, error: res.error || 'Failed to generate more tasks.' });
        }
      } catch (e) {
        set({ isLoading: false, error: 'Moti is tired. Try again later.' });
      }
    },

    completePomodoroSession: (taskId) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const updatedTasks = (rawData.tasks || []).map((t: any) => {
          if (t.id === taskId) {
            const nextCompleted = (t.completedSessions || 0) + 1;
            const isFullyDone = nextCompleted >= t.sessions;
            return { ...t, completedSessions: nextCompleted, isCompleted: isFullyDone, completed: isFullyDone };
          }
          return t;
        });
        return { ...fw, rawData: { ...rawData, tasks: updatedTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    logPomodoroDistraction: (taskId, note) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const updatedTasks = (rawData.tasks || []).map((t: any) => {
          if (t.id === taskId) {
            const distractions = t.distractions || [];
            const count = (t.distractionCount || 0) + 1;
            return {
              ...t,
              distractionCount: count,
              distractions: [...distractions, { timestamp: new Date().toISOString(), note }]
            };
          }
          return t;
        });
        return { ...fw, rawData: { ...rawData, tasks: updatedTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    },

    skipPomodoroSession: (taskId) => {
      const { session } = get();
      if (!session) return;
      const updatedFrameworks = session.frameworks.map((fw) => {
        if (fw.frameworkId !== 'pomodoro') return fw;
        const rawData = fw.rawData as any;
        const updatedTasks = (rawData.tasks || []).map((t: any) => {
          if (t.id === taskId) {
            const nextCompleted = (t.completedSessions || 0) + 1;
            const isFullyDone = nextCompleted >= t.sessions;
            return { ...t, completedSessions: nextCompleted, isCompleted: isFullyDone, completed: isFullyDone };
          }
          return t;
        });
        return { ...fw, rawData: { ...rawData, tasks: updatedTasks } };
      });
      const updatedSession = { ...session, frameworks: updatedFrameworks };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
    }

  })),
);

usePTStore.subscribe(
  (state) => ({ session: state.session, confusedMessages: state.confusedMessages }),
  (current) => {
    if (current.session) {
      PTStorage.saveSession(current.session);
    }
    if (current.confusedMessages.length > 0) {
      PTStorage.saveConfusedMessages(current.confusedMessages);
    }
  },
);

/* ---- Hook: useFramework (convenience) ---- */
export function useFramework(frameworkId: string) {
  return usePTStore((state) => state.session?.frameworks.find((f) => f.frameworkId === frameworkId) ?? null);
}
