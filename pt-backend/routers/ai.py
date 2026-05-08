from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import time
from models.story import ProcessStoryRequest
from schemas.responses import ProcessStoryResponse
from services.gemini_service import get_gemini_service

# ============================================
# Promptivity — AI Router
# Endpoints untuk AI processing
# ============================================

router = APIRouter()

# Simple in-memory rate limiter (per IP, max 10 req/min)
_rate_limit: dict[str, list[float]] = {}
RATE_LIMIT_WINDOW = 60      # seconds
RATE_LIMIT_MAX    = 10      # requests per window


def check_rate_limit(ip: str) -> bool:
    """Return True if request is allowed, False if rate limited."""
    now       = time.time()
    history   = _rate_limit.get(ip, [])
    # Remove old entries
    history   = [t for t in history if now - t < RATE_LIMIT_WINDOW]
    if len(history) >= RATE_LIMIT_MAX:
        _rate_limit[ip] = history
        return False
    history.append(now)
    _rate_limit[ip] = history
    return True


@router.post("/process-story", response_model=ProcessStoryResponse)
async def process_story(request: Request, body: ProcessStoryRequest):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    story = body.story.strip()
    if not story: return ProcessStoryResponse(success=False, error="Empty story")
    
    personalization = body.personalization.model_dump() if body.personalization else None
    
    try:
        gemini = get_gemini_service()
        session = await gemini.process_story_initial(story, personalization)
        return ProcessStoryResponse(success=True, data=session)
    except Exception as e:
        return ProcessStoryResponse(success=False, error=str(e))

@router.post("/generate-framework")
async def generate_framework(request: Request, body: dict):
    """
    Request:
        sessionId:   str
        frameworkId: str
    """
    session_id   = body.get("sessionId")
    framework_id = body.get("frameworkId")
    
    if not session_id or not framework_id:
        raise HTTPException(status_code=400, detail="Missing sessionId or frameworkId")
        
    try:
        gemini = get_gemini_service()
        data = await gemini.generate_framework(session_id, framework_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/confused-chat")
async def confused_chat(request: Request, body: dict):
    """
    Request:
        message: str
        history: list[dict]
    """
    message = body.get("message")
    history = body.get("history", [])
    
    if not message:
        raise HTTPException(status_code=400, detail="Missing message")
        
    try:
        gemini = get_gemini_service()
        data = await gemini.confused_chat(message, history)
        return {"success": True, "reply": data.get("reply")}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/finish-confused-session")
async def finish_confused_session(request: Request, body: dict):
    """
    Request:
        history: list[dict]
    """
    history = body.get("history", [])
    if not history:
        raise HTTPException(status_code=400, detail="Missing history")
        
    try:
        gemini = get_gemini_service()
        data = await gemini.finish_confused_session(history)
        return {"success": True, "story": data.get("story")}
    except Exception as e:
        return {"success": False, "error": str(e)}
