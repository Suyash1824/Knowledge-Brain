# Knowledge Brain — Universal AI Memory Infrastructure

A unified, portable, intelligent, and user-controlled memory infrastructure for AI agents, connecting persistent memory across independent sessions and heterogeneous agent clients.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Database: Neon PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL%20(pgvector)-00E599.svg)](https://neon.tech)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Three.js%20%2B%20ReactFlow-61DAFB.svg)](https://react.dev)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Uvicorn-009688.svg)](https://fastapi.tiangolo.com)

---

## Unified System Architecture

Knowledge Brain is delivered as one fully integrated full-stack application combining:
- **Backend (`backend/`):** Python 3.12+, FastAPI, SQLAlchemy 2.0, Pydantic v2, pgvector HNSW indexing, bcrypt, RFC 7519 JWT, and Model Context Protocol (MCP) server.
- **Frontend (`frontend/`):** React 18, TypeScript, Tailwind CSS, Three.js 3D volumetric memory core, ReactFlow interactive knowledge graph, Recharts telemetry analytics, and Framer Motion cinematic interactions.
- **Database:** Serverless Neon Cloud PostgreSQL with `pgvector 0.8.7` (1,536-dimensional HNSW cosine index).

```
                            +--------------------------------------------------+
                            |     Knowledge Brain SPA (React 18 + Three.js)    |
                            |  Landing Page | Dashboard | 3D Core | ReactFlow  |
                            +------------------------+-------------------------+
                                                     |
                                    HTTP / REST API  | Bearer JWT (HS256)
                                                     v
                            +--------------------------------------------------+
                            |          FastAPI Application (Port 8000)         |
                            |  Auth | Compiler | Capsules | Conflicts | Audit   |
                            +------------------------+-------------------------+
                                                     |
                                   SQLAlchemy Pool   | pgvector 0.8.7 (HNSW)
                                                     v
                            +--------------------------------------------------+
                            |         Neon Cloud PostgreSQL Database           |
                            |  14 Tables | 1536-dim Embeddings | DAG Lineage   |
                            +--------------------------------------------------+
```

---

## 11 Core Functional Modules

| # | Module | Frontend Component | Connected Backend Endpoint | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Landing Page** | `LandingPage.tsx`, `OrganicParticleCore.tsx` | `GET /api/health`, `GET /api/dashboard/stats` | Cinematic 3D memory core, live telemetry, interactive particles, custom cursor. |
| **2** | **Authentication** | `SettingsTab.tsx`, `Navbar.tsx` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Bcrypt 12-round hashing, RFC 7519 JWT Bearer tokens, protected routes. |
| **3** | **Dashboard Overview**| `OverviewTab.tsx` | `GET /api/dashboard/stats`, `GET /api/memories?limit=5` | Real-time KPI cards, cognitive facet charts, recent verified memory feed. |
| **4** | **Memory Explorer** | `MemoryExplorerTab.tsx` | `GET /api/memories`, `POST /api/memories/search` | Paginated listing, facet & status filters, pgvector `<=>` cosine search. |
| **5** | **Memory Detail & CRUD**| `MemoryDetailDrawer.tsx`, `CreateMemoryModal.tsx` | `GET /api/memories/{id}`, `PUT /api/memories/{id}`, `DELETE /api/memories/{id}`, `POST /api/memories` | Full lifecycle CRUD, immutable version history, turn provenance inspection. |
| **6** | **Memory Compiler** | `MemoryCompilerTab.tsx` | `POST /api/compiler/compile` | Dialogue ingestion, prompt-injection defanging, 5 cognitive facet extractions. |
| **7** | **Memory Capsules** | `MemoryCapsulesTab.tsx` | `POST /api/capsules/generate` | Composite scoring (0.45R+0.25I+0.20T+0.10C), strict token budget packing, passive data wrap. |
| **8** | **AI Agent Ecosystem**| `AiAgentsTab.tsx` | `GET /api/agents` | Live agent metrics, permissions, live Cursor AI <-> Antigravity AI continuity verification. |
| **9** | **Knowledge Graph** | `KnowledgeGraphTab.tsx` | `GET /api/graph`, `POST /api/memories/relationships` | ReactFlow interactive canvas, cycle-checked DAG dependencies, semantic links. |
| **10**| **Conflict Center** | `ConflictCenterTab.tsx` | `POST /api/compiler/detect-conflicts` | Semantic contradiction & temporal drift detection against verified memory DAG. |
| **11**| **Security & Audit**| `SecurityAuditTab.tsx` | `POST /api/forgetting/request-deletion`, `GET /api/forgetting/verify/{id}` | Cascading forgetting, vector nullification, tamper-evident SHA-256 receipts. |

---

## Quick Start (Native Windows)

### 1. Unified One-Click Launch
To start both Backend (FastAPI on Port 8000) and Frontend (Vite on Port 3000) concurrently:
```powershell
.\start-all.ps1
```
Open **`http://localhost:3000`** in your browser.

---

### 2. Independent Process Execution

#### Backend Server:
```powershell
.\start-backend.ps1
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Alternative ReDoc: `http://127.0.0.1:8000/redoc`

#### Frontend Application:
```powershell
.\start-frontend.ps1
```
- Web Application: `http://localhost:3000`
- Proxy Configuration: Automatically proxies `/api/*` requests to `http://127.0.0.1:8000`

---

## Automated Verification & Testing

Knowledge Brain includes comprehensive verification test suites running directly against live Neon Cloud PostgreSQL:

```powershell
# 1. Run Complete End-to-End Full-Stack Verification (12/12 Integration Steps)
.\verify.ps1

# 2. Run Backend 14-Suite Live Verification Test Harness
.\venv\Scripts\python.exe scripts/verify_backend_complete.py

# 3. Run Live Database Connectivity & pgvector Verification
.\venv\Scripts\python.exe scripts/verify_live_database.py

# 4. Verify Frontend Production Build
cd frontend
npm run build
```

---

## Environment Variables

### Backend Configuration (`.env` in root)
```ini
DATABASE_URL=postgresql://neondb_owner:***@ep-red-leaf-az7vacgt-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=kb_secret_key_prod_verified_2026
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:3000
API_PORT=8000
```

### Frontend Configuration (`frontend/.env`)
```ini
VITE_API_URL=/api
```
*(Backend credentials and database URLs are strictly excluded from frontend code and client bundles).*

---

## Directory Structure

```
Knowledge-Brain/
├── backend/                  # Authoritative Python Backend Engine
│   ├── app/
│   │   ├── auth/             # JWT & bcrypt authentication
│   │   ├── capsule/          # Memory capsule generator
│   │   ├── compiler/         # Dialogue extractor & injection defanging
│   │   ├── conflict/         # Contradiction & drift detector
│   │   ├── forgetting/       # Cascading deletion & audit receipts
│   │   ├── ingestion/        # Runtime ingestion engine
│   │   ├── retrieval/        # Depth-aware hierarchical retrieval
│   │   ├── services/         # Memory & embedding services
│   │   ├── api.py            # FastAPI REST routes
│   │   ├── database.py       # SQLAlchemy engine & health checks
│   │   ├── main.py           # FastAPI entry point, CORS & timing
│   │   ├── models.py         # SQLAlchemy ORM models (14 tables)
│   │   └── schemas.py        # Pydantic validation contracts
│   ├── mcp_server.py         # Standalone MCP server (JSON-RPC 2.0)
│   └── requirements.txt      # Python requirements
├── frontend/                 # Flagship React 18 Motion SPA
│   ├── src/
│   │   ├── components/       # Common, dashboard, hero & section components
│   │   ├── pages/            # LandingPage & DashboardPage
│   │   ├── services/         # Centralized API client (api.ts)
│   │   ├── styles/           # Tailwind CSS & animations
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Router configuration
│   │   └── main.tsx          # Application mount
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts        # Vite config with /api proxy & chunk splitting
├── docs/                     # Comprehensive Architecture Specifications
│   ├── acceptance_test_report.md
│   ├── api_reference.md
│   ├── architecture.md
│   ├── frontend_integration_contract.md
│   └── mcp_architecture.md
├── scripts/                  # Verification, Benchmark & Test Harnesses
│   ├── verify_e2e_integration.py # 12-step end-to-end integration test suite
│   ├── verify_backend_complete.py# 14-suite backend test runner
│   └── verify_live_database.py   # Live Neon DB pgvector verifier
├── start-all.ps1             # Concurrent full-stack launcher
├── start-backend.ps1         # Backend startup script
├── start-frontend.ps1        # Frontend startup script
├── verify.ps1                # Verification suite runner
├── .env.example              # Root environment template
├── .gitignore                # Git ignore configuration
└── README.md                 # System documentation
```

---

## License

This project is licensed under the MIT License.
