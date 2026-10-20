from typing import Dict
from pydantic import BaseModel, Field


class EmotionPrediction(BaseModel):
    primary_emotion: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    distribution: Dict[str, float]


class EmotionHistoryItem(BaseModel):
    id: str
    primary_emotion: str
    confidence: float
    created_at: str
    modality: str
