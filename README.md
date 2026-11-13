# Knowledge Brain

A universal, portable, intelligent, and user-controlled memory infrastructure for AI agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Knowledge Brain enables heterogeneous AI agents (LangGraph, CrewAI, MCP clients) to persist, retrieve, validate, and forget memories with full provenance tracking, temporal knowledge revision, and cryptographic auditability.

### Core Capabilities
- **Memory Compiler:** Transforms unstructured dialogue into normalized cognitive memory facets (facts, preferences, decisions, tasks, experiences).
- **Memory Capsules:** Compiles token-budgeted, query-relevant context capsules rather than overflowing agent prompt windows.
- **Dual-Graph Architecture:** Strictly decouples causal dependency DAGs (`depends_on`, `derives_from`) from cycle-tolerant semantic links (`contradicts`, `updates`).
- **Temporal & Conflict Tracking:** Detects contradictions across conversations and branches with explicit revision lineage.
- **Dependency-Aware Forgetting:** Traces cascading downstream derivations, scrubs relational data and vector embeddings, and outputs tamper-evident SHA-256 deletion audit receipts.
- **Memory Security Barrier:** Enforces clearance levels, pre-retrieval ACL whitelisting, and passive data tagging (`<memory_data is_instruction='false'>`).
- **Cross-Agent Continuity:** Exposes unified REST APIs and Model Context Protocol (MCP) gateways for seamless agent integration.

---

## Technical Documentation & Architecture

Comprehensive technical specifications and system designs are available in the [docs/](docs/) directory:
- [System Architecture & Foundation Specification](docs/architecture.md)
  - System architecture and sequence flows
  - Database schema & 10-table entity-relationship (ER) mapping
  - Dual-relationship graph topology & cycle detection
  - Multi-store dependency-aware forgetting & cryptographic audit boundaries
  - Ingress security, trust classification & pre-retrieval ACL
  - pgvector configuration & zero-downtime embedding migration plan
- [Model Context Protocol (MCP) Server Architecture](docs/mcp_architecture.md)
  - Stdio JSON-RPC 2.0 communication engine
  - 6 Core MCP tools specifications (`compile_memory`, `retrieve_memories`, `generate_memory_capsule`, `check_memory_conflicts`, `update_memory`, `forget_memory`)
  - Cursor AI and Google Antigravity integration configurations
- [Current Development Status](DEVELOPMENT_STATUS.md)

---

## Technology Stack

- **Backend:** Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2
- **Database:** Neon Cloud PostgreSQL with `pgvector`
- **Graph & Dependencies:** NetworkX and relational dependency tables
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Development Environment:** 100% Native Windows execution (PowerShell scripts, Python `venv`, npm) — **No Docker required**
- **Deployment Targets:** Render (Backend API), Vercel (Frontend Dashboard), Neon (Cloud Serverless PostgreSQL)

---

## Getting Started (Native Windows)

### Prerequisites
- Python 3.12+ installed and available on PATH
- Node.js 18+ and npm
- Neon PostgreSQL connection string (with `pgvector` enabled)

### Backend Setup & Execution

1. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your Neon database credentials:
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Automated Setup:**
   Run the PowerShell setup script to create the dedicated virtual environment and install dependencies:
   ```powershell
   .\setup.ps1
   ```

3. **Start the Backend Server:**
   Launch the FastAPI application with auto-reload:
   ```powershell
   .\start.ps1
   ```

   Alternatively, activate and run directly via CLI:
   ```powershell
   .\venv\Scripts\Activate.ps1
   $env:PYTHONPATH = "backend"
   python -m uvicorn app.main:app --reload
   ```

   The backend will be available at:
   - **API Server:** `http://127.0.0.1:8000`
   - **Interactive API Docs (Swagger UI):** `http://127.0.0.1:8000/docs`
   - **Alternative API Docs (ReDoc):** `http://127.0.0.1:8000/redoc`

### Verification & Automated Testing

Knowledge Brain includes automated verification suites for architecture validation, core intelligence capabilities, and live MCP tools:
```powershell
# Run Phase 1 Foundation & Schema Verification
.\venv\Scripts\python.exe scripts/verify_phase1.py

# Run Phase 2 Core Intelligence Engine Verification (10/10 Objectives)
.\venv\Scripts\python.exe scripts/test_phase2_suite.py

# Run Live Database Verification (Neon PostgreSQL + pgvector)
.\venv\Scripts\python.exe scripts/verify_live_database.py

# Run Standalone MCP Server Automated Test Suite (6/6 Tools Live)
.\venv\Scripts\python.exe scripts/test_mcp_server.py
```

### Standalone MCP Server Execution (Cursor AI & Antigravity AI)

To start the standalone MCP server over stdio:
```powershell
$env:PYTHONPATH = "backend"
.\venv\Scripts\python.exe backend/mcp_server.py
```

### Frontend Setup & Execution

1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

---

## Project Structure

```
Knowledge-Brain/
├── backend/                  # Python Backend & Engine
│   ├── app/                  # Consolidated authoritative application package
│   │   ├── compiler/         # Extraction & sanitization modules
│   │   ├── conflict/         # Contradiction & conflict detection engine
│   │   ├── forgetting/       # Dependency-aware cascade forgetting engine
│   │   ├── capsule/          # Memory capsule token budget generator
│   │   ├── services/         # Orchestration & persistence service layer
│   │   ├── api.py            # REST API routes
│   │   ├── database.py       # SQLAlchemy engine & 503 fallback guard
│   │   ├── main.py           # Application entry point & middleware
│   │   ├── models.py         # 10-table ORM schemas & graph associations
│   │   └── schemas.py        # Pydantic v2 validation contracts
│   ├── mcp_server.py         # Standalone Model Context Protocol (MCP) server
│   └── requirements.txt      # Python dependencies
├── docs/                     # Comprehensive Architecture Specifications
│   ├── architecture.md       # Full architecture specification & Mermaid diagrams
│   └── mcp_architecture.md   # MCP server specification & tool schemas
├── frontend/                 # React + Tailwind CSS client
│   ├── src/
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── scripts/                  # Automation & verification scripts
│   ├── migrate_database.py   # Live Neon database migration & HNSW runner
│   ├── scan_secrets.py       # Secret scanning & pre-commit audit
│   ├── test_mcp_server.py    # Automated MCP Server test suite (6/6 tools)
│   ├── test_phase2_suite.py  # Phase 2 Core Intelligence test suite (10/10)
│   ├── verify_live_database.py # Live PostgreSQL & pgvector verifier
│   └── verify_phase1.py      # Automated Phase 1 test suite
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules (secrets, venv, node_modules)
├── DEVELOPMENT_STATUS.md     # Phase-by-phase implementation progress tracker
├── LICENSE                   # MIT License
├── PROJECT_STRUCTURE.txt     # Complete directory breakdown
├── setup.ps1                 # Native Windows environment setup script
├── start.ps1                 # Native Windows backend launch script
└── README.md                 # Project documentation
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
