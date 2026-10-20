from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MemoryCreate(BaseModel):
    fact: str = Field(..., min_length=2, max_length=500)
    category: str = Field(default="preference")


class MemoryResponse(BaseModel):
    id: str
    user_id: str
    fact: str
    category: str
    confidence: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
