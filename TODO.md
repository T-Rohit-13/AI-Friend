# AI Friend — Project TODO & Phase Tracker

> Last updated: 2026-10-20

## Status Legend
- ✅ Complete — implemented and tested
- 🔨 In Progress — actively being built
- ⏳ Pending — not yet started
- 🚫 Blocked — waiting on external input/resource
- 📋 Planned — designed but not started

---

## PHASE 0 — Repository Inspection & Planning
**Status: 🔨 In Progress**

| Task | Status | Evidence | Blocker |
|------|--------|----------|---------|
| Inspect existing repo | ✅ | Empty workspace confirmed | — |
| Check dev environment | ✅ | Python 3.14, Git 2.54, PyTorch 2.10 installed. No Node.js, Docker. | — |
| Install Node.js | 🔨 | winget install running | — |
| Create ARCHITECTURE.md | ✅ | File created | — |
| Create TODO.md | ✅ | This file | — |
| Create research/ARCHITECTURE.md | ⏳ | — | — |
| Create docs/DECISIONS.md | ⏳ | — | — |
| Create GitHub repo | 🚫 | User creating on GitHub | User action |
| Configure git user | 🚫 | User will configure | User action |
| Present plan for approval | ⏳ | — | — |

**Gate:** User approves plan before Phase 1.

---

## PHASE 1 — Research, Requirements & Design System
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| Competitor feature analysis | 📋 | — |
| Dataset register | 📋 | — |
| Color psychology research | 📋 | — |
| API contract draft | 📋 | — |
| Design tokens definition | 📋 | — |
| Acceptance test plan | 📋 | — |

**Gate:** Requirements and interfaces documented and consistent.

---

## PHASE 2 — Project Foundation
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| Initialize monorepo structure | 📋 | — |
| Configure frontend (React + Vite + TS) | 📋 | Node.js installation |
| Configure backend (FastAPI) | 📋 | — |
| Add linting, formatting, type checking | 📋 | — |
| Configure PostgreSQL & migrations | 📋 | PostgreSQL install |
| Health/readiness endpoints | 📋 | — |
| CI pipeline (GitHub Actions) | 📋 | — |
| .env.example | 📋 | — |

**Gate:** Fresh developer can install, start, and test.

---

## PHASE 3 — Frontend Shell & Design System
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| App shell & routing | 📋 | — |
| Chat layout | 📋 | — |
| Settings UI | 📋 | — |
| Theme system | 📋 | — |
| Accessibility | 📋 | — |
| Loading/error/empty states | 📋 | — |
| Typed API client | 📋 | — |

**Gate:** Frontend works on all screen sizes, no inert controls.

---

## PHASE 4 — Authentication, Database & Backend
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| Auth endpoints | 📋 | — |
| Database models & migrations | 📋 | — |
| Preferences CRUD | 📋 | — |
| Conversation CRUD | 📋 | — |
| Rate limiting | 📋 | — |
| User isolation tests | 📋 | — |

**Gate:** Protected endpoints pass integration tests.

---

## PHASE 5 — Working Text-Chat MVP
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| LLM provider interface | 📋 | — |
| Configure one provider | 📋 | User provides API key |
| Behaviour router | 📋 | — |
| Text chat UI integration | 📋 | — |
| Basic activities (jokes, riddles) | 📋 | — |

**Gate:** User can log in, send message, get real LLM response.

---

## PHASE 6 — Voice Capture & Multilingual ASR
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| Microphone permission & recording | 📋 | — |
| Audio validation | 📋 | — |
| Whisper integration | 📋 | — |
| EN/TA/HI evaluation | 📋 | Test data needed |
| Error handling | 📋 | — |

**Gate:** Voice samples transcribed, errors handled, results documented.

---

## PHASE 7 — Voice Emotion Model
**Status: 📋 Planned**

| Task | Status | Blocker |
|------|--------|---------|
| Audio preprocessing pipeline | 📋 | — |
| CNN baseline in PyTorch | 📋 | — |
| Training scripts | 📋 | — |
| Dataset preparation | 🚫 | User uploads dataset |
| Speaker-independent splits | 📋 | — |
| Evaluation & metrics | 📋 | — |

**Gate:** Model runs, provenance documented, evaluation available.

---

## PHASE 8 — Context Engine & Response Generation
**Status: 📋 Planned**

## PHASE 9 — Memory & Activities
**Status: 📋 Planned**

## PHASE 10 — UI Adaptation & Accessibility
**Status: 📋 Planned**

## PHASE 11 — Security & Full Integration
**Status: 📋 Planned**

## PHASE 12 — Deployment & Final Handover
**Status: 📋 Planned**

---

## External Dependencies

| Dependency | Required By | Status |
|------------|-------------|--------|
| GitHub repo creation | Phase 0 | User creating |
| Git user config | Phase 0 | User configuring |
| Node.js LTS | Phase 2 | Installing |
| PostgreSQL | Phase 2 | Not installed |
| LLM API key | Phase 5 | User decides later |
| Emotion dataset | Phase 7 | User uploads later |
| Whisper model weights | Phase 6 | Auto-download |
| TTS provider | Phase 8 | User decides later |

---

## Known Limitations & Future Work

1. Docker deployment documented but deferred
2. pgvector for semantic memory — after core is stable
3. Tamil/Hindi emotion model data — limited availability
4. Production HTTPS — deployment-phase concern
5. GPU inference optimization — only if model size justifies it
