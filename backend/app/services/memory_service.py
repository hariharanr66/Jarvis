import re
import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database.models import Memory, User

logger = logging.getLogger("jarvis.memory_service")

# Allowed standard memory categories
VALID_CATEGORIES = {
    "personal",
    "preferences",
    "goals",
    "projects",
    "skills",
    "routines",
    "important_facts"
}

# Category normalization mapping
CATEGORY_MAPPING = {
    "user preferences": "preferences",
    "user_preferences": "preferences",
    "preference": "preferences",
    "important facts": "important_facts",
    "important_fact": "important_facts",
    "frequently used information": "important_facts",
    "frequent info": "important_facts",
    "routine": "routines",
    "project": "projects",
    "goal": "goals",
    "skill": "skills"
}

# Sensitive credential patterns that MUST NEVER be stored in memory
SENSITIVE_PATTERNS = [
    r'(?i)\b(password|passcode|pwd)\b\s*[:=]?\s*\S+',
    r'(?i)\b(api_key|apikey|api-key)\b\s*[:=]?\s*\S+',
    r'(?i)\b(bearer|auth_token|access_token|secret_key|private_key)\b\s*[:=]?\s*\S+',
    r'\bsk-[a-zA-Z0-9]{20,}\b',
    r'\bAQ\.[a-zA-Z0-9]{20,}\b',
    r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b' # Credit card
]

def normalize_category(cat: str) -> str:
    if not cat:
        return "important_facts"
    c = cat.strip().lower()
    if c in VALID_CATEGORIES:
        return c
    return CATEGORY_MAPPING.get(c, "important_facts")

class MemoryService:
    @staticmethod
    def get_or_create_user(db: Session, user_id: Optional[str] = None) -> User:
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
        user = db.query(User).first()
        if not user:
            user = User(email="local.user@jarvis.ai")
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def contains_sensitive_data(text: str) -> bool:
        if not text:
            return False
        for pattern in SENSITIVE_PATTERNS:
            if re.search(pattern, text):
                return True
        return False

    @staticmethod
    def list_memories(
        db: Session, 
        user_id: Optional[str] = None, 
        category: Optional[str] = None, 
        search_query: Optional[str] = None
    ) -> List[Memory]:
        return MemoryService.search_memories(db, user_id=user_id, category=category, search_query=search_query)

    @staticmethod
    def search_memories(
        db: Session, 
        user_id: Optional[str] = None, 
        category: Optional[str] = None, 
        search_query: Optional[str] = None
    ) -> List[Memory]:
        query = db.query(Memory)
        if user_id:
            query = query.filter(Memory.user_id == user_id)
        if category and category.strip() and category != "all":
            norm_cat = normalize_category(category)
            query = query.filter(Memory.category == norm_cat)
        if search_query and search_query.strip():
            sq = f"%{search_query.strip()}%"
            query = query.filter(or_(Memory.key.ilike(sq), Memory.value.ilike(sq), Memory.category.ilike(sq)))
        return query.order_by(Memory.importance.desc(), Memory.updated_at.desc()).all()

    @staticmethod
    def get_memory(db: Session, memory_id: str) -> Optional[Memory]:
        return db.query(Memory).filter(Memory.id == memory_id).first()

    @staticmethod
    def create_memory(
        db: Session,
        category: str,
        key: str,
        value: str,
        importance: int = 3,
        user_id: Optional[str] = None
    ) -> Tuple[Optional[Memory], bool, Optional[str]]:
        """
        Creates or updates a memory.
        Returns tuple: (memory, is_security_rejected, error_message)
        """
        combined_text = f"{key} {value}"
        if MemoryService.contains_sensitive_data(combined_text):
            logger.warning("Blocked attempt to store sensitive credentials in AI memory.")
            return None, True, "I cannot store sensitive credentials, API keys, or passwords in AI memory for security reasons."

        user = MemoryService.get_or_create_user(db, user_id)
        norm_cat = normalize_category(category)
        clean_key = key.strip()
        clean_val = value.strip()

        # Check for existing duplicate memory for same user, category, and key (case-insensitive)
        existing = db.query(Memory).filter(
            Memory.user_id == user.id,
            Memory.category == norm_cat,
            func.lower(Memory.key) == clean_key.lower()
        ).first()

        if existing:
            existing.value = clean_val
            existing.importance = importance
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            logger.info(f"Updated existing memory id='{existing.id}' [{existing.category}] '{existing.key}' -> '{existing.value}'")
            return existing, False, None

        memory = Memory(
            user_id=user.id,
            category=norm_cat,
            key=clean_key,
            value=clean_val,
            importance=importance
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)
        logger.info(f"Created new memory id='{memory.id}' [{memory.category}] '{memory.key}' -> '{memory.value}'")
        return memory, False, None

    @staticmethod
    def update_memory(
        db: Session,
        memory_id: str,
        category: Optional[str] = None,
        key: Optional[str] = None,
        value: Optional[str] = None,
        importance: Optional[int] = None
    ) -> Tuple[Optional[Memory], bool, Optional[str]]:
        memory = db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            return None, False, "Memory record not found."

        test_key = key if key is not None else memory.key
        test_val = value if value is not None else memory.value
        if MemoryService.contains_sensitive_data(f"{test_key} {test_val}"):
            return None, True, "I cannot store sensitive credentials, API keys, or passwords in AI memory for security reasons."

        if category is not None:
            memory.category = normalize_category(category)
        if key is not None:
            memory.key = key.strip()
        if value is not None:
            memory.value = value.strip()
        if importance is not None:
            memory.importance = importance

        memory.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(memory)
        return memory, False, None

    @staticmethod
    def delete_memory(db: Session, memory_id: str) -> bool:
        memory = db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            return False
        db.delete(memory)
        db.commit()
        logger.info(f"Deleted memory id '{memory_id}'")
        return True

    @staticmethod
    def delete_memory_by_key_or_value(db: Session, search_term: str, user_id: Optional[str] = None) -> List[str]:
        """Deletes memories matching key or value search term."""
        user = MemoryService.get_or_create_user(db, user_id)
        term_clean = search_term.strip().lower()
        words = [w for w in re.split(r'\s+', term_clean) if w not in {"is", "that", "my", "the", "a", "an"}]

        all_user_memories = db.query(Memory).filter(Memory.user_id == user.id).all()
        matches = []
        for m in all_user_memories:
            mk = m.key.lower()
            mv = m.value.lower()
            if term_clean in mk or term_clean in mv or mk in term_clean or mv in term_clean:
                matches.append(m)
            elif any(w in mk or w in mv for w in words if len(w) > 2):
                matches.append(m)

        deleted_keys = []
        for m in set(matches):
            deleted_keys.append(m.key)
            db.delete(m)
        if deleted_keys:
            db.commit()
            logger.info(f"Deleted memories matching '{search_term}': {deleted_keys}")
        return deleted_keys

    @staticmethod
    def get_relevant_memories(db: Session, user_text: str, user_id: Optional[str] = None, limit: int = 8) -> List[Memory]:
        """
        Retrieves relevant memories for current user prompt.
        Does NOT dump full DB unless query requires relevant context.
        """
        all_memories = MemoryService.list_memories(db, user_id=user_id)
        if not all_memories:
            return []

        if not user_text:
            return all_memories[:limit]

        text_lower = user_text.lower()
        
        # Check if user is asking personal questions ("my name", "who am i", "my project", "my goal", "my stack", "what do i work on")
        personal_queries = ["name", "who am i", "my name", "project", "goal", "skill", "prefer", "routine", "like", "use", "work on", "what should i work on"]
        is_personal_query = any(pq in text_lower for pq in personal_queries)

        relevant = []
        for m in all_memories:
            # Match if key, value, or category appears in user query
            key_match = m.key.lower() in text_lower
            val_match = any(word in text_lower for word in m.value.lower().split() if len(word) > 3)
            cat_match = m.category.lower() in text_lower
            
            if key_match or val_match or cat_match or is_personal_query:
                relevant.append(m)

        # Sort by importance descending
        relevant.sort(key=lambda x: x.importance, reverse=True)
        return relevant[:limit]

    @staticmethod
    def format_memory_prompt_context(memories: List[Memory]) -> str:
        """Formats memories into clean internal XML context structure for Gemini (Section 10)."""
        if not memories:
            return ""

        grouped: Dict[str, List[Memory]] = {}
        for m in memories:
            cat_label = m.category.replace("_", " ").title()
            if cat_label not in grouped:
                grouped[cat_label] = []
            grouped[cat_label].append(m)

        lines = ["<user_memory>"]
        for cat, items in grouped.items():
            lines.append(f"{cat}:")
            for item in items:
                lines.append(f"* {item.key}: {item.value}")
            lines.append("")
        lines.append("</user_memory>")
        return "\n".join(lines).strip()

    @staticmethod
    def process_explicit_memory_commands(db: Session, user_text: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Detects explicit instructions to remember or forget context.
        Returns dictionary with action, response message, or None if no explicit command.
        """
        if not user_text:
            return None

        text = user_text.strip()

        # Security check: Check if user asks to remember sensitive information
        if re.search(r'(?i)\b(remember|save|store)\b.*(api_key|apikey|password|secret|pwd|token)', text) or MemoryService.contains_sensitive_data(text):
            return {
                "action": "security_rejected",
                "response": "I cannot store sensitive credentials, API keys, or passwords in AI memory for security reasons."
            }

        # 1. Explicit Forget Requests ("Forget that my name is...", "Forget my name", "Forget project JARVIS", "Delete memory X")
        forget_match = re.search(r'(?i)\b(?:forget|delete\s+memory|remove\s+memory)\s+(?:that\s+)?(?:my\s+)?(.+)', text)
        if forget_match:
            target_term = forget_match.group(1).strip().rstrip('.!?')
            deleted_keys = MemoryService.delete_memory_by_key_or_value(db, target_term, user_id=user_id)
            if deleted_keys:
                keys_str = ", ".join(deleted_keys)
                return {
                    "action": "forgot",
                    "response": f"Got it. I have removed '{keys_str}' from my persistent memory."
                }
            else:
                return {
                    "action": "forgot",
                    "response": f"I couldn't find a memory matching '{target_term}' in my database."
                }

        # 2. Explicit Remember Requests
        # Pattern A: "Remember that my name is Hariharan" / "Remember my name is Hariharan"
        name_match = re.search(r'(?i)\b(?:remember|don\'t\s+forget)\s+(?:that\s+)?my\s+name\s+is\s+([A-Za-z0-9\s_-]+)', text)
        if name_match:
            val = name_match.group(1).strip().rstrip('.!?')
            mem, is_rejected, err = MemoryService.create_memory(db, category="personal", key="name", value=val, importance=5, user_id=user_id)
            if is_rejected:
                return {"action": "security_rejected", "response": err}
            return {
                "action": "remembered",
                "response": f"Got it. I'll remember that your name is {val}."
            }

        # Pattern B: "Remember that my main project is JARVIS" / "Remember project X"
        project_match = re.search(r'(?i)\b(?:remember|don\'t\s+forget)\s+(?:that\s+)?my\s+(?:main\s+|primary\s+)?project\s+is\s+([A-Za-z0-9\s_-]+)', text)
        if project_match:
            val = project_match.group(1).strip().rstrip('.!?')
            mem, is_rejected, err = MemoryService.create_memory(db, category="projects", key="main project", value=val, importance=5, user_id=user_id)
            if is_rejected:
                return {"action": "security_rejected", "response": err}
            return {
                "action": "remembered",
                "response": f"Got it. I'll remember that your main project is {val}."
            }

        # Pattern C: "Remember that I am learning UI/UX" / "Remember my goal is to..."
        goal_match = re.search(r'(?i)\b(?:remember|don\'t\s+forget)\s+(?:that\s+)?(?:I\s+am\s+learning|my\s+goal\s+is\s+to|my\s+goal\s+is)\s+([A-Za-z0-9\s_\/-]+)', text)
        if goal_match:
            val = goal_match.group(1).strip().rstrip('.!?')
            mem, is_rejected, err = MemoryService.create_memory(db, category="goals", key="goal", value=val, importance=4, user_id=user_id)
            if is_rejected:
                return {"action": "security_rejected", "response": err}
            return {
                "action": "remembered",
                "response": f"Got it. I'll remember that your goal is {val}."
            }

        # Pattern D: "Don't forget that I use Figma" / "Remember that I use React"
        pref_match = re.search(r'(?i)\b(?:remember|don\'t\s+forget)\s+(?:that\s+)?(?:I\s+use|I\s+prefer)\s+([A-Za-z0-9\s_-]+)', text)
        if pref_match:
            val = pref_match.group(1).strip().rstrip('.!?')
            mem, is_rejected, err = MemoryService.create_memory(db, category="preferences", key=f"uses {val}", value=val, importance=3, user_id=user_id)
            if is_rejected:
                return {"action": "security_rejected", "response": err}
            return {
                "action": "remembered",
                "response": f"Got it. I'll remember that you use {val}."
            }

        # Generic Pattern E: "Remember that <key> is <value>" / "Remember <key>: <value>"
        generic_match = re.search(r'(?i)\b(?:remember|don\'t\s+forget)\s+(?:that\s+)?(.+?)\s+(?:is|:)\s+(.+)', text)
        if generic_match:
            raw_key = generic_match.group(1).strip().replace("my ", "").replace("the ", "")
            raw_val = generic_match.group(2).strip().rstrip('.!?')

            # Categorize generic match
            cat = "important_facts"
            if any(k in raw_key.lower() for k in ["name", "email", "age", "location", "city", "hometown"]):
                cat = "personal"
            elif any(k in raw_key.lower() for k in ["project", "app", "repo", "codebase"]):
                cat = "projects"
            elif any(k in raw_key.lower() for k in ["goal", "target", "aim", "plan"]):
                cat = "goals"
            elif any(k in raw_key.lower() for k in ["preference", "stack", "favorite", "like"]):
                cat = "preferences"
            elif any(k in raw_key.lower() for k in ["skill", "expertise", "specialty"]):
                cat = "skills"

            mem, is_rejected, err = MemoryService.create_memory(db, category=cat, key=raw_key, value=raw_val, importance=4, user_id=user_id)
            if is_rejected:
                return {"action": "security_rejected", "response": err}
            return {
                "action": "remembered",
                "response": f"Got it. I'll remember that your {raw_key} is {raw_val}."
            }

        return None

memory_service = MemoryService()
