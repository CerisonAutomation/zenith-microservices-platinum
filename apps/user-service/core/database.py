"""
Database Configuration and Session Management
Supports PostgreSQL directly and Supabase PostgreSQL connections
"""

import os
import logging
from typing import AsyncGenerator, Optional
from sqlalchemy import create_engine, event, text, pool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, QueuePool

logger = logging.getLogger(__name__)

# Database URL configuration
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    os.getenv(
        "SQLALCHEMY_DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/zenith_db"
    )
)

# Check if using Supabase
USING_SUPABASE: bool = bool(os.getenv("SUPABASE_URL"))

# Convert to async PostgreSQL URL if needed
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    ASYNC_DATABASE_URL = DATABASE_URL

# Engine configuration
POOL_CONFIG = {
    "poolclass": NullPool if os.getenv("ENVIRONMENT") == "test" else QueuePool,
    "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
    "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
    "pool_pre_ping": True,  # Verify connections before using them
    "pool_recycle": 3600,   # Recycle connections after 1 hour
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true"
}

# Synchronous engine
engine = create_engine(
    DATABASE_URL,
    **POOL_CONFIG,
    connect_args={
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    } if DATABASE_URL.startswith("postgresql") else {}
)

# Asynchronous engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    poolclass=NullPool if os.getenv("ENVIRONMENT") == "test" else QueuePool,
    echo=POOL_CONFIG.get("echo", False),
    connect_args={
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    } if ASYNC_DATABASE_URL.startswith("postgresql") else {}
)

# Session factories
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base declarative class
Base = declarative_base()


def get_db():
    """
    Dependency for FastAPI to get synchronous database session.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI to get asynchronous database session.
    
    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_async_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Async database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database (create tables, run migrations)."""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_db() -> None:
    """Close database connections."""
    try:
        await async_engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


def is_using_supabase() -> bool:
    """Check if application is using Supabase."""
    return USING_SUPABASE


@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Configure PostgreSQL connection options."""
    if hasattr(dbapi_conn, "set_isolation_level"):
        dbapi_conn.set_isolation_level(0)  # Autocommit mode
