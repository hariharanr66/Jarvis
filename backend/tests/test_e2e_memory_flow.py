import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api"

print("--- Starting End-to-End Persistent Memory Integration Test ---")

# 1. Conversation 1: Explicit Remember Request
conv1_res = httpx.post(f"{BASE_URL}/conversations", json={"title": "Conversation 1"}, timeout=10.0)
conv1_id = conv1_res.json()["id"]
print(f"Created Conversation 1: {conv1_id}")

chat1_res = httpx.post(
    f"{BASE_URL}/chat",
    json={"conversation_id": conv1_id, "message": "Remember that my name is Hariharan."},
    timeout=30.0
)
print("Conversation 1 HTTP Status:", chat1_res.status_code)
chat1_json = chat1_res.json()
print("Conversation 1 JARVIS Response:", chat1_json.get("message"))

assert chat1_json.get("success") is True
assert "Hariharan" in chat1_json.get("message")

# 2. Check Memory DB via API GET /api/memory
mem_res = httpx.get(f"{BASE_URL}/memory", timeout=10.0)
memories = mem_res.json()
print(f"Retrieved {len(memories)} memories from GET /api/memory:")
for m in memories:
    print(f" - [{m['category']}] {m['key']}: {m['value']}")

assert any(m["key"].lower() == "name" and m["value"] == "Hariharan" for m in memories)

# 3. Start a completely NEW Conversation 2
conv2_res = httpx.post(f"{BASE_URL}/conversations", json={"title": "Conversation 2"}, timeout=10.0)
conv2_id = conv2_res.json()["id"]
print(f"Created NEW Conversation 2: {conv2_id}")

# 4. Conversation 2: Query "What is my name?"
chat2_res = httpx.post(
    f"{BASE_URL}/chat",
    json={"conversation_id": conv2_id, "message": "What is my name?"},
    timeout=30.0
)
print("Conversation 2 HTTP Status:", chat2_res.status_code)
chat2_json = chat2_res.json()
print("Conversation 2 JARVIS Response:", chat2_json.get("message"))

assert chat2_json.get("success") is True
assert "Hariharan" in chat2_json.get("message")

# 5. Security Test: Sensitive credential rejection
security_res = httpx.post(
    f"{BASE_URL}/chat",
    json={"conversation_id": conv2_id, "message": "Remember my API key is sk-1234567890abcdef1234567890"},
    timeout=30.0
)
print("Security Rejection Response:", security_res.json().get("message"))
assert "cannot store sensitive credentials" in security_res.json().get("message")

print("\n[OK] ALL END-TO-END PERSISTENT MEMORY TESTS PASSED SUCCESSFULLY!")
