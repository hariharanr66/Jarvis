from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.models import Conversation, Message, User

class ConversationService:
    @staticmethod
    def get_or_create_user(db: Session, user_id: Optional[str] = None) -> User:
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
        
        # Default anonymous local user if none exists
        user = db.query(User).first()
        if not user:
            user = User(email="local.user@jarvis.ai")
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def create_conversation(db: Session, user_id: Optional[str] = None, title: str = "New Conversation") -> Conversation:
        user = ConversationService.get_or_create_user(db, user_id)
        conversation = Conversation(
            user_id=user.id,
            title=title
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def get_conversation(db: Session, conversation_id: str) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def list_conversations(db: Session, limit: int = 50) -> List[Conversation]:
        return (
            db.query(Conversation)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def delete_conversation(db: Session, conversation_id: str) -> bool:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            return False
        db.delete(conv)
        db.commit()
        return True

    @staticmethod
    def add_message(db: Session, conversation_id: str, role: str, content: str) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.add(msg)
        
        # Touch conversation updated_at
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.updated_at = datetime.utcnow()
            # Auto update title from first message if it's currently default
            if conv.title == "New Conversation" and role == "user":
                summary = content.strip().split("\n")[0][:40]
                if len(content) > 40:
                    summary += "..."
                conv.title = summary

        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def get_conversation_messages(db: Session, conversation_id: str) -> List[Message]:
        return (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )

conversation_service = ConversationService()
