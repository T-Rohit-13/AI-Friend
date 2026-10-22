import uuid
import pytest
import httpx
from backend.app.main import app
from backend.app.core.database import AsyncSessionLocal
from backend.app.models.user import User
from sqlalchemy import select


async def register_and_login(ac: httpx.AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    email = f"tts_user_{uid}@example.com"
    password = "SecurePassword123!"
    await ac.post("/api/v1/auth/register", json={
        "email": email, "password": password, "display_name": "TTS Tester"
    })
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        if user:
            user.is_verified = True
            await session.commit()
    login = await ac.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_tamil_tts_playback():
    """Verify Tamil audio generation with edge-tts and ta-IN-PallaviNeural."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        tamil_text = "வணக்கம்! நான் உங்கள் AI நண்பன். உங்களுக்கு எப்படி உதவ முடியும்?"
        resp = await client.get("/api/v1/voice/tts", params={"text": tamil_text, "language": "ta-IN"})
        
        assert resp.status_code == 200
        assert "audio/mpeg" in resp.headers.get("content-type", "")
        assert resp.headers.get("x-tts-provider") in ("edge_tts", "gtts")
        assert resp.headers.get("x-tts-voice") in ("ta-IN-PallaviNeural", "google_ta")
        assert len(resp.content) > 1000
        print(f"\n[PASS] Tamil audio generated: provider={resp.headers.get('x-tts-provider')}, voice={resp.headers.get('x-tts-voice')}, bytes={len(resp.content)}")


@pytest.mark.asyncio
async def test_english_tts_playback():
    """Verify English audio generation remains intact with en-US-JennyNeural."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        en_text = "Hello! I am your AI friend. How can I help you today?"
        resp = await client.get("/api/v1/voice/tts", params={"text": en_text, "language": "en-US"})
        
        assert resp.status_code == 200
        assert "audio/mpeg" in resp.headers.get("content-type", "")
        assert resp.headers.get("x-tts-voice") in ("en-US-JennyNeural", "google_en")
        assert len(resp.content) > 1000
        print(f"\n[PASS] English audio generated: provider={resp.headers.get('x-tts-provider')}, voice={resp.headers.get('x-tts-voice')}, bytes={len(resp.content)}")


@pytest.mark.asyncio
async def test_tamil_unicode_auto_detection():
    """Verify Tamil script is automatically recognized and routed to Tamil voice even with language=en."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/voice/tts", params={"text": "நன்றி நண்பா", "language": "en"})
        
        assert resp.status_code == 200
        assert resp.headers.get("x-tts-voice") in ("ta-IN-PallaviNeural", "google_ta")
        assert len(resp.content) > 500
        print(f"\n[PASS] Tamil auto-detection passed: voice={resp.headers.get('x-tts-voice')}, bytes={len(resp.content)}")


@pytest.mark.asyncio
async def test_synthesize_endpoint_tamil():
    """Verify /synthesize voice endpoint recommends ta-IN-PallaviNeural."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        auth_headers = await register_and_login(client)
        resp = await client.post("/api/v1/voice/synthesize", json={
            "text": "வணக்கம்",
            "language": "ta-IN",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["recommended_voice"] == "ta-IN-PallaviNeural"
        assert "language=ta-IN" in data["audio_stream_url"]
        print(f"\n[PASS] Synthesize endpoint: recommended_voice={data['recommended_voice']}")


@pytest.mark.asyncio
async def test_full_conversation_turn_tamil_language_switch():
    """Verify 'Let's talk in Tamil' sets session language to ta-IN, responds in Tamil, and returns Tamil audio stream."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        auth_headers = await register_and_login(client)
        
        # 1. Create session (initially English)
        sess = await client.post("/api/v1/chat/sessions", json={"title": "Multilingual Test", "language": "en"}, headers=auth_headers)
        assert sess.status_code == 201
        session_id = sess.json()["id"]

        # 2. User says: "Let's talk in Tamil"
        turn = await client.post(f"/api/v1/chat/sessions/{session_id}/messages", json={
            "content": "Let's talk in Tamil",
        }, headers=auth_headers)
        assert turn.status_code == 200
        data = turn.json()
        
        # Verify language was switched to ta-IN
        assert data["language"] == "ta-IN", f"Expected language ta-IN, got {data['language']}"
        
        # Verify content contains Tamil script (Unicode 0x0B80 - 0x0BFF)
        has_tamil = any(0x0B80 <= ord(c) <= 0x0BFF for c in data["content"])
        assert has_tamil, f"Expected Tamil script in reply, got: {data['content']}"
        
        # Verify audio_url was generated
        assert data["audio_url"] is not None
        assert "language=ta-IN" in data["audio_url"]
        
        # 3. Fetch the audio stream directly to verify playback readiness
        audio_resp = await client.get(data["audio_url"])
        if audio_resp.status_code != 200:
            import asyncio
            await asyncio.sleep(1)
            audio_resp = await client.get(data["audio_url"])
        assert audio_resp.status_code == 200
        assert audio_resp.headers.get("x-tts-voice") in ("ta-IN-PallaviNeural", "google_ta")
        assert len(audio_resp.content) > 1000
        print(f"\n[PASS] Full Tamil conversation turn verified: lang={data['language']}, voice={audio_resp.headers.get('x-tts-voice')}, audio_bytes={len(audio_resp.content)}")
