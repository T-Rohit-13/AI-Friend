from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from backend.app.models.user import User
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/voice", tags=["Voice & Audio Interaction"])


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "en"
    voice_id: Optional[str] = None
    rate: float = 1.0
    pitch: float = 1.0


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = "en",
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe audio bytes to text.
    In Phase 6, wired to local Whisper/Faster-Whisper model.
    """
    # Non-blocking read
    _ = await audio.read()
    return {
        "text": "Hello, how are you feeling today?",
        "language": language or "en",
        "duration_seconds": 2.5,
    }


@router.post("/synthesize")
async def synthesize_speech(
    payload: SynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Synthesize text to speech voice parameters.
    Returns optimal client Web Speech parameters or backend audio stream URL.
    """
    # Voice mapping recommendations by language
    voice_mapping = {
        "en": "en-US-JennyNeural",
        "es": "es-ES-ElviraNeural",
        "hi": "hi-IN-SwaraNeural",
        "fr": "fr-FR-DeniseNeural",
        "de": "de-DE-KatjaNeural",
        "zh": "zh-CN-XiaoxiaoNeural",
    }
    recommended_voice = voice_mapping.get(payload.language, "en-US-JennyNeural")

    return {
        "status": "success",
        "text": payload.text,
        "language": payload.language,
        "recommended_voice": recommended_voice,
        "rate": payload.rate,
        "pitch": payload.pitch,
        "audio_stream_url": None,  # Falls back to high-quality browser Web Speech API
    }
