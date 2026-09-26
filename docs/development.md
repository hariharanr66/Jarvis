# JARVIS Development & Setup Guide

## Prerequisites

- **Python**: Version 3.10+
- **Node.js**: Version 18+
- **npm**: Version 9+

---

## 1. Environment Setup

Copy `.env.example` to `.env` inside the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` to configure your AI provider and API keys:

```ini
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite:///./jarvis.db

AI_PROVIDER=auto
AI_MODEL=gemini-2.5-flash
AI_API_KEY=your_gemini_or_openai_key_here
```

---

## 2. Backend Server Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

Run the FastAPI Uvicorn development server:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Diagnostics**: `http://localhost:8000/api/health`

---

## 3. Frontend Development Setup

Open a second terminal window and navigate to `frontend`:

```bash
cd frontend
```

Install Node dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The UI will be accessible in your browser at `http://localhost:5173`.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Diagnostic status of backend and LLM provider |
| `POST` | `/api/chat` | Send prompt to JARVIS and receive AI reply |
| `GET` | `/api/conversations` | List conversation threads |
| `POST` | `/api/conversations` | Create a new conversation thread |
| `GET` | `/api/conversations/{id}` | Load message history for a conversation |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation thread |

---

## 5. Verification & Testing

To verify the setup:

1. Open `http://localhost:5173` in your browser.
2. Ensure the top status bar displays **"System Active"** or **"gemini-2.5-flash"**.
3. Click a prompt suggestion chip or type a message in the input box and press **Enter**.
4. Observe the animated JARVIS thinking state and the received reply.
5. Create a new conversation using **+ New Conversation** in the sidebar.
6. Switch between conversations to verify state persistence across page refreshes.
