# Knowledge Brain — Production Container Dockerfile
# Builds unified container image for FastAPI API server and Background Ingestion Worker
FROM python:3.12-slim-bookworm

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/app /app/app
COPY backend/mcp_server.py /app/mcp_server.py

# Expose API port
EXPOSE 8000

# Default command: FastAPI API server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

