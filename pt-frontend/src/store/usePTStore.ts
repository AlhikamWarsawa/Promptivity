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
import { parseSession, parseTasks }                 from '@/lib/parsers';
import PTStorage                           from '@/lib/storage';
import { API }                             from '@/lib/api';

/* ---- Store State Type ---- */

export interface PTStoreState {
  // Data
  session:     PTSession | null;
  isLoading:   boolean;
  error:       string | null;
  loadedFromStorage: boolean;   // Apakah session di-load dari localStorage
  
  // Auth
  token:           string | null;
  user:            { id: string, name: string, email: string } | null;
  isAuthenticated: boolean;
  isAuthHydrated:  boolean;
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
  moveKanbanCard:     (taskId: string, toColumn: 'backlog' | 'inProgress' | 'done') => void;
  updateKRProgress:   (krIndex: number, progress: number) => void;
  updateGoalProgress: (goalIndex: number, progress: number) => void;

  // Confused Mode
  confusedMessages:   { role: 'user' | 'model'; content: string }[];
  addConfusedMessage: (role: 'user' | 'model', content: string) => void;
  addGreetingMessage: () => void;
  resetConfusedMessages:  () => void;
  clearConfusedSession: () => void;

  // Auth Actions
  login:            (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register:         (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:           () => void;
  initializeAuth:   () => Promise<void>;
  generateFrameworkTasks: (frameworkId: string) => Promise<{ success: boolean; error?: string }>;
  fetchLatestSession: () => Promise<void>;
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

    // Auth
    token:           null,
    user:            null,
    isAuthenticated: false,
    isAuthHydrated:  false,
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
        const localDate = new Date().toLocaleDateString('en-CA');
        PTStorage.saveSessionByDate(localDate, result.session);

        const { isAuthenticated } = get();
        if (isAuthenticated) {
          API.post('/sessions', {
            id: result.session.sessionId,
            session_date: localDate,
            raw_story: result.session.story.rawText,
            data: result.session
          }).catch(err => console.error('Failed to sync session to backend:', err));
        }

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

    loadFromStorage: () => {
      if (get().loadedFromStorage) return;
      const storedSession = PTStorage.getSession();
      const storedConfused = PTStorage.getConfusedMessages();
      const hasOnboarded = PTStorage.load<boolean>(PTStorage.KEYS.ONBOARDED) || false;

      set({
        session:          storedSession,
        confusedMessages: storedConfused,
        loadedFromStorage: true,
        hasCompletedOnboarding: storedSession ? true : hasOnboarded,
      });
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

      const updatedMasterList = session.masterTaskList.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task,
      );

      const updatedFrameworks = session.frameworks.map((fw) => ({
        ...fw,
        tasks: fw.tasks.map((task) =>
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task,
        ),
      }));

      const updatedSession = {
        ...session,
        masterTaskList: updatedMasterList,
        frameworks:     updatedFrameworks,
      };

      set({ session: updatedSession });
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

        const updatedTask = { ...movedTask, isCompleted: toColumn === 'done' };
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
        const updatedKRs = (rawData.keyResults ?? []).map((kr: any, i: number) =>
          i === krIndex ? { ...kr, progress: Math.max(0, Math.min(100, progress)) } : kr,
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
        const updatedGoals = (rawData.goals ?? []).map((goal: any, i: number) =>
          i === goalIndex ? { ...goal, progress: Math.max(0, Math.min(100, progress)) } : goal,
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

    initializeAuth: async () => {
      const token = PTStorage.getToken();
      const user = PTStorage.getUser();
      const hasOnboarded = PTStorage.load<boolean>(PTStorage.KEYS.ONBOARDED) || false;
      set({ hasCompletedOnboarding: hasOnboarded });

      if (token && user) {
        set({ token, user, isAuthenticated: true });
        try {
          const freshUser = await API.get<any>('/auth/me');
          set({ user: freshUser, isAuthenticated: true });
          PTStorage.saveUser(freshUser);
        } catch (e) {
          set({ token: null, user: null, isAuthenticated: false });
          PTStorage.clearAuth();
        }
      }
      set({ isAuthHydrated: true });
    },

    login: async (email, password) => {
      if (get().isLoading) return { success: false };
      set({ isLoading: true, error: null });
      try {
        const res = await API.post<any>('/auth/login', { email, password });
        set({ token: res.token, user: res.user, isAuthenticated: true, isLoading: false });
        PTStorage.saveToken(res.token);
        PTStorage.saveUser(res.user);
        return { success: true };
      } catch (e: any) {
        set({ isLoading: false, error: e.message });
        return { success: false, error: e.message };
      }
    },

    register: async (name, email, password) => {
      if (get().isLoading) return { success: false };
      set({ isLoading: true, error: null });
      try {
        await API.post<any>('/auth/register', { name, email, password });
        set({ isLoading: false });
        return get().login(email, password);
      } catch (e: any) {
        set({ isLoading: false, error: e.message });
        return { success: false, error: e.message };
      }
    },

    logout: () => {
      set({ token: null, user: null, isAuthenticated: false });
      PTStorage.clearAuth();
    },

    fetchLatestSession: async () => {
      const { isAuthenticated, isLoading } = get();
      if (!isAuthenticated || isLoading) return;

      set({ isLoading: true, error: null });
      try {
        const sessions = await API.get<any[]>('/sessions');
        if (sessions.length > 0) {
          const latest = sessions[0];
          set({ session: latest.data, hasCompletedOnboarding: true, isLoading: false });
          PTStorage.saveSession(latest.data);
          PTStorage.save(PTStorage.KEYS.ONBOARDED, true);
        } else {
          set({ isLoading: false });
        }
      } catch (e) {
        set({ isLoading: false });
      }
    },

    setHasCompletedOnboarding: (val) => {
      set({ hasCompletedOnboarding: val });
      PTStorage.save(PTStorage.KEYS.ONBOARDED, val);
    },

    addTask: (taskData) => {
      const { session, isAuthenticated } = get();
      if (!session) return;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'General',
        estimatedMinutes: taskData.estimatedMinutes || 30,
        isCompleted: false,
        framework: 'gtd',
        subtasks: [],
        ...taskData,
      };

      const updatedSession = { ...session, masterTaskList: [newTask, ...session.masterTaskList] };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);
      
      if (isAuthenticated) {
        API.post('/sessions', {
          id: updatedSession.sessionId,
          session_date: new Date().toLocaleDateString('en-CA'),
          raw_story: updatedSession.story.rawText,
          data: updatedSession
        }).catch(err => console.error('Failed to sync added task:', err));
      }
    },

    editTask: (taskId, updates) => {
      const { session, isAuthenticated } = get();
      if (!session) return;

      const updatedList = session.masterTaskList.map(t => t.id === taskId ? { ...t, ...updates } : t);
      const updatedSession = { ...session, masterTaskList: updatedList };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);

      if (isAuthenticated) {
        API.post('/sessions', {
          id: updatedSession.sessionId,
          session_date: new Date().toLocaleDateString('en-CA'),
          raw_story: updatedSession.story.rawText,
          data: updatedSession
        }).catch(err => console.error('Failed to sync edited task:', err));
      }
    },

    deleteTask: (taskId) => {
      const { session, isAuthenticated } = get();
      if (!session) return;

      const updatedList = session.masterTaskList.filter(t => t.id !== taskId);
      const updatedSession = { ...session, masterTaskList: updatedList };
      set({ session: updatedSession });
      PTStorage.saveSession(updatedSession);

      if (isAuthenticated) {
        API.post('/sessions', {
          id: updatedSession.sessionId,
          session_date: new Date().toLocaleDateString('en-CA'),
          raw_story: updatedSession.story.rawText,
          data: updatedSession
        }).catch(err => console.error('Failed to sync deleted task:', err));
      }
    },

    generateSubtasks: async (taskId) => {
      const { session, isAuthenticated, isLoading } = get();
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

          if (isAuthenticated) {
            API.post('/sessions', {
              id: updatedSession.sessionId,
              session_date: new Date().toLocaleDateString('en-CA'),
              raw_story: updatedSession.story.rawText,
              data: updatedSession
            }).catch(err => console.error('Failed to sync generated subtasks:', err));
          }
        } else {
          set({ isLoading: false, error: 'Failed to generate subtasks' });
        }
      } catch (e) {
        set({ isLoading: false, error: 'Moti is sleeping. Try again later.' });
      }
    },

    addMoreTasks: async () => {
      const { session, isAuthenticated, isLoading } = get();
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
             set({ isLoading: false, error: 'Moti tidak menemukan task baru yang relevan.' });
             return;
          }

          const updatedSession = { ...session, masterTaskList: [...session.masterTaskList, ...uniqueNewTasks] };
          set({ session: updatedSession, isLoading: false });
          PTStorage.saveSession(updatedSession);

          if (isAuthenticated) {
            API.post('/sessions', {
              id: updatedSession.sessionId,
              session_date: new Date().toLocaleDateString('en-CA'),
              raw_story: updatedSession.story.rawText,
              data: updatedSession
            }).catch(err => console.error('Failed to sync added tasks:', err));
          }
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
          const updatedFrameworks = session.frameworks.map(fw => 
            fw.frameworkId === frameworkId ? { ...fw, rawData: res.data.data } : fw
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
          t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
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
        // Map them to look like generic tasks for the backend
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
          const newGenericTasks = parseTasks(res.newTasks, 'pomodoro'); // This just ensures it's parsed securely as generic Task[]
          
          const newPomTasks = newGenericTasks.map((t: Task, idx: number) => ({
            id: `pomodoro-new-${Date.now()}-${idx}`,
            title: t.title,
            duration: 25,
            breakDuration: 5,
            sessions: Math.max(1, Math.ceil((t.estimatedMinutes || 25) / 25)),
            completedSessions: 0,
            isCompleted: false,
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
            return { ...t, completedSessions: nextCompleted, isCompleted: isFullyDone };
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
            // Skips increment completedSessions but doesn't count towards productivity metrics if we had them
            // For now, it just advances the queue.
            const nextCompleted = (t.completedSessions || 0) + 1;
            const isFullyDone = nextCompleted >= t.sessions;
            return { ...t, completedSessions: nextCompleted, isCompleted: isFullyDone };
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
    } else {
      PTStorage.clearSession();
    }
    PTStorage.saveConfusedMessages(current.confusedMessages);
  },
  { equalityFn: (a, b) => a.session === b.session && a.confusedMessages === b.confusedMessages }
);

/* ---- Selectors ---- */
export const selectSession     = (s: PTStoreState) => s.session;
export const selectIsLoading   = (s: PTStoreState) => s.isLoading;
export const selectError       = (s: PTStoreState) => s.error;
export const selectTopFramework = (s: PTStoreState) => s.session?.topRecommendation ?? null;
export const selectTodayPlan   = (s: PTStoreState) => s.session?.todayPlan ?? [];
export const selectMasterTasks = (s: PTStoreState) => s.session?.masterTaskList ?? [];
export const selectToggleTask  = (s: PTStoreState) => s.toggleTask;
export const selectMoveKanbanCard = (s: PTStoreState) => s.moveKanbanCard;
export const selectUpdateKRProgress = (s: PTStoreState) => s.updateKRProgress;
export const selectUpdateGoalProgress = (s: PTStoreState) => s.updateGoalProgress;

export const selectAddPomodoroTask = (s: PTStoreState) => s.addPomodoroTask;
export const selectEditPomodoroTask = (s: PTStoreState) => s.editPomodoroTask;
export const selectDeletePomodoroTask = (s: PTStoreState) => s.deletePomodoroTask;
export const selectTogglePomodoroTask = (s: PTStoreState) => s.togglePomodoroTask;
export const selectReorderPomodoroTasks = (s: PTStoreState) => s.reorderPomodoroTasks;
export const selectAddMorePomodoroTasks = (s: PTStoreState) => s.addMorePomodoroTasks;
export const selectCompletePomodoroSession = (s: PTStoreState) => s.completePomodoroSession;

export function useFramework(frameworkId: string) {
  return usePTStore((state) => state.session?.frameworks.find((f) => f.frameworkId === frameworkId) ?? null);
}
