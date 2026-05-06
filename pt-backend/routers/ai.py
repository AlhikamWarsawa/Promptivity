from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProcessStoryRequest(BaseModel):
    story: str
    personalization: Optional[dict] = None

@router.post("/process-story")
async def process_story(request: ProcessStoryRequest):
    # TODO: Day 6 — integrate Gemini
    return {
        "success": True,
        "data": None,
        "message": "AI processing not yet implemented — coming Day 6"
    }
