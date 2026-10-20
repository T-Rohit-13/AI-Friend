from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SessionCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    persona: str = "friendly_companion"
    language: str = "en"


class SessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    persona: str
    language: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    mode: str = Field(default="chat")  # "chat", "voice", "game", "study"
    detected_emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None


class SafetyNotice(BaseModel):
    is_crisis: bool = False
    crisis_helpline: Optional[str] = None
    resources: List[str] = []


class ChatTurnResponse(BaseModel):
    message_id: str
    role: str = "assistant"
    content: str
    language: str = "en"
    audio_url: Optional[str] = None
    companion_emotion: str = "neutral"
    safety_notice: Optional[SafetyNotice] = None


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
