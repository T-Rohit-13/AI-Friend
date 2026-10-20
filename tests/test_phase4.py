import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.database import init_db
from backend.app.core.rate_limit import rate_limiter


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    import asyncio
    asyncio.run(init_db())


@pytest.mark.asyncio
async def test_user_isolation_security():
    """Verify User A cannot access or delete User B's sessions or memories."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register User A
        email_a = "user_a_isolation@example.com"
        await ac.post("/api/v1/auth/register", json={
            "email": email_a, "password": "Password123!", "display_name": "User A"
        })
        login_a = await ac.post("/api/v1/auth/login", json={"email": email_a, "password": "Password123!"})
        token_a = login_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Register User B
        email_b = "user_b_isolation@example.com"
        await ac.post("/api/v1/auth/register", json={
            "email": email_b, "password": "Password123!", "display_name": "User B"
        })
        login_b = await ac.post("/api/v1/auth/login", json={"email": email_b, "password": "Password123!"})
        token_b = login_b.json()["access_token"]
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
        email = "pref_user@example.com"
        await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Pref User"
        })
        login = await ac.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

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

        # 3. Verify persistence
        verify_res = await ac.get("/api/v1/settings/preferences", headers=headers)
        assert verify_res.json()["persona"] == "calm_confidant"


@pytest.mark.asyncio
async def test_chat_pagination_and_export():
    """Verify message pagination, deletion, and GDPR export."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = "pagination_user@example.com"
        await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "Password123!", "display_name": "Pagination User"
        })
        login = await ac.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # Create session
        sess = await ac.post("/api/v1/chat/sessions", json={"title": "Export Test"}, headers=headers)
        sess_id = sess.json()["id"]

        # Send multiple turns
        await ac.post(f"/api/v1/chat/sessions/{sess_id}/messages", json={"content": "Turn 1"}, headers=headers)
        await ac.post(f"/api/v1/chat/sessions/{sess_id}/messages", json={"content": "Turn 2"}, headers=headers)

        # Pagination test
        page_res = await ac.get(f"/api/v1/chat/sessions/{sess_id}/messages?limit=2&offset=0", headers=headers)
        assert page_res.status_code == 200
        assert len(page_res.json()) == 2

        # GDPR Export test
        export_res = await ac.get(f"/api/v1/chat/sessions/{sess_id}/export", headers=headers)
        assert export_res.status_code == 200
        export_data = export_res.json()
        assert export_data["message_count"] == 4  # 2 user messages + 2 assistant replies
        assert export_data["session"]["id"] == sess_id

        # Delete session
        del_res = await ac.delete(f"/api/v1/chat/sessions/{sess_id}", headers=headers)
        assert del_res.status_code == 204

        # Confirm deleted
        verify_del = await ac.get(f"/api/v1/chat/sessions/{sess_id}/messages", headers=headers)
        assert verify_del.status_code == 404


@pytest.mark.asyncio
async def test_rate_limiter_trigger():
    """Verify rate limiter blocks excessive requests with 429."""
    client_key = "test_rate_limited_ip"
    max_reqs = 5

    # Simulate rapid requests
    for _ in range(max_reqs):
        allowed, _ = rate_limiter.is_allowed(client_key, max_reqs)
        assert allowed is True

    # Next request must be rejected
    allowed, retry_after = rate_limiter.is_allowed(client_key, max_reqs)
    assert allowed is False
    assert retry_after > 0


@pytest.mark.asyncio
async def test_profile_update_and_password_change():
    """Verify profile updating and password change flow."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = "pwd_user@example.com"
        await ac.post("/api/v1/auth/register", json={
            "email": email, "password": "OldPassword123!", "display_name": "Original Name"
        })
        login = await ac.post("/api/v1/auth/login", json={"email": email, "password": "OldPassword123!"})
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

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
