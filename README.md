# 🤖 AI Friend — Multilingual AI Emotional Companion

A multilingual AI emotional companion web application that supports natural conversation, humour, motivation, study help, games, and voice interaction with vocal emotion estimation.

## ✨ Features (Planned)

- 💬 **Text Chat** — Natural conversational AI with multiple behaviours
- 🎙️ **Voice Input** — Multilingual speech recognition (English, Tamil, Hindi)
- 🎭 **Emotion Estimation** — Vocal emotion analysis with uncertainty reporting
- 🌍 **Multilingual** — Full support for English, Tamil, and Hindi
- 🔊 **Voice Response** — Optional text-to-speech output
- 🎮 **Activities** — Jokes, riddles, quizzes, trivia, word games, stories
- 📚 **Study Help** — Focus sessions and goal planning
- 🧠 **Memory** — Consent-based conversation memory (opt-in only)
- 🎨 **Adaptive Themes** — Calm, playful, reflective, creative themes
- ♿ **Accessible** — Keyboard navigation, screen reader support, reduced motion
- 🔒 **Privacy-First** — No audio stored, full data control, account deletion

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL |
| ML | PyTorch, Librosa, Whisper |
| LLM | Provider-independent (Gemini/OpenAI/Groq) |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design.

## 📋 Project Status

**Current Phase: 0 — Planning & Setup**

See [TODO.md](TODO.md) for detailed phase tracking.

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+ (LTS)
- PostgreSQL 16+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/T-Rohit-13/AI-Friend.git
cd AI-Friend

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Development

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## 📁 Project Structure

```
ai-friend/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Python + FastAPI
├── ml/                # Machine learning models
│   └── voice_emotion/ # Emotion classification
├── shared/            # Shared API contracts
├── research/          # Research documents
├── docs/              # Project documentation
├── scripts/           # Utility scripts
├── infra/             # Infrastructure configs
├── .github/           # CI/CD workflows
├── ARCHITECTURE.md    # System architecture
├── SECURITY.md        # Security model
├── TODO.md            # Phase tracker
└── README.md          # This file
```

## ⚠️ Important Notes

- **This is an AI companion, not a medical diagnostic system**
- Emotion predictions are estimates with uncertainty — never presented as facts
- Memory is disabled by default and requires explicit consent
- Audio is never stored by default
- The AI is transparent about being AI

## 📄 Documentation

- [Architecture](ARCHITECTURE.md)
- [Security Model](SECURITY.md)
- [Phase Tracker](TODO.md)
- [Design Decisions](docs/DECISIONS.md)
- [Research Architecture](research/ARCHITECTURE.md)

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make changes in appropriate module directories
3. Run tests before committing
4. Submit a pull request with description

## 📝 License

This project is for educational and personal use.
