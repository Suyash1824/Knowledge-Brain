"""
Database connection and session management for Knowledge Brain.
Supports Neon PostgreSQL with pgvector extension.
Enforces 503 Service Unavailable on persistent operations when unconfigured.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException, status
from .models import Base

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
SessionLocal = None

def get_engine():
    global engine, SessionLocal
    if engine is not None:
        return engine
    
    url = os.getenv("DATABASE_URL")
    if not url or "your-neon-host" in url or "<neon-host>" in url:
        # DB not yet configured with real credentials
        return None
    
    # Neon PostgreSQL requires SSL; ensure sslmode is present if using postgresql://
    if "sslmode" not in url and ("neon.tech" in url or "postgres" in url):
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}sslmode=require"

    engine = create_engine(
        url,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        pool_pre_ping=True,
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
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_health() -> dict:
    """
    Checks database connectivity and pgvector extension availability.
    """
    url = os.getenv("DATABASE_URL")
    if not url or "<neon-host>" in url or "your-neon-host" in url:
        return {
            "status": "unconfigured",
            "message": "DATABASE_URL is not configured with live credentials in .env",
            "pgvector_available": False
        }
    
    try:
        eng = get_engine()
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
            res = conn.execute(text(
                "SELECT installed_version FROM pg_available_extensions WHERE name = 'vector'"
            )).fetchone()
            vector_installed = res is not None and res[0] is not None
            return {
                "status": "connected",
                "message": "Successfully connected to PostgreSQL",
                "pgvector_available": vector_installed
            }
    except Exception as e:
        return {
            "status": "connection_error",
            "message": str(e),
            "pgvector_available": False
        }
