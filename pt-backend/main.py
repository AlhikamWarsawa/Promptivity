from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from schemas.responses import HealthResponse
from routers import ai

# ============================================
# Promptivity — FastAPI Backend
# ============================================

app = FastAPI(
    title       = "Promptivity API",
    description = "Backend API for Promptivity — AI-powered productivity mission builder",
    version     = "0.2.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# Routers
app.include_router(ai.router, prefix="/api", tags=["AI"])


@app.get("/", include_in_schema=False)
async def root():
    return {
        "app":     "Promptivity",
        "message": "API is running",
        "version": "0.2.0",
        "docs":    "/docs",
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", version="0.2.0")
