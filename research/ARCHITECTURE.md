# AI Friend — System Architecture (Research Reference)

## 1. Architecture Pattern

The system follows a **layered modular monorepo** pattern with clear boundaries:

```
┌─────────────────────────────────────────────────────────┐
│  Layer A: Frontend (React/TypeScript/Vite)              │
│  - Presentation, user interaction, accessibility        │
├─────────────────────────────────────────────────────────┤
│  Layer B: API Gateway & Security (FastAPI middleware)   │
│  - Auth, rate limiting, validation, consent             │
├─────────────────────────────────────────────────────────┤
│  Layer C: Audio Input Pipeline                          │
│  - Format validation, normalization, routing            │
├──────────────────┬──────────────────────────────────────┤
│  Layer D: ASR    │  Layer E: Emotion Estimation         │
│  (Whisper)       │  (CNN on spectrograms)               │
├──────────────────┴──────────────────────────────────────┤
│  Layer F: Context & Decision Engine                     │
│  - Merges request, transcript, emotion, preferences     │
├─────────────────────────────────────────────────────────┤
│  Layer G: Companion Orchestrator                        │
│  - Behaviour routing, LLM calls, safety, memory        │
├─────────────────────────────────────────────────────────┤
│  Layer H: Response Generation                           │
│  - Text reply, optional TTS, language tagging           │
├─────────────────────────────────────────────────────────┤
│  Layer I: Data & Monitoring                             │
│  - PostgreSQL, structured logs, metrics, retention      │
└─────────────────────────────────────────────────────────┘
```

## 2. Component Interaction Diagram

```
User Input (text or voice)
    │
    ├── Text Path ──────────────────────────────────┐
    │                                                │
    └── Voice Path                                   │
         │                                           │
         ├── ASR Branch ──→ Transcript + Language     │
         │                                           │
         └── Emotion Branch ──→ Probabilities        │
                                                     │
                    ┌────────────────────────────────┘
                    │
                    ▼
            Context Engine
            (explicit request priority)
                    │
                    ▼
            Behaviour Router
            ┌───┬───┬───┬───┬───┐
            │   │   │   │   │   │
            Chat Joke Quiz Study Game Story
                    │
                    ▼
            LLM Provider (via adapter)
                    │
                    ▼
            Safety & Validation
                    │
                    ▼
            Response (text + optional TTS)
```

## 3. Key Design Principles

### 3.1 Explicit Request Priority
The user's explicit request always takes precedence over inferred signals.
If a user asks for a joke while sounding sad, deliver the joke.

### 3.2 Uncertainty as a Feature
Emotion predictions always include probability distributions and uncertainty.
The system never claims to know how someone feels.

### 3.3 Provider Independence
All external AI services (LLM, ASR, TTS) are accessed through typed adapter
interfaces. Swapping providers requires implementing a new adapter, not
rewriting application logic.

### 3.4 Privacy by Default
- Memory is opt-in only
- Audio is not stored by default
- Logs exclude personal content
- Users can delete all their data

### 3.5 Graceful Degradation
- Voice features fail gracefully to text-only mode
- LLM failures return a friendly fallback message
- ASR failures allow manual text entry
- Emotion model unavailability doesn't block responses

## 4. Concurrency Model

### Audio Processing
ASR and emotion analysis run as **independent parallel branches**.
Neither waits for the other unless there's a technical dependency.

```
Audio Input
    │
    ├──→ asyncio.create_task(asr_service.transcribe(audio))
    │
    └──→ asyncio.create_task(emotion_service.analyze(audio))
    
    await asyncio.gather(asr_result, emotion_result)
```

### Request Processing
FastAPI's async request handling allows concurrent request processing.
Long-running ML inference can be offloaded to background workers if needed.

## 5. Security Boundaries

```
┌─────────────────────────────────┐
│  PUBLIC ZONE                    │
│  - Landing page                 │
│  - Registration                 │
│  - Login                        │
│  - Health check                 │
├─────────────────────────────────┤
│  AUTHENTICATED ZONE             │
│  - All /api/v1/* endpoints      │
│  - Chat, voice, preferences     │
│  - Memory management            │
├─────────────────────────────────┤
│  SERVER INTERNAL                │
│  - ML model inference           │
│  - LLM provider calls           │
│  - Database access              │
│  - Audit logging                │
└─────────────────────────────────┘
```

## 6. Data Retention Model

| Data Type | Default Retention | User Control |
|-----------|-------------------|--------------|
| Messages | Session only | Can enable persistence |
| Audio | Not stored | N/A |
| Memories | Never (opt-in) | Full CRUD |
| Preferences | Until deleted | Full control |
| Emotion metadata | Aggregated only | Can delete |
| Feedback | Anonymized | Can delete |
| Audit logs | 90 days | Admin only |

## 7. References

- FastAPI documentation: https://fastapi.tiangolo.com/
- React documentation: https://react.dev/
- PyTorch documentation: https://pytorch.org/docs/
- Whisper: https://github.com/openai/whisper
- PostgreSQL: https://www.postgresql.org/docs/
- OWASP API Security: https://owasp.org/www-project-api-security/
