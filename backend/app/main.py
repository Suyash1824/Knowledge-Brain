import uvicorn
from fastapi import FastAPI
from .api import router as api_router

app = FastAPI(
    title="Knowledge Brain API",
    description="Universal, portable, intelligent and user-controlled memory infrastructure for AI agents.",
    version="0.1.0"
)

app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "healthy",
        "service": "Knowledge Brain API",
        "version": "0.1.0",
        "phase": "Phase 1 - System Architecture & Foundation"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
