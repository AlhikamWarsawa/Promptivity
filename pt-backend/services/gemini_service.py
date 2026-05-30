import os
import json
import uuid
import re
import hashlib
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional
import google.generativeai as genai
from google.api_core import exceptions

# Setup logging
QUOTA_LOG_FILE = "storage/logs/quota_errors.log"
os.makedirs(os.path.dirname(QUOTA_LOG_FILE), exist_ok=True)
logging.basicConfig(level=logging.INFO)
quota_logger = logging.getLogger("gemini_quota")
fh = logging.FileHandler(QUOTA_LOG_FILE)
fh.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
quota_logger.addHandler(fh)

# Safety settings
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
]

GENERATION_CONFIG = {
    "temperature":       0.4,
    "top_p":             0.95,
    "top_k":             40,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        self.storage_dir = "storage/stories"
        self.cache_dir   = "storage/cache"
        self.framework_cache_dir = "storage/frameworks"
        os.makedirs(self.storage_dir, exist_ok=True)
        os.makedirs(self.cache_dir, exist_ok=True)
        os.makedirs(self.framework_cache_dir, exist_ok=True)

    def _get_story_hash(self, story: str, personalization: Optional[dict]) -> str:
        data = {"story": story, "personalization": personalization}
        return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

    def _save_story(
        self,
        session_id: str,
        story: str,
        personalization: Optional[dict],
        dashboard_tasks: Optional[list] = None,
        today_plan: Optional[list] = None,
    ):
        path = os.path.join(self.storage_dir, f"{session_id}.json")
        with open(path, "w") as f:
            json.dump({
                "story": story,
                "personalization": personalization,
                "dashboardTasks": dashboard_tasks or [],
                "todayPlan": today_plan or [],
            }, f)

    def _load_story(self, session_id: str) -> dict:
        path = os.path.join(self.storage_dir, f"{session_id}.json")
        if not os.path.exists(path):
            raise ValueError("Session not found")
        with open(path, "r") as f:
            return json.load(f)

    def _get_cached_session(self, story_hash: str) -> Optional[dict]:
        path = os.path.join(self.cache_dir, f"{story_hash}.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return None

    def _cache_session(self, story_hash: str, session: dict):
        path = os.path.join(self.cache_dir, f"{story_hash}.json")
        with open(path, "w") as f:
            json.dump(session, f)

    def _get_cached_framework(self, session_id: str, framework_id: str) -> Optional[dict]:
        path = os.path.join(self.framework_cache_dir, f"{session_id}_{framework_id}.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return None

    def _cache_framework(self, session_id: str, framework_id: str, data: dict):
        path = os.path.join(self.framework_cache_dir, f"{session_id}_{framework_id}.json")
        with open(path, "w") as f:
            json.dump(data, f)

    async def process_story_initial(
        self,
        story:           str,
        personalization: Optional[dict] = None,
    ) -> dict:
        """Initial story analysis for the dashboard."""
        story_hash = self._get_story_hash(story, personalization)
        cached = self._get_cached_session(story_hash)
        if cached:
            self._save_story(
                cached.get("sessionId", str(uuid.uuid4())),
                story,
                personalization,
                cached.get("masterTaskList", []),
                cached.get("todayPlan", []),
            )
            return cached

        from services.prompts import DASHBOARD_SYSTEM_PROMPT, build_user_prompt
        user_prompt = build_user_prompt(story, personalization)
        
        response_text = await self._call_gemini(
            system_instruction=DASHBOARD_SYSTEM_PROMPT,
            prompt=user_prompt
        )
        parsed = self._parse_and_validate_dashboard(self._extract_json(response_text))
        
        session_id = str(uuid.uuid4())
        
        frameworks_list = []
        for fw in parsed.get("frameworks", []):
            frameworks_list.append({
                "frameworkId":          fw["id"],
                "recommendationScore":  fw["score"],
                "recommendationReason": fw["reason"],
                "isRecommended":        fw["score"] >= 75,
                "tasks":                [],
                "todayActions":         [],
                "rawData":              {},
            })

        session = {
            "sessionId":               session_id,
            "processedAt":             datetime.now(timezone.utc).isoformat(),
            "story": {
                "rawText":         story,
                "personalization": personalization,
                "submittedAt":     datetime.now(timezone.utc).isoformat(),
            },
            "topRecommendation":       parsed.get("topRecommendation", "gtd"),
            "topRecommendationReason": parsed.get("topRecommendationReason", ""),
            "masterTaskList":          parsed.get("masterTaskList", []),
            "todayPlan":               parsed.get("todayPlan", []),
            "frameworks":              frameworks_list,
            "isDemo":                  False,
        }
        self._save_story(
            session_id,
            story,
            personalization,
            session.get("masterTaskList", []),
            session.get("todayPlan", []),
        )
        
        self._cache_session(story_hash, session)
        return session

    async def generate_framework(self, session_id: str, framework_id: str) -> dict:
        """Generate specific framework data on demand."""
        cached = self._get_cached_framework(session_id, framework_id)
        if cached:
            cached_data = cached.get("rawData", {})
            ensured_data = self.ensure_framework_has_content(framework_id, cached_data)
            if ensured_data != cached_data:
                cached["rawData"] = ensured_data
                cached["todayActions"] = self._ensure_today_actions(
                    framework_id,
                    cached.get("todayActions", []),
                    ensured_data,
                )
                self._cache_framework(session_id, framework_id, cached)
            return cached

        from services.prompts import FRAMEWORK_SYSTEM_PROMPT, build_framework_prompt
        story_data = self._load_story(session_id)
        user_prompt = build_framework_prompt(
            story_data["story"], 
            framework_id, 
            story_data["personalization"],
            story_data.get("dashboardTasks", []),
            story_data.get("todayPlan", []),
        )
        
        system_instruction = FRAMEWORK_SYSTEM_PROMPT.replace("{framework_id}", framework_id)
        
        response_text = await self._call_gemini(
            system_instruction=system_instruction,
            prompt=user_prompt
        )
        parsed = self._extract_json(response_text)
        data = json.loads(parsed)
        
        framework_data = self.ensure_framework_has_content(
            framework_id,
            data.get("data", {}),
        )
        today_actions = self._ensure_today_actions(
            framework_id,
            data.get("todayActions", []),
            framework_data,
        )
        
        result = {
            "frameworkId":  framework_id,
            "rawData":      framework_data,
            "todayActions": today_actions,
            "tasks":        [], 
        }
        
        self._cache_framework(session_id, framework_id, result)
        return result

    def ensure_framework_has_content(self, framework_id: str, data: object) -> dict:
        """Return valid framework data with enough actionable content."""
        if isinstance(data, dict) and self._framework_meets_minimum(framework_id, data):
            return data
        return self.build_framework_fallback(framework_id)

    def count_actionable_items(self, framework_id: str, data: object) -> int:
        """Count concrete task/action content in a framework-specific object."""
        if not isinstance(data, dict):
            return 0

        try:
            if framework_id == "gtd":
                return (
                    self._count_list(data.get("inbox"))
                    + self._count_list(data.get("nextActions"))
                    + self._count_projects(data.get("projects"))
                )
            if framework_id == "kanban":
                return self._count_list(data.get("backlog")) + self._count_list(data.get("todo"))
            if framework_id == "time-blocking":
                return self._count_list(data.get("schedule"))
            if framework_id == "eat-the-frog":
                return (1 if self._has_actionable_value(data.get("frog")) else 0) + self._count_list(data.get("secondaryTasks"))
            if framework_id == "pomodoro":
                return self._count_list(data.get("tasks"))
            if framework_id == "eisenhower":
                return sum(self._count_list(data.get(key)) for key in ("doNow", "schedule", "delegate", "eliminate"))
            if framework_id == "systemist":
                return (
                    self._count_list(data.get("morning"))
                    + self._count_list(data.get("workTasks"))
                    + self._count_list(data.get("evening"))
                    + self._count_list(data.get("recurring"))
                )
            if framework_id == "medium-method":
                count = 0
                for day in data.get("days", []) if isinstance(data.get("days"), list) else []:
                    if isinstance(day, dict):
                        count += 1 if self._has_actionable_value(day.get("mainTask")) else 0
                        count += self._count_list(day.get("supportTasks"))
                return count
            if framework_id == "okrs":
                return self._count_list(data.get("keyResults"))
            if framework_id == "weekly-review":
                return (
                    self._count_list(data.get("winsThisWeek"))
                    + self._count_list(data.get("lessonsLearned"))
                    + self._count_list(data.get("nextWeekFocus"))
                )
            if framework_id == "commitment-inventory":
                return self._count_list(data.get("commitments"))
            if framework_id == "smart-goals":
                count = 0
                for goal in data.get("goals", []) if isinstance(data.get("goals"), list) else []:
                    if isinstance(goal, dict):
                        count += sum(
                            1
                            for key in ("title", "specific", "measurable", "achievable", "relevant", "timeBound")
                            if self._has_actionable_value(goal.get(key))
                        )
                    elif self._has_actionable_value(goal):
                        count += 1
                return count
            if framework_id == "para":
                return (
                    self._count_projects(data.get("projects"))
                    + self._count_list(data.get("areas"))
                    + self._count_list(data.get("resources"))
                    + self._count_list(data.get("archives"))
                )
            if framework_id == "deep-work":
                return (
                    (1 if self._has_actionable_value(data.get("focusGoal")) else 0)
                    + self._count_list(data.get("deepBlocks"))
                    + self._count_list(data.get("shallowTasks"))
                    + self._count_list(data.get("distractions"))
                    + self._count_list(data.get("shutdownRitual"))
                )
            if framework_id == "pareto":
                return sum(self._count_list(data.get(key)) for key in ("highImpact", "maintenance", "eliminate", "leverage"))
        except Exception:
            return 0

        return 0

    def build_framework_fallback(self, framework_id: str) -> dict:
        """Build framework-specific fallback content for vague or malformed AI output."""
        fallbacks = {
            "gtd": {
                "inbox": [
                    "Clarify everything currently on your mind",
                    "List all unfinished responsibilities",
                    "Capture any deadline or commitment",
                ],
                "nextActions": [
                    "Choose the most urgent task",
                    "Break it into the next physical action",
                    "Schedule when to do it",
                ],
                "projects": ["Organize current responsibilities"],
                "waitingFor": [],
                "someday": [],
            },
            "kanban": {
                "backlog": [
                    "Clarify current priorities",
                    "Break big task into smaller task",
                    "Prepare next action",
                ],
                "inProgress": [],
                "done": [],
            },
            "time-blocking": {
                "schedule": [
                    {"time": "09:00", "task": "Clarify priorities", "duration": 30, "category": "work", "priority": "high"},
                    {"time": "10:00", "task": "Work on highest priority task", "duration": 60, "category": "work", "priority": "critical"},
                    {"time": "13:00", "task": "Review progress and adjust plan", "duration": 30, "category": "work", "priority": "medium"},
                ],
            },
            "eat-the-frog": {
                "frog": {
                    "title": "Do the most important unfinished responsibility first",
                    "task": "Do the most important unfinished responsibility first",
                    "reason": "This reduces mental load and creates momentum early.",
                    "estimatedMinutes": 90,
                    "priority": "critical",
                    "category": "work",
                },
                "secondaryTasks": [
                    "Prepare materials",
                    "Handle smaller follow-up task",
                    "Review progress",
                ],
            },
            "pomodoro": {
                "tasks": [
                    {"title": "Prioritize urgent tasks", "sessions": 2, "duration": 25, "breakDuration": 5},
                    {"title": "Deep focus work block", "sessions": 3, "duration": 25, "breakDuration": 5},
                    {"title": "Review and organize next steps", "sessions": 1, "duration": 25, "breakDuration": 5},
                ],
            },
            "eisenhower": {
                "doNow": ["Handle the most urgent important task"],
                "schedule": ["Plan important non-urgent work"],
                "delegate": ["Identify task that can be simplified or delegated"],
                "eliminate": ["Remove one low-value distraction"],
            },
            "systemist": {
                "morning": [
                    "Review today's priorities",
                    "Pick one main focus",
                    "Prepare workspace",
                ],
                "workTasks": [
                    "Execute highest priority task",
                    "Batch small admin tasks",
                    "Review progress",
                ],
                "evening": [
                    "Reflect on what worked",
                    "Plan tomorrow",
                    "Close unfinished loops",
                ],
                "recurring": ["Daily planning check-in"],
            },
            "medium-method": {
                "days": [
                    {"day": "Day 1", "label": "Day 1", "mainTask": "Clarify priorities", "supportTasks": ["List blockers", "Choose one task"]},
                    {"day": "Day 2", "label": "Day 2", "mainTask": "Execute core work", "supportTasks": ["Start focused block", "Review progress"]},
                    {"day": "Day 3", "label": "Day 3", "mainTask": "Stabilize system", "supportTasks": ["Clean backlog", "Plan next cycle"]},
                ],
            },
            "okrs": {
                "objective": "Create clearer progress from current responsibilities",
                "keyResults": [
                    {"kr": "Finish 3 priority tasks", "metric": "3 tasks completed", "progress": 0},
                    {"kr": "Reduce backlog by 30%", "metric": "backlog reduction", "progress": 0},
                    {"kr": "Complete one focused work session daily", "metric": "focus sessions", "progress": 0},
                ],
            },
            "weekly-review": {
                "winsThisWeek": ["Captured current responsibilities"],
                "lessonsLearned": ["Unclear priorities create friction"],
                "nextWeekFocus": [
                    "Choose fewer priorities",
                    "Schedule deep work",
                    "Review progress daily",
                ],
            },
            "commitment-inventory": {
                "commitments": [
                    {
                        "name": "Current main responsibility",
                        "urgency": "high",
                        "category": "work",
                        "recommendation": "continue",
                        "reason": "This appears connected to your current pressure.",
                    },
                    {
                        "name": "Low-value distractions",
                        "urgency": "low",
                        "category": "personal",
                        "recommendation": "drop",
                        "reason": "This may reduce focus.",
                    },
                    {
                        "name": "Pending personal maintenance",
                        "urgency": "medium",
                        "category": "personal",
                        "recommendation": "schedule",
                        "reason": "Small tasks should be planned instead of carried mentally.",
                    },
                ],
            },
            "smart-goals": {
                "goals": [
                    {
                        "title": "Complete today's most important task",
                        "specific": "Choose one concrete task and finish it",
                        "measurable": "Task marked complete",
                        "achievable": "Can be done in one focused session",
                        "relevant": "Reduces current mental load",
                        "timeBound": "Today",
                        "progress": 0,
                    },
                ],
            },
            "para": {
                "projects": ["Current active mission"],
                "areas": ["Personal productivity", "Responsibilities"],
                "resources": ["Notes from brain dump", "Generated action plan"],
                "archives": [],
            },
            "deep-work": {
                "focusGoal": "Make progress on the highest-value task",
                "deepBlocks": [
                    {"start": "09:00", "end": "10:30", "task": "Deep focus on main task"},
                    {"start": "14:00", "end": "15:00", "task": "Continue focused execution"},
                ],
                "shallowTasks": [
                    "Reply to simple messages",
                    "Organize notes",
                    "Review task list",
                ],
                "distractions": [
                    "Social media",
                    "Unplanned task switching",
                ],
                "shutdownRitual": [
                    "Review what was completed",
                    "Write next action",
                    "Close workspace",
                ],
            },
            "pareto": {
                "highImpact": [
                    "Identify the one task with the biggest payoff",
                    "Work on the task that unlocks other tasks",
                    "Finish the action closest to deadline or goal impact",
                ],
                "maintenance": ["Handle small admin tasks later"],
                "eliminate": [
                    "Remove one low-value distraction",
                    "Postpone non-critical work",
                ],
                "leverage": [
                    "Batch similar tasks",
                    "Reuse existing notes or templates",
                ],
            },
        }
        return fallbacks.get(framework_id, fallbacks["gtd"])

    def _framework_meets_minimum(self, framework_id: str, data: dict) -> bool:
        if self.count_actionable_items(framework_id, data) < 3:
            return False

        if framework_id == "gtd":
            return self._count_list(data.get("inbox")) >= 3 and self._count_list(data.get("nextActions")) >= 3 and self._count_list(data.get("projects")) >= 1
        if framework_id == "kanban":
            return self._count_list(data.get("backlog") or data.get("todo")) >= 3
        if framework_id == "time-blocking":
            return self._count_list(data.get("schedule")) >= 3
        if framework_id == "eat-the-frog":
            return self._has_actionable_value(data.get("frog")) and self._count_list(data.get("secondaryTasks")) >= 3
        if framework_id == "pomodoro":
            return self._count_list(data.get("tasks")) >= 3
        if framework_id == "eisenhower":
            return self.count_actionable_items(framework_id, data) >= 3
        if framework_id == "systemist":
            return self._count_list(data.get("morning")) > 0 and self._count_list(data.get("workTasks")) > 0 and self._count_list(data.get("evening")) > 0
        if framework_id == "medium-method":
            days = data.get("days")
            return isinstance(days, list) and len(days) >= 3 and all(isinstance(day, dict) and self._has_actionable_value(day.get("mainTask")) and self._count_list(day.get("supportTasks")) > 0 for day in days[:3])
        if framework_id == "okrs":
            return self._has_actionable_value(data.get("objective")) and self._count_list(data.get("keyResults")) >= 3
        if framework_id == "weekly-review":
            return self._count_list(data.get("winsThisWeek")) > 0 and self._count_list(data.get("lessonsLearned")) > 0 and self._count_list(data.get("nextWeekFocus")) >= 3
        if framework_id == "commitment-inventory":
            return self._count_list(data.get("commitments")) >= 3
        if framework_id == "smart-goals":
            return self._count_list(data.get("goals")) >= 1 and self.count_actionable_items(framework_id, data) >= 3
        if framework_id == "para":
            return self._count_list(data.get("projects")) > 0 and self._count_list(data.get("areas")) > 0 and self._count_list(data.get("resources")) > 0 and isinstance(data.get("archives", []), list)
        if framework_id == "deep-work":
            return self._has_actionable_value(data.get("focusGoal")) and self._count_list(data.get("deepBlocks")) > 0 and self._count_list(data.get("shallowTasks")) > 0 and self._count_list(data.get("distractions")) > 0 and self._count_list(data.get("shutdownRitual")) > 0
        if framework_id == "pareto":
            return all(self._count_list(data.get(key)) > 0 for key in ("highImpact", "maintenance", "eliminate", "leverage"))

        return True

    def _has_actionable_value(self, value: object) -> bool:
        if isinstance(value, str):
            return bool(value.strip())
        if isinstance(value, dict):
            for key in ("title", "task", "name", "kr", "mainTask", "specific", "focusGoal"):
                if self._has_actionable_value(value.get(key)):
                    return True
            if "tasks" in value and self._count_list(value.get("tasks")) > 0:
                return True
            return False
        return value is not None

    def _count_list(self, value: object) -> int:
        if not isinstance(value, list):
            return 0
        return sum(1 for item in value if self._has_actionable_value(item))

    def _count_projects(self, value: object) -> int:
        if not isinstance(value, list):
            return 0
        count = 0
        for project in value:
            if self._has_actionable_value(project):
                count += 1
            if isinstance(project, dict):
                count += self._count_list(project.get("tasks"))
        return count

    def _ensure_today_actions(self, framework_id: str, today_actions: object, data: dict) -> list:
        actions = [a.strip() for a in today_actions if isinstance(a, str) and a.strip()] if isinstance(today_actions, list) else []
        if len(actions) >= 3:
            return actions[:5]

        extracted = self._extract_action_titles(framework_id, data)
        for title in extracted:
            if title not in actions:
                actions.append(title)
            if len(actions) >= 3:
                break
        return actions[:5]

    def _extract_action_titles(self, framework_id: str, data: dict) -> list[str]:
        titles: list[str] = []

        def add(value: object):
            if isinstance(value, str) and value.strip():
                titles.append(value.strip())
            elif isinstance(value, dict):
                for key in ("title", "task", "name", "kr", "mainTask"):
                    val = value.get(key)
                    if isinstance(val, str) and val.strip():
                        titles.append(val.strip())
                        return

        if framework_id == "time-blocking":
            for block in data.get("schedule", []):
                add(block.get("task") if isinstance(block, dict) else block)
        elif framework_id == "eat-the-frog":
            add(data.get("frog"))
            for item in data.get("secondaryTasks", []):
                add(item)
        elif framework_id == "okrs":
            for item in data.get("keyResults", []):
                add(item)
        elif framework_id == "weekly-review":
            for item in data.get("nextWeekFocus", []):
                add(item)
        else:
            for value in data.values():
                if isinstance(value, list):
                    for item in value:
                        add(item)
                        if isinstance(item, dict):
                            for nested in item.get("tasks", []) if isinstance(item.get("tasks"), list) else []:
                                add(nested)
                else:
                    add(value)

        return titles or [
            "Clarify today's top priority",
            "Break the main goal into smaller steps",
            "Schedule a focused work session",
        ]

    def _parse_and_validate_dashboard(self, json_str: str) -> dict:
        data = json.loads(json_str)
        if "frameworks" not in data: data["frameworks"] = []
        if "masterTaskList" not in data: data["masterTaskList"] = []
        return data

    def _extract_json(self, raw_text: str) -> str:
        text = raw_text.strip().lstrip('\ufeff')
        text = re.sub(r'^```(?:json|JSON)?\s*\n?', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n?```\s*$', '', text, flags=re.MULTILINE)
        text = text.strip()
        start = text.find('{')
        if start == -1: return "{}"
        depth = 0
        in_str = False
        escape = False
        end = -1
        for i, ch in enumerate(text[start:], start):
            if escape: escape = False; continue
            if ch == '\\' and in_str: escape = True; continue
            if ch == '"': in_str = not in_str; continue
            if in_str: continue
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: end = i; break
        return text[start:end+1] if end != -1 else text[start:]

    async def _call_gemini(self, system_instruction: str, prompt: str, retry_count=0) -> str:
        model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=system_instruction,
            generation_config=GENERATION_CONFIG,
            safety_settings=SAFETY_SETTINGS
        )
        try:
            response = model.generate_content(
                contents=[{"role": "user", "parts": [{"text": prompt}]}]
            )
            if not response.text:
                raise RuntimeError("Empty response from Gemini")
            return response.text
        except exceptions.ResourceExhausted as e:
            quota_logger.warning(f"Quota exceeded (429) for prompt: {prompt[:50]}... Error: {e}")
            if retry_count < 2:
                wait_time = (retry_count + 1) * 2
                await asyncio.sleep(wait_time)
                return await self._call_gemini(system_instruction, prompt, retry_count + 1)
            raise RuntimeError("AI quota temporarily exhausted. Please retry in 1 minute.")
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                quota_logger.warning(f"Potential quota error detected: {e}")
                if retry_count < 2:
                    await asyncio.sleep(2)
                    return await self._call_gemini(system_instruction, prompt, retry_count + 1)
                raise RuntimeError("AI quota temporarily exhausted. Please retry in 1 minute.")
            raise RuntimeError(f"Gemini error: {e}")

    async def confused_chat(self, message: str, history: list[dict]) -> dict:
        from services.prompts import CONFUSED_MODE_SYSTEM_PROMPT
        
        model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=CONFUSED_MODE_SYSTEM_PROMPT,
            generation_config={"temperature": 0.7, "top_p": 0.95, "max_output_tokens": 8192},
            safety_settings=SAFETY_SETTINGS
        )
        
        formatted_history = []
        for h in history:
            role = "user" if h["role"] == "user" else "model"
            # Extract content from list if necessary
            content_text = h["content"]
            if isinstance(content_text, list):
                content_text = " ".join([p.get("text", "") for p in content_text])
            formatted_history.append({"role": role, "parts": [content_text]})
            
        chat = model.start_chat(history=formatted_history)
        
        try:
            response = chat.send_message(message)
            if not response.text:
                raise RuntimeError("Empty response from Gemini")
            return {"reply": response.text}
        except Exception as e:
            raise RuntimeError(f"Gemini error in confused mode: {e}")

    async def finish_confused_session(self, conversation_history: list[dict]) -> dict:
        from services.prompts import CONFUSED_SUMMARY_SYSTEM_PROMPT
        
        chat_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in conversation_history])
        user_prompt = f"Here is the conversation:\n\n{chat_text}\n\nPlease summarize this into a concise productivity story format suitable for mission building."
        
        response_text = await self._call_gemini(
            system_instruction=CONFUSED_SUMMARY_SYSTEM_PROMPT,
            prompt=user_prompt
        )
        parsed = self._extract_json(response_text)
        data = json.loads(parsed)
        return data

    async def generate_subtasks(self, task_title: str, context: str) -> list[str]:
        model = genai.GenerativeModel("gemini-1.5-flash-8b")
        
        prompt = f"""
        User Task: "{task_title}"
        Story Context: "{context}"

        You are Moti, the AI Productivity Mascot.
        Your goal is to break down the task above into 3-5 small, extremely actionable subtasks.
        
        Rules:
        1. Keep it simple and motivating.
        2. Use the same language as the task title.
        3. Each subtask should be a single action.
        4. Return ONLY a JSON list of strings.
        """

        try:
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=GENERATION_CONFIG,
                safety_settings=SAFETY_SETTINGS
            )
            
            data = json.loads(response.text)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and "subtasks" in data:
                return data["subtasks"]
            return []
        except Exception as e:
            print(f"Error generating subtasks: {e}")
            return []
    async def generate_more_tasks(
        self,
        session_id: str,
        existing_tasks: list,
        context: str,
        framework_id: Optional[str] = None,
        framework_data: Optional[dict] = None,
        completed_tasks: Optional[list] = None,
    ) -> list:
        """Generate 3-5 additional tasks based on story context and existing tasks."""
        existing_titles = [t.get("title", "") for t in existing_tasks]
        completed_titles = [t.get("title", "") for t in completed_tasks or []]

        if framework_id == "eisenhower":
            prompt = f"""
            User Story Context: "{context}"
            Current Eisenhower Matrix Data: {json.dumps(framework_data or {}, ensure_ascii=False)}
            Existing Task Titles: {json.dumps(existing_titles, ensure_ascii=False)}
            Completed Task Titles: {json.dumps(completed_titles, ensure_ascii=False)}

            You are Moti, the AI Productivity Mascot.
            The user completed the current Eisenhower Matrix tasks and needs more useful momentum.

            Generate 3-5 NEW Eisenhower Matrix tasks.

            Rules:
            - Do not repeat any existing or completed task title.
            - Every task must be concrete, short, and action-oriented.
            - Put each task in the right quadrant using one of:
              "doNow", "schedule", "delegate", "eliminate".
            - Prefer practical next steps inferred from the story and current matrix.
            - If the story is vague, infer useful starter actions.

            Return ONLY a JSON object:
            {{
              "newTasks": [
                {{
                  "title": "Concrete action",
                  "description": "Brief reason or context",
                  "priority": "critical|high|medium|low",
                  "estimatedMinutes": 5,
                  "category": "work",
                  "quadrant": "doNow|schedule|delegate|eliminate"
                }}
              ]
            }}
            """
        else:
            prompt = f"""
            User Story Context: "{context}"
            Framework: "{framework_id or "dashboard"}"
            Current Framework Data: {json.dumps(framework_data or {}, ensure_ascii=False)}
            Current Task List: {json.dumps(existing_titles, ensure_ascii=False)}
            Completed Task Titles: {json.dumps(completed_titles, ensure_ascii=False)}

            You are Moti, the AI Productivity Mascot.
            The user has completed all their current tasks and needs more momentum.

            Your goal:
            Generate 3-5 NEW framework-specific tasks that are relevant to their story but NOT already in the list above.

            Task Requirements:
            - Title: Action-oriented, concise.
            - Description: Brief explanation of why this is important.
            - Priority: low, medium, high, or critical.
            - EstimatedMinutes: 5 to 480.
            - Category: e.g. Work, Study, Personal, Health.

            Return ONLY a JSON object with the key "newTasks" containing a list of task objects.
            """

        try:
            response_text = await self._call_gemini(
                system_instruction="You are a productivity expert AI. Generate new relevant tasks.",
                prompt=prompt
            )
            parsed = self._extract_json(response_text)
            data = json.loads(parsed)
            return data.get("newTasks", [])
        except Exception as e:
            print(f"Error generating more tasks: {e}")
            return []

# Singleton
_gemini_service: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
