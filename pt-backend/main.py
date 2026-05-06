from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai, auth

app = FastAPI(
    title="PT (Promptivity) API",
    description="Backend API for PT — AI-powered productivity mission builder",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

@app.get("/")
async def root():
    return {"message": "PT API is running", "version": "0.1.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}
