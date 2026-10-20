from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.memory import UserMemory
from backend.app.models.preference import UserPreference
from backend.app.schemas.memory import MemoryCreate, MemoryResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/memories", tags=["Memory Vault"])


class MemoryUpdate(BaseModel):
    fact: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class MemoryExtractRequest(BaseModel):
    message_text: str


class MemoryExtractResponse(BaseModel):
    extracted: bool
    persisted: bool
    fact: Optional[str] = None
    category: Optional[str] = None
    confidence: float = 0.0


@router.get("", response_model=List[MemoryResponse])
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all stored user memories."""
    query = (
        select(UserMemory)
        .where(UserMemory.user_id == current_user.id)
        .order_by(UserMemory.created_at.desc())
    )
    result = await db.execute(query)
    memories = result.scalars().all()
    return [MemoryResponse.model_validate(m) for m in memories]


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    payload: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Explicitly save a memory / personal fact."""
    memory = UserMemory(
        user_id=current_user.id,
        fact=payload.fact,
        category=payload.category,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return MemoryResponse.model_validate(memory)


@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing transparent memory."""
    query = select(UserMemory).where(
        UserMemory.id == memory_id,
        UserMemory.user_id == current_user.id,
    )
    res = await db.execute(query)
    memory = res.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    if payload.fact is not None:
        memory.fact = payload.fact
    if payload.category is not None:
        memory.category = payload.category
    if payload.is_active is not None:
        memory.is_active = payload.is_active

    await db.commit()
    await db.refresh(memory)
    return MemoryResponse.model_validate(memory)


@router.post("/extract", response_model=MemoryExtractResponse)
async def extract_memory(
    payload: MemoryExtractRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Extract personal facts and preferences from conversation text.
    Respects user privacy: bypasses persistence if privacy strict mode is enabled.
    """
    text = payload.message_text.strip()
    lower = text.lower()

    # Check user preference for privacy strict mode
    pref_res = await db.execute(select(UserPreference).where(UserPreference.user_id == current_user.id))
    pref = pref_res.scalar_one_or_none()
    privacy_strict = pref.privacy_strict_mode if pref else False

    extracted_fact = None
    category = "preference"
    confidence = 0.0

    if "i like " in lower or "i love " in lower:
        item = text[lower.find("like" if "i like" in lower else "love") + 5 :].strip(" .!?,")
        extracted_fact = f"Likes {item}"
        category = "interest"
        confidence = 0.88
    elif "i am learning " in lower or "studying " in lower:
        topic = text[lower.find("learning" if "learning" in lower else "studying") + 9 :].strip(" .!?,")
        extracted_fact = f"Currently learning {topic}"
        category = "goal"
        confidence = 0.92
    elif "my goal is " in lower or "i want to achieve " in lower:
        goal = text[lower.find("goal is" if "goal is" in lower else "achieve") + 8 :].strip(" .!?,")
        extracted_fact = f"Goal: {goal}"
        category = "goal"
        confidence = 0.95

    persisted = False
    if extracted_fact and not privacy_strict:
        mem = UserMemory(
            user_id=current_user.id,
            fact=extracted_fact,
            category=category,
            confidence=confidence,
        )
        db.add(mem)
        await db.commit()
        persisted = True

    return MemoryExtractResponse(
        extracted=extracted_fact is not None,
        persisted=persisted,
        fact=extracted_fact,
        category=category if extracted_fact else None,
        confidence=confidence,
    )


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GDPR Right-to-Forget: erase all memories stored for this user."""
    await db.execute(delete(UserMemory).where(UserMemory.user_id == current_user.id))
    await db.commit()
    return None


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a single memory."""
    query = select(UserMemory).where(
        UserMemory.id == memory_id,
        UserMemory.user_id == current_user.id,
    )
    res = await db.execute(query)
    memory = res.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    await db.delete(memory)
    await db.commit()
    return None
