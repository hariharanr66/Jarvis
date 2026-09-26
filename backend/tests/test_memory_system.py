import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.database.models import User, Conversation, Message, Memory
from app.services.memory_service import memory_service, normalize_category

class TestJARVISMemorySystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create an in-memory SQLite database for fast unit testing
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()
        # Ensure default test user exists
        self.user = memory_service.get_or_create_user(self.db)

    def tearDown(self):
        self.db.query(Memory).delete()
        self.db.query(Message).delete()
        self.db.query(Conversation).delete()
        self.db.commit()
        self.db.close()

    # 1. Create Memory
    def test_01_create_memory(self):
        mem, is_rejected, err = memory_service.create_memory(
            self.db, category="personal", key="name", value="Hariharan", importance=5, user_id=self.user.id
        )
        self.assertFalse(is_rejected)
        self.assertIsNotNone(mem)
        self.assertEqual(mem.key, "name")
        self.assertEqual(mem.value, "Hariharan")
        self.assertEqual(mem.category, "personal")

    # 2. Retrieve Memory
    def test_02_retrieve_memory(self):
        created, _, _ = memory_service.create_memory(
            self.db, category="goals", key="Primary Goal", value="Learn UI/UX", importance=4, user_id=self.user.id
        )
        fetched = memory_service.get_memory(self.db, created.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.value, "Learn UI/UX")

    # 3. Update Memory
    def test_03_update_memory(self):
        created, _, _ = memory_service.create_memory(
            self.db, category="projects", key="main project", value="Old Project", importance=3, user_id=self.user.id
        )
        updated, is_rejected, _ = memory_service.update_memory(
            self.db, memory_id=created.id, value="JARVIS", importance=5
        )
        self.assertFalse(is_rejected)
        self.assertEqual(updated.value, "JARVIS")
        self.assertEqual(updated.importance, 5)

    # 4. Delete Memory
    def test_04_delete_memory(self):
        created, _, _ = memory_service.create_memory(
            self.db, category="skills", key="Core Skill", value="Python", importance=3, user_id=self.user.id
        )
        success = memory_service.delete_memory(self.db, created.id)
        self.assertTrue(success)
        self.assertIsNone(memory_service.get_memory(self.db, created.id))

    # 5. Search Memory
    def test_05_search_memory(self):
        memory_service.create_memory(self.db, category="preferences", key="uses Figma", value="Figma", importance=3, user_id=self.user.id)
        memory_service.create_memory(self.db, category="projects", key="main project", value="JARVIS", importance=5, user_id=self.user.id)
        
        results = memory_service.search_memories(self.db, search_query="Figma")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].key, "uses Figma")

    # 6. Duplicate Memory Update
    def test_06_duplicate_memory_update(self):
        mem1, _, _ = memory_service.create_memory(
            self.db, category="personal", key="name", value="Hariharan", importance=5, user_id=self.user.id
        )
        # Attempt to create duplicate memory for same category/key (case-insensitive)
        mem2, _, _ = memory_service.create_memory(
            self.db, category="personal", key="NAME", value="Hariharan S", importance=5, user_id=self.user.id
        )
        self.assertEqual(mem1.id, mem2.id)
        self.assertEqual(mem2.value, "Hariharan S")
        all_mems = memory_service.list_memories(self.db, user_id=self.user.id)
        self.assertEqual(len(all_mems), 1)

    # 7. Memory Retrieval in a NEW Conversation
    def test_07_memory_retrieval_new_conversation(self):
        # Store memory
        memory_service.create_memory(self.db, category="personal", key="name", value="Hariharan", importance=5, user_id=self.user.id)

        # Simulate new conversation 2
        conv2 = Conversation(user_id=self.user.id, title="New Conversation 2")
        self.db.add(conv2)
        self.db.commit()

        # Query relevant memories for "What is my name?"
        rel = memory_service.get_relevant_memories(self.db, user_text="What is my name?", user_id=self.user.id)
        context = memory_service.format_memory_prompt_context(rel)
        
        self.assertIn("Personal:", context)
        self.assertIn("name: Hariharan", context)

    # 8. Explicit "Remember This" Request
    def test_08_explicit_remember_request(self):
        res = memory_service.process_explicit_memory_commands(
            self.db, user_text="Remember that my name is Hariharan.", user_id=self.user.id
        )
        self.assertIsNotNone(res)
        self.assertEqual(res["action"], "remembered")
        self.assertIn("Hariharan", res["response"])

        memories = memory_service.list_memories(self.db, user_id=self.user.id)
        self.assertTrue(any(m.key == "name" and m.value == "Hariharan" for m in memories))

    # 9. Explicit "Forget This" Request
    def test_09_explicit_forget_request(self):
        memory_service.create_memory(self.db, category="personal", key="name", value="Hariharan", importance=5, user_id=self.user.id)
        
        res = memory_service.process_explicit_memory_commands(
            self.db, user_text="Forget that my name is Hariharan.", user_id=self.user.id
        )
        self.assertIsNotNone(res)
        self.assertEqual(res["action"], "forgot")
        
        memories = memory_service.list_memories(self.db, user_id=self.user.id)
        self.assertEqual(len(memories), 0)

    # 10. Sensitive Information Rejection
    def test_10_sensitive_information_rejection(self):
        # Test 10a: Password rejection
        res1 = memory_service.process_explicit_memory_commands(
            self.db, user_text="Remember my password is secret12345", user_id=self.user.id
        )
        self.assertEqual(res1["action"], "security_rejected")

        # Test 10b: API Key rejection
        res2 = memory_service.process_explicit_memory_commands(
            self.db, user_text="Remember my API key is sk-123456789012345678901234567890", user_id=self.user.id
        )
        self.assertEqual(res2["action"], "security_rejected")

        # Verify nothing was saved
        memories = memory_service.list_memories(self.db, user_id=self.user.id)
        self.assertEqual(len(memories), 0)

    # 11. Relevant-Memory Filtering
    def test_11_relevant_memory_filtering(self):
        memory_service.create_memory(self.db, category="personal", key="name", value="Hariharan", importance=5, user_id=self.user.id)
        memory_service.create_memory(self.db, category="projects", key="main project", value="JARVIS", importance=5, user_id=self.user.id)
        memory_service.create_memory(self.db, category="skills", key="skill", value="Figma", importance=3, user_id=self.user.id)

        # Relevant request for name
        rel_name = memory_service.get_relevant_memories(self.db, user_text="What is my name?", user_id=self.user.id)
        keys_name = [m.key for m in rel_name]
        self.assertIn("name", keys_name)

if __name__ == "__main__":
    unittest.main()
