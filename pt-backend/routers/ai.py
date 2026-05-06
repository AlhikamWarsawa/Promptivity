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
    """
    Process user story through Gemini and return mission plan.
    
    Request:
        story:           str   — User's free-form story text
        personalization: dict  — Optional personalization data
    
    Response:
        success: bool
        data:    PTSession | None
        error:   str | None
    """
    # Rate limit check
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a minute before trying again."
        )
    
    # Validate story length
    story = body.story.strip()
    if not story:
        return ProcessStoryResponse(
            success=False,
            error="Story cannot be empty."
        )
    
    if len(story.split()) < 5:
        return ProcessStoryResponse(
            success=False,
            error="Story is too short. Please provide more context about your situation."
        )
    
    # Sanitize: strip HTML tags (basic)
    import re
    story_clean = re.sub(r'<[^>]+>', '', story)
    
    # Personalization data
    personalization = None
    if body.personalization:
        personalization = body.personalization.model_dump()
    
    # Process via Gemini
    try:
        gemini = get_gemini_service()
        session = await gemini.process_story(story_clean, personalization)
        
        return ProcessStoryResponse(
            success=True,
            data=session,
        )

    except ValueError as e:
        # User input error
        return ProcessStoryResponse(
            success=False,
            error=str(e)
        )
    except RuntimeError as e:
        # AI processing error
        return ProcessStoryResponse(
            success=False,
            error=f"Mission building failed: {str(e)}"
        )
    except Exception as e:
        # Unexpected error
        print(f"[/api/process-story] Unexpected error: {e}")
        return ProcessStoryResponse(
            success=False,
            error="An unexpected error occurred. Please try again."
        )
