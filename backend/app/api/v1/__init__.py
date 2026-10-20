from fastapi import APIRouter
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.chat import router as chat_router
from backend.app.api.v1.memories import router as memories_router
from backend.app.api.v1.games import router as games_router
from backend.app.api.v1.study import router as study_router
from backend.app.api.v1.emotions import router as emotions_router
from backend.app.api.v1.voice import router as voice_router
from backend.app.api.v1.settings import router as settings_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(memories_router)
api_v1_router.include_router(games_router)
api_v1_router.include_router(study_router)
api_v1_router.include_router(emotions_router)
api_v1_router.include_router(voice_router)
api_v1_router.include_router(settings_router)
