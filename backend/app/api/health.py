from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings
from app.services.ai_service import status_tracker

router = APIRouter()

@router.get("/health")
def health_check():
    gemini_key = settings.get_gemini_api_key()
    api_configured = bool(gemini_key and gemini_key.strip())

    return {
        "status": status_tracker.service_status,
        "system": "JARVIS AI Engine",
        "version": "0.1.0",
        "ai_provider": "gemini",
        "api_configured": api_configured,
        "selected_model": settings.active_gemini_model,
        "fallback_model": settings.active_gemini_fallback_model,
        "service_status": status_tracker.service_status,
        "last_error_category": status_tracker.last_error_category,
        "timestamp": datetime.utcnow().isoformat()
    }
