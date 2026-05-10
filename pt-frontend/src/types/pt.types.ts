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
  framework: FrameworkId;
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
    time: string;
    task: string;
    duration: number;
    category: string;
  }[];
}

export interface EatTheFrogData {
  frog: { task: Task; reason: string };
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
  morning: string[];
  workTasks: Task[];
  evening: string[];
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
    kr: string;
    metric: string;
    deadline: string;
    progress: number;
  }[];
}

export interface WeeklyReviewData {
  winsThisWeek: string[];
  lessonsLearned: string[];
  nextWeekFocus: string[];
}

export interface CommitmentInventoryData {
  commitments: {
    name: string;
    urgency: Priority;
    category: string;
    recommendation: 'continue' | 'drop' | 'delegate';
    reason: string;
  }[];
}

export interface SMARTGoalsData {
  goals: {
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
    progress: number;
  }[];
}

export interface PARAData {
  projects: { name: string; description: string; tasks: Task[] }[];
  areas: { name: string; description: string }[];
  resources: { name: string; description: string }[];
  archives: { name: string; description: string }[];
}

export interface DeepWorkData {
  focusGoal: string;
  deepBlocks: {
    start: string;
    end: string;
    task: string;
  }[];
  shallowTasks: string[];
  distractions: string[];
  shutdownRitual: string[];
}

export interface ParetoData {
  highImpact: string[];
  maintenance: string[];
  eliminate: string[];
  leverage: string[];
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
