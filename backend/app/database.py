"""
Database connection and session management for Knowledge Brain.
Supports Neon PostgreSQL with pgvector extension.
Enforces 503 Service Unavailable on persistent operations when unconfigured.
Sanitizes all connection strings and logs to prevent credential leakage.
"""

import os
import re
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException, status
from .models import Base

# Load environment variables
load_dotenv()

engine = None
SessionLocal = None

def sanitize_db_url(url: str = None) -> str:
    """Masks password in connection strings to prevent credential exposure in logs."""
    if not url:
        return "None"
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", url)

def get_engine():
    global engine, SessionLocal
    if engine is not None:
        return engine
    
    url = os.getenv("DATABASE_URL")
    if not url or "your-neon-host" in url or "<neon-host>" in url or "<password>" in url:
        # DB not yet configured with real credentials
        return None

    # Ensure SQLAlchemy uses psycopg2 driver if standard postgresql:// schema is passed
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    # Neon PostgreSQL requires SSL; local docker postgres typically does not
    is_neon = "neon.tech" in url
    is_ssl_required = "sslmode=require" in url or is_neon

    connect_args = {
        "connect_timeout": 15,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
    if is_ssl_required:
        connect_args["sslmode"] = "require"
        if "sslmode" not in url:
            separator = "&" if "?" in url else "?"
            url = f"{url}{separator}sslmode=require"

    engine = create_engine(
        url,
        pool_size=5,
        max_overflow=10,
        pool_recycle=60,
        pool_pre_ping=True,
        connect_args=connect_args
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine

def get_db():
    """
    FastAPI dependency yielding a database session or None if unconfigured.
    """
    db_engine = get_engine()
    if db_engine is None or SessionLocal is None:
        yield None
        return
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_db():
    """
    FastAPI dependency that enforces persistent database availability.
    Raises HTTP 503 Service Unavailable if the database is unconfigured or unreachable.
    Guarantees that no unpersisted memory operation reports false success.
    """
    eng = get_engine()
    if eng is None or SessionLocal is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "DatabaseNotConfigured",
                "message": "Persistent storage is currently unavailable. Configure DATABASE_URL in .env to enable memory persistence."
            }
        )
    try:
        db = SessionLocal()
        yield db
    except OperationalError as e:
        safe_msg = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "DatabaseConnectionFailed",
                "message": f"Unable to reach PostgreSQL database: {safe_msg[:120]}"
            }
        )
    finally:
        if 'db' in locals():
            db.close()

def check_db_health() -> dict:
    """
    Checks database connectivity, verifies pgvector extension, and safely reports status.
    """
    url = os.getenv("DATABASE_URL")
    if not url or "<neon-host>" in url or "your-neon-host" in url or "<password>" in url:
        return {
            "status": "unconfigured",
            "message": "DATABASE_URL is not configured with live credentials in .env",
            "pgvector_available": False,
            "target": "unconfigured"
        }
    
    try:
        eng = get_engine()
        if eng is None:
            return {
                "status": "unconfigured",
                "message": "Database engine initialization skipped (placeholder credentials detected)",
                "pgvector_available": False,
                "target": sanitize_db_url(url)
            }
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
            res = conn.execute(text(
                "SELECT installed_version FROM pg_available_extensions WHERE name = 'vector'"
            )).fetchone()
            vector_installed = res is not None and res[0] is not None
            return {
                "status": "connected",
                "message": "Successfully connected to PostgreSQL database",
                "pgvector_available": vector_installed,
                "target": sanitize_db_url(url)
            }
    except Exception as e:
        safe_err = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", str(e))
        return {
            "status": "connection_error",
            "message": f"Database connection error: {safe_err[:120]}",
            "pgvector_available": False,
            "target": sanitize_db_url(url)
        }
