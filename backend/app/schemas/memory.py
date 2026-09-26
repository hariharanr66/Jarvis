from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MemoryBase(BaseModel):
    category: str = Field(default="important_facts", description="Memory category: personal, preferences, goals, projects, skills, routines, important_facts")
    key: str = Field(..., min_length=1, description="Memory label/key (e.g., 'Main Project', 'Preferred Stack')")
    value: str = Field(..., min_length=1, description="Memory detail/value (e.g., 'Sree Promoters', 'React & FastAPI')")
    importance: int = Field(default=3, ge=1, le=5, description="Importance score (1-5)")

class MemoryCreate(MemoryBase):
    user_id: Optional[str] = None

class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    key: Optional[str] = None
    value: Optional[str] = None
    importance: Optional[int] = Field(default=None, ge=1, le=5)

class MemorySchema(MemoryBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
