from pydantic import BaseModel
from typing import Optional, Any

class ProcessStoryResponse(BaseModel):
    success: bool
    data:    Optional[Any] = None
    error:   Optional[str] = None

class HealthResponse(BaseModel):
    status:  str
    version: str
