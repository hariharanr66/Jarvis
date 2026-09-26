from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    ConversationSchema, 
    ConversationCreate
)
from app.services.conversation_service import conversation_service
from app.services.memory_service import memory_service
from app.services.ai_service import ai_service, AIServiceException

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, db: Session = Depends(get_db)):
    # 1. Resolve or create conversation
    conv_id = payload.conversation_id
    if not conv_id:
        new_conv = conversation_service.create_conversation(db)
        conv_id = new_conv.id
    else:
        conv = conversation_service.get_conversation(db, conv_id)
        if not conv:
            new_conv = conversation_service.create_conversation(db)
            conv_id = new_conv.id

    # 2. Save user message to database
    user_msg = conversation_service.add_message(
        db, conversation_id=conv_id, role="user", content=payload.message
    )

    # 3. Check for explicit "Remember that..." or "Forget..." memory commands (Section 4 & 6)
    try:
        explicit_result = memory_service.process_explicit_memory_commands(db, payload.message)
        if explicit_result and "response" in explicit_result:
            assistant_reply = explicit_result["response"]
            assistant_msg = conversation_service.add_message(
                db, conversation_id=conv_id, role="assistant", content=assistant_reply
            )
            return ChatResponse(
                success=True,
                conversation_id=conv_id,
                message_id=assistant_msg.id,
                message=assistant_reply,
                timestamp=assistant_msg.created_at.isoformat()
            )
    except Exception as exc:
        pass

    # 4. Memory Retrieval: Search and filter relevant memories for AI context (Section 5 & 10)
    relevant_memories = memory_service.get_relevant_memories(db, payload.message)
    memory_context = memory_service.format_memory_prompt_context(relevant_memories)

    # 5. Retrieve conversation message history
    history_messages = conversation_service.get_conversation_messages(db, conv_id)
    history_payload = []
    
    # Inject relevant memory context into history payload if present
    if memory_context:
        history_payload.append({"role": "system", "content": memory_context})

    for msg in history_messages:
        history_payload.append({"role": msg.role, "content": msg.content})

    # 6. Generate reply using AI Service with robust exception handling
    try:
        assistant_reply = await ai_service.generate_reply(history_payload)
    except AIServiceException as exc:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        if exc.category == "authentication_error":
            status_code = status.HTTP_401_UNAUTHORIZED
        elif exc.category == "rate_limit_error":
            status_code = status.HTTP_429_TOO_MANY_REQUESTS
        elif exc.category in ("temporary_unavailable", "timeout_error"):
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        
        raise HTTPException(
            status_code=status_code,
            detail={
                "success": False,
                "error": {
                    "code": exc.category,
                    "message": exc.user_message
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "internal_server_error",
                    "message": "JARVIS is currently unable to process your request. Please try again."
                }
            }
        )

    # 7. Save assistant reply to database
    assistant_msg = conversation_service.add_message(
        db, conversation_id=conv_id, role="assistant", content=assistant_reply
    )

    return ChatResponse(
        success=True,
        conversation_id=conv_id,
        message_id=assistant_msg.id,
        message=assistant_reply,
        timestamp=assistant_msg.created_at.isoformat()
    )

@router.get("/conversations", response_model=List[ConversationSchema])
def list_conversations(db: Session = Depends(get_db)):
    return conversation_service.list_conversations(db)

@router.post("/conversations", response_model=ConversationSchema)
def create_conversation(payload: ConversationCreate = ConversationCreate(), db: Session = Depends(get_db)):
    title = payload.title or "New Conversation"
    return conversation_service.create_conversation(db, title=title)

@router.get("/conversations/{conversation_id}", response_model=ConversationSchema)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = conversation_service.get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    success = conversation_service.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "success", "message": f"Conversation {conversation_id} deleted"}
