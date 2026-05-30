import type { FrameworkId, FrameworkRawData, Priority, Task } from '@/types/pt.types';

export type EisenhowerQuadrantId = 'doNow' | 'schedule' | 'delegate' | 'eliminate';

export interface FrameworkTaskDraft {
  id?: string;
  title?: string;
  task?: string;
  name?: string;
  description?: string;
  priority?: Priority;
  estimatedMinutes?: number;
  category?: string;
  completed?: boolean;
  isCompleted?: boolean;
  source?: Task['source'];
  frameworkId?: FrameworkId;
  framework?: FrameworkId;
  quadrant?: EisenhowerQuadrantId;
}

const EISENHOWER_QUADRANTS: EisenhowerQuadrantId[] = ['doNow', 'schedule', 'delegate', 'eliminate'];

export function isTaskCompleted(task: unknown): boolean {
  if (!isRecord(task)) return false;
  return Boolean(task.isCompleted ?? task.completed);
}

export function getTaskTitle(task: unknown): string {
  if (typeof task === 'string') return task.trim();
  if (!isRecord(task)) return '';
  const value = task.title ?? task.task ?? task.name ?? task.kr ?? task.mainTask;
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeFrameworkTask(
  raw: unknown,
  frameworkId: FrameworkId,
  index = 0,
  defaults: Partial<Task> & { quadrant?: EisenhowerQuadrantId } = {},
): Task & { quadrant?: EisenhowerQuadrantId } {
  const obj = isRecord(raw) ? raw : {};
  const title = getTaskTitle(raw) || defaults.title || 'Clarify next action';
  const completed = Boolean(obj.isCompleted ?? obj.completed ?? defaults.isCompleted ?? defaults.completed ?? false);
  const source = (obj.source === 'dashboard' || obj.source === 'manual' || obj.source === 'ai' || obj.source === 'framework')
    ? obj.source
    : defaults.source ?? 'framework';
  const quadrant = isEisenhowerQuadrant(obj.quadrant)
    ? obj.quadrant
    : isEisenhowerQuadrant(defaults.quadrant)
      ? defaults.quadrant
      : undefined;

  return {
    id: String(obj.id ?? defaults.id ?? `${frameworkId}-${Date.now()}-${index}`),
    title,
    description: typeof obj.description === 'string' ? obj.description : defaults.description ?? '',
    priority: normalizePriority(obj.priority ?? defaults.priority),
    estimatedMinutes: normalizeMinutes(obj.estimatedMinutes ?? defaults.estimatedMinutes),
    category: typeof obj.category === 'string' && obj.category.trim() ? obj.category.trim() : defaults.category ?? 'general',
    isCompleted: completed,
    completed,
    framework: frameworkId,
    frameworkId,
    source,
    quadrant,
  };
}

export function extractFrameworkTasks(frameworkId: FrameworkId, rawData: unknown): Task[] {
  const tasks: Task[] = [];
  const seen = new Set<string>();

  const addTask = (value: unknown, defaults: { quadrant?: EisenhowerQuadrantId } = {}) => {
    if (!isActionObject(value)) return;
    const task = normalizeFrameworkTask(value, frameworkId, tasks.length, defaults);
    if (seen.has(task.id)) return;
    seen.add(task.id);
    tasks.push(task);
  };

  if (!isRecord(rawData)) return tasks;

  if (frameworkId === 'eisenhower') {
    for (const quadrant of EISENHOWER_QUADRANTS) {
      const list = rawData[quadrant];
      if (Array.isArray(list)) list.forEach((item) => addTask(item, { quadrant }));
    }
    return tasks;
  }

  walkRawData(rawData, addTask);
  return tasks;
}

export function hasAllFrameworkTasksCompleted(frameworkId: FrameworkId, rawData: unknown): boolean {
  const tasks = extractFrameworkTasks(frameworkId, rawData);
  return tasks.length > 0 && tasks.every((task) => task.isCompleted || task.completed);
}

export function appendFrameworkTasks(
  frameworkId: FrameworkId,
  rawData: unknown,
  incomingTasks: unknown[],
  options: { source?: Task['source']; defaultQuadrant?: EisenhowerQuadrantId } = {},
): FrameworkRawData {
  const current = isRecord(rawData) ? rawData : {};
  const existingTitles = new Set(
    extractFrameworkTasks(frameworkId, current)
      .map((task) => task.title.toLowerCase().trim())
      .filter(Boolean),
  );
  const nextRawData = { ...current } as Record<string, unknown>;
  const uniqueTasks = incomingTasks
    .map((task, index) => normalizeFrameworkTask(
      task,
      frameworkId,
      index,
      { source: options.source ?? 'ai', quadrant: options.defaultQuadrant },
    ))
    .filter((task) => {
      const key = task.title.toLowerCase().trim();
      if (!key || existingTitles.has(key)) return false;
      existingTitles.add(key);
      return true;
    });

  if (frameworkId === 'eisenhower') {
    const quadrants = Object.fromEntries(
      EISENHOWER_QUADRANTS.map((quadrant) => [
        quadrant,
        Array.isArray(current[quadrant]) ? [...(current[quadrant] as unknown[])] : [],
      ]),
    ) as Record<EisenhowerQuadrantId, unknown[]>;

    uniqueTasks.forEach((task) => {
      const quadrant = isEisenhowerQuadrant(task.quadrant) ? task.quadrant : options.defaultQuadrant ?? 'doNow';
      quadrants[quadrant].push({ ...task, quadrant });
    });

    return { ...nextRawData, ...quadrants } as unknown as FrameworkRawData;
  }

  const targetKey = getDefaultAppendKey(frameworkId);
  const currentList = Array.isArray(current[targetKey]) ? current[targetKey] as unknown[] : [];
  return {
    ...nextRawData,
    [targetKey]: [...currentList, ...uniqueTasks],
  } as unknown as FrameworkRawData;
}

export function toggleTaskInRawData(rawData: unknown, taskId: string): { rawData: unknown; changed: boolean } {
  const toggle = (value: unknown): { value: unknown; changed: boolean } => {
    if (Array.isArray(value)) {
      let changed = false;
      const next = value.map((item) => {
        const result = toggle(item);
        changed = changed || result.changed;
        return result.value;
      });
      return { value: changed ? next : value, changed };
    }

    if (!isRecord(value)) return { value, changed: false };

    if (String(value.id ?? '') === taskId) {
      const completed = !Boolean(value.isCompleted ?? value.completed);
      const next: Record<string, unknown> = {
        ...value,
        isCompleted: completed,
        completed,
      };
      if (typeof value.progress === 'number') next.progress = completed ? 100 : 0;
      return { value: next, changed: true };
    }

    let changed = false;
    const next: Record<string, unknown> = { ...value };
    for (const [key, child] of Object.entries(value)) {
      const result = toggle(child);
      if (result.changed) {
        next[key] = result.value;
        changed = true;
      }
    }

    return { value: changed ? next : value, changed };
  };

  const result = toggle(rawData);
  return { rawData: result.value, changed: result.changed };
}

function walkRawData(value: unknown, addTask: (value: unknown) => void) {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      addTask(item);
      walkRawData(item, addTask);
    });
    return;
  }

  if (!isRecord(value)) return;
  for (const child of Object.values(value)) {
    walkRawData(child, addTask);
  }
}

function isActionObject(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!('id' in value)) return false;
  return Boolean(getTaskTitle(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePriority(value: unknown): Priority {
  return value === 'critical' || value === 'high' || value === 'medium' || value === 'low'
    ? value
    : 'medium';
}

function normalizeMinutes(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 30;
  return Math.max(5, Math.min(480, numberValue));
}

function isEisenhowerQuadrant(value: unknown): value is EisenhowerQuadrantId {
  return value === 'doNow' || value === 'schedule' || value === 'delegate' || value === 'eliminate';
}

function getDefaultAppendKey(frameworkId: FrameworkId): string {
  const map: Record<FrameworkId, string> = {
    gtd: 'nextActions',
    kanban: 'backlog',
    'time-blocking': 'schedule',
    'eat-the-frog': 'secondaryTasks',
    pomodoro: 'tasks',
    eisenhower: 'doNow',
    systemist: 'workTasks',
    'medium-method': 'days',
    okrs: 'keyResults',
    'weekly-review': 'nextWeekFocus',
    'commitment-inventory': 'commitments',
    'smart-goals': 'goals',
    para: 'projects',
    'deep-work': 'shallowTasks',
    pareto: 'highImpact',
  };
  return map[frameworkId];
}
