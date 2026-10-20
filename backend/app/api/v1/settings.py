from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash
from backend.app.models.user import User
from backend.app.models.preference import UserPreference
from backend.app.schemas.settings import (
    PreferenceUpdate,
    PreferenceResponse,
    ProfileUpdate,
    PasswordChange,
)
from backend.app.schemas.auth import UserResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings & Preferences"])


@router.get("/preferences", response_model=PreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch current user's preferences. Auto-creates defaults if none exist."""
    query = select(UserPreference).where(UserPreference.user_id == current_user.id)
    res = await db.execute(query)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            persona="friendly_companion",
            preferred_language=current_user.preferred_language or "en",
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return PreferenceResponse.model_validate(pref)


@router.put("/preferences", response_model=PreferenceResponse)
async def update_preferences(
    payload: PreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update personal preferences (persona, voice, theme, privacy)."""
    query = select(UserPreference).where(UserPreference.user_id == current_user.id)
    res = await db.execute(query)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    # Update only fields provided
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pref, field, value)

    await db.commit()
    await db.refresh(pref)
    return PreferenceResponse.model_validate(pref)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile attributes like display name, preferred language, or avatar."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.preferred_language is not None:
        current_user.preferred_language = payload.preferred_language
    if payload.avatar is not None:
        current_user.avatar = payload.avatar

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Securely change user password."""
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password.",
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"message": "Password changed successfully."}
