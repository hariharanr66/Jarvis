import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load .env file from the backend directory regardless of working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: Optional[str] = None
    
    DATABASE_URL: str = "sqlite:///./jarvis.db"
    
    AI_PROVIDER: str = "gemini"
    GEMINI_MODEL: Optional[str] = None
    GEMINI_FALLBACK_MODEL: Optional[str] = None
    AI_MODEL: str = "gemini-3.6-flash"
    
    GEMINI_API_KEY: Optional[str] = None
    AI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"

    @property
    def active_database_url(self) -> str:
        url = self.DATABASE_URL or "sqlite:///./jarvis.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def active_gemini_model(self) -> str:
        return self.GEMINI_MODEL or self.AI_MODEL or "gemini-3.6-flash"

    @property
    def active_gemini_fallback_model(self) -> str:
        return self.GEMINI_FALLBACK_MODEL or "gemini-3.1-flash-lite"

    def get_gemini_api_key(self) -> Optional[str]:
        return (
            self.GEMINI_API_KEY 
            or self.AI_API_KEY 
            or os.getenv("GEMINI_API_KEY") 
            or os.getenv("AI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )

settings = Settings()
