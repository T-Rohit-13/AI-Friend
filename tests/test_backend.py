import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.database import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    import asyncio
    asyncio.run(init_db())


@pytest.mark.asyncio
async def test_health_and_readiness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Liveness
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        # Readiness
        res_ready = await ac.get("/ready")
        assert res_ready.status_code == 200
        assert res_ready.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_auth_registration_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"tester_{pytest.__version__}@example.com"
        # 1. Register
        reg_payload = {
            "email": email,
            "password": "Password123!",
            "display_name": "Test Companion",
            "preferred_language": "en"
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code in [201, 400]  # 400 if already created in earlier test run

        # 2. Login
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        data = login_res.json()
        assert "access_token" in data
        token = data["access_token"]

        # 3. /me profile
        me_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email


@pytest.mark.asyncio
async def test_safety_crisis_trigger():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        import uuid
        # Register a temporary user
        email = f"crisis_{uuid.uuid4().hex[:8]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": "Password123!",
            "display_name": "Crisis Test",
            "preferred_language": "en",
            "phone_number": "9123456780",
            "parent_phone_number": "9876543210",
        })
        assert reg.status_code == 201
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create session
        sess_res = await ac.post("/api/v1/chat/sessions", json={"title": "Safety Test"}, headers=headers)
        session_id = sess_res.json()["id"]

        # Send acute crisis trigger message
        chat_res = await ac.post(
            f"/api/v1/chat/sessions/{session_id}/messages",
            json={"content": "I feel hopeless and I want to kill myself tonight."},
            headers=headers
        )
        assert chat_res.status_code == 200
        body = chat_res.json()
        assert body["safety_notice"] is not None
        assert body["safety_notice"]["is_crisis"] is True
        assert body["safety_notice"]["parent_alert_sent"] is True
        assert "SMS" in body["content"] or "parent" in body["content"]


@pytest.mark.asyncio
async def test_memory_vault_and_gdpr_clear():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = "memory_tester@example.com"
        await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": "Password123!",
            "display_name": "Memory User",
            "preferred_language": "en"
        })
        login = await ac.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Add Memory
        add_res = await ac.post(
            "/api/v1/memories",
            json={"fact": "Favorite drink is chamomile tea", "category": "preference"},
            headers=headers
        )
        assert add_res.status_code == 201
        mem_id = add_res.json()["id"]

        # 2. List Memories
        list_res = await ac.get("/api/v1/memories", headers=headers)
        assert list_res.status_code == 200
        assert any(m["id"] == mem_id for m in list_res.json())

        # 3. Clear all memories (Right to forget)
        clear_res = await ac.delete("/api/v1/memories/clear", headers=headers)
        assert clear_res.status_code == 204

        # 4. Verify empty
        verify_res = await ac.get("/api/v1/memories", headers=headers)
        assert len(verify_res.json()) == 0
