import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.services.behaviour_router import BehaviourRouter
from backend.app.services.llm import MockLLMClient, OpenAICompatibleLLMClient, get_llm_client


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_mock_llm_multilingual_and_activities():
    client = MockLLMClient()

    # 1. Greetings across languages
    res_en = await client.generate_response([{"role": "user", "content": "Hello!"}], language="en")
    assert "feeling today" in res_en.lower() or "good to hear" in res_en.lower()

    res_hi = await client.generate_response([{"role": "user", "content": "नमस्ते"}], language="hi")
    assert "नमस्ते" in res_hi

    res_es = await client.generate_response([{"role": "user", "content": "Hola"}], language="es")
    assert "hola" in res_es.lower()

    # 2. Riddles
    res_riddle = await client.generate_response([{"role": "user", "content": "Tell me a fun riddle"}], language="en")
    assert any(term in res_riddle.lower() for term in ["riddle", "what am i", "wind", "intuition"])

    # 3. Jokes
    res_joke = await client.generate_response([{"role": "user", "content": "Tell me a quick joke"}], language="en")
    assert any(term in res_joke.lower() for term in ["scarecrow", "skeletons", "impasta", "smile", "chuckle"])

    # 4. Anxiety & Grounding
    res_anxious = await client.generate_response([{"role": "user", "content": "I feel anxious and need to breathe"}], language="en")
    assert "inhale" in res_anxious.lower() or "safe" in res_anxious.lower()


@pytest.mark.asyncio
async def test_behaviour_router_prompt_construction():
    # Prompt with persona, memories, emotion, language
    memories = ["Enjoys tea in the morning", "Working on a machine learning project"]
    prompt = BehaviourRouter.build_system_prompt(
        persona="study_buddy",
        language="hi",
        detected_emotion="tired",
        memories=memories,
    )

    assert "Study Buddy" in prompt
    assert "Hindi" in prompt
    assert "Exhaustion/Burnout" in prompt
    assert "Enjoys tea in the morning" in prompt
    assert "Working on a machine learning project" in prompt
    assert "AI companion" in prompt


@pytest.mark.asyncio
async def test_behaviour_router_history_assembly():
    history = [
        {"role": "user", "content": "Turn 1"},
        {"role": "assistant", "content": "Turn 2"},
        {"role": "user", "content": "Turn 3"},
        {"role": "assistant", "content": "Turn 4"},
    ]
    messages = BehaviourRouter.assemble_messages(
        system_prompt="System Prompt",
        history=history,
        new_user_message="Turn 5",
        max_turns=2,
    )
    # System + 2 history turns + 1 new user message = 4
    assert len(messages) == 4
    assert messages[0]["role"] == "system"
    assert messages[1]["content"] == "Turn 3"
    assert messages[2]["content"] == "Turn 4"
    assert messages[3]["content"] == "Turn 5"


@pytest.mark.asyncio
async def test_openai_compatible_fallback_resilience():
    # Unreachable base_url should gracefully fall back to MockLLMClient without crashing
    client = OpenAICompatibleLLMClient(
        base_url="http://127.0.0.1:9999/v1",
        api_key="dummy_key",
        model="test-model",
    )
    response = await client.generate_response(
        messages=[{"role": "user", "content": "Hello friend!"}],
        language="en",
    )
    assert response is not None
    assert len(response) > 5


@pytest.mark.asyncio
async def test_end_to_end_chat_with_memory_and_emotion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        unique_email = f"phase5_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = await ac.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "display_name": "Phase5 User",
            "preferred_language": "en"
        })
        assert reg_res.status_code == 201
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Add a memory
        mem_res = await ac.post("/api/v1/memories", json={
            "fact": "Preparing for a big presentation tomorrow",
            "category": "goal"
        }, headers=headers)
        assert mem_res.status_code == 201

        # Create session
        sess_res = await ac.post("/api/v1/chat/sessions", json={
            "title": "Evening Check-in",
            "persona": "friendly_companion",
            "language": "en"
        }, headers=headers)
        session_id = sess_res.json()["id"]

        # Send joyful message
        msg1_res = await ac.post(f"/api/v1/chat/sessions/{session_id}/messages", json={
            "content": "I finished my project milestone and feel thrilled!",
            "detected_emotion": "joyful"
        }, headers=headers)
        assert msg1_res.status_code == 200
        data1 = msg1_res.json()
        assert data1["role"] == "assistant"
        assert data1["companion_emotion"] == "celebratory"

        # Send follow up asking for a joke
        msg2_res = await ac.post(f"/api/v1/chat/sessions/{session_id}/messages", json={
            "content": "Can you tell me a quick joke to celebrate?",
            "detected_emotion": "joyful"
        }, headers=headers)
        assert msg2_res.status_code == 200
        data2 = msg2_res.json()
        assert len(data2["content"]) > 10

        # Verify messages history in session
        hist_res = await ac.get(f"/api/v1/chat/sessions/{session_id}/messages", headers=headers)
        assert hist_res.status_code == 200
        msgs = hist_res.json()
        assert len(msgs) == 4  # 2 user messages + 2 assistant messages


@pytest.mark.asyncio
async def test_chat_crisis_override_still_protected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        unique_email = f"crisis_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = await ac.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "display_name": "Crisis Check",
            "preferred_language": "en"
        })
        assert reg_res.status_code == 201
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        sess_res = await ac.post("/api/v1/chat/sessions", json={"title": "Crisis Test"}, headers=headers)
        session_id = sess_res.json()["id"]

        msg_res = await ac.post(f"/api/v1/chat/sessions/{session_id}/messages", json={
            "content": "I feel like ending my life right now",
            "detected_emotion": "sad"
        }, headers=headers)
        assert msg_res.status_code == 200
        data = msg_res.json()
        assert data["companion_emotion"] == "compassionate"
        assert data["safety_notice"] is not None
        assert data["safety_notice"]["is_crisis"] is True
        assert "parent" in data["content"].lower() or "sms" in data["content"].lower()
