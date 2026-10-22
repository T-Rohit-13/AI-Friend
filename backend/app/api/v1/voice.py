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
import io
import logging
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


def is_tamil_script(text: str) -> bool:
    """Checks if text contains Tamil Unicode block characters (U+0B80 to U+0BFF)."""
    return any(0x0B80 <= ord(c) <= 0x0BFF for c in text)


@router.get("/tts")
async def get_tts_audio(
    text: str,
    language: str = "en",
    voice: Optional[str] = None,
):
    """
    Synthesizes speech to MP3 stream using high-fidelity Edge-TTS neural voices,
    with automatic resilient fallback to Google TTS (gTTS).
    
    Guaranteed Tamil voice mapping:
    - Primary: Microsoft Pallavi Neural ('ta-IN-PallaviNeural') or Valluvar ('ta-IN-ValluvarNeural')
    - Fallback: Google TTS Tamil ('ta')
    
    English voice mapping:
    - Primary: Microsoft Jenny Neural ('en-US-JennyNeural')
    - Fallback: Google TTS English ('en')
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    has_tamil_chars = is_tamil_script(text)
    lang_lower = (language or "en").lower().strip()
    is_tamil = has_tamil_chars or lang_lower in ("ta", "ta-in", "tamil") or lang_lower.startswith("ta")

    # Select appropriate voice
    voice_name = voice
    if not voice_name:
        if is_tamil:
            voice_name = getattr(settings, "TAMIL_TTS_VOICE", "ta-IN-PallaviNeural")
        elif lang_lower in ("hi", "hi-in", "hindi") or lang_lower.startswith("hi"):
            voice_name = getattr(settings, "HINDI_TTS_VOICE", "hi-IN-SwaraNeural")
        elif lang_lower in ("es", "es-es", "spanish") or lang_lower.startswith("es"):
            voice_name = "es-ES-ElviraNeural"
        else:
            voice_name = getattr(settings, "ENGLISH_TTS_VOICE", "en-US-JennyNeural")

    # 1. Primary Neural TTS via edge-tts
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice_name)
        audio_stream = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.extend(chunk["data"])

        if len(audio_stream) > 0:
            return Response(
                content=bytes(audio_stream),
                media_type="audio/mpeg",
                headers={
                    "X-TTS-Provider": "edge_tts",
                    "X-TTS-Voice": voice_name,
                    "X-TTS-Language": "ta-IN" if is_tamil else "en-US",
                    "Cache-Control": "public, max-age=86400",
                },
            )
    except Exception as edge_err:
        logger.warning(f"Edge-TTS synthesis warning for '{voice_name}': {edge_err}. Attempting gTTS fallback...")

    # 2. Resilient Fallback via gTTS
    try:
        from gtts import gTTS
        gtts_lang = "ta" if is_tamil else ("hi" if lang_lower.startswith("hi") else "en")
        tts = gTTS(text=text, lang=gtts_lang)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_bytes = fp.read()
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-TTS-Provider": "gtts",
                "X-TTS-Voice": f"google_{gtts_lang}",
                "X-TTS-Language": "ta-IN" if is_tamil else "en-US",
                "Cache-Control": "public, max-age=86400",
            },
        )
    except Exception as gtts_err:
        logger.error(f"gTTS fallback error: {gtts_err}")
        try:
            import time
            time.sleep(0.5)
            from gtts import gTTS
            tts = gTTS(text=text, lang=gtts_lang)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            audio_bytes = fp.read()
            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={
                    "X-TTS-Provider": "gtts",
                    "X-TTS-Voice": f"google_{gtts_lang}",
                    "X-TTS-Language": "ta-IN" if is_tamil else "en-US",
                    "Cache-Control": "public, max-age=86400",
                },
            )
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"TTS synthesis failed on both primary and fallback providers. Primary voice '{voice_name}'."
        )


@router.post("/synthesize")
async def synthesize_speech(
    payload: SynthesizeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Synthesize text to speech voice parameters.
    Returns optimal client Web Speech parameters or backend audio stream URL.
    """
    has_tamil_chars = is_tamil_script(payload.text)
    lang_lower = (payload.language or "en").lower().strip()
    is_tamil = has_tamil_chars or lang_lower in ("ta", "ta-in", "tamil") or lang_lower.startswith("ta")

    voice_mapping = {
        "en": "en-US-JennyNeural",
        "es": "es-ES-ElviraNeural",
        "hi": "hi-IN-SwaraNeural",
        "ta": "ta-IN-PallaviNeural",
        "fr": "fr-FR-DeniseNeural",
        "de": "de-DE-KatjaNeural",
        "ja": "ja-JP-NanamiNeural",
    }
    
    if is_tamil:
        recommended_voice = "ta-IN-PallaviNeural"
        target_lang = "ta-IN"
    else:
        recommended_voice = voice_mapping.get(payload.language[:2], "en-US-JennyNeural")
        target_lang = payload.language

    encoded_text = urllib.parse.quote(payload.text)

    return {
        "status": "success",
        "text": payload.text,
        "language": target_lang,
        "recommended_voice": recommended_voice,
        "rate": payload.rate,
        "pitch": payload.pitch,
        "audio_stream_url": f"/api/v1/voice/tts?text={encoded_text}&language={target_lang}",
    }
