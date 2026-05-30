// ============================================
// PT (Promptivity) — Core Type Definitions
// ============================================

export type FrameworkId =
  | 'gtd'
  | 'kanban'
  | 'time-blocking'
  | 'eat-the-frog'
  | 'pomodoro'
  | 'eisenhower'
  | 'systemist'
  | 'medium-method'
  | 'okrs'
  | 'weekly-review'
  | 'commitment-inventory'
  | 'smart-goals'
  | 'para'
  | 'deep-work'
  | 'pareto';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type EnergyPattern = 'morning' | 'night' | 'variable';

export type PreferredStyle = 'structured' | 'flexible';

export type UserRole =
  | 'mahasiswa'
  | 'profesional'
  | 'freelancer'
  | 'entrepreneur'
  | 'lainnya';

// ============================================
// User Input Types
// ============================================

export interface Personalization {
  name: string;
  role: UserRole;
  bigGoal: string;
  currentProblem: string;
  deadline?: string;
  energyPattern: EnergyPattern;
  preferredStyle: PreferredStyle;
}

export interface UserStory {
  rawText: string;
  personalization?: Personalization;
  submittedAt: string;
}

// ============================================
// Task Types
// ============================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  estimatedMinutes: number;
  deadline?: string;
  category: string;
  isCompleted: boolean;
  completed?: boolean;
  framework: FrameworkId;
  frameworkId?: FrameworkId;
  source?: 'dashboard' | 'framework' | 'manual' | 'ai';
  subtasks?: string[];
  durationLabel?: string;
}

// ============================================
// Framework-Specific Data Types
// ============================================

export interface GTDData {
  inbox: Task[];
  nextActions: Task[];
  waitingFor: Task[];
  projects: { name: string; tasks: Task[] }[];
  someday: Task[];
}

export interface KanbanData {
  backlog: Task[];
  inProgress: Task[];
  done: Task[];
}

export interface TimeBlockData {
  schedule: {
    id?: string;
    time: string;
    task: string;
    title?: string;
    duration: number;
    category: string;
    priority?: Priority;
    isCompleted?: boolean;
    completed?: boolean;
    source?: 'framework';
    frameworkId?: FrameworkId;
  }[];
}

export interface EatTheFrogData {
  frog: Task & { reason: string };
  secondaryTasks: Task[];
}

export interface PomodoroTask {
  id: string;
  title: string;
  duration: number;
  breakDuration: number;
  sessions: number;
  completedSessions: number;
  isCompleted?: boolean;
  completed?: boolean;
  source?: 'framework';
  frameworkId?: FrameworkId;
  distractionCount?: number;
  distractions?: { timestamp: string; note: string }[];
}

export interface PomodoroData {
  tasks: PomodoroTask[];
}

export interface EisenhowerData {
  doNow: Task[];
  schedule: Task[];
  delegate: Task[];
  eliminate: Task[];
}

export interface SystemistData {
  morning: (string | Task)[];
  workTasks: Task[];
  evening: (string | Task)[];
  recurring: Task[];
}

export interface MediumMethodData {
  days: {
    label: string;
    mainTask: Task;
    supportTasks: Task[];
  }[];
}

export interface OKRData {
  objective: string;
  keyResults: {
    id?: string;
    kr: string;
    title?: string;
    metric: string;
    deadline: string;
    progress: number;
    isCompleted?: boolean;
    completed?: boolean;
    source?: 'framework';
    frameworkId?: FrameworkId;
  }[];
}

export interface WeeklyReviewData {
  winsThisWeek: string[];
  lessonsLearned: string[];
  nextWeekFocus: (string | Task)[];
}

export interface CommitmentInventoryData {
  commitments: {
    id?: string;
    name: string;
    title?: string;
    urgency: Priority;
    category: string;
    recommendation: 'continue' | 'drop' | 'delegate' | 'schedule';
    reason: string;
    isCompleted?: boolean;
    completed?: boolean;
    source?: 'framework';
    frameworkId?: FrameworkId;
  }[];
}

export interface SMARTGoalsData {
  goals: {
    id?: string;
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
    progress: number;
    isCompleted?: boolean;
    completed?: boolean;
    source?: 'framework';
    frameworkId?: FrameworkId;
  }[];
}

export interface PARAData {
  projects: { id?: string; name: string; title?: string; description: string; tasks: Task[]; isCompleted?: boolean; completed?: boolean; source?: 'framework'; frameworkId?: FrameworkId }[];
  areas: { id?: string; name: string; title?: string; description: string; isCompleted?: boolean; completed?: boolean; source?: 'framework'; frameworkId?: FrameworkId }[];
  resources: { id?: string; name: string; title?: string; description: string; isCompleted?: boolean; completed?: boolean; source?: 'framework'; frameworkId?: FrameworkId }[];
  archives: { id?: string; name: string; title?: string; description: string; isCompleted?: boolean; completed?: boolean; source?: 'framework'; frameworkId?: FrameworkId }[];
}

export interface DeepWorkData {
  focusGoal: string;
  deepBlocks: {
    id?: string;
    start: string;
    end: string;
    task: string;
    title?: string;
    isCompleted?: boolean;
    completed?: boolean;
    source?: 'framework';
    frameworkId?: FrameworkId;
  }[];
  shallowTasks: (string | Task)[];
  distractions: string[];
  shutdownRitual: (string | Task)[];
}

export interface ParetoData {
  highImpact: (string | Task)[];
  maintenance: (string | Task)[];
  eliminate: (string | Task)[];
  leverage: (string | Task)[];
}

export type FrameworkRawData =
  | GTDData
  | KanbanData
  | TimeBlockData
  | EatTheFrogData
  | PomodoroData
  | EisenhowerData
  | SystemistData
  | MediumMethodData
  | OKRData
  | WeeklyReviewData
  | CommitmentInventoryData
  | SMARTGoalsData
  | PARAData
  | DeepWorkData
  | ParetoData;

// ============================================
// Framework Output (dari AI)
// ============================================

export interface FrameworkOutput {
  frameworkId: FrameworkId;
  isRecommended: boolean;
  recommendationScore: number;  // 0–100
  recommendationReason: string;
  tasks: Task[];
  todayActions: string[];
  rawData: FrameworkRawData;
}

// ============================================
// Session (disimpan ke localStorage)
// ============================================

export interface PTSession {
  sessionId: string;
  story: UserStory;
  processedAt: string;
  frameworks: FrameworkOutput[];
  topRecommendation: FrameworkId;
  topRecommendationReason: string;
  masterTaskList: Task[];
  todayPlan: string[];
  isDemo: boolean;
}

// ============================================
// API Types
// ============================================

export interface ProcessStoryRequest {
  story: string;
  personalization?: Personalization;
}

export interface ProcessStoryResponse {
  success: boolean;
  data?: PTSession;
  error?: string;
}
