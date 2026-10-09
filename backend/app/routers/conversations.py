from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db, get_write_db
from ..models import Conversation, Message, User
from ..schemas import ConversationOut, MessageIn
from ..security import current_user
from ..services.serializers import conversation_out

router = APIRouter(prefix="/conversations", tags=["messages"])
LOAD = (selectinload(Conversation.messages), selectinload(Conversation.guest), selectinload(Conversation.listing))


@router.get("", response_model=list[ConversationOut])
def mine(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Conversations where the user is the guest or the host."""
    rows = db.scalars(select(Conversation).where(or_(Conversation.guest_id == user.id, Conversation.host_id == user.id))
                      .order_by(Conversation.created_at.desc()).options(*LOAD)).all()
    return [conversation_out(c, user.id) for c in rows if c.messages]


@router.post("/{conversation_id}/messages", response_model=ConversationOut, status_code=201)
def send(conversation_id: str, body: MessageIn, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    c = db.scalar(select(Conversation).where(Conversation.id == conversation_id).options(*LOAD))
    if not c or user.id not in (c.guest_id, c.host_id):
        raise HTTPException(404, "Conversation not found")
    msg = Message(conversation_id=c.id, sender_id=user.id, text=body.text.strip())
    db.add(msg)
    db.commit()
    db.refresh(c)
    return conversation_out(c, user.id)
