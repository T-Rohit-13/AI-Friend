from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SessionCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    persona: str = "friendly_companion"
    language: str = "en"
    mode: str = "normal"  # "normal" or "dump"


class SessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    persona: str
    language: str
    mode: str = "normal"
    dominant_mood: str = "neutral"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    mode: str = Field(default="chat")  # "chat", "voice", "game", "study", "dump"
    detected_emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None


class SafetyNotice(BaseModel):
    is_crisis: bool = False
    crisis_helpline: Optional[str] = None
    resources: List[str] = []
    parent_alert_sent: bool = False
    parent_contact_notified: Optional[str] = None
    alert_status: Optional[str] = None


class ChatTurnResponse(BaseModel):
    message_id: str
    role: str = "assistant"
    content: str
    language: str = "en"
    audio_url: Optional[str] = None
    companion_emotion: str = "neutral"
    user_emotion: Optional[str] = "neutral"
    safety_notice: Optional[SafetyNotice] = None
    navigation_intent: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    audio_url: Optional[str] = None
    detected_emotion: Optional[str] = None
    companion_emotion: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
