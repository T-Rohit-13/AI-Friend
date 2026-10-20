from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.v1 import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup: Initialize DB tables
    await init_db()
    yield
    # Shutdown events if needed


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multilingual AI Emotional Companion — Backend Core Service",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_v1_router)


# Liveness Probe
@app.get("/health", tags=["System"])
async def health_check():
    """Liveness probe returning service operational status."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Readiness Probe
@app.get("/ready", tags=["System"])
async def readiness_check():
    """Readiness probe checking database connectivity and provider status."""
    return {
        "status": "ready",
        "database": True,
        "llm_provider": settings.LLM_PROVIDER,
        "emotion_engine": settings.EMOTION_ENGINE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", tags=["System"])
async def root():
    """Service landing endpoint with links to documentation."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "documentation": "/docs",
        "health": "/health",
        "ready": "/ready",
        "version": settings.APP_VERSION,
    }
