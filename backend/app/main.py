import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import Base, engine
from app.api import health, chat, memory

logger = logging.getLogger("jarvis.startup")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation check
    gemini_key = settings.get_gemini_api_key()
    if not gemini_key or not gemini_key.strip():
        err_msg = (
            "\n"
            "========================================================================\n"
            "CRITICAL STARTUP ERROR: GEMINI_API_KEY environment variable is missing!\n"
            "Please configure GEMINI_API_KEY in backend/.env before starting JARVIS.\n"
            "========================================================================\n"
        )
        logger.error(err_msg)
        print(err_msg)
    else:
        logger.info(f"JARVIS Core initialized with model: {settings.active_gemini_model}")
    
    yield

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JARVIS AI Assistant Backend",
    description="Core backend for JARVIS Personal AI Assistant powered by Google Gemini",
    version="0.2.0",
    lifespan=lifespan
)

# Configure CORS dynamically for local development & production frontend origin
def get_cors_origins():
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    if settings.FRONTEND_URL:
        clean_url = settings.FRONTEND_URL.strip().rstrip("/")
        if clean_url and clean_url not in origins:
            origins.append(clean_url)
    if settings.ALLOWED_ORIGINS:
        for item in settings.ALLOWED_ORIGINS.split(","):
            cleaned = item.strip().rstrip("/")
            if cleaned and cleaned not in origins:
                origins.append(cleaned)
    return origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat & Conversations"])
app.include_router(memory.router, prefix="/api", tags=["Memory Management"])

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "JARVIS AI Assistant API (Gemini V0.2 with Memory)",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
