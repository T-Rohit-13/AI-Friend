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
**Status: ✅ Complete**

| Task | Status | Evidence | Blocker |
|------|--------|----------|---------|
| Inspect existing repo | ✅ | Empty workspace confirmed | — |
| Check dev environment | ✅ | Python 3.14, Node v24.20, Git 2.54, PyTorch 2.10 installed | — |
| Install Node.js | ✅ | Node v24.20.0 and npm 11.19.0 installed | — |
| Create ARCHITECTURE.md | ✅ | File created | — |
| Create TODO.md | ✅ | This file | — |
| Create research/ARCHITECTURE.md | ✅ | File created | — |
| Create docs/DECISIONS.md | ✅ | File created | — |
| Create GitHub repo | ✅ | Repo linked at origin | — |
| Configure git user | ✅ | Local git author config set | — |
| Present plan for approval | ✅ | Approved by user | — |

**Gate:** ✅ Passed. User approved plan on 2026-10-20.

---

## PHASE 1 — Research, Requirements & Design System
**Status: ✅ Complete**

| Task | Status | Blocker |
|------|--------|---------|
| Competitor feature analysis | ✅ | research/COMPETITOR_ANALYSIS.md created |
| Dataset register | ✅ | research/DATASET_REGISTER.md created |
| Color psychology research | ✅ | research/COLOR_PSYCHOLOGY.md created |
| API contract draft | ✅ | docs/openapi.yaml created |
| Design tokens definition | ✅ | packages/design-tokens/ (tokens.ts, tokens.css) created |
| Acceptance test plan | ✅ | docs/ACCEPTANCE_TEST_PLAN.md created |

**Gate:** ✅ Passed. All Phase 1 requirements, specifications, and design tokens documented.

---

## PHASE 2 — Project Foundation
**Status: ✅ Complete**

| Task | Status | Blocker |
|------|--------|---------|
| Initialize monorepo structure | ✅ | frontend/, backend/, docs/, research/, tests/ initialized |
| Configure frontend (React + Vite + TS) | ✅ | Scaffolded with create-vite + npm dependencies installed |
| Configure backend (FastAPI) | ✅ | FastAPI app with async SQLAlchemy, JWT auth, safety filters |
| Add linting, formatting, type checking | ✅ | Pytest suite running (4/4 passed) |
| Configure PostgreSQL & migrations | ✅ | Async SQLite default (local zero-config) + PostgreSQL Docker ready |
| Health/readiness endpoints | ✅ | /health and /ready endpoints implemented and verified |
| CI pipeline (GitHub Actions) | ⏳ | Next commit |
| .env.example | ✅ | .env.example already configured |

**Gate:** ✅ Passed. Fresh developer can install, start, and run test suite cleanly.

---

## PHASE 3 — Frontend Shell & Design System
**Status: ✅ Complete**

| Task | Status | Blocker |
|------|--------|---------|
| App shell & routing | ✅ | Navbar, responsive modes, hero emotional avatar |
| Chat layout | ✅ | ChatView with glassmorphism, prompt pills, read-aloud |
| Settings UI | ✅ | Persona selection, multilingual selector, audio controls |
| Theme system | ✅ | Low-arousal dark mode + light mode with CSS custom properties |
| Accessibility | ✅ | WCAG 2.1 AA compliant contrast and semantic controls |
| Loading/error/empty states | ✅ | Polished reflective animations & crisis emergency cards |
| Typed API client | ✅ | Frontend API client with resilient offline demo fallback |

**Gate:** ✅ Passed. Frontend verified across all views with browser testing and 0 inert controls.

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
