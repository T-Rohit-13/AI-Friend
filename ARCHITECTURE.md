# AI Friend — Architecture Document

## 1. Overview

AI Friend is a multilingual AI emotional companion — a web application that provides
friendly conversational AI interaction with support for text and voice input, emotion
estimation from audio, multilingual speech recognition (English, Tamil, Hindi), and
adaptive response generation.

**This is an AI companion, not a medical diagnostic system.**

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
│                   (Voice or Text Input)                           │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (React + TypeScript + Vite)                 │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────────┐    │
│  │ Auth     │ │ Chat UI  │ │ Voice     │ │ Settings &      │    │
│  │ Screens  │ │ & History│ │ Recorder  │ │ Preferences     │    │
│  └──────────┘ └──────────┘ └───────────┘ └─────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────────┐    │
│  │ Activity │ │ Memory   │ │ Theme     │ │ Privacy         │    │
│  │ Center   │ │ Manager  │ │ System    │ │ Dashboard       │    │
│  └──────────┘ └──────────┘ └───────────┘ └─────────────────┘    │
└──────────────┬──────────────────────────────────────────────────┘
               │  REST API (typed client)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│           BACKEND (Python + FastAPI)                              │
│                                                                   │
│  Layer B — API Gateway & Security                                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Auth │ Rate Limit │ Validation │ CORS │ Consent Check   │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer C — Audio Input Pipeline                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Format Validation → Normalize → Branch to ASR & Emotion │     │
│  └─────────────────────────────────────────────────────────┘     │
│           │                           │                           │
│           ▼                           ▼                           │
│  Layer D — ASR                Layer E — Emotion                  │
│  ┌──────────────┐            ┌──────────────────┐                │
│  │ Whisper or   │            │ CNN on Log-Mel   │                │
│  │ equivalent   │            │ Spectrograms     │                │
│  │ (EN/TA/HI)   │            │ + Uncertainty    │                │
│  └──────┬───────┘            └────────┬─────────┘                │
│         │                             │                           │
│         ▼                             ▼                           │
│  Layer F — Context & Decision Engine                             │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Explicit Request + Transcript + Language + Emotion +     │     │
│  │ User Prefs + Permitted Memory → Priority Resolution      │     │
│  └─────────────────────────────────────────────────────────┘     │
│                          │                                        │
│                          ▼                                        │
│  Layer G — Companion Orchestrator                                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Behaviour Router → LLM Provider Adapter →                │     │
│  │ Safety Checks → Activity Tools → Memory Retrieval        │     │
│  └─────────────────────────────────────────────────────────┘     │
│                          │                                        │
│                          ▼                                        │
│  Layer H — Response Generation                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Text Reply + Optional TTS + Language Tag + Behaviour Tag │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer I — Data & Monitoring                                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ PostgreSQL │ Structured Logs │ Metrics │ Retention       │     │
│  └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Technology Stack

| Layer        | Technology                                   | Status     |
|--------------|----------------------------------------------|------------|
| Frontend     | React 18+, TypeScript, Vite, Tailwind CSS    | To install |
| Backend      | Python 3.14, FastAPI, Pydantic, SQLAlchemy   | To install |
| Database     | PostgreSQL 16                                | To install |
| ML Framework | PyTorch 2.10 (installed), Librosa, NumPy     | Partial    |
| ASR          | Whisper (via adapter)                        | To install |
| LLM          | Provider-independent interface               | To build   |
| TTS          | Provider-independent adapter                 | To build   |
| CI/CD        | GitHub Actions                               | To config  |
| Container    | Docker (optional, documented)                | Deferred   |

## 4. Data Flow — Voice Message

```
Audio Capture (browser MediaRecorder)
    │
    ▼
POST /api/v1/voice/transcribe  ─────────────────────────────┐
POST /api/v1/voice/analyze-emotion ─────────────────────┐   │
    │                                                    │   │
    ▼                                                    ▼   ▼
┌───────────────┐                              ┌───────────────────┐
│ Audio         │                              │ Audio             │
│ Validation    │                              │ Validation        │
│ & Preprocess  │                              │ & Preprocess      │
└───────┬───────┘                              └────────┬──────────┘
        │                                               │
        ▼                                               ▼
┌───────────────┐                              ┌───────────────────┐
│ ASR Model     │                              │ Log-Mel           │
│ (Whisper)     │                              │ Spectrogram       │
│ EN / TA / HI  │                              │ Extraction        │
└───────┬───────┘                              └────────┬──────────┘
        │                                               │
        ▼                                               ▼
┌───────────────┐                              ┌───────────────────┐
│ Transcript +  │                              │ Emotion CNN       │
│ Language ID   │                              │ → Probabilities   │
│ + Confidence  │                              │ + Uncertainty     │
└───────┬───────┘                              └────────┬──────────┘
        │                                               │
        └──────────────────┬────────────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Context Engine      │
                │ (explicit request   │
                │  takes priority)    │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Companion Response  │
                │ + Optional TTS      │
                └─────────────────────┘
```

## 5. Database Schema (High-Level)

```
users ──────────┐
                │
user_preferences│──── 1:1 ──── users
                │
consent_records │──── N:1 ──── users
                │
conversations   │──── N:1 ──── users
                │
messages        │──── N:1 ──── conversations
                │
memories        │──── N:1 ──── users (consent-gated)
                │
feedback        │──── N:1 ──── messages
                │
activity_sessions──── N:1 ──── users
                │
emotion_predictions ─ N:1 ──── messages (metadata only)
                │
model_versions  │──── standalone registry
                │
audit_events    │──── N:1 ──── users (admin)
```

## 6. API Design Principles

- Versioned: `/api/v1/`
- Validated: Pydantic request/response schemas
- Authenticated: JWT or session-based tokens
- Rate-limited: Per-user request throttling
- Error-structured: Consistent error response format
- OpenAPI-documented: Auto-generated from FastAPI

## 7. Security Architecture

- HTTPS in production
- Password hashing (bcrypt or argon2)
- JWT tokens with expiry
- Server-side authorization on all protected routes
- CORS restricted to approved origins
- Input validation and request-size limits
- Secrets in environment variables only
- No raw audio stored by default
- Audit logging for sensitive operations
- Rate limiting on auth and upload endpoints
- Dependency vulnerability scanning in CI

## 8. ML Model Architecture

### Emotion Classification (Phase 7)
- Input: Audio → Log-Mel Spectrogram (128 mel bands, 16kHz)
- Architecture: CNN baseline (Conv2d → BatchNorm → ReLU → Pool → FC)
- Output: Probability distribution over emotion classes + uncertainty
- Evaluation: Speaker-independent splits, Macro-F1, confusion matrix
- Dataset: User-provided (RAVDESS format expected initially)

### ASR (Phase 6)
- Pretrained multilingual model (Whisper recommended)
- Languages: English, Tamil, Hindi
- Evaluation: WER per language on documented test sets

## 9. Deployment Architecture

```
Development:    Local Python + Node.js dev servers
Testing:        CI (GitHub Actions) with test database
Production:     Cloud deployment (documented path)
                Frontend: Static hosting (Vercel/Netlify/S3)
                Backend:  Cloud VM or container service
                Database: Managed PostgreSQL
                ML:       Same backend or separate GPU worker
```

## 10. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | Yes | Single repo for frontend, backend, ML with clear boundaries |
| LLM Provider | Interface-based | Swap providers without code rewrite |
| Docker | Optional | Not required for local dev, documented for deployment |
| Database | PostgreSQL | Reliable, supports pgvector extension later |
| Auth | JWT-based | Stateless, works well with REST API |
| Emotion model | Uncertain by design | Never claims certainty about user emotions |
| Memory | Opt-in only | Disabled by default, requires explicit consent |
| Audio storage | None by default | Privacy-first design |
