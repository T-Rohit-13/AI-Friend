import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.core.database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()
    yield


@pytest.mark.asyncio
async def test_memory_update_and_auto_extract():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"mem_act_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Memory Activity User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create memory
        create_res = await ac.post("/api/v1/memories", json={
            "fact": "Likes herbal mint tea",
            "category": "preference"
        }, headers=headers)
        assert create_res.status_code == 201
        mem_id = create_res.json()["id"]

        # 2. Update memory
        update_res = await ac.put(f"/api/v1/memories/{mem_id}", json={
            "fact": "Likes organic peppermint tea in the evenings",
            "category": "preference"
        }, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json()["fact"] == "Likes organic peppermint tea in the evenings"

        # 3. Auto-extract memory from conversation text
        extract_res = await ac.post("/api/v1/memories/extract", json={
            "message_text": "I am learning Rust programming this semester"
        }, headers=headers)
        assert extract_res.status_code == 200
        ext_data = extract_res.json()
        assert ext_data["extracted"] is True
        assert ext_data["persisted"] is True
        assert "Rust programming" in ext_data["fact"]

        # Verify it now appears in user's memory vault
        list_res = await ac.get("/api/v1/memories", headers=headers)
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 2


@pytest.mark.asyncio
async def test_memory_extraction_respects_strict_privacy():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"strict_priv_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Strict Privacy"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Enable strict privacy mode
        await ac.put("/api/v1/settings/preferences", json={
            "privacy_strict_mode": True
        }, headers=headers)

        # Attempt extraction
        extract_res = await ac.post("/api/v1/memories/extract", json={
            "message_text": "I like listening to classical piano"
        }, headers=headers)
        assert extract_res.status_code == 200
        ext_data = extract_res.json()
        assert ext_data["extracted"] is True
        # Bypassed persistence due to strict privacy
        assert ext_data["persisted"] is False


@pytest.mark.asyncio
async def test_games_jokes_and_breathwork_activities():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"games_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Games User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Jokes endpoint
        joke_res = await ac.get("/api/v1/games/jokes?language=en", headers=headers)
        assert joke_res.status_code == 200
        joke = joke_res.json()
        assert "setup" in joke
        assert "punchline" in joke

        # Breathwork routine
        breath_res = await ac.get("/api/v1/games/breathwork", headers=headers)
        assert breath_res.status_code == 200
        breath = breath_res.json()
        assert "4-7-8" in breath["technique"]
        assert len(breath["steps"]) == 4


@pytest.mark.asyncio
async def test_study_feynman_and_quiz():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = f"study_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Study User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Feynman explainer
        exp_res = await ac.post("/api/v1/study/explain", json={
            "topic": "Neural Networks",
            "level": "eli5"
        }, headers=headers)
        assert exp_res.status_code == 200
        exp = exp_res.json()
        assert "Neural Networks" in exp["topic"]
        assert "analogy" in exp
        assert "check_question" in exp

        # Study quiz
        quiz_res = await ac.post("/api/v1/study/quiz", json={
            "subject": "Quantum Computing",
            "num_questions": 3
        }, headers=headers)
        assert quiz_res.status_code == 200
        quiz = quiz_res.json()
        assert len(quiz["cards"]) == 3
