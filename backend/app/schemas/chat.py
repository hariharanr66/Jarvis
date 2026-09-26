from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, description="The message content from the user")

class ChatErrorDetail(BaseModel):
    code: str
    message: str

class ChatResponse(BaseModel):
    success: bool = True
    message: str
    conversation_id: str
    message_id: str
    timestamp: str
    error: Optional[ChatErrorDetail] = None

class MessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class ConversationSchema(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageSchema]] = []

    class Config:
        from_attributes = True
