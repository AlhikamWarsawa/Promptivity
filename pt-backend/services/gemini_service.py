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

    def _save_story(self, session_id: str, story: str, personalization: Optional[dict]):
        path = os.path.join(self.storage_dir, f"{session_id}.json")
        with open(path, "w") as f:
            json.dump({"story": story, "personalization": personalization}, f)

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
            return cached

        from services.prompts import DASHBOARD_SYSTEM_PROMPT, build_user_prompt
        user_prompt = build_user_prompt(story, personalization)
        
        response_text = await self._call_gemini(
            system_instruction=DASHBOARD_SYSTEM_PROMPT,
            prompt=user_prompt
        )
        parsed = self._parse_and_validate_dashboard(self._extract_json(response_text))
        
        session_id = str(uuid.uuid4())
        self._save_story(session_id, story, personalization)
        
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
        
        self._cache_session(story_hash, session)
        return session

    async def generate_framework(self, session_id: str, framework_id: str) -> dict:
        """Generate specific framework data on demand."""
        cached = self._get_cached_framework(session_id, framework_id)
        if cached:
            return cached

        from services.prompts import FRAMEWORK_SYSTEM_PROMPT, build_framework_prompt
        story_data = self._load_story(session_id)
        user_prompt = build_framework_prompt(
            story_data["story"], 
            framework_id, 
            story_data["personalization"]
        )
        
        system_instruction = FRAMEWORK_SYSTEM_PROMPT.replace("{framework_id}", framework_id)
        
        response_text = await self._call_gemini(
            system_instruction=system_instruction,
            prompt=user_prompt
        )
        parsed = self._extract_json(response_text)
        data = json.loads(parsed)
        
        result = {
            "frameworkId":  framework_id,
            "rawData":      data.get("data", {}),
            "todayActions": data.get("todayActions", []),
            "tasks":        [], 
        }
        
        self._cache_framework(session_id, framework_id, result)
        return result

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
    async def generate_more_tasks(self, session_id: str, existing_tasks: list, context: str) -> list:
        """Generate 3-5 additional tasks based on story context and existing tasks."""
        existing_titles = [t.get("title", "") for t in existing_tasks]
        
        prompt = f"""
        User Story Context: "{context}"
        Current Task List: {json.dumps(existing_titles)}

        You are Moti, the AI Productivity Mascot.
        The user has completed all their current tasks and needs more momentum!
        
        Your goal:
        Generate 3-5 NEW tasks that are relevant to their story but NOT already in the list above.
        
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
