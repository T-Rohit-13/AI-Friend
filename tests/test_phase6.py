import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.services.asr import validate_audio_bytes, AudioValidationError, get_asr_provider


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()
    yield


def generate_dummy_wav(size: int = 1000) -> bytes:
    """Generate dummy RIFF WAV header bytes for testing."""
    header = b"RIFF" + (size - 8).to_bytes(4, "little") + b"WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data"
    data = b"\x00" * (size - len(header))
    return header + data


def generate_dummy_webm(size: int = 500) -> bytes:
    """Generate dummy WebM header bytes."""
    header = b"\x1a\x45\xdf\xa3" + b"\x00" * (size - 4)
    return header


@pytest.mark.asyncio
async def test_audio_validation_rules():
    # 1. Valid WAV
    wav_bytes = generate_dummy_wav(500)
    valid, fmt = validate_audio_bytes(wav_bytes)
    assert valid is True
    assert fmt == "audio/wav"

    # 2. Valid WebM
    webm_bytes = generate_dummy_webm(500)
    valid, fmt = validate_audio_bytes(webm_bytes)
    assert valid is True
    assert fmt == "audio/webm"

    # 3. Too small / empty audio (< 100 bytes)
    with pytest.raises(AudioValidationError) as exc:
        validate_audio_bytes(b"RIFF short", content_type="audio/wav")
    assert exc.value.status_code == 400
    assert "too small" in exc.value.detail.lower()

    # 4. Corrupted / invalid container format
    with pytest.raises(AudioValidationError) as exc:
        validate_audio_bytes(b"This is just random text disguised as audio with lots of words " * 5, content_type="text/plain")
    assert exc.value.status_code == 400

    # 5. Oversized payload
    with pytest.raises(AudioValidationError) as exc:
        validate_audio_bytes(b"\x00" * (26 * 1024 * 1024))
    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_multilingual_asr_provider():
    provider = get_asr_provider()
    wav_bytes = generate_dummy_wav(2000)

    # English transcription
    res_en = await provider.transcribe(wav_bytes, language="en")
    assert res_en["language"] == "en"
    assert len(res_en["text"]) > 5
    assert res_en["duration_seconds"] > 0

    # Hindi transcription
    res_hi = await provider.transcribe(wav_bytes, language="hi")
    assert res_hi["language"] == "hi"
    assert len(res_hi["text"]) > 5

    # Tamil transcription
    res_ta = await provider.transcribe(wav_bytes, language="ta")
    assert res_ta["language"] == "ta"
    assert len(res_ta["text"]) > 5


@pytest.mark.asyncio
async def test_voice_transcribe_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"voice_user_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Voice User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        wav_bytes = generate_dummy_wav(1500)
        files = {"audio": ("test_sample.wav", wav_bytes, "audio/wav")}
        data = {"language": "en"}

        resp = await ac.post("/api/v1/voice/transcribe", files=files, data=data, headers=headers)
        assert resp.status_code == 200
        payload = resp.json()
        assert "text" in payload
        assert payload["language"] == "en"
        assert payload["detected_format"] == "audio/wav"


@pytest.mark.asyncio
async def test_voice_synthesize_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"synth_user_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Synth User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = await ac.post("/api/v1/voice/synthesize", json={
            "text": "Hello, take a deep breath.",
            "language": "hi",
            "rate": 1.0,
            "pitch": 1.0,
        }, headers=headers)

        assert resp.status_code == 200
        payload = resp.json()
        assert payload["recommended_voice"] == "hi-IN-SwaraNeural"
        assert payload["status"] == "success"
