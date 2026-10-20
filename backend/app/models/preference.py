import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    persona: Mapped[str] = mapped_column(String(50), default="friendly_companion")
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    voice_id: Mapped[str] = mapped_column(String(100), default="en-US-JennyNeural")
    theme: Mapped[str] = mapped_column(String(20), default="dark")
    enable_voice_effects: Mapped[bool] = mapped_column(Boolean, default=True)
    emotion_sharing_opt_in: Mapped[bool] = mapped_column(Boolean, default=True)
    privacy_strict_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="preferences")
