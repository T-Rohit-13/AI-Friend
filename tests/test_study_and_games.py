import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.database import init_db


@pytest_asyncio.fixture
async def auth_client():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"student_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Test Student"
        })
        token = reg.json().get("access_token", "")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        ac.headers.update(headers)
        yield ac


@pytest.mark.asyncio
async def test_study_explain_endpoint(auth_client):
    resp = await auth_client.post(
        "/api/v1/study/explain",
        json={"topic": "Quantum Superposition", "level": "eli5"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "Quantum Superposition" in data["topic"]
    assert "analogy" in data
    assert "core_idea" in data
    assert "check_question" in data


@pytest.mark.asyncio
async def test_study_quiz_endpoint(auth_client):
    resp = await auth_client.post(
        "/api/v1/study/quiz",
        json={"subject": "Mathematics", "num_questions": 3},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["subject"] == "Mathematics"
    assert len(data["cards"]) == 3
    for card in data["cards"]:
        assert "question" in card
        assert "key_takeaway" in card


@pytest.mark.asyncio
async def test_games_riddles_flow(auth_client):
    # 1. Fetch riddle
    next_resp = await auth_client.get("/api/v1/games/riddles/next")
    assert next_resp.status_code == 200
    riddle = next_resp.json()
    assert "id" in riddle
    assert "question" in riddle
    assert len(riddle["hints"]) >= 1

    # 2. Answer riddle check
    ans_resp = await auth_client.post(
        "/api/v1/games/riddles/answer",
        json={"riddle_id": riddle["id"], "user_answer": "echo"},
    )
    assert ans_resp.status_code == 200
    ans_data = ans_resp.json()
    assert "correct" in ans_data
    assert "message" in ans_data


@pytest.mark.asyncio
async def test_voice_synthesize_endpoint(auth_client):
    resp = await auth_client.post(
        "/api/v1/voice/synthesize",
        json={"text": "வணக்கம் நண்பா", "language": "ta"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["language"] == "ta-IN"
    assert "Pallavi" in data["recommended_voice"]
