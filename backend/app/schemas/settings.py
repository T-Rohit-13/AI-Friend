from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PreferenceUpdate(BaseModel):
    persona: Optional[str] = None
    preferred_language: Optional[str] = None
    voice_id: Optional[str] = None
    theme: Optional[str] = None
    enable_voice_effects: Optional[bool] = None
    emotion_sharing_opt_in: Optional[bool] = None
    privacy_strict_mode: Optional[bool] = None


class PreferenceResponse(BaseModel):
    id: str
    user_id: str
    persona: str
    preferred_language: str
    voice_id: str
    theme: str
    enable_voice_effects: bool
    emotion_sharing_opt_in: bool
    privacy_strict_mode: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=50)
    preferred_language: Optional[str] = None
    avatar: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)
