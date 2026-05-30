/* ============================================
   Promptivity — AI Output Parser
   
   Tugas parser ini:
   1. Terima raw JSON dari backend (sudah di-parse dari string)
   2. Validasi semua field yang dibutuhkan
   3. Fill missing/invalid data dengan safe defaults
   4. Return typed PTSession yang dijamin valid
   
   FILOSOFI: Parser tidak pernah throw.
   Kalau data tidak ada → pakai default.
   Kalau data rusak → pakai default.
   App harus selalu jalan.
   ============================================ */

import { v4 as uuidv4 } from 'uuid';
import type {
  PTSession,
  FrameworkOutput,
  Task,
  Priority,
  FrameworkId,
  Personalization,
  FrameworkRawData,
} from '@/types/pt.types';
import { FRAMEWORK_IDS } from '@/lib/frameworkConfig';

/* ============================================
   Edge case helpers
   ============================================ */

/** Ensure a string value is not one of these fallback markers */
function isRealValue(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const EMPTY_MARKERS = [
    'To be defined', 'Not specified', 'N/A', 'TBD', 'None',
    'null', 'undefined', '', 'no data', 'N/A.',
  ];
  return !EMPTY_MARKERS.includes(val.trim());
}

/** Safely parse a date string, return undefined if invalid */
function safeDate(val: unknown): string | undefined {
  if (typeof val !== 'string' || !val.trim()) return undefined;
  // Accept descriptive dates too ("Akhir bulan", "Next week")
  if (val.length < 4) return undefined;
  return val.trim();
}


// ---- Safe string helper ----
function safeStr(val: unknown, fallback = ''): string {
  if (typeof val === 'string' && val.trim().length > 0) return val.trim();
  return fallback;
}

// ---- Safe number helper ----
function safeNum(val: unknown, fallback = 0, min = 0, max = Infinity): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

// ---- Safe array helper ----
function safeArr<T>(val: unknown, fallback: T[] = []): T[] {
  return Array.isArray(val) ? val : fallback;
}

// ---- Safe boolean helper ----
function safeBool(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

// ---- Validate FrameworkId ----
function isValidFrameworkId(id: unknown): id is FrameworkId {
  return typeof id === 'string' && (FRAMEWORK_IDS as readonly string[]).includes(id);
}

// ---- Validate Priority ----
const VALID_PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
function safePriority(val: unknown): Priority {
  if (typeof val === 'string' && VALID_PRIORITIES.includes(val as Priority)) {
    return val as Priority;
  }
  return 'medium';
}

function safeSource(val: unknown): Task['source'] {
  return val === 'dashboard' || val === 'framework' || val === 'manual' || val === 'ai'
    ? val
    : 'framework';
}

function safeCompletion(obj: Record<string, unknown>): boolean {
  return safeBool(obj.isCompleted ?? obj.completed, false);
}

function generatedId(frameworkId: FrameworkId, prefix: string, index?: number): string {
  const suffix = typeof index === 'number' ? `${Date.now()}-${index}` : uuidv4().slice(0, 8);
  return `${frameworkId}-${prefix}-${suffix}`;
}

/* ============================================
   parseTask — Parse satu task object
   ============================================ */
export function parseTask(raw: unknown, frameworkId: FrameworkId = 'gtd'): Task {
  if (typeof raw === 'string') {
    return {
      id:               `task_${uuidv4().slice(0, 8)}`,
      title:            safeStr(raw, 'Clarify next action'),
      description:      '',
      priority:         'medium',
      estimatedMinutes: 30,
      category:         'general',
      isCompleted:      false,
      completed:        false,
      framework:        frameworkId,
      frameworkId,
      source:           'framework',
    };
  }

  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const framework = isValidFrameworkId(obj.framework) ? obj.framework : frameworkId;
  const normalizedFrameworkId = isValidFrameworkId(obj.frameworkId) ? obj.frameworkId : framework;
  const completed = safeCompletion(obj);

  return {
    id:               safeStr(obj.id, `task_${uuidv4().slice(0, 8)}`),
    title:            safeStr(obj.title ?? obj.task ?? obj.name ?? obj.kr ?? obj.mainTask, 'Clarify next action'),
    description:      safeStr(obj.description),
    priority:         safePriority(obj.priority),
    estimatedMinutes: safeNum(obj.estimatedMinutes, 30, 5, 480),
    deadline:         safeDate(obj.deadline),    // ← Use safeDate instead of safeStr
    category:         safeStr(obj.category, 'general'),
    isCompleted:      completed,
    completed,
    framework,
    frameworkId:      normalizedFrameworkId,
    source:           safeSource(obj.source),
  };
}

/* ============================================
   parseTasks — Parse array of tasks
   ============================================ */
export function parseTasks(raw: unknown, frameworkId: FrameworkId): Task[] {
  return safeArr(raw).map((item) => parseTask(item, frameworkId));
}

/* ============================================
   parseFrameworkOutput — Parse satu framework
   ============================================ */
interface ParseFrameworkOptions {
  ensureContent?: boolean;
}

export function parseFrameworkOutput(
  frameworkId: FrameworkId,
  raw:         unknown,
  options:     ParseFrameworkOptions = {},
): FrameworkOutput {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const nestedRawData = toRecord(obj.rawData) ?? toRecord(obj.data);
  const rawSource = nestedRawData ?? obj;
  const hasGeneratedRawData = hasFrameworkSpecificContent(frameworkId, rawSource);
  const shouldParseRawData = options.ensureContent || hasGeneratedRawData;
  const frameworkSource = options.ensureContent
    ? ensureFrameworkData(frameworkId, rawSource)
    : rawSource;

  // Extract tasks from various possible locations in raw data
  let tasks = parseTasks(
    frameworkSource.tasks ??
    frameworkSource.nextActions ??
    frameworkSource.backlog ??
    frameworkSource.workTasks ??
    obj.tasks ??
    [],
    frameworkId,
  );

  // Parse rawData — framework-specific fields
  const rawData = shouldParseRawData
    ? parseFrameworkRawData(frameworkId, frameworkSource) as FrameworkRawData
    : ({} as FrameworkRawData);

  // Fallback: If no tasks extracted, try to find them in rawData (e.g. PARA projects)
  if (tasks.length === 0) {
    if (frameworkId === 'para' && 'projects' in rawData) {
      tasks = (rawData as any).projects.flatMap((p: any) => p.tasks || []);
    } else if (frameworkId === 'gtd' && 'projects' in rawData) {
      tasks = (rawData as any).projects.flatMap((p: any) => p.tasks || []);
    }
  }

  // Final safety net for generated framework responses.
  if (tasks.length === 0 && options.ensureContent) {
    tasks = getFrameworkFallbacks(frameworkId);
  }

  return {
    frameworkId,
    isRecommended:        safeBool(obj.isRecommended, false),
    recommendationScore:  safeNum(obj.recommendationScore, 50, 0, 100),
    recommendationReason: safeStr(
      obj.recommendationReason,
      'No recommendation data extracted for this framework.',
    ),
    tasks,
    todayActions: ensureTodayActions(
      frameworkId,
      safeArr<string>(obj.todayActions).map((a) => safeStr(a)).filter(Boolean),
      rawData,
      options.ensureContent,
    ),
    rawData,
  };
}

/**
 * Returns a set of fallback tasks specific to a framework
 */
function getFrameworkFallbacks(frameworkId: FrameworkId): Task[] {
  const titles = extractActionTitles(frameworkId, buildFrameworkFallback(frameworkId)).slice(0, 3);

  return titles.map((title, i) => ({
    id: `fallback_${frameworkId}_${i}`,
    title,
    description: 'Auto-generated starter task.',
    priority: i === 0 ? 'high' : 'medium',
    estimatedMinutes: i === 0 ? 30 : 25,
    category: 'general',
    isCompleted: false,
    completed: false,
    framework: frameworkId,
    frameworkId,
    source: 'framework',
  }));
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>).some(hasValue);
  }
  return value !== null && value !== undefined;
}

function countList(value: unknown): number {
  return safeArr(value).filter(hasValue).length;
}

function countProjects(value: unknown): number {
  return safeArr<unknown>(value).reduce<number>((sum, item) => {
    const project = toRecord(item);
    if (!project) return sum + (hasValue(item) ? 1 : 0);
    return sum + (hasValue(project.name) || hasValue(project.description) ? 1 : 0) + countList(project.tasks);
  }, 0);
}

function countActionableItems(frameworkId: FrameworkId, data: Record<string, unknown>): number {
  switch (frameworkId) {
    case 'gtd':
      return countList(data.inbox) + countList(data.nextActions) + countProjects(data.projects);
    case 'kanban':
      return countList(data.backlog ?? data.todo);
    case 'time-blocking':
      return countList(data.schedule);
    case 'eat-the-frog':
      return (hasValue(data.frog) ? 1 : 0) + countList(data.secondaryTasks);
    case 'pomodoro':
      return countList(data.tasks);
    case 'eisenhower':
      return countList(data.doNow) + countList(data.schedule) + countList(data.delegate) + countList(data.eliminate);
    case 'systemist':
      return countList(data.morning) + countList(data.workTasks) + countList(data.evening) + countList(data.recurring);
    case 'medium-method':
      return safeArr<unknown>(data.days).reduce<number>((sum, dayRaw) => {
        const day = toRecord(dayRaw);
        return day ? sum + (hasValue(day.mainTask) ? 1 : 0) + countList(day.supportTasks) : sum;
      }, 0);
    case 'okrs':
      return countList(data.keyResults);
    case 'weekly-review':
      return countList(data.winsThisWeek) + countList(data.lessonsLearned) + countList(data.nextWeekFocus);
    case 'commitment-inventory':
      return countList(data.commitments);
    case 'smart-goals':
      return safeArr<unknown>(data.goals).reduce<number>((sum, goalRaw) => {
        const goal = toRecord(goalRaw);
        if (!goal) return sum + (hasValue(goalRaw) ? 1 : 0);
        return sum + ['title', 'specific', 'measurable', 'achievable', 'relevant', 'timeBound']
          .filter((key) => hasValue(goal[key])).length;
      }, 0);
    case 'para':
      return countProjects(data.projects) + countList(data.areas) + countList(data.resources) + countList(data.archives);
    case 'deep-work':
      return (hasValue(data.focusGoal) ? 1 : 0) + countList(data.deepBlocks) + countList(data.shallowTasks) + countList(data.distractions) + countList(data.shutdownRitual);
    case 'pareto':
      return countList(data.highImpact) + countList(data.maintenance) + countList(data.eliminate) + countList(data.leverage);
  }
}

function frameworkHasMinimum(frameworkId: FrameworkId, data: Record<string, unknown>): boolean {
  if (countActionableItems(frameworkId, data) < 3) return false;

  switch (frameworkId) {
    case 'gtd':
      return countList(data.inbox) >= 3 && countList(data.nextActions) >= 3 && countList(data.projects) >= 1;
    case 'kanban':
      return countList(data.backlog ?? data.todo) >= 3;
    case 'time-blocking':
      return countList(data.schedule) >= 3;
    case 'eat-the-frog':
      return hasValue(data.frog) && countList(data.secondaryTasks) >= 3;
    case 'pomodoro':
      return countList(data.tasks) >= 3;
    case 'eisenhower':
      return countActionableItems(frameworkId, data) >= 3;
    case 'systemist':
      return countList(data.morning) > 0 && countList(data.workTasks) > 0 && countList(data.evening) > 0;
    case 'medium-method':
      return safeArr(data.days).length >= 3 && safeArr(data.days).slice(0, 3).every((dayRaw) => {
        const day = toRecord(dayRaw);
        return !!day && hasValue(day.mainTask) && countList(day.supportTasks) > 0;
      });
    case 'okrs':
      return hasValue(data.objective) && countList(data.keyResults) >= 3;
    case 'weekly-review':
      return countList(data.winsThisWeek) > 0 && countList(data.lessonsLearned) > 0 && countList(data.nextWeekFocus) >= 3;
    case 'commitment-inventory':
      return countList(data.commitments) >= 3;
    case 'smart-goals':
      return countList(data.goals) >= 1;
    case 'para':
      return countList(data.projects) > 0 && countList(data.areas) > 0 && countList(data.resources) > 0 && Array.isArray(data.archives ?? []);
    case 'deep-work':
      return hasValue(data.focusGoal) && countList(data.deepBlocks) > 0 && countList(data.shallowTasks) > 0 && countList(data.distractions) > 0 && countList(data.shutdownRitual) > 0;
    case 'pareto':
      return countList(data.highImpact) > 0 && countList(data.maintenance) > 0 && countList(data.eliminate) > 0 && countList(data.leverage) > 0;
  }
}

function hasFrameworkSpecificContent(frameworkId: FrameworkId, data: Record<string, unknown>): boolean {
  const primaryKeys: Record<FrameworkId, string[]> = {
    gtd: ['inbox', 'nextActions', 'projects'],
    kanban: ['backlog', 'todo', 'inProgress', 'done'],
    'time-blocking': ['schedule'],
    'eat-the-frog': ['frog', 'secondaryTasks'],
    pomodoro: ['tasks'],
    eisenhower: ['doNow', 'schedule', 'delegate', 'eliminate'],
    systemist: ['morning', 'workTasks', 'evening', 'recurring'],
    'medium-method': ['days'],
    okrs: ['objective', 'keyResults'],
    'weekly-review': ['winsThisWeek', 'lessonsLearned', 'nextWeekFocus'],
    'commitment-inventory': ['commitments'],
    'smart-goals': ['goals'],
    para: ['projects', 'areas', 'resources', 'archives'],
    'deep-work': ['focusGoal', 'deepBlocks', 'shallowTasks', 'distractions', 'shutdownRitual'],
    pareto: ['highImpact', 'maintenance', 'eliminate', 'leverage'],
  };

  return primaryKeys[frameworkId].some((key) => hasValue(data[key]));
}

export function ensureFrameworkData(frameworkId: FrameworkId, data: unknown): Record<string, unknown> {
  const record = toRecord(data) ?? {};
  return frameworkHasMinimum(frameworkId, record) ? record : buildFrameworkFallback(frameworkId);
}

export function hasFrameworkData(frameworkId: FrameworkId, data: unknown): boolean {
  return hasGeneratedTasks(frameworkId, data);
}

export function hasGeneratedTasks(frameworkId: FrameworkId, data: unknown): boolean {
  const record = toRecord(data);
  return !!record && frameworkHasMinimum(frameworkId, record);
}

function buildFrameworkFallback(frameworkId: FrameworkId): Record<string, unknown> {
  const fallbacks: Record<FrameworkId, Record<string, unknown>> = {
    gtd: {
      inbox: [
        'Clarify everything currently on your mind',
        'List all unfinished responsibilities',
        'Capture any deadline or commitment',
      ],
      nextActions: [
        'Choose the most urgent task',
        'Break it into the next physical action',
        'Schedule when to do it',
      ],
      projects: ['Organize current responsibilities'],
      waitingFor: [],
      someday: [],
    },
    kanban: {
      backlog: [
        'Clarify current priorities',
        'Break big task into smaller task',
        'Prepare next action',
      ],
      inProgress: [],
      done: [],
    },
    'time-blocking': {
      schedule: [
        { time: '09:00', task: 'Clarify priorities', duration: 30, category: 'work', priority: 'high' },
        { time: '10:00', task: 'Work on highest priority task', duration: 60, category: 'work', priority: 'critical' },
        { time: '13:00', task: 'Review progress and adjust plan', duration: 30, category: 'work', priority: 'medium' },
      ],
    },
    'eat-the-frog': {
      frog: {
        title: 'Do the most important unfinished responsibility first',
        task: 'Do the most important unfinished responsibility first',
        reason: 'This reduces mental load and creates momentum early.',
        estimatedMinutes: 90,
        priority: 'critical',
        category: 'work',
      },
      secondaryTasks: [
        'Prepare materials',
        'Handle smaller follow-up task',
        'Review progress',
      ],
    },
    pomodoro: {
      tasks: [
        { title: 'Prioritize urgent tasks', sessions: 2, duration: 25, breakDuration: 5 },
        { title: 'Deep focus work block', sessions: 3, duration: 25, breakDuration: 5 },
        { title: 'Review and organize next steps', sessions: 1, duration: 25, breakDuration: 5 },
      ],
    },
    eisenhower: {
      doNow: ['Handle the most urgent important task'],
      schedule: ['Plan important non-urgent work'],
      delegate: ['Identify task that can be simplified or delegated'],
      eliminate: ['Remove one low-value distraction'],
    },
    systemist: {
      morning: [
        "Review today's priorities",
        'Pick one main focus',
        'Prepare workspace',
      ],
      workTasks: [
        'Execute highest priority task',
        'Batch small admin tasks',
        'Review progress',
      ],
      evening: [
        'Reflect on what worked',
        'Plan tomorrow',
        'Close unfinished loops',
      ],
      recurring: ['Daily planning check-in'],
    },
    'medium-method': {
      days: [
        { day: 'Day 1', label: 'Day 1', mainTask: 'Clarify priorities', supportTasks: ['List blockers', 'Choose one task'] },
        { day: 'Day 2', label: 'Day 2', mainTask: 'Execute core work', supportTasks: ['Start focused block', 'Review progress'] },
        { day: 'Day 3', label: 'Day 3', mainTask: 'Stabilize system', supportTasks: ['Clean backlog', 'Plan next cycle'] },
      ],
    },
    okrs: {
      objective: 'Create clearer progress from current responsibilities',
      keyResults: [
        { kr: 'Finish 3 priority tasks', metric: '3 tasks completed', progress: 0 },
        { kr: 'Reduce backlog by 30%', metric: 'backlog reduction', progress: 0 },
        { kr: 'Complete one focused work session daily', metric: 'focus sessions', progress: 0 },
      ],
    },
    'weekly-review': {
      winsThisWeek: ['Captured current responsibilities'],
      lessonsLearned: ['Unclear priorities create friction'],
      nextWeekFocus: [
        'Choose fewer priorities',
        'Schedule deep work',
        'Review progress daily',
      ],
    },
    'commitment-inventory': {
      commitments: [
        {
          name: 'Current main responsibility',
          urgency: 'high',
          category: 'work',
          recommendation: 'continue',
          reason: 'This appears connected to your current pressure.',
        },
        {
          name: 'Low-value distractions',
          urgency: 'low',
          category: 'personal',
          recommendation: 'drop',
          reason: 'This may reduce focus.',
        },
        {
          name: 'Pending personal maintenance',
          urgency: 'medium',
          category: 'personal',
          recommendation: 'schedule',
          reason: 'Small tasks should be planned instead of carried mentally.',
        },
      ],
    },
    'smart-goals': {
      goals: [
        {
          title: "Complete today's most important task",
          specific: 'Choose one concrete task and finish it',
          measurable: 'Task marked complete',
          achievable: 'Can be done in one focused session',
          relevant: 'Reduces current mental load',
          timeBound: 'Today',
          progress: 0,
        },
      ],
    },
    para: {
      projects: ['Current active mission'],
      areas: ['Personal productivity', 'Responsibilities'],
      resources: ['Notes from brain dump', 'Generated action plan'],
      archives: [],
    },
    'deep-work': {
      focusGoal: 'Make progress on the highest-value task',
      deepBlocks: [
        { start: '09:00', end: '10:30', task: 'Deep focus on main task' },
        { start: '14:00', end: '15:00', task: 'Continue focused execution' },
      ],
      shallowTasks: [
        'Reply to simple messages',
        'Organize notes',
        'Review task list',
      ],
      distractions: [
        'Social media',
        'Unplanned task switching',
      ],
      shutdownRitual: [
        'Review what was completed',
        'Write next action',
        'Close workspace',
      ],
    },
    pareto: {
      highImpact: [
        'Identify the one task with the biggest payoff',
        'Work on the task that unlocks other tasks',
        'Finish the action closest to deadline or goal impact',
      ],
      maintenance: ['Handle small admin tasks later'],
      eliminate: [
        'Remove one low-value distraction',
        'Postpone non-critical work',
      ],
      leverage: [
        'Batch similar tasks',
        'Reuse existing notes or templates',
      ],
    },
  };

  return fallbacks[frameworkId];
}

function extractActionTitles(frameworkId: FrameworkId, data: unknown): string[] {
  const record = toRecord(data) ?? {};
  const titles: string[] = [];

  const pushValue = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      titles.push(value.trim());
      return;
    }
    const obj = toRecord(value);
    if (!obj) return;
    const title = safeStr(obj.title ?? obj.task ?? obj.name ?? obj.kr ?? obj.mainTask);
    if (title) titles.push(title);
  };

  if (frameworkId === 'time-blocking') {
    safeArr(record.schedule).forEach((block) => pushValue(toRecord(block)?.task ?? block));
  } else if (frameworkId === 'eat-the-frog') {
    pushValue(record.frog);
    safeArr(record.secondaryTasks).forEach(pushValue);
  } else if (frameworkId === 'okrs') {
    safeArr(record.keyResults).forEach(pushValue);
  } else if (frameworkId === 'weekly-review') {
    safeArr(record.nextWeekFocus).forEach(pushValue);
  } else {
    Object.values(record).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          pushValue(item);
          const itemObj = toRecord(item);
          if (itemObj) safeArr(itemObj.tasks).forEach(pushValue);
        });
      } else {
        pushValue(value);
      }
    });
  }

  return [...new Set(titles)].slice(0, 8);
}

function ensureTodayActions(
  frameworkId: FrameworkId,
  actions: string[],
  rawData: FrameworkRawData,
  shouldEnsure = false,
): string[] {
  if (!shouldEnsure && actions.length > 0) return actions;
  if (actions.length >= 3) return actions.slice(0, 5);

  const nextActions = [...actions];
  for (const title of extractActionTitles(frameworkId, rawData)) {
    if (!nextActions.includes(title)) nextActions.push(title);
    if (nextActions.length >= 3) break;
  }

  return nextActions.length > 0
    ? nextActions.slice(0, 5)
    : [
      "Clarify today's top priority",
      'Break the main goal into smaller steps',
      'Schedule a focused work session',
    ];
}

/* ============================================
   parseFrameworkRawData — Framework-specific
   data extraction with safe defaults
   ============================================ */
function parseFrameworkRawData(
  frameworkId: FrameworkId,
  obj:         Record<string, unknown>,
): any {
  // Helper: parse string array
  const strArr = (val: unknown): string[] =>
    safeArr(val).map((s) => safeStr(s)).filter(Boolean);

  switch (frameworkId) {
    case 'gtd':
      return {
        inbox:       parseTasks(obj.inbox, 'gtd'),
        nextActions: parseTasks(obj.nextActions, 'gtd'),
        waitingFor:  parseTasks(obj.waitingFor, 'gtd'),
        projects:    safeArr(obj.projects).map((p: unknown) => {
          if (typeof p === 'string') {
            return {
              name:  safeStr(p, 'Organize current responsibilities'),
              tasks: [],
            };
          }
          const proj = (p as Record<string, unknown>) ?? {};
          return {
            name:  safeStr(proj.name, 'Untitled Project'),
            tasks: parseTasks(proj.tasks, 'gtd'),
          };
        }),
        someday:     parseTasks(obj.someday, 'gtd'),
      };

    case 'kanban':
      return {
        backlog:    parseTasks(obj.backlog ?? obj.todo, 'kanban'),
        inProgress: parseTasks(obj.inProgress, 'kanban'),
        done:       parseTasks(obj.done, 'kanban'),
      };

    case 'time-blocking':
      return {
        schedule: safeArr(obj.schedule).map((slot: unknown, index: number) => {
          const s = (slot as Record<string, unknown>) ?? {};
          const title = safeStr(s.task ?? s.title, 'Focus work');
          const completed = safeCompletion(s);
          return {
            id:       safeStr(s.id, generatedId('time-blocking', 'slot', index)),
            time:     safeStr(s.time, '09:00'),
            task:     title,
            title,
            duration: safeNum(s.duration, 60, 15, 240),
            category: safeStr(s.category, 'work'),
            priority: safePriority(s.priority),
            isCompleted: completed,
            completed,
            source: 'framework',
            frameworkId: 'time-blocking',
          };
        }),
      };

    case 'eat-the-frog': {
      // frog bisa jadi object atau string (edge case dari Gemini output lama)
      const frogRaw = obj.frog;
      let frogObj: Record<string, unknown> = {};

      if (typeof frogRaw === 'string') {
        // Gemini kadang return string — konversi ke object
        frogObj = { title: frogRaw, reason: 'This is your most important task.', estimatedMinutes: 90 };
      } else if (typeof frogRaw === 'object' && frogRaw !== null) {
        frogObj = frogRaw as Record<string, unknown>;
      }

      return {
        frog: {
          ...parseTask(frogObj, 'eat-the-frog'),
          title:            safeStr(frogObj.title ?? frogObj.task, 'Do the most important unfinished responsibility first'),
          reason:           safeStr(frogObj.reason, 'This is your highest priority item.'),
          estimatedMinutes: safeNum(frogObj.estimatedMinutes, 90, 15, 480),
          priority:         'critical' as Priority,
          category:         safeStr(frogObj.category, 'work'),
        },
        secondaryTasks: parseTasks(obj.secondaryTasks, 'eat-the-frog'),
      };
    }

    case 'pomodoro':
      return {
        tasks: safeArr(obj.tasks).map((s: unknown, index: number) => {
          const sess = (s as Record<string, unknown>) ?? {};
          const completed = safeCompletion(sess);
          return {
            id:            safeStr(sess.id, `pomodoro-${index}-${Date.now()}`),
            title:         safeStr(sess.title || sess.task, 'Focus session'),
            duration:      safeNum(sess.duration, 25, 5, 120),
            breakDuration: safeNum(sess.breakDuration, 5, 2, 30),
            sessions:      safeNum(sess.sessions || sess.pomodoroCount, 2, 1, 10),
            completedSessions: safeNum(sess.completedSessions, 0, 0, 10),
            isCompleted:   completed,
            completed,
            source:        'framework',
            frameworkId:   'pomodoro',
          };
        }),
      };

    case 'eisenhower':
      return {
        doNow:    parseTasks(obj.doNow, 'eisenhower'),
        schedule: parseTasks(obj.schedule, 'eisenhower'),
        delegate: parseTasks(obj.delegate, 'eisenhower'),
        eliminate:parseTasks(obj.eliminate, 'eisenhower'),
      };

    case 'systemist':
      return {
        morning:   parseTasks(obj.morning, 'systemist'),
        workTasks: parseTasks(obj.workTasks, 'systemist'),
        evening:   parseTasks(obj.evening, 'systemist'),
        recurring: parseTasks(obj.recurring, 'systemist'),
      };

    case 'medium-method':
      return {
        days: safeArr(obj.days).map((d: unknown) => {
          const day = (d as Record<string, unknown>) ?? {};
          return {
            label:        safeStr(day.label ?? day.day, 'Today'),
            mainTask:     parseTask(day.mainTask, 'medium-method'),
            supportTasks: parseTasks(day.supportTasks, 'medium-method'),
          };
        }),
      };

    case 'okrs':
      return {
        objective:  safeStr(obj.objective, 'Define your main objective'),
        keyResults: safeArr(obj.keyResults).map((kr: unknown, index: number) => {
          const k = (kr as Record<string, unknown>) ?? {};
          const progress = safeNum(k.progress, 0, 0, 100);
          const completed = safeBool(k.isCompleted ?? k.completed, progress >= 100);
          return {
            id:       safeStr(k.id, generatedId('okrs', 'kr', index)),
            kr:       safeStr(k.kr, 'Key result to be defined'),
            title:    safeStr(k.title ?? k.kr, 'Key result to be defined'),
            metric:   isRealValue(k.metric) ? safeStr(k.metric) : 'To be defined',
            deadline: safeDate(k.deadline) ?? '',
            progress,    // always default 0
            isCompleted: completed,
            completed,
            source: 'framework',
            frameworkId: 'okrs',
          };
        }),
      };

    case 'weekly-review':
      return {
        winsThisWeek:  strArr(obj.winsThisWeek),
        lessonsLearned:strArr(obj.lessonsLearned),
        nextWeekFocus: parseTasks(obj.nextWeekFocus, 'weekly-review'),
      };

    case 'commitment-inventory':
      return {
        commitments: safeArr(obj.commitments).map((c: unknown, index: number) => {
          const com = (c as Record<string, unknown>) ?? {};
          const rec = safeStr(com.recommendation, 'continue');
          const name = safeStr(com.name ?? com.title, 'Unnamed commitment');
          const completed = safeCompletion(com);
          return {
            id:             safeStr(com.id, generatedId('commitment-inventory', 'commitment', index)),
            name,
            title:          name,
            urgency:        safePriority(com.urgency),
            category:       safeStr(com.category, 'work'),
            recommendation: (['continue', 'drop', 'delegate', 'schedule'].includes(rec)
              ? rec
              : 'continue') as 'continue' | 'drop' | 'delegate' | 'schedule',
            reason:         safeStr(com.reason, 'Review this commitment.'),
            isCompleted:    completed,
            completed,
            source:         'framework',
            frameworkId:    'commitment-inventory',
          };
        }),
      };

    case 'smart-goals':
      return {
        goals: safeArr(obj.goals).map((g: unknown, index: number) => {
          const goal = (g as Record<string, unknown>) ?? {};
          const progress = safeNum(goal.progress, 0, 0, 100);
          const completed = safeBool(goal.isCompleted ?? goal.completed, progress >= 100);
          return {
            id:         safeStr(goal.id, generatedId('smart-goals', 'goal', index)),
            title:      safeStr(goal.title, 'Untitled Goal'),
            specific:   isRealValue(goal.specific)   ? safeStr(goal.specific)   : 'To be defined',
            measurable: isRealValue(goal.measurable) ? safeStr(goal.measurable) : 'To be defined',
            achievable: isRealValue(goal.achievable) ? safeStr(goal.achievable) : 'To be defined',
            relevant:   isRealValue(goal.relevant)   ? safeStr(goal.relevant)   : 'To be defined',
            timeBound:  isRealValue(goal.timeBound)  ? safeStr(goal.timeBound)  : 'To be defined',
            progress,
            isCompleted: completed,
            completed,
            source:     'framework',
            frameworkId:'smart-goals',
          };
        }).filter((g) => g.title !== 'Untitled Goal' || isRealValue(g.specific)),
      };

    case 'para':
      return {
        projects:  safeArr(obj.projects).map((p: unknown, index: number) => {
          if (typeof p === 'string') {
            return {
              id:          generatedId('para', 'project', index),
              name:        safeStr(p, 'Current active mission'),
              title:       safeStr(p, 'Current active mission'),
              description: '',
              tasks:       [],
              isCompleted: false,
              completed:   false,
              source:      'framework',
              frameworkId: 'para',
            };
          }
          const proj = (p as Record<string, unknown>) ?? {};
          const name = safeStr(proj.name ?? proj.title, 'Untitled Project');
          const completed = safeCompletion(proj);
          return {
            id:          safeStr(proj.id, generatedId('para', 'project', index)),
            name,
            title:       name,
            description: safeStr(proj.description, ''),
            tasks:       parseTasks(proj.tasks, 'para'),
            isCompleted: completed,
            completed,
            source:      'framework',
            frameworkId: 'para',
          };
        }),
        areas:     safeArr(obj.areas).map((a: unknown, index: number) => {
          if (typeof a === 'string') {
            return {
              id:          generatedId('para', 'area', index),
              name:        safeStr(a, 'Responsibilities'),
              title:       safeStr(a, 'Responsibilities'),
              description: '',
              isCompleted: false,
              completed:   false,
              source:      'framework',
              frameworkId: 'para',
            };
          }
          const area = (a as Record<string, unknown>) ?? {};
          const name = safeStr(area.name ?? area.title, 'Untitled Area');
          const completed = safeCompletion(area);
          return {
            id:          safeStr(area.id, generatedId('para', 'area', index)),
            name,
            title:       name,
            description: safeStr(area.description, ''),
            isCompleted: completed,
            completed,
            source:      'framework',
            frameworkId: 'para',
          };
        }),
        resources: safeArr(obj.resources).map((r: unknown, index: number) => {
          if (typeof r === 'string') {
            return {
              id:          generatedId('para', 'resource', index),
              name:        safeStr(r, 'Generated action plan'),
              title:       safeStr(r, 'Generated action plan'),
              description: '',
              isCompleted: false,
              completed:   false,
              source:      'framework',
              frameworkId: 'para',
            };
          }
          const res = (r as Record<string, unknown>) ?? {};
          const name = safeStr(res.name ?? res.title, 'Untitled Resource');
          const completed = safeCompletion(res);
          return {
            id:          safeStr(res.id, generatedId('para', 'resource', index)),
            name,
            title:       name,
            description: safeStr(res.description, ''),
            isCompleted: completed,
            completed,
            source:      'framework',
            frameworkId: 'para',
          };
        }),
        archives:  safeArr(obj.archives).map((a: unknown, index: number) => {
          if (typeof a === 'string') {
            return {
              id:          generatedId('para', 'archive', index),
              name:        safeStr(a, 'Archived item'),
              title:       safeStr(a, 'Archived item'),
              description: '',
              isCompleted: false,
              completed:   false,
              source:      'framework',
              frameworkId: 'para',
            };
          }
          const arc = (a as Record<string, unknown>) ?? {};
          const name = safeStr(arc.name ?? arc.title, 'Untitled Archive');
          const completed = safeCompletion(arc);
          return {
            id:          safeStr(arc.id, generatedId('para', 'archive', index)),
            name,
            title:       name,
            description: safeStr(arc.description, ''),
            isCompleted: completed,
            completed,
            source:      'framework',
            frameworkId: 'para',
          };
        }),
      };

    case 'deep-work':
      return {
        focusGoal: safeStr(obj.focusGoal, 'Make progress on the highest-value task'),
        deepBlocks: safeArr(obj.deepBlocks).map((block: unknown, index: number) => {
          const b = (block as Record<string, unknown>) ?? {};
          const title = safeStr(b.task ?? b.title, 'Deep focus on main task');
          const completed = safeCompletion(b);
          return {
            id:    safeStr(b.id, generatedId('deep-work', 'block', index)),
            start: safeStr(b.start, '09:00'),
            end:   safeStr(b.end, '10:30'),
            task:  title,
            title,
            isCompleted: completed,
            completed,
            source: 'framework',
            frameworkId: 'deep-work',
          };
        }),
        shallowTasks:    parseTasks(obj.shallowTasks, 'deep-work'),
        distractions:    strArr(obj.distractions),
        shutdownRitual:  parseTasks(obj.shutdownRitual, 'deep-work'),
      };

    case 'pareto':
      return {
        highImpact:  parseTasks(obj.highImpact, 'pareto'),
        maintenance: parseTasks(obj.maintenance, 'pareto'),
        eliminate:   parseTasks(obj.eliminate, 'pareto'),
        leverage:    parseTasks(obj.leverage, 'pareto'),
      };

    default:
      return obj;
  }
}

/* ============================================
   parseFrameworksArray — Parse the frameworks
   array from backend response.
   
   Backend returns frameworks as an array of
   FrameworkOutput objects. We need to ensure
   all 15 frameworks are present.
   ============================================ */
function parseFrameworksArray(raw: unknown): FrameworkOutput[] {
  // Backend dapat return frameworks sebagai array ATAU object
  let frameworksMap: Record<string, unknown> = {};

  if (Array.isArray(raw)) {
    // Array format: [{ frameworkId: 'gtd', ... }, ...] OR [{ id: 'gtd', score: 90, ... }]
    for (const item of raw) {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const id  = safeStr(obj.frameworkId || obj.id);
        if (id) frameworksMap[id] = obj;
      }
    }
  } else if (typeof raw === 'object' && raw !== null) {
    // Object format: { gtd: {...}, kanban: {...}, ... }
    frameworksMap = raw as Record<string, unknown>;
  }

  // Normalisasi: kadang Gemini wrap tasks langsung di framework level
  // contoh: frameworks.kanban.tasks = [...] instead of frameworks.kanban.backlog = [...]
  for (const fwId of FRAMEWORK_IDS) {
    const fw = frameworksMap[fwId] as Record<string, unknown> | undefined;
    if (!fw) continue;

    // If kanban has "tasks" instead of backlog/inProgress/done
    if (fwId === 'kanban' && !fw.backlog && Array.isArray(fw.tasks)) {
      fw.backlog = fw.tasks;
      fw.inProgress = [];
      fw.done = [];
    }

    // If eat-the-frog has tasks array instead of frog object
    if (fwId === 'eat-the-frog' && !fw.frog && Array.isArray(fw.tasks) && fw.tasks.length > 0) {
      const firstTask = fw.tasks[0] as Record<string, unknown>;
      fw.frog = {
        title:            firstTask.title ?? 'Your most important task',
        reason:           'This is your highest priority task.',
        estimatedMinutes: firstTask.estimatedMinutes ?? 90,
        priority:         'critical',
        category:         firstTask.category ?? 'work',
      };
      fw.secondaryTasks = fw.tasks.slice(1);
    }
  }

  // Build output list, ensure all 15 exist
  const result: FrameworkOutput[] = [];

  for (const fwId of FRAMEWORK_IDS) {
    const rawFw = frameworksMap[fwId];
    result.push(parseFrameworkOutput(fwId, rawFw ?? {}));
  }

  return result;
}

/* ============================================
   parseSession — Main entry point.
   Converts raw backend response to PTSession.
   
   NEVER throws. Always returns a valid PTSession.
   ============================================ */
export function parseSession(
  raw:             unknown,
  storyText:       string       = '',
  personalization?: Personalization,
): PTSession {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  // Parse frameworks
  const frameworks = parseFrameworksArray(obj.frameworks);

  // Find top recommendation — validate it's a real framework ID
  let topRec = safeStr(obj.topRecommendation, 'gtd');
  if (!isValidFrameworkId(topRec)) topRec = 'gtd';

  // Build master task list from all frameworks if not provided
  let masterTaskList = parseTasks(obj.masterTaskList, 'gtd');
  if (masterTaskList.length === 0) {
    // Fallback: collect tasks from top 3 frameworks
    const topFrameworks = frameworks
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 3);
    masterTaskList = topFrameworks.flatMap((fw) => fw.tasks).slice(0, 10);
  }

  // Build today plan
  let todayPlan = safeArr<string>(obj.todayPlan).map((a) =>
    safeStr(a),
  ).filter(Boolean);

  if (todayPlan.length === 0) {
    // Fallback: take today actions from top recommended framework
    const topFw = frameworks.find((f) => f.frameworkId === topRec);
    todayPlan   = topFw?.todayActions ?? ['Start with your most important task today.'];
  }

  return {
    sessionId:               safeStr(obj.sessionId, uuidv4()),
    story: {
      rawText:         storyText,
      personalization: personalization,
      submittedAt:     safeStr(
        (obj.story as Record<string, unknown>)?.submittedAt,
        new Date().toISOString(),
      ),
    },
    processedAt:             safeStr(obj.processedAt, new Date().toISOString()),
    frameworks,
    topRecommendation:       topRec as FrameworkId,
    topRecommendationReason: safeStr(
      obj.topRecommendationReason,
      'This framework best matches your current situation.',
    ),
    masterTaskList,
    todayPlan,
    isDemo:                  safeBool(obj.isDemo, false),
  };
}

/* ============================================
   validateSession — Check a PTSession object
   for minimum viability.
   
   Returns { valid: bool, issues: string[] }
   ============================================ */
export function validateSession(session: PTSession): {
  valid:  boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!session.sessionId)          issues.push('Missing sessionId');
  if (!session.topRecommendation)  issues.push('Missing topRecommendation');
  if (session.frameworks.length < 15) {
    issues.push(`Only ${session.frameworks.length}/15 frameworks present`);
  }
  if (session.masterTaskList.length === 0) {
    issues.push('masterTaskList is empty');
  }

  // Check all 15 framework IDs present
  const presentIds = new Set(session.frameworks.map((f) => f.frameworkId));
  for (const id of FRAMEWORK_IDS) {
    if (!presentIds.has(id)) {
      issues.push(`Missing framework: ${id}`);
    }
  }

  return {
    valid:  issues.length === 0,
    issues,
  };
}
