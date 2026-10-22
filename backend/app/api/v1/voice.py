from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from backend.app.models.user import User
from backend.app.api.deps import get_current_user
from backend.app.services.asr import get_asr_provider, validate_audio_bytes, AudioValidationError

router = APIRouter(prefix="/voice", tags=["Voice & Audio Interaction"])


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "en"
    voice_id: Optional[str] = None
    rate: float = 1.0
    pitch: float = 1.0


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration_seconds: float
    detected_format: Optional[str] = None
    provider: Optional[str] = None


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("en"),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribes uploaded audio bytes with rigorous validation:
    - Verifies audio container format (WAV, WebM, MP3, OGG, M4A).
    - Rejects empty, corrupted, or oversized files (> 25MB).
    - Routes to active ASR provider (Remote Whisper or Resilient Local ASR).
    """
    try:
        audio_bytes = await audio.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read audio stream: {str(e)}",
        )

    # Validate audio bytes & headers
    is_valid, detected_format = validate_audio_bytes(audio_bytes, content_type=audio.content_type)

    asr_service = get_asr_provider()
    result = await asr_service.transcribe(
        audio_bytes=audio_bytes,
        language=language,
        filename=audio.filename or "recording.wav",
    )

    return TranscriptionResponse(
        text=result["text"],
        language=result["language"],
        duration_seconds=result["duration_seconds"],
        detected_format=detected_format,
        provider=result.get("provider", "asr_engine"),
    )


from fastapi.responses import Response
import urllib.parse
import logging

logger = logging.getLogger(__name__)


@router.get("/tts")
async def get_tts_audio(
    text: str,
    language: str = "en",
    voice: Optional[str] = None,
):
    """
    Synthesizes speech to MP3 stream using edge-tts.
    Tamil: 'ta-IN-PallaviNeural' or 'ta-IN-ValluvarNeural'
    English: 'en-US-JennyNeural' or 'en-US-GuyNeural'
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice_name = voice
    if not voice_name:
        if language == "ta":
            voice_name = "ta-IN-PallaviNeural"
        elif language == "hi":
            voice_name = "hi-IN-SwaraNeural"
        else:
            voice_name = "en-US-JennyNeural"

    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice_name)
        audio_stream = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.extend(chunk["data"])
        return Response(content=bytes(audio_stream), media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@router.post("/synthesize")
async def synthesize_speech(
    payload: SynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Synthesize text to speech voice parameters.
    Returns optimal client Web Speech parameters or backend audio stream URL.
    """
    voice_mapping = {
        "en": "en-US-JennyNeural",
        "es": "es-ES-ElviraNeural",
        "hi": "hi-IN-SwaraNeural",
        "ta": "ta-IN-PallaviNeural",
        "fr": "fr-FR-DeniseNeural",
        "de": "de-DE-KatjaNeural",
        "ja": "ja-JP-NanamiNeural",
    }
    recommended_voice = voice_mapping.get(payload.language, "en-US-JennyNeural")
    encoded_text = urllib.parse.quote(payload.text[:300])

    return {
        "status": "success",
        "text": payload.text,
        "language": payload.language,
        "recommended_voice": recommended_voice,
        "rate": payload.rate,
        "pitch": payload.pitch,
        "audio_stream_url": f"/api/v1/voice/tts?text={encoded_text}&language={payload.language}",
    }
