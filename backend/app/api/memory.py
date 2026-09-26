from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemorySchema
from app.services.memory_service import memory_service

router = APIRouter()

@router.get("/memory", response_model=List[MemorySchema])
def list_memories(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term in key or value"),
    db: Session = Depends(get_db)
):
    return memory_service.list_memories(db, category=category, search_query=search)

@router.post("/memory", response_model=MemorySchema, status_code=status.HTTP_201_CREATED)
def create_memory(payload: MemoryCreate, db: Session = Depends(get_db)):
    memory, is_rejected, err_msg = memory_service.create_memory(
        db,
        category=payload.category,
        key=payload.key,
        value=payload.value,
        importance=payload.importance,
        user_id=payload.user_id
    )
    if is_rejected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg or "Failed to store memory. Information may contain sensitive credentials."
        )
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to store memory record."
        )
    return memory

@router.put("/memory/{memory_id}", response_model=MemorySchema)
def update_memory(memory_id: str, payload: MemoryUpdate, db: Session = Depends(get_db)):
    updated, is_rejected, err_msg = memory_service.update_memory(
        db,
        memory_id=memory_id,
        category=payload.category,
        key=payload.key,
        value=payload.value,
        importance=payload.importance
    )
    if is_rejected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg or "Failed to update memory due to security policy."
        )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory record with ID '{memory_id}' not found."
        )
    return updated

@router.delete("/memory/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    success = memory_service.delete_memory(db, memory_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory record with ID '{memory_id}' not found."
        )
    return {"status": "success", "message": f"Memory {memory_id} successfully deleted"}
