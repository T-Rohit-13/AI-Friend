"""
Multilingual Automatic Speech Recognition (ASR) Engine.
Supports:
1. Audio validation: MIME type check, magic bytes inspection, size limits (100B - 25MB).
2. Remote Whisper ASR (OpenAI / Groq audio/transcriptions endpoint).
3. Genuine Speech Recognition for Tamil (ta-IN) and English (en-IN/en-US) via Google Speech ASR.
4. Zero mocked or hardcoded transcripts.
"""

import io
import os
import struct
import wave
import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Tuple
import httpx
import torch
from fastapi import HTTPException, status

from backend.app.core.config import settings
from backend.app.ml.preprocessing import decode_wav_to_tensor

logger = logging.getLogger(__name__)

# Magic byte signatures for audio formats
AUDIO_SIGNATURES = {
    b"RIFF": "audio/wav",
    b"\x1a\x45\xdf\xa3": "audio/webm",
    b"OggS": "audio/ogg",
    b"ID3": "audio/mpeg",
    b"\xff\xfb": "audio/mpeg",
    b"\xff\xf3": "audio/mpeg",
    b"\xff\xf2": "audio/mpeg",
    b"ftyp": "audio/mp4",
}

SUPPORTED_LANGUAGES = ["en", "hi", "ta", "es", "fr", "de", "ja"]


class AudioValidationError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


def validate_audio_bytes(data: bytes, content_type: Optional[str] = None) -> Tuple[bool, str]:
    """
    Validates uploaded audio payload:
    1. Size check: minimum 100 bytes (non-empty), maximum 25 MB.
    2. Magic byte signature inspection.
    Returns: (is_valid, detected_format)
    """
    size = len(data)
    if size < 100:
        raise AudioValidationError("Audio file too small or empty (< 100 bytes). Please speak into the microphone for at least 0.5s.")

    max_size = 25 * 1024 * 1024  # 25 MB
    if size > max_size:
        raise AudioValidationError(
            f"Audio file exceeds maximum allowed limit of 25MB (Received {size / (1024*1024):.2f}MB).",
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
        )

    # Check magic bytes
    detected = None
    for sig, mime in AUDIO_SIGNATURES.items():
        if data.startswith(sig) or sig in data[:32]:
            detected = mime
            break

    # If content_type was provided and recognized as audio, accept
    if not detected:
        if content_type and any(audio_type in content_type.lower() for audio_type in ["audio", "webm", "wav", "ogg", "mp3", "m4a", "octet-stream"]):
            detected = content_type
        else:
            raise AudioValidationError(
                "Invalid or unsupported audio container format. Supported formats: WAV, WebM, MP3, OGG, M4A."
            )

    return True, detected


class BaseASRProvider(ABC):
    """Abstract interface for speech-to-text recognition."""

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = "en",
        filename: str = "audio.wav",
    ) -> Dict[str, Any]:
        pass


class GoogleSpeechASRProvider(BaseASRProvider):
    """
    Genuine speech recognition engine using Google Speech Recognition API via speech_recognition.
    Supports authentic Tamil (ta-IN) and English (en-IN / en-US).
    Never fabricates, mocks, or hardcodes text.
    """

    def __init__(self):
        try:
            import speech_recognition as sr
            self.sr = sr
            self.recognizer = sr.Recognizer()
        except ImportError:
            self.sr = None
            self.recognizer = None

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = "en",
        filename: str = "audio.wav",
    ) -> Dict[str, Any]:
        validate_audio_bytes(audio_bytes)

        if not self.sr:
            raise AudioValidationError("Speech recognition engine not initialized on backend.")

        # Map language codes to genuine BCP-47 locales
        lang_lower = (language or "en").lower().strip()
        if lang_lower in ("ta", "ta-in", "tamil") or lang_lower.startswith("ta"):
            target_lang = "ta-IN"
        elif lang_lower in ("hi", "hi-in", "hindi") or lang_lower.startswith("hi"):
            target_lang = "hi-IN"
        elif lang_lower in ("en-in", "english-india"):
            target_lang = "en-IN"
        elif lang_lower in ("es", "es-es", "spanish"):
            target_lang = "es-ES"
        elif lang_lower in ("fr", "fr-fr", "french"):
            target_lang = "fr-FR"
        elif lang_lower in ("de", "de-de", "german"):
            target_lang = "de-DE"
        elif lang_lower in ("ja", "ja-jp", "japanese"):
            target_lang = "ja-JP"
        else:
            target_lang = "en-US"

        # Prepare WAV audio buffer
        wav_stream = None
        if audio_bytes.startswith(b"RIFF"):
            wav_stream = io.BytesIO(audio_bytes)
        else:
            # Decode audio tensor and repack as clean 16kHz 16-bit mono WAV
            tensor = decode_wav_to_tensor(audio_bytes)
            if torch.max(torch.abs(tensor)).item() < 0.005:
                raise AudioValidationError("Audio recording is silent. Please speak clearly into your microphone.")

            samples = (tensor.clamp(-1.0, 1.0) * 32767.0).to(torch.int16).tolist()
            buf = io.BytesIO()
            with wave.open(buf, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                wf.writeframes(struct.pack(f"<{len(samples)}h", *samples))
            buf.seek(0)
            wav_stream = buf

        loop = asyncio.get_running_loop()

        def _recognize_sync():
            with self.sr.AudioFile(wav_stream) as source:
                audio_data = self.recognizer.record(source)
            return self.recognizer.recognize_google(audio_data, language=target_lang)

        try:
            recognized_text = await loop.run_in_executor(None, _recognize_sync)
            return {
                "text": recognized_text.strip(),
                "language": target_lang,
                "duration_seconds": round(len(audio_bytes) / 32000.0, 2),
                "provider": "google_speech_asr",
            }
        except self.sr.UnknownValueError:
            raise AudioValidationError(
                "Could not understand audio. Please speak clearly into the microphone."
            )
        except self.sr.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            raise AudioValidationError("Speech recognition network error. Please try again.")


class RemoteWhisperASRProvider(BaseASRProvider):
    """Transcribes audio using OpenAI / Groq Whisper endpoint with resilient fallback."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        model: str = "whisper-1",
        fallback: Optional[BaseASRProvider] = None,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.fallback = fallback or GoogleSpeechASRProvider()

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = "en",
        filename: str = "audio.wav",
    ) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"{self.base_url}/audio/transcriptions"

        files = {"file": (filename, audio_bytes, "audio/wav")}
        data: Dict[str, Any] = {"model": self.model}
        if language:
            lang_code = language.split("-")[0]
            data["language"] = lang_code

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, files=files, data=data)
                resp.raise_for_status()
                result = resp.json()
                text = result.get("text", "").strip()
                if not text:
                    raise AudioValidationError("Could not understand audio. Please speak clearly.")
                return {
                    "text": text,
                    "language": language or "en",
                    "duration_seconds": result.get("duration", 2.0),
                    "provider": "remote_whisper",
                }
        except Exception as e:
            logger.warning(f"Remote Whisper API notice ({e}), routing to Google Speech ASR...")
            return await self.fallback.transcribe(audio_bytes, language, filename)


def get_asr_provider() -> BaseASRProvider:
    """Factory creating the active ASR provider."""
    api_key = settings.OPENAI_API_KEY or settings.GROQ_API_KEY
    if api_key:
        base_url = "https://api.groq.com/openai/v1" if settings.GROQ_API_KEY else "https://api.openai.com/v1"
        model = "whisper-large-v3" if settings.GROQ_API_KEY else "whisper-1"
        return RemoteWhisperASRProvider(
            api_key=api_key,
            base_url=base_url,
            model=model,
            fallback=GoogleSpeechASRProvider(),
        )

    return GoogleSpeechASRProvider()
