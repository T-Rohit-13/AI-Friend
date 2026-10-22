from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "AI Friend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    # Default: local async SQLite so local dev runs instantly without Docker;
    # In production/docker: postgresql+asyncpg://user:pass@postgres:5432/aifriend
    DATABASE_URL: str = "sqlite+aiosqlite:///./aifriend.db"

    # Security & Auth
    SECRET_KEY: str = "aifriend_dev_super_secret_jwt_key_change_in_production_32b!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # AI & LLM Provider Configuration
    # Supported providers: "openai" (default), "gemini", "groq", "ollama", "mock"
    AI_PROVIDER: Optional[str] = None
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: Optional[str] = None
    LLM_BASE_URL: Optional[str] = None
    LLM_MODEL: str = "gpt-4o-mini"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GROQ_API_KEY: Optional[str] = None
    MAX_HISTORY_TURNS: int = 10

    # Voice / Audio Pipeline
    ASR_PROVIDER: str = "web_speech"  # "whisper" or "web_speech"
    TTS_PROVIDER: str = "edge_tts"  # "edge_tts", "gtts", or "web_speech"
    TAMIL_TTS_VOICE: str = "ta-IN-PallaviNeural"  # Microsoft Pallavi Neural (Tamil - India)
    ENGLISH_TTS_VOICE: str = "en-US-JennyNeural"  # Microsoft Jenny Neural (English - US)
    HINDI_TTS_VOICE: str = "hi-IN-SwaraNeural"    # Microsoft Swara Neural (Hindi - India)
    EMOTION_ENGINE: str = "heuristic"  # "heuristic" or "neural"

    # Email & Account Verification
    EMAIL_PROVIDER: str = "console"  # "smtp", "console", or "disabled"
    REQUIRE_EMAIL_VERIFICATION: bool = True
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = "noreply@aifriend.org"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
