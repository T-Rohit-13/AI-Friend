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


from fastapi.responses import StreamingResponse
import json
from backend.app.core.config import settings
from backend.app.models.memory import UserMemory
from backend.app.services.behaviour_router import BehaviourRouter


@router.post("/sessions/{session_id}/messages", response_model=ChatTurnResponse)
async def send_message(
    session_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a user message, evaluate safety & emotion, and generate the companion reply with multi-turn context."""
    sess_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    )
    sess_res = await db.execute(sess_query)
    session = sess_res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Fetch recent message history for multi-turn context
    history_query = (
        select(Message)
        .where(Message.session_id == session.id)
        .order_by(Message.created_at.desc())
        .limit(settings.MAX_HISTORY_TURNS)
    )
    hist_res = await db.execute(history_query)
    prior_messages = list(reversed(hist_res.scalars().all()))
    history_list = [{"role": m.role, "content": m.content} for m in prior_messages]

    # 2. Fetch active transparent memories for grounding
    mem_query = (
        select(UserMemory)
        .where(UserMemory.user_id == current_user.id, UserMemory.is_active == True)
        .order_by(UserMemory.created_at.desc())
        .limit(5)
    )
    mem_res = await db.execute(mem_query)
    memories = [m.fact for m in mem_res.scalars().all()]

    # 3. Save User Message
    user_msg = Message(
        session_id=session.id,
        role="user",
        content=payload.content,
        detected_emotion=payload.detected_emotion,
    )
    db.add(user_msg)
    await db.flush()

    # 4. Context Engine Turn Processing
    from backend.app.services.context_engine import ContextEngine

    turn_result = await ContextEngine.process_turn(
        user_message=payload.content,
        session_id=session.id,
        user_language=session.language,
        persona=session.persona,
        vocal_emotion=payload.detected_emotion,
        text_emotion=None,
        memories=memories,
        history=history_list,
    )

    reply_content = turn_result["content"]
    companion_emotion = turn_result["companion_emotion"]
    safety_notice = turn_result["safety_notice"]

    # 7. Save Assistant Message
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


@router.post("/sessions/{session_id}/stream")
async def stream_chat_turn(
    session_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream assistant response chunks via Server-Sent Events (SSE)."""
    sess_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    )
    sess_res = await db.execute(sess_query)
    session = sess_res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Safety check first
    is_flagged, direct_reply, safety_notice = evaluate_safety(
        payload.content,
        user_language=session.language,
    )

    async def event_generator():
        if is_flagged and direct_reply:
            yield f"data: {json.dumps({'chunk': direct_reply, 'is_crisis': True})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Prepare messages
        system_prompt = BehaviourRouter.build_system_prompt(
            persona=session.persona,
            language=session.language,
            detected_emotion=payload.detected_emotion,
        )
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": payload.content}]
        llm = get_llm_client()

        full_reply = []
        async for token in llm.stream_response(messages, language=session.language, detected_emotion=payload.detected_emotion, persona=session.persona):
            full_reply.append(token)
            yield f"data: {json.dumps({'chunk': token})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
