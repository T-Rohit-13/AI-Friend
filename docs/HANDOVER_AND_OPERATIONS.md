# AI Friend — Handover, Operations & Maintenance Manual

## 1. System Overview & Architecture
**AI Friend** is an emotionally attuned, multimodal AI companion application built for supportive conversation, active listening, learning assistance, games, and mindfulness.

- **Frontend**: React 19, TypeScript, Vite, CSS Design Tokens with biophilic low-arousal aesthetics, WCAG AAA High Contrast mode, and Web Speech API.
- **Backend**: FastAPI async Python service with SQLAlchemy 2.0 ORM, Alembic schema migrations, sliding-window rate limiting, and JWT authentication.
- **LLM Context Engine**: Pluggable provider architecture (Groq, OpenAI, Ollama, resilient local Mock companion) with Behaviour Router, transparent memory grounding, and explicit intent prioritization.
- **Voice Pipeline**: Multilingual ASR with magic byte validation, Remote/Local Whisper support, and PyTorch deep learning Speech Emotion Recognition (`VoiceEmotionCNN`).
- **Ethical & Safety Guardrails**: Hardcoded emergency crisis hotline interceptors (988 US/Canada, 112 EU, 9152987821 India Tele-MANAS), parasocial boundary enforcement, GDPR Right-to-be-Forgotten, and data portability export.

---

## 2. Quickstart Run Guide

### Option A: Local Development (Instant, Zero External Dependencies)

#### 1. Backend Service
```powershell
# From project root:
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Probe: `http://127.0.0.1:8000/health`
- Readiness Probe: `http://127.0.0.1:8000/ready`

#### 2. Frontend Application
```powershell
# In another terminal:
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application: `http://127.0.0.1:5173`

---

### Option B: Production Container Deployment (Docker Compose)

```bash
# Build and run all services (PostgreSQL + pgvector, Backend, Frontend Nginx):
docker compose up -d --build
```
- Web App: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 3. Configuration & Environment Variables

| Variable | Default Value | Description |
|:---|:---:|:---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./aifriend.db` | Async SQLAlchemy database URI (SQLite for local dev, PostgreSQL for production) |
| `SECRET_KEY` | *(dev secret)* | 32-byte secret key for signing JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | Session JWT validity duration |
| `LLM_PROVIDER` | `mock` | Active companion provider (`mock`, `groq`, `openai`, `ollama`) |
| `LLM_API_KEY` | `None` | API key for LLM provider |
| `GROQ_API_KEY` | `None` | Optional Groq cloud acceleration key |
| `OPENAI_API_KEY`| `None` | Optional OpenAI key |
| `LLM_MODEL` | `llama3-70b-8192` | Model name / checkpoint |
| `MAX_HISTORY_TURNS` | `10` | Conversation history turns passed for context grounding |
| `ASR_PROVIDER` | `web_speech` | Speech recognition mode (`web_speech`, `whisper`) |

---

## 4. Test Suite Execution & Quality Gates

Run the complete 34-test end-to-end integration test suite:
```powershell
python -m pytest tests/ -v
```

All 34 test cases cover:
- Health & Readiness probes
- JWT authentication registration & token validation
- User data isolation across tenants
- Preferences & profile management
- Behaviour Router prompt assembly & memory injection
- Multi-turn conversational chat with emotion adaptation
- Safety crisis regex override & helpline routing
- Parasocial boundary enforcement
- Multilingual ASR & audio byte validation (WAV, WebM, MP3)
- PyTorch VoiceEmotionCNN feature extraction & speaker-independent cross-validation
- Memory Vault CRUD, auto-extraction, and privacy strict mode gating
- GDPR Article 17 Right to Erasure account deletion

---

## 5. Backup & Disaster Recovery

### Local SQLite Backup:
```powershell
Copy-Item aifriend.db "aifriend_backup_$(Get-Date -Format 'yyyyMMdd_HHmm').db"
```

### PostgreSQL Container Backup:
```bash
docker exec -t aifriend-postgres pg_dumpall -c -U aifriend > backup.sql
# Restore:
cat backup.sql | docker exec -i aifriend-postgres psql -U aifriend -d aifriend
```

---

## 6. Security Incident Response
1. **Self-Harm / Crisis Interception**: If a user communicates self-harm intent, the emergency regex layer intercepts the turn before reaching the LLM and displays verified 24/7 crisis hotlines.
2. **Account Erasure**: A user can trigger complete account deletion via `DELETE /api/v1/settings/account`, which cascades and purges all conversations, messages, memories, and preferences.
