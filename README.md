# 🤖 AI Friend — Multilingual AI Emotional Companion

[![CI Status](https://github.com/T-Rohit-13/AI-Friend/actions/workflows/ci.yml/badge.svg)](https://github.com/T-Rohit-13/AI-Friend/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.10-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![WCAG AAA](https://img.shields.io/badge/a11y-WCAG%20AAA-success.svg)](https://www.w3.org/WAI/WCAG2AAA-Conformance)

A modular, multilingual AI emotional companion web application designed for natural conversation, empathetic listening, humour, study assistance, games, and voice interaction with vocal emotion estimation.

---

## ✨ System Capabilities

- 💬 **Multilingual Text Chat** — Natural conversational companion with emotion-adaptive tone (English, Hindi, Tamil, Spanish, French, German, Japanese).
- 🎙️ **Voice Input & ASR** — Hybrid dual-tier speech recognition with browser Web Speech API ($< 50\text{ms}$) and backend Whisper audio validation (WAV, WebM, MP3).
- 🎭 **Speech Emotion Recognition (SER)** — PyTorch deep learning convolutional neural network (`VoiceEmotionCNN`) estimating affective prosody with 0% speaker identity leakage.
- 🧠 **Transparent Memory Vault** — Transparent personal memory storage with 1-click GDPR Article 17 Right-to-be-Forgotten erasure and data portability export.
- 🎮 **Engaging Activities** — Lighthearted jokes, interactive riddles with progressive hints, trivia quizzes, and collaborative choose-your-own-adventure storytelling.
- 📚 **Study Coach & Focus** — Feynman technique concept explainer (ELI5, High School, College levels) and Pomodoro focus timer.
- 🧘 **Mindfulness & Grounding** — Guided 4-7-8 relaxing breathwork routines for acute anxiety.
- 🎨 **Adaptive Emotional UI** — Biophilic breathing avatar orb with state transitions (idle, listening, thinking, speaking) and dynamic ambient glow matching emotional tone.
- ♿ **Comprehensive Accessibility (a11y)** — WCAG AAA high contrast mode (`data-contrast="high"`), keyboard navigation hotkeys (`Alt+1..5`, `Alt+C`, `Alt+M`), screen reader skip-to-content links, and reduced motion styling.
- 🛡️ **Ethical & Safety Guardrails** — Hardcoded 24/7 crisis emergency hotline routing (988 US/Canada, 112 EU, 9152987821 India Tele-MANAS), parasocial boundary enforcement, and sliding-window rate limiting.

---

## 🏗️ Architecture

```
                    ┌───────────────────────────┐
                    │     React 19 Frontend     │
                    │  (Vite + Design Tokens)   │
                    └─────────────┬─────────────┘
                                  │ HTTP / REST & SSE
                                  ▼
                    ┌───────────────────────────┐
                    │    FastAPI Core Backend   │
                    │  (Rate Limit + JWT Auth)  │
                    └──────┬──────────────┬─────┘
                           │              │
             ┌─────────────┴──┐        ┌──┴─────────────┐
             ▼                ▼        ▼                ▼
     ┌───────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐
     │ ContextEngine │ │ ASR Engine │ │ PyTorch    │ │ SQLite /       │
     │ + Behaviour   │ │ (Whisper / │ │ Voice SER  │ │ PostgreSQL     │
     │   Router      │ │  WebSpeech)│ │ (CNN Model)│ │ (Alembic ORM)  │
     └───────────────┘ └────────────┘ └────────────┘ └────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Local Development (Instant, Zero Dependencies)

#### Backend Service
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Docs: `http://127.0.0.1:8000/docs`
- Health Probe: `http://127.0.0.1:8000/health`

#### Frontend Application
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application: `http://127.0.0.1:5173`

---

### 2. Production Docker Deployment

```bash
docker compose up -d --build
```
- Web Application: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Testing & Quality Gates

Run the comprehensive 34-test end-to-end integration test suite:
```powershell
python -m pytest tests/ -v
```

All 34 tests pass covering:
- Auth, JWT issuance & expired token rejection
- Sliding-window rate limiter (HTTP 429)
- Multi-tenant user isolation & access controls
- Multilingual LLM provider fallback resilience
- Behaviour Router prompt assembly & memory injection
- Multi-modal affective fusion & explicit intent priority
- Multilingual ASR & audio byte header validation
- PyTorch VoiceEmotionCNN training & inference
- Transparent Memory Vault CRUD & GDPR Right to Erasure
- Acute emergency crisis hotline routing & parasocial boundary enforcement

---

## 📁 Repository Structure

```
AI FRIEND/
├── .github/workflows/ci.yml       # GitHub Actions CI automation
├── backend/
│   ├── alembic/                   # Database migrations
│   ├── app/
│   │   ├── api/v1/                # REST endpoints (auth, chat, voice, emotions, games, study, memories, settings)
│   │   ├── core/                  # Database, config, security, rate limiting
│   │   ├── ml/                    # PyTorch SER model, audio preprocessing, dataset splits, training script
│   │   ├── models/                # SQLAlchemy relational schemas
│   │   ├── schemas/               # Pydantic v2 validation contracts
│   │   └── services/              # LLM providers, Behaviour Router, Context Engine, ASR engine, Safety
│   └── requirements.txt           # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/            # EmotionalAvatar, Navbar, ChatView, VoiceControls, GamesView, StudyView, MemoryVault
│   │   ├── services/api.ts        # Typed API client with resilient offline demo fallbacks
│   │   ├── index.css              # Global design tokens, WCAG AAA high contrast, animations
│   │   └── App.tsx                # Application state shell and keyboard hotkeys
│   ├── nginx.conf                 # Production Nginx SPA configuration
│   └── Dockerfile                 # Multi-stage production container
├── docs/                          # Architecture, decisions, ASR benchmarks, SER model card, handover manual
├── models/                        # Trained PyTorch SER model checkpoints
├── tests/                         # 34 integration and security tests
├── docker-compose.yml             # Full-stack container orchestration
├── ARCHITECTURE.md                # System design & architecture specification
└── TODO.md                        # Master 12-phase project status tracker
```

---

## 📄 License & Ethical Standards
This project is dedicated to empathetic, ethical AI companionship. It includes strict, hardcoded safeguards preventing toxic dependence, romantic illusion, or mental health medical misrepresentation.
