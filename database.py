"""
Database configuration and session management for Zenith Microservices.
Supports both direct PostgreSQL and Supabase PostgreSQL connections.
Provides SQLAlchemy engine, session maker, and base declarative class.
"""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# Database URL configuration - prioritize Supabase if available
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    os.getenv(
        "SQLALCHEMY_DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/zenith_db"
    )
)

# Check if we're using Supabase (indicated by SUPABASE_URL presence)
USING_SUPABASE = bool(os.getenv("SUPABASE_URL"))

if USING_SUPABASE and not DATABASE_URL.startswith("postgresql://"):
    # If using Supabase but no explicit DATABASE_URL, construct from Supabase URL
    supabase_url = os.getenv("SUPABASE_URL")
    if supabase_url:
        # Extract project reference from Supabase URL
        # Format: https://[project-ref].supabase.co
        project_ref = supabase_url.split("//")[1].split(".")[0]
        DATABASE_URL = f"postgresql://postgres:[password]@db.{project_ref}.supabase.co:5432/postgres"

# Create engine with connection pooling and security settings
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI routes to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_using_supabase() -> bool:
    """Check if the application is configured to use Supabase."""
    return USING_SUPABASE
