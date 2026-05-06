from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas.responses import HealthResponse
from routers import ai, auth

# ============================================
# Promptivity — FastAPI Backend
# ============================================

app = FastAPI(
    title       = "Promptivity API",
    description = "Backend API for Promptivity — AI-powered productivity mission builder",
    version     = "0.1.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# CORS — allow frontend origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    # Production URL ditambahkan di Day 22
]

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ALLOWED_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["GET", "POST", "OPTIONS"],
    allow_headers     = ["*"],
)

# Routers
app.include_router(ai.router,   prefix="/api",  tags=["AI"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])


@app.get("/", include_in_schema=False)
async def root():
    return {
        "app":     "Promptivity",
        "message": "API is running",
        "version": "0.1.0",
        "docs":    "/docs",
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", version="0.1.0")
