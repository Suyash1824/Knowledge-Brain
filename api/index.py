"""
Vercel Serverless Function Entrypoint for Knowledge Brain FastAPI Backend.
Exposes the ASGI app instance for Vercel's Python runtime.
"""

import os
import sys

# Add project root and backend to sys.path so app.main imports cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_path = os.path.join(project_root, "backend")

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.main import app

# Handler for Vercel Serverless Function
handler = app
