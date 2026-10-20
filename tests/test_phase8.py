import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.services.context_engine import ContextEngine


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()
    yield


def test_explicit_intent_detection():
    assert ContextEngine.detect_explicit_intent("Can you tell me a joke?") == "joke"
    assert ContextEngine.detect_explicit_intent("Share a fun riddle please") == "riddle"
    assert ContextEngine.detect_explicit_intent("Help me study this concept using Feynman") == "study"
    assert ContextEngine.detect_explicit_intent("I need to breathe, help me calm down") == "breathwork"
    assert ContextEngine.detect_explicit_intent("Just checking in on the weather") is None


def test_multimodal_emotion_fusion_priority():
    # 1. Passive vocal emotion alone
    emo1 = ContextEngine.resolve_effective_emotion(vocal_emotion="sad", explicit_intent=None)
    assert emo1 == "sad"

    # 2. Strict override: user is sad but explicitly asked for a joke/riddle
    emo2 = ContextEngine.resolve_effective_emotion(vocal_emotion="sad", explicit_intent="joke")
    assert emo2 == "playful"

    # 3. Explicit request for breathwork
    emo3 = ContextEngine.resolve_effective_emotion(vocal_emotion="neutral", explicit_intent="breathwork")
    assert emo3 == "anxious"


@pytest.mark.asyncio
async def test_context_engine_turn_processing():
    # Test turn with memory grounding
    result = await ContextEngine.process_turn(
        user_message="I'm feeling excited about our study session!",
        session_id="test-session-1",
        user_language="en",
        persona="study_buddy",
        vocal_emotion="happy",
        memories=["Learning Python fundamentals"],
    )

    assert result["companion_emotion"] == "celebratory"
    assert len(result["content"]) > 10
    assert result["safety_notice"] is None


@pytest.mark.asyncio
async def test_end_to_end_explicit_intent_priority():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"context_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Context User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        sess = await ac.post("/api/v1/chat/sessions", json={"title": "Context Test"}, headers=headers)
        session_id = sess.json()["id"]

        # User voice was detected as 'sad', but user explicitly requests a riddle
        msg_res = await ac.post(f"/api/v1/chat/sessions/{session_id}/messages", json={
            "content": "Give me a fun riddle to distract me",
            "detected_emotion": "sad"
        }, headers=headers)

        assert msg_res.status_code == 200
        payload = msg_res.json()
        # Companion emotion adapts to 'playful' instead of dragging user down into unsolicited sadness probing
        assert payload["companion_emotion"] == "playful"
        assert any(term in payload["content"].lower() for term in ["riddle", "what am i", "intuition", "guess", "wind"])
