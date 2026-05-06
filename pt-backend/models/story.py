from __future__ import annotations

# TODO: Day 6 — implement story model
from pydantic import BaseModel
from typing import Optional


class StoryInput(BaseModel):
    story: str
    personalization: Optional[dict] = None
