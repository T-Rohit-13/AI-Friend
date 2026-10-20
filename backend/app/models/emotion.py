import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    modality: Mapped[str] = mapped_column(String(20), default="multimodal")  # "audio", "text", "multimodal"
    primary_emotion: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    raw_scores: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON-encoded distribution
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    # Relationships
    user = relationship("User", back_populates="emotion_logs")
