from typing import Dict, Optional
from pydantic import BaseModel, Field


class EmotionPrediction(BaseModel):
    primary_emotion: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    distribution: Dict[str, float]
    acoustic_tone: Optional[str] = None
    pitch_mean: Optional[float] = None
    rms_energy: Optional[float] = None
    uncertain: Optional[bool] = False


class EmotionHistoryItem(BaseModel):
    id: str
    primary_emotion: str
    confidence: float
    created_at: str
    modality: str
