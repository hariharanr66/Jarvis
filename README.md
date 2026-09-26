# JARVIS — Personal AI Assistant (V0.2)

JARVIS is a real, high-performance personal AI assistant built with a clean, extensible architecture designed to support cross-device synchronization (Windows Laptop & Android Phone), persistent memory, voice interaction, tool execution, and local control.

---

## 🚀 Version 0.2 Features

- 🧠 **Persistent Contextual Memory**: Stateful long-term memory system across conversations.
- 📂 **Memory Categorization**: User preferences, projects, goals, skills, important facts, frequently used information.
- ⚡ **Auto Fact Extraction**: Intelligent detection of project names, goals, and preferences from normal conversation messages.
- 🛡️ **Credential Filtering**: Automatic blocking of passwords, API keys, bearer tokens, and secrets from persistent memory.
- ⚛️ **Futuristic UI**: Glassmorphism interface inspired by Apple, Linear, and Raycast built with React, Vite, TypeScript, Tailwind CSS, and Framer Motion.
- 🔮 **Animated JARVIS Core**: Reactive glowing central orb visualizing active, thinking, and offline states.
- ⚡ **FastAPI Backend**: Python asynchronous API backend with Pydantic validation and CORS support.
- 🤖 **Provider Abstraction**: Extensible LLM service supporting Google Gemini (`gemini-3.8-flash` primary, `gemini-2.5-flash` fallback) with exponential backoff retries.
- 💾 **Stateful Database**: SQLite persistence via SQLAlchemy tracking Users, Conversations, Messages, and Memories.

---

## 🏗️ Project Architecture

```
JARVIS/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/   # JarvisOrb, TopBar, Sidebar, ChatMessage, ChatInput, MemoryManagerModal, SettingsModal
│   │   ├── hooks/        # useChat, useConversations
│   │   ├── services/     # REST API client (api.ts)
│   │   ├── types/        # TypeScript data models (jarvis.ts)
│   │   ├── utils/        # Date and time formatters
│   │   ├── pages/        # MainChat workspace view
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # Python FastAPI + SQLAlchemy Backend
│   ├── app/
│   │   ├── api/          # health.py, chat.py, memory.py
│   │   ├── core/         # config.py, personality.py
│   │   ├── database/     # session.py, models.py (User, Conversation, Message, Memory)
│   │   ├── schemas/      # chat.py, memory.py (Pydantic validation)
│   │   ├── services/     # ai_service.py, conversation_service.py, memory_service.py
│   │   └── main.py       # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── architecture.md   # Architectural breakdown
│   └── development.md    # Developer setup guide
│
├── .gitignore
└── README.md
```

---

## 🛠️ API Memory Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/memory` | Retrieve all persistent memories (filterable by category or query) |
| `POST` | `/api/memory` | Create a new persistent memory record |
| `PUT` | `/api/memory/{id}` | Update an existing memory record |
| `DELETE` | `/api/memory/{id}` | Delete a memory record |

---

## 💻 Running Locally

### 1. Run Backend Server (Terminal 1)

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

FastAPI server runs on `http://localhost:8000`.

### 2. Run Frontend Development Server (Terminal 2)

```bash
cd frontend
npm run dev
```

Vite app opens at `http://localhost:5173`.
