import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.database import init_db, AsyncSessionLocal
from backend.app.core.rate_limit import rate_limiter
from backend.app.models.user import User
from sqlalchemy import select


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    import asyncio
    asyncio.run(init_db())


async def register_and_verify(ac: AsyncClient, email: str, password: str = "Password123!", display_name: str = "User") -> str:
    """Helper registering and verifying test account for authenticated test endpoints."""
    await ac.post("/api/v1/auth/register", json={
        "email": email, "password": password, "display_name": display_name
    })
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        if user:
            user.is_verified = True
            await session.commit()
    login = await ac.post("/api/v1/auth/login", json={"email": email, "password": password})
    return login.json()["access_token"]


@pytest.mark.asyncio
async def test_user_isolation_security():
    """Verify User A cannot access or delete User B's sessions or memories."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        uid = uuid.uuid4().hex[:8]
        # Register User A
        email_a = f"user_a_{uid}@example.com"
        token_a = await register_and_verify(ac, email_a, "Password123!", "User A")
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Register User B
        email_b = f"user_b_{uid}@example.com"
        token_b = await register_and_verify(ac, email_b, "Password123!", "User B")
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User A creates a session
        sess_a = await ac.post("/api/v1/chat/sessions", json={"title": "User A Private Chat"}, headers=headers_a)
        session_id_a = sess_a.json()["id"]

        # User B attempts to access User A's session -> Must be 404
        access_attempt = await ac.get(f"/api/v1/chat/sessions/{session_id_a}/messages", headers=headers_b)
        assert access_attempt.status_code == 404

        # User B attempts to delete User A's session -> Must be 404
        delete_attempt = await ac.delete(f"/api/v1/chat/sessions/{session_id_a}", headers=headers_b)
        assert delete_attempt.status_code == 404

        # User A creates a private memory
        mem_a = await ac.post("/api/v1/memories", json={"fact": "User A secret plan", "category": "goal"}, headers=headers_a)
        mem_id_a = mem_a.json()["id"]

        # User B attempts to delete User A's memory -> Must be 404
        mem_delete_attempt = await ac.delete(f"/api/v1/memories/{mem_id_a}", headers=headers_b)
        assert mem_delete_attempt.status_code == 404


@pytest.mark.asyncio
async def test_user_preferences_crud():
    """Verify preference fetching, updating, and persistence."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"pref_{uuid.uuid4().hex[:8]}@example.com"
        token = await register_and_verify(ac, email, "Password123!", "Pref User")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch default preferences
        get_res = await ac.get("/api/v1/settings/preferences", headers=headers)
        assert get_res.status_code == 200
        pref = get_res.json()
        assert pref["persona"] == "friendly_companion"
        assert pref["theme"] == "dark"

        # 2. Update preferences
        update_res = await ac.put("/api/v1/settings/preferences", json={
            "persona": "calm_confidant",
            "preferred_language": "es",
            "privacy_strict_mode": True,
        }, headers=headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["persona"] == "calm_confidant"
        assert updated["preferred_language"] == "es"
        assert updated["privacy_strict_mode"] is True


@pytest.mark.asyncio
async def test_chat_pagination_and_export():
    """Verify chat session message pagination (limit/offset) and GDPR export."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"chat_pg_{uuid.uuid4().hex[:8]}@example.com"
        token = await register_and_verify(ac, email, "Password123!", "Pagination User")
        headers = {"Authorization": f"Bearer {token}"}

        # Create session
        sess_res = await ac.post("/api/v1/chat/sessions", json={"title": "Pagination Chat"}, headers=headers)
        session_id = sess_res.json()["id"]

        # Send 3 messages
        for i in range(3):
            await ac.post(f"/api/v1/chat/sessions/{session_id}/messages", json={
                "content": f"Test message {i+1}",
                "detected_emotion": "neutral"
            }, headers=headers)

        # 1. Test pagination limit=2 (each turn produces 1 user msg + 1 assistant msg = 6 total)
        pag_res = await ac.get(f"/api/v1/chat/sessions/{session_id}/messages?limit=2&offset=0", headers=headers)
        assert pag_res.status_code == 200
        assert len(pag_res.json()) == 2

        # 2. Test export
        export_res = await ac.get(f"/api/v1/chat/sessions/{session_id}/export", headers=headers)
        assert export_res.status_code == 200
        data = export_res.json()
        assert data["message_count"] == 6
        assert len(data["messages"]) == 6
        assert "export_date" in data


@pytest.mark.asyncio
async def test_rate_limiter_trigger():
    """Verify sliding-window rate limiter returns 429 after threshold."""
    client_key = "test_rate_limited_ip"
    rate_limiter.reset()
    rate_limiter.requests_per_minute = 5
    rate_limiter.window_seconds = 10

    # Exhaust quota
    for _ in range(5):
        allowed, _ = rate_limiter.is_allowed(client_key)
        assert allowed is True

    # 6th request must be rejected
    allowed, retry_after = rate_limiter.is_allowed(client_key)
    assert allowed is False
    assert retry_after > 0

    # Cleanup
    rate_limiter.requests_per_minute = 120
    rate_limiter.window_seconds = 60
    rate_limiter.reset()


@pytest.mark.asyncio
async def test_profile_update_and_password_change():
    """Verify profile updating and password change flow."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"pwd_{uuid.uuid4().hex[:8]}@example.com"
        token = await register_and_verify(ac, email, "OldPassword123!", "Original Name")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Update Profile
        prof_res = await ac.put("/api/v1/settings/profile", json={"display_name": "Updated Name", "avatar": "star-orb"}, headers=headers)
        assert prof_res.status_code == 200
        assert prof_res.json()["display_name"] == "Updated Name"

        # 2. Change password with wrong old password -> 400
        fail_res = await ac.post("/api/v1/settings/change-password", json={
            "old_password": "WrongPassword!", "new_password": "NewSecurePassword123!"
        }, headers=headers)
        assert fail_res.status_code == 400

        # 3. Change password with correct old password -> 200
        success_res = await ac.post("/api/v1/settings/change-password", json={
            "old_password": "OldPassword123!", "new_password": "NewSecurePassword123!"
        }, headers=headers)
        assert success_res.status_code == 200

        # 4. Verify login with new password succeeds
        new_login = await ac.post("/api/v1/auth/login", json={"email": email, "password": "NewSecurePassword123!"})
        assert new_login.status_code == 200
