# AI Friend — Design Decisions Log

> This document records key architectural and design decisions with rationale.

---

## Decision 001: Monorepo Structure
**Date:** 2026-10-20
**Decision:** Use a single GitHub repository with `frontend/`, `backend/`, `ml/`, `shared/`, `research/`, and `docs/` directories.
**Rationale:** Simplifies coordination between frontend, backend, and ML code. Shared API contracts live in one place. CI can test everything together.
**Alternatives considered:** Separate repos per layer — rejected due to added complexity for a small team.

---

## Decision 002: No Docker for Initial Development
**Date:** 2026-10-20
**Decision:** Run services locally (Node.js dev server, Python FastAPI, local PostgreSQL). Document Docker setup for deployment.
**Rationale:** Docker is not installed. Local development is faster for a single developer. Docker configuration will be added for Phase 12 deployment.
**Risk:** Database setup differences between dev and prod. Mitigated by using Alembic migrations consistently.

---

## Decision 003: Provider-Independent LLM Interface
**Date:** 2026-10-20
**Decision:** Build an abstract `LLMProvider` interface. Implement concrete adapters (e.g., `GeminiProvider`, `OpenAIProvider`, `GroqProvider`).
**Rationale:** User hasn't decided on provider yet. Interface allows swapping without rewriting application logic.
**Status:** Provider to be selected before Phase 5.

---

## Decision 004: JWT-Based Authentication
**Date:** 2026-10-20
**Decision:** Use JWT tokens for API authentication. Passwords hashed with bcrypt.
**Rationale:** Stateless tokens work well with REST APIs. No session store needed initially.
**Alternatives considered:** Session-based auth — simpler but requires server-side session storage.

---

## Decision 005: Emotion as Advisory Signal Only
**Date:** 2026-10-20
**Decision:** Voice-emotion predictions are always advisory. The user's explicit request takes priority. Predictions include uncertainty information. No UI changes are forced by emotion predictions alone.
**Rationale:** Emotion recognition from audio is inherently uncertain. Acted speech datasets don't reflect natural speech. Cross-cultural and cross-language validity is limited. Responsible AI design requires transparency about limitations.

---

## Decision 006: Memory Disabled by Default
**Date:** 2026-10-20
**Decision:** Conversation memory system is opt-in. Users must explicitly enable it. Users can inspect, edit, and delete all stored memories.
**Rationale:** Privacy-first design. No user data should be retained without consent.

---

## Decision 007: Python 3.14 Compatibility
**Date:** 2026-10-20
**Decision:** Target Python 3.14 (installed on system). Pin dependencies compatible with this version.
**Risk:** Some libraries may not yet fully support 3.14. Will test and document incompatibilities.

---

## Decision 008: PostgreSQL for All Structured Data
**Date:** 2026-10-20  
**Decision:** Use PostgreSQL for users, conversations, preferences, consent, feedback, and all application data. Defer pgvector until semantic memory is needed.
**Rationale:** Single database simplifies deployment. PostgreSQL is mature, supports JSON, and has pgvector extension available when needed.
**Status:** PostgreSQL not yet installed. Required before Phase 2.

---

## Pending Decisions

| ID | Topic | Decision Needed By | Status |
|----|-------|-------------------|--------|
| P01 | LLM provider selection | Phase 5 | User deciding |
| P02 | TTS provider selection | Phase 8 | Future |
| P03 | Emotion dataset format | Phase 7 | User uploads |
| P04 | Cloud deployment target | Phase 12 | Future |
| P05 | PostgreSQL installation method | Phase 2 | Next phase |
