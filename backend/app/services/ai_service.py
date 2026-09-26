import logging
import asyncio
import re
import httpx
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

from app.core.config import settings
from app.core.personality import JARVIS_SYSTEM_PROMPT

logger = logging.getLogger("jarvis.ai_service")

# Global tracker for backend health status & diagnostic reporting
class SystemStatusTracker:
    def __init__(self):
        self.last_error_category: Optional[str] = None
        self.last_used_model: str = settings.active_gemini_model
        self.service_status: str = "online"

    def record_success(self, model_used: str):
        self.last_used_model = model_used
        self.last_error_category = None
        self.service_status = "online"

    def record_error(self, category: str, model_used: str):
        self.last_used_model = model_used
        self.last_error_category = category
        if category in ["authentication_error", "temporary_unavailable", "timeout_error"]:
            self.service_status = "degraded"

status_tracker = SystemStatusTracker()

def sanitize_text(text: Any) -> str:
    """Strips API keys from URLs, payload texts, and error messages before logging."""
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    
    # Redact key query parameter in URLs
    sanitized = re.sub(r'([?&]key=)[^&\s]+', r'\1***REDACTED***', text)
    # Redact raw API key if present in string
    api_key = settings.get_gemini_api_key()
    if api_key and api_key in sanitized:
        sanitized = sanitized.replace(api_key, "***REDACTED***")
    return sanitized

class AIServiceException(Exception):
    """Custom exception providing sanitized user-friendly messages for frontend."""
    def __init__(self, user_message: str, category: str, technical_detail: str = ""):
        super().__init__(user_message)
        self.user_message = user_message
        self.category = category
        self.technical_detail = sanitize_text(technical_detail)

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        pass

class GeminiLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        if not api_key or not api_key.strip():
            raise AIServiceException(
                user_message="JARVIS AI configuration error. GEMINI_API_KEY is missing in backend/.env.",
                category="authentication_error"
            )
        self.api_key = api_key.strip()
        self.primary_model = settings.active_gemini_model
        self.fallback_model = settings.active_gemini_fallback_model

    async def _attempt_request(
        self, client: httpx.AsyncClient, model_name: str, payload: Dict[str, Any]
    ) -> str:
        """Executes a single HTTP request to Gemini API for a given model, raising appropriate AIServiceException on non-200."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
        
        try:
            res = await client.post(url, json=payload)
        except httpx.TimeoutException as e:
            sanitized_err = sanitize_text(str(e))
            logger.error(f"Gemini API timeout on model '{model_name}': {sanitized_err}")
            status_tracker.record_error("timeout_error", model_name)
            raise AIServiceException(
                user_message="JARVIS experienced a network timeout connecting to the AI service. Please check your network connection.",
                category="timeout_error",
                technical_detail=f"Timeout on {model_name}: {sanitized_err}"
            )
        except Exception as e:
            sanitized_err = sanitize_text(str(e))
            logger.error(f"Network connection error on model '{model_name}': {sanitized_err}")
            status_tracker.record_error("timeout_error", model_name)
            raise AIServiceException(
                user_message="JARVIS experienced a network connection problem. Please check your network.",
                category="timeout_error",
                technical_detail=f"Network error on {model_name}: {sanitized_err}"
            )

        status_code = res.status_code
        raw_error_text = sanitize_text(res.text)

        if status_code == 200:
            data = res.json()
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                status_tracker.record_success(model_name)
                return text.strip()
            except (KeyError, IndexError) as e:
                logger.error(f"Invalid payload format from model '{model_name}': {raw_error_text}")
                status_tracker.record_error("server_error", model_name)
                raise AIServiceException(
                    user_message="JARVIS received an invalid response format from the AI provider.",
                    category="server_error",
                    technical_detail=raw_error_text
                )

        # Categorize non-200 HTTP responses
        if status_code in (401, 403):
            logger.error(f"Gemini authentication failure ({status_code}): {raw_error_text}")
            status_tracker.record_error("authentication_error", model_name)
            raise AIServiceException(
                user_message="JARVIS authentication failed. Please check your GEMINI_API_KEY in backend/.env.",
                category="authentication_error",
                technical_detail=raw_error_text
            )
        elif status_code == 429:
            logger.warning(f"Gemini rate limit exceeded ({status_code}): {raw_error_text}")
            status_tracker.record_error("rate_limit_error", model_name)
            raise AIServiceException(
                user_message="JARVIS is receiving too many requests right now (rate limit reached). Please wait a moment.",
                category="rate_limit_error",
                technical_detail=raw_error_text
            )
        elif status_code in (502, 503, 504):
            logger.warning(f"Gemini temporary availability spike ({status_code}) on '{model_name}': {raw_error_text}")
            status_tracker.record_error("temporary_unavailable", model_name)
            raise AIServiceException(
                user_message="JARVIS is temporarily unable to reach the AI service due to high demand. Retrying...",
                category="temporary_unavailable",
                technical_detail=raw_error_text
            )
        elif status_code >= 500:
            logger.error(f"Gemini internal server error ({status_code}) on '{model_name}': {raw_error_text}")
            status_tracker.record_error("server_error", model_name)
            raise AIServiceException(
                user_message="JARVIS experienced an internal AI server error. Please try again.",
                category="server_error",
                technical_detail=raw_error_text
            )
        else:
            logger.error(f"Gemini error ({status_code}) on '{model_name}': {raw_error_text}")
            status_tracker.record_error("unknown_error", model_name)
            raise AIServiceException(
                user_message="JARVIS encountered an issue processing your request.",
                category="unknown_error",
                technical_detail=raw_error_text
            )

    async def _execute_with_retry_and_fallback(
        self, client: httpx.AsyncClient, models_to_try: List[str], payload: Dict[str, Any]
    ) -> str:
        """Attempts generation across models with exponential backoff for 503 temporary unavailable errors."""
        backoff_delays = [1.0, 2.0, 4.0]  # Retry 1: ~1s, Retry 2: ~2s, Retry 3: ~4s
        last_exception: Optional[AIServiceException] = None

        for model_index, model_name in enumerate(models_to_try):
            is_fallback = model_index > 0
            if is_fallback:
                logger.info(f"Switching to fallback Gemini model: '{model_name}'")

            for attempt in range(len(backoff_delays) + 1):
                try:
                    return await self._attempt_request(client, model_name, payload)
                except AIServiceException as exc:
                    last_exception = exc

                    # Only retry on 503 / temporary_unavailable or timeout errors
                    if exc.category in ("temporary_unavailable", "timeout_error"):
                        if attempt < len(backoff_delays):
                            delay = backoff_delays[attempt]
                            logger.warning(
                                f"Gemini 503/temporary issue on model '{model_name}' (attempt {attempt + 1}/{len(backoff_delays) + 1}). "
                                f"Retrying in {delay}s..."
                            )
                            await asyncio.sleep(delay)
                            continue

                    # For authentication errors, 429 rate limits, or non-retryable errors, break retry loop immediately
                    break

        # If all retries and fallbacks failed, raise user-friendly final exception
        if last_exception and last_exception.category == "temporary_unavailable":
            raise AIServiceException(
                user_message="JARVIS is temporarily unavailable. Please try again in a moment.",
                category="temporary_unavailable",
                technical_detail=last_exception.technical_detail
            )
        elif last_exception:
            raise last_exception
        else:
            raise AIServiceException(
                user_message="JARVIS is temporarily unavailable. Please try again in a moment.",
                category="temporary_unavailable"
            )

    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        contents = []
        system_instruction = None

        for m in messages:
            if m["role"] == "system":
                system_instruction = {"parts": [{"text": m["content"]}]}
                continue
            
            role = "user" if m["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": m["content"]}]
            })

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            }
        }
        if system_instruction:
            payload["systemInstruction"] = system_instruction

        # Determine models to try: primary model first, followed by fallback model if different
        models_to_try = [self.primary_model]
        if self.fallback_model and self.fallback_model != self.primary_model:
            models_to_try.append(self.fallback_model)

        async with httpx.AsyncClient(timeout=30.0) as client:
            return await self._execute_with_retry_and_fallback(client, models_to_try, payload)

def get_llm_provider() -> BaseLLMProvider:
    api_key = settings.get_gemini_api_key()
    if not api_key or not api_key.strip():
        status_tracker.record_error("authentication_error", settings.active_gemini_model)
        raise AIServiceException(
            user_message="JARVIS is missing an active API key. Please set GEMINI_API_KEY in backend/.env.",
            category="authentication_error"
        )
    return GeminiLLMProvider(api_key=api_key)

class AIService:
    def __init__(self):
        self.system_prompt = JARVIS_SYSTEM_PROMPT

    async def generate_reply(self, message_history: List[Dict[str, str]]) -> str:
        provider = get_llm_provider()
        
        # Build prompt stack with system prompt first
        formatted_messages = [{"role": "system", "content": self.system_prompt}]
        formatted_messages.extend(message_history)
        
        return await provider.generate_response(formatted_messages)

ai_service = AIService()
