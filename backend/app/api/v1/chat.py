from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.session import ChatSession
from backend.app.models.message import Message
from backend.app.schemas.chat import (
    SessionCreate,
    SessionResponse,
    MessageCreate,
    MessageResponse,
    ChatTurnResponse,
    SafetyNotice,
)
from backend.app.api.deps import get_current_user
from backend.app.services.safety import evaluate_safety
from backend.app.services.llm import get_llm_client

router = APIRouter(prefix="/chat", tags=["Conversation & Chat"])


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all chat sessions for the current user."""
    query = (
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    )
    result = await db.execute(query)
    sessions = result.scalars().all()
    return [SessionResponse.model_validate(s) for s in sessions]


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chat session."""
    session = ChatSession(
        user_id=current_user.id,
        title=payload.title or "New Conversation",
        persona=payload.persona,
        language=payload.language or current_user.preferred_language,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionResponse.model_validate(session)


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch paginated message history for a given session."""
    sess_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    )
    sess_res = await db.execute(sess_query)
    session = sess_res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msg_query = (
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    msg_res = await db.execute(msg_query)
    messages = msg_res.scalars().all()
    return [MessageResponse.model_validate(m) for m in messages]


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a conversation session and all its messages."""
    sess_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    )
    res = await db.execute(sess_query)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()
    return None


@router.get("/sessions/{session_id}/export")
async def export_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export complete session transcript for GDPR data portability."""
    sess_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    )
    res = await db.execute(sess_query)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msg_query = (
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
    )
    msg_res = await db.execute(msg_query)
    messages = msg_res.scalars().all()

    return {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "user_id": current_user.id,
        "session": {
            "id": session.id,
            "title": session.title,
            "persona": session.persona,
            "language": session.language,
            "created_at": session.created_at.isoformat(),
        },
        "message_count": len(messages),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "companion_emotion": m.companion_emotion,
                "detected_emotion": m.detected_emotion,
                "timestamp": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.post("/sessions/{session_id}/messages", response_model=ChatTurnResponse)
async def send_message(
    session_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a user message, evaluate safety & emotion, and generate the companion reply."""
    sess_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    )
    sess_res = await db.execute(sess_query)
    session = sess_res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Save User Message
    user_msg = Message(
        session_id=session.id,
        role="user",
        content=payload.content,
        detected_emotion=payload.detected_emotion,
    )
    db.add(user_msg)
    await db.flush()

    # 2. Safety Screening
    is_flagged, direct_reply, safety_notice = evaluate_safety(
        payload.content,
        user_language=session.language,
    )

    companion_emotion = "compassionate" if (safety_notice and safety_notice.is_crisis) else "warm"

    if is_flagged and direct_reply:
        reply_content = direct_reply
    else:
        # 3. LLM Generation
        llm = get_llm_client()
        reply_content = await llm.generate_response(
            messages=[{"role": "user", "content": payload.content}],
            language=session.language,
            detected_emotion=payload.detected_emotion,
            persona=session.persona,
        )

    # 4. Save Assistant Message
    assistant_msg = Message(
        session_id=session.id,
        role="assistant",
        content=reply_content,
        companion_emotion=companion_emotion,
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return ChatTurnResponse(
        message_id=assistant_msg.id,
        role="assistant",
        content=reply_content,
        language=session.language,
        companion_emotion=companion_emotion,
        safety_notice=safety_notice,
    )
