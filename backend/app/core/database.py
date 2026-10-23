from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.app.core.config import settings

# Create async engine. For SQLite, need check_same_thread=False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and False,  # set True for verbose SQL logs
    connect_args=connect_args,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    # Import all models here so that Base.metadata has registered them
    import backend.app.models.user  # noqa: F401
    import backend.app.models.session  # noqa: F401
    import backend.app.models.message  # noqa: F401
    import backend.app.models.memory  # noqa: F401
    import backend.app.models.emotion  # noqa: F401
    import backend.app.models.preference  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # SQLite schema auto-patch for new columns
        def patch_sqlite_columns(connection):
            from sqlalchemy import text
            tables_and_columns = {
                "users": [
                    ("phone_number", "VARCHAR(30)"),
                    ("parent_phone_number", "VARCHAR(30)"),
                    ("otp_code_hash", "VARCHAR(128)"),
                    ("otp_expires_at", "DATETIME"),
                    ("otp_attempts", "INTEGER DEFAULT 0"),
                    ("otp_last_sent_at", "DATETIME"),
                ],
                "chat_sessions": [
                    ("mode", "VARCHAR(20) DEFAULT 'normal'"),
                    ("dominant_mood", "VARCHAR(30) DEFAULT 'neutral'"),
                ],
                "user_preferences": [
                    ("companion_name", "VARCHAR(50) DEFAULT 'AI-Friend'"),
                    ("avatar_style", "VARCHAR(20) DEFAULT 'emoji'"),
                    ("avatar_gender", "VARCHAR(20) DEFAULT 'female'"),
                    ("auto_expression_updates", "BOOLEAN DEFAULT 1"),
                    ("gentle_acknowledgements", "BOOLEAN DEFAULT 1"),
                    ("avatar_mood_override", "VARCHAR(30) DEFAULT 'auto'"),
                ],
            }
            for table, cols in tables_and_columns.items():
                try:
                    res = connection.execute(text(f"PRAGMA table_info({table})")).fetchall()
                    existing_cols = {row[1] for row in res}
                    for col_name, col_type in cols:
                        if col_name not in existing_cols:
                            connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
                except Exception:
                    pass

        await conn.run_sync(patch_sqlite_columns)
