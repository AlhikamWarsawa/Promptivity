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

/* ============================================
   parseTask — Parse satu task object
   ============================================ */
export function parseTask(raw: unknown, frameworkId: FrameworkId = 'gtd'): Task {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  return {
    id:               safeStr(obj.id, `task_${uuidv4().slice(0, 8)}`),
    title:            safeStr(obj.title, 'Untitled Task'),
    description:      safeStr(obj.description),
    priority:         safePriority(obj.priority),
    estimatedMinutes: safeNum(obj.estimatedMinutes, 30, 5, 480),
    deadline:         safeDate(obj.deadline),    // ← Use safeDate instead of safeStr
    category:         safeStr(obj.category, 'general'),
    isCompleted:      safeBool(obj.isCompleted, false),
    framework:        isValidFrameworkId(obj.framework) ? obj.framework : frameworkId,
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
export function parseFrameworkOutput(
  frameworkId: FrameworkId,
  raw:         unknown,
): FrameworkOutput {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  // Extract tasks from various possible locations in raw data
  let tasks = parseTasks(
    obj.tasks ??
    obj.nextActions ??
    obj.backlog ??
    obj.workTasks ??
    [],
    frameworkId,
  );

  // Parse rawData — framework-specific fields
  const rawData = parseFrameworkRawData(frameworkId, obj) as FrameworkRawData;

  // Fallback: If no tasks extracted, try to find them in rawData (e.g. PARA projects)
  if (tasks.length === 0) {
    if (frameworkId === 'para' && 'projects' in rawData) {
      tasks = (rawData as any).projects.flatMap((p: any) => p.tasks || []);
    } else if (frameworkId === 'gtd' && 'projects' in rawData) {
      tasks = (rawData as any).projects.flatMap((p: any) => p.tasks || []);
    }
  }

  // Final Safety Net: If still empty, use hardcoded fallbacks
  if (tasks.length === 0) {
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
    todayActions: safeArr<string>(obj.todayActions).map((a) =>
      safeStr(a, 'Review your priorities for today'),
    ),
    rawData,
  };
}

/**
 * Returns a set of fallback tasks specific to a framework
 */
function getFrameworkFallbacks(frameworkId: FrameworkId): Task[] {
  const genericTasks = [
    { title: "Define your primary objective for today", priority: 'high', estimatedMinutes: 15 },
    { title: "Break down your biggest goal into smaller actions", priority: 'medium', estimatedMinutes: 30 },
    { title: "Review current progress and obstacles", priority: 'low', estimatedMinutes: 20 },
  ];

  return genericTasks.map((t, i) => ({
    id: `fallback_${frameworkId}_${i}`,
    title: t.title,
    description: 'Auto-generated starter task.',
    priority: t.priority as Priority,
    estimatedMinutes: t.estimatedMinutes,
    category: 'general',
    isCompleted: false,
    framework: frameworkId,
  }));
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
        inbox:       strArr(obj.inbox),
        nextActions: parseTasks(obj.nextActions, 'gtd'),
        waitingFor:  strArr(obj.waitingFor),
        projects:    safeArr(obj.projects).map((p: unknown) => {
          const proj = (p as Record<string, unknown>) ?? {};
          return {
            name:  safeStr(proj.name, 'Untitled Project'),
            tasks: parseTasks(proj.tasks, 'gtd'),
          };
        }),
        someday:     strArr(obj.someday),
      };

    case 'kanban':
      return {
        backlog:    parseTasks(obj.backlog, 'kanban'),
        inProgress: parseTasks(obj.inProgress, 'kanban'),
        done:       parseTasks(obj.done, 'kanban'),
      };

    case 'time-blocking':
      return {
        schedule: safeArr(obj.schedule).map((slot: unknown) => {
          const s = (slot as Record<string, unknown>) ?? {};
          return {
            time:     safeStr(s.time, '09:00'),
            task:     safeStr(s.task, 'Focus work'),
            duration: safeNum(s.duration, 60, 15, 240),
            category: safeStr(s.category, 'work'),
            priority: safePriority(s.priority),
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
          title:            safeStr(frogObj.title, 'Your most important task today'),
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
          return {
            id:            safeStr(sess.id, `pomodoro-${index}-${Date.now()}`),
            title:         safeStr(sess.title || sess.task, 'Focus session'),
            duration:      safeNum(sess.duration, 25, 5, 120),
            breakDuration: safeNum(sess.breakDuration, 5, 2, 30),
            sessions:      safeNum(sess.sessions || sess.pomodoroCount, 2, 1, 10),
            completedSessions: safeNum(sess.completedSessions, 0, 0, 10),
            isCompleted:   !!sess.isCompleted,
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
        morning:   strArr(obj.morning),
        workTasks: parseTasks(obj.workTasks, 'systemist'),
        evening:   strArr(obj.evening),
        recurring: parseTasks(obj.recurring, 'systemist'),
      };

    case 'medium-method':
      return {
        days: safeArr(obj.days).map((d: unknown) => {
          const day = (d as Record<string, unknown>) ?? {};
          return {
            label:        safeStr(day.label, 'Today'),
            mainTask:     parseTask(day.mainTask, 'medium-method'),
            supportTasks: parseTasks(day.supportTasks, 'medium-method'),
          };
        }),
      };

    case 'okrs':
      return {
        objective:  safeStr(obj.objective, 'Define your main objective'),
        keyResults: safeArr(obj.keyResults).map((kr: unknown) => {
          const k = (kr as Record<string, unknown>) ?? {};
          return {
            kr:       safeStr(k.kr, 'Key result to be defined'),
            metric:   isRealValue(k.metric) ? safeStr(k.metric) : 'To be defined',
            deadline: safeDate(k.deadline) ?? '',
            progress: safeNum(k.progress, 0, 0, 100),    // always default 0
          };
        }),
      };

    case 'weekly-review':
      return {
        winsThisWeek:  strArr(obj.winsThisWeek),
        lessonsLearned:strArr(obj.lessonsLearned),
        nextWeekFocus: strArr(obj.nextWeekFocus),
      };

    case 'commitment-inventory':
      return {
        commitments: safeArr(obj.commitments).map((c: unknown) => {
          const com = (c as Record<string, unknown>) ?? {};
          const rec = safeStr(com.recommendation, 'continue');
          return {
            name:           safeStr(com.name, 'Unnamed commitment'),
            urgency:        safePriority(com.urgency),
            category:       safeStr(com.category, 'work'),
            recommendation: (['continue', 'drop', 'delegate'].includes(rec)
              ? rec
              : 'continue') as 'continue' | 'drop' | 'delegate',
            reason:         safeStr(com.reason, 'Review this commitment.'),
          };
        }),
      };

    case 'smart-goals':
      return {
        goals: safeArr(obj.goals).map((g: unknown) => {
          const goal = (g as Record<string, unknown>) ?? {};
          return {
            title:      safeStr(goal.title, 'Untitled Goal'),
            specific:   isRealValue(goal.specific)   ? safeStr(goal.specific)   : 'To be defined',
            measurable: isRealValue(goal.measurable) ? safeStr(goal.measurable) : 'To be defined',
            achievable: isRealValue(goal.achievable) ? safeStr(goal.achievable) : 'To be defined',
            relevant:   isRealValue(goal.relevant)   ? safeStr(goal.relevant)   : 'To be defined',
            timeBound:  isRealValue(goal.timeBound)  ? safeStr(goal.timeBound)  : 'To be defined',
            progress:   safeNum(goal.progress, 0, 0, 100),
          };
        }).filter((g) => g.title !== 'Untitled Goal' || isRealValue(g.specific)),
      };

    case 'para':
      return {
        projects:  safeArr(obj.projects).map((p: unknown) => {
          const proj = (p as Record<string, unknown>) ?? {};
          return {
            name:        safeStr(proj.name, 'Untitled Project'),
            description: safeStr(proj.description, ''),
            tasks:       parseTasks(proj.tasks, 'para'),
          };
        }),
        areas:     safeArr(obj.areas).map((a: unknown) => {
          const area = (a as Record<string, unknown>) ?? {};
          return {
            name:        safeStr(area.name, 'Untitled Area'),
            description: safeStr(area.description, ''),
          };
        }),
        resources: safeArr(obj.resources).map((r: unknown) => {
          const res = (r as Record<string, unknown>) ?? {};
          return {
            name:        safeStr(res.name, 'Untitled Resource'),
            description: safeStr(res.description, ''),
          };
        }),
        archives:  safeArr(obj.archives).map((a: unknown) => {
          const arc = (a as Record<string, unknown>) ?? {};
          return {
            name:        safeStr(arc.name, 'Untitled Archive'),
            description: safeStr(arc.description, ''),
          };
        }),
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
   all 13 frameworks are present.
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

  // Build output list, ensure all 13 exist
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
  if (session.frameworks.length < 13) {
    issues.push(`Only ${session.frameworks.length}/13 frameworks present`);
  }
  if (session.masterTaskList.length === 0) {
    issues.push('masterTaskList is empty');
  }

  // Check all 13 framework IDs present
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
