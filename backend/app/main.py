"""
Knowledge Brain — Production FastAPI Application Entry Point.
Universal, portable, intelligent, and user-controlled memory infrastructure for AI agents.
Configures CORS, middleware, global error handling, and API routing.
"""

import os
import sys
import time
import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure root .env is loaded
load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [KnowledgeBrain-API] [%(levelname)s] %(message)s",
    stream=sys.stderr
)
logger = logging.getLogger("knowledge-brain-api")

from .api import router as api_router
from .database import check_db_health

app = FastAPI(
    title="Knowledge Brain API",
    description="Universal, portable, intelligent, and user-controlled memory infrastructure for AI agents. Bridges Cursor AI, Google Antigravity, and MCP clients.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ==========================================
# 1. CORS Configuration (Frontend Integration)
# ==========================================

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [
    frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time-Ms"]
)

# ==========================================
# 2. Performance & Request Timing Middleware
# ==========================================

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = (time.perf_counter() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

# ==========================================
# 3. Global Exception Handlers
# ==========================================

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    error_type = "HTTPError"
    message = exc.detail
    if isinstance(exc.detail, dict):
        error_type = exc.detail.get("error", "HTTPError")
        message = exc.detail.get("message", str(exc.detail))

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": error_type,
            "message": message,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred. Transaction was safely aborted.",
            "status_code": 500
        }
    )

# ==========================================
# 4. Route Mounting & Health
# ==========================================

app.include_router(api_router, prefix="/api")

@app.get("/", tags=["System"])
async def root():
    health = check_db_health()
    return {
        "status": "online",
        "service": "Knowledge Brain API",
        "version": "1.0.0",
        "database": health.get("status"),
        "pgvector_active": health.get("pgvector_available", False),
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
