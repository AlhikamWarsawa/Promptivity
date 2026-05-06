from __future__ import annotations

# TODO: Implement response schemas
from pydantic import BaseModel
from typing import Optional


class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: str = ""
    error: Optional[str] = None
