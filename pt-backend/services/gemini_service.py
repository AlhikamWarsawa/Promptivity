import os
import json
import uuid
import re
from datetime import datetime, timezone
from typing import Optional
import google.generativeai as genai
from services.prompts import SYSTEM_PROMPT, build_user_prompt

# ============================================
# Promptivity — Gemini Service
# Handles all Gemini API calls with proper
# error handling and output validation.
# ============================================

# Safety settings — relax untuk productivity content
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
]

GENERATION_CONFIG = {
    "temperature":       0.4,    # Lower = more consistent JSON output
    "top_p":             0.95,
    "top_k":             40,
    "max_output_tokens": 8192,   # 13 frameworks butuh banyak token
}


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name     = "gemini-1.5-flash",   # Fast + cost-effective untuk MVP
            system_instruction = SYSTEM_PROMPT,
            safety_settings    = SAFETY_SETTINGS,
            generation_config  = GENERATION_CONFIG,
        )

    async def process_story(
        self,
        story:           str,
        personalization: Optional[dict] = None,
    ) -> dict:
        """
        Send user story to Gemini and return parsed PTSession dict.
        
        Returns:
            Parsed PTSession dict (ready to be returned as API response)
        
        Raises:
            ValueError: If story is too short
            RuntimeError: If Gemini fails after retries
        """
        if len(story.strip().split()) < 10:
            raise ValueError("Story is too short. Please provide more context.")

        user_prompt = build_user_prompt(story, personalization)
        
        # Retry logic: 2 attempts
        last_error = None
        for attempt in range(2):
            try:
                response = await self._call_gemini(user_prompt)
                raw_json  = self._extract_json(response)
                parsed    = self._parse_and_validate(raw_json)
                session   = self._build_session(parsed, story, personalization)
                return session

            except json.JSONDecodeError as e:
                last_error = f"JSON parsing failed: {str(e)}"
                print(f"[GeminiService] Attempt {attempt+1} JSON error: {last_error}")
                continue
            except Exception as e:
                last_error = str(e)
                print(f"[GeminiService] Attempt {attempt+1} error: {last_error}")
                if attempt == 0:
                    continue
                break

        raise RuntimeError(f"Gemini processing failed after 2 attempts: {last_error}")

    async def _call_gemini(self, prompt: str) -> str:
        """Make the actual API call. Returns raw text response."""
        try:
            # Note: google-generativeai tidak native async,
            # tapi ini cukup untuk MVP. Day 22 bisa switch ke asyncio.to_thread
            response = self.model.generate_content(prompt)
            
            if not response.text:
                raise RuntimeError("Gemini returned empty response")
            
            return response.text

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                raise RuntimeError("API rate limit reached. Please wait a moment and try again.")
            elif "timeout" in error_msg.lower():
                raise RuntimeError("Request timed out. Please try again.")
            else:
                raise RuntimeError(f"Gemini API error: {error_msg}")

    def _extract_json(self, raw_text: str) -> str:
        """
        Extract JSON from Gemini response.
        Handles cases where Gemini wraps output in markdown code blocks.
        """
        text = raw_text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            # Remove ```json or ``` at start
            text = re.sub(r'^```(?:json)?\n?', '', text)
            # Remove ``` at end
            text = re.sub(r'\n?```$', '', text)
            text = text.strip()
        
        # Find first { and last }
        start = text.find('{')
        end   = text.rfind('}')
        
        if start == -1 or end == -1:
            raise json.JSONDecodeError("No JSON object found in response", text, 0)
        
        return text[start:end+1]

    def _parse_and_validate(self, json_str: str) -> dict:
        """Parse JSON and validate required top-level keys."""
        data = json.loads(json_str)
        
        required_keys = [
            "topRecommendation",
            "topRecommendationReason",
            "masterTaskList",
            "todayPlan",
            "frameworks",
        ]
        
        for key in required_keys:
            if key not in data:
                # Don't fail — fill with defaults
                print(f"[GeminiService] Warning: missing key '{key}', using default")
                data[key] = self._get_default(key)
        
        # Ensure all 13 frameworks present
        required_frameworks = [
            "gtd", "kanban", "time-blocking", "eat-the-frog", "pomodoro",
            "eisenhower", "systemist", "medium-method", "okrs",
            "weekly-review", "commitment-inventory", "smart-goals", "para",
        ]
        
        if "frameworks" not in data or not isinstance(data["frameworks"], dict):
            data["frameworks"] = {}
        
        for fw in required_frameworks:
            if fw not in data["frameworks"]:
                print(f"[GeminiService] Warning: framework '{fw}' missing, using skeleton")
                data["frameworks"][fw] = self._get_framework_skeleton(fw)
        
        return data

    def _build_session(
        self,
        parsed:          dict,
        story:           str,
        personalization: Optional[dict],
    ) -> dict:
        """Convert parsed Gemini output to PTSession format."""
        session_id = str(uuid.uuid4())
        
        # Build framework output list
        frameworks_list = []
        for fw_id, fw_data in parsed.get("frameworks", {}).items():
            fw_output = {
                "frameworkId":          fw_id,
                "isRecommended":        fw_data.get("isRecommended", False),
                "recommendationScore":  fw_data.get("recommendationScore", 50),
                "recommendationReason": fw_data.get("recommendationReason", ""),
                "tasks":                fw_data.get("nextActions", fw_data.get("backlog", [])),
                "todayActions":         fw_data.get("todayActions", []),
                "rawData":              {k: v for k, v in fw_data.items()
                                        if k not in ("isRecommended", "recommendationScore",
                                                     "recommendationReason", "todayActions")},
            }
            frameworks_list.append(fw_output)
        
        return {
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

    def _get_default(self, key: str):
        defaults = {
            "topRecommendation":       "gtd",
            "topRecommendationReason": "GTD is a solid starting point for organizing your tasks.",
            "masterTaskList":          [],
            "todayPlan":               ["Review your current tasks and pick the most important one"],
        }
        return defaults.get(key, None)

    def _get_framework_skeleton(self, fw_id: str) -> dict:
        """Return a minimal skeleton for a missing framework."""
        return {
            "recommendationScore":  50,
            "recommendationReason": "Could not extract enough data for this framework.",
            "isRecommended":        False,
            "todayActions":         ["Review your tasks and apply this framework"],
        }


# Singleton instance
_gemini_service: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
