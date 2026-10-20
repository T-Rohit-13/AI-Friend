from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.memory import UserMemory
from backend.app.schemas.memory import MemoryCreate, MemoryResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/memories", tags=["Memory Vault"])


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
