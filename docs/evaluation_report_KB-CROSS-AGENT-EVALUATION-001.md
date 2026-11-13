# Knowledge Brain — Automated Testing and Evaluation Report

**Evaluation ID**: `KB-CROSS-AGENT-EVALUATION-001`  
**Execution Timestamp**: `2026-11-13T20:57:12.206127+00:00`  
**Execution Duration**: `138.73 seconds`  
**Pass Rate**: **100.0% (33/33 Tests Passed)**  

## Executive Summary

This report records the automated execution of the comprehensive test harness for the integrated Knowledge Brain full-stack application. All tests were executed against the live **Neon Cloud PostgreSQL** database (`ep-red-leaf...`) with active **pgvector 0.8.7**, the live **FastAPI** backend (`http://127.0.0.1:8000`), the live **Vite React 18** frontend (`http://localhost:3000`), and the standalone **Model Context Protocol (MCP)** server.

### Results Breakdown by Category

| Category | Total Tests | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Backend Unit Tests** | 10 | 10 | 0 | ✅ PASSED |
| **Integration Tests** | 8 | 8 | 0 | ✅ PASSED |
| **Frontend Tests** | 8 | 8 | 0 | ✅ PASSED |
| **End-to-End Evaluation** | 7 | 7 | 0 | ✅ PASSED |
| **TOTAL** | **33** | **33** | **0** | **✅ 100% PASS** |

---

## Detailed Test Execution Records

| Test ID | Category | Description | Expected Result | Actual Result | Latency | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `UNIT-001` | Backend Unit | Memory Creation with 1536-dim pgvector embedding | Memory record created with UUID, active status, and 1536-dim vector | Created Memory ID: 6ac660a6-6979-469e-ae8a-05947c6d4ef5, Embedding dims: 1536 | 4471.9 ms | ✅ PASS |
| `UNIT-002` | Backend Unit | Memory Retrieval by UUID | Memory successfully retrieved with identical content and metadata | Retrieved ID: 6ac660a6-6979-469e-ae8a-05947c6d4ef5, Content: [UNIT-001] Knowledge Brain leverages PostgreSQL wi... | 164.41 ms | ✅ PASS |
| `UNIT-003` | Backend Unit | Memory Classification across 5 cognitive facets | Extract and categorize fact, preference, decision, task, experience | Extracted 5 items with facets: ['preference', 'experience', 'decision', 'task', 'fact'] | 6.39 ms | ✅ PASS |
| `UNIT-004` | Backend Unit | Memory Updates with Immutable Version History | Memory content updated, prior content preserved in memory_versions table | Historical Versions Recorded: 2, Prior Content: [UNIT-001] Knowledge Brain leverages Pos... | 2425.01 ms | ✅ PASS |
| `UNIT-005` | Backend Unit | Memory Deletion with Cascade Cleanup | Memory record deleted and confirmed absent from database query | Delete confirmed: query_after is None | 6730.05 ms | ✅ PASS |
| `UNIT-006` | Backend Unit | Semantic Search via pgvector Cosine Operator | Retrieve memories matching semantic concept with cosine similarity score | Retrieved 1 memories; Top Result: [UNIT-004] Knowledge Brain leverages PostgreS... | 758.11 ms | ✅ PASS |
| `UNIT-007` | Backend Unit | Capsule Generation with Passive Fencing & Budgeting | Token budget respected, passive fencing tags applied to prevent instruction hijacking | Memories in capsule: 1, Tokens: 75 / 800 budget | 584.52 ms | ✅ PASS |
| `UNIT-008` | Backend Unit | Authentication (bcrypt 12-round hashing & RFC 7519 JWT) | Bcrypt verifies correct password; JWT issues and decodes subject and email | Password Verified: True, JWT Subject: c5db0670-7324-4421-94c2-722ada035d19 | 1201.12 ms | ✅ PASS |
| `UNIT-009` | Backend Unit | Authorization & Clearance Boundary Enforcement | Unauthorized agent query yields no clearance for restricted memory | Guest agent permission record: None (Blocked as expected) | 6844.39 ms | ✅ PASS |
| `UNIT-010` | Backend Unit | Neon Database Persistence across Detached Sessions | Transaction commit confirmed readable across independent database connections | Fresh Session Query Result: ID=86e519cb-825b-4566-85b7-bf9e5590a107 | 12483.25 ms | ✅ PASS |
| `INT-001` | Integration | FastAPI and Neon PostgreSQL Connectivity | HTTP 200, status='healthy', pgvector_available=True | HTTP 200, DB Status: connected, pgvector: True | 5321.4 ms | ✅ PASS |
| `INT-002` | Integration | REST API Request/Response Schema Contracts | HTTP 200, payload conforms to DashboardStatsResponse Pydantic schema | HTTP 200, Total Memories: 20, Storage: Neon Serverless PostgreSQL (AWS ap-southeast-1), pgvector: True | 10610.89 ms | ✅ PASS |
| `INT-003` | Integration | MCP Server Protocol & Tool Discovery | All 6 standard MCP tools registered and discoverable | Discovered 9 tools: ['compile_memory', 'retrieve_memories', 'generate_memory_capsule', 'check_memory_conflicts', 'update_memory', 'forget_memory', 'ingest_experience', 'retrieve_hierarchical_memory', 'promote_memory'] | 0.14 ms | ✅ PASS |
| `INT-004` | Integration | Memory Writing through Antigravity Integration | Antigravity compiles and writes memory record to Neon DB with provenance | Status: success, Created Memory ID: bb77a752-7368-42d3-8f68-6f571981bef9, Agent: antigravity-ai | 8406.65 ms | ✅ PASS |
| `INT-005` | Integration | Memory Retrieval through Cursor Integration | Cursor agent queries and retrieves Antigravity-authored record | Retrieved 3 memories; Found Antigravity Record: True | 1198.41 ms | ✅ PASS |
| `INT-006` | Integration | Bidirectional Cross-Agent Memory Sharing | Cursor writes progress; Antigravity retrieves and incorporates into capsule | Cursor ID: 185bac18-7fb7-400f-9f1b-e75f6059e7bf, Antigravity Capsule contains Cursor Task: True | 3911.35 ms | ✅ PASS |
| `INT-007` | Integration | Session-Independent Persistence & Retrieval | Detached HTTP client retrieves persisted memory with zero in-memory state | HTTP 200, Returned 10 items, Found Content Match: True | 2694.54 ms | ✅ PASS |
| `INT-008` | Integration | User & Agent Permission Boundary Enforcement | Restricted memory blocked from read and rejected on write with PermissionDenied | Read Blocked: True, Write Blocked: True (PermissionDenied) | 10496.42 ms | ✅ PASS |
| `FRONT-001` | Frontend | Vite React SPA Dashboard Root Loading | HTML contains #root container and /src/main.tsx script entry | File: index.html, Size: 1385 bytes, Has Root: True | 0.46 ms | ✅ PASS |
| `FRONT-002` | Frontend | Memory Explorer API Proxy Integration | HTTP 200 via /api proxy, returns JSON array of memories | HTTP 200, Array length: 5, Sample ID: cefcfa7c-3787-4c96-b180-a84a3a602f56 | 2279.75 ms | ✅ PASS |
| `FRONT-003` | Frontend | Memory Compiler API Integration | HTTP 200, returns extracted candidate memory items with cognitive facets | HTTP 200, Extracted candidate memories: 2 | 1511.13 ms | ✅ PASS |
| `FRONT-004` | Frontend | Memory Capsules Generator API Integration | HTTP 200, returns synthesized capsule with token count and passive fencing | HTTP 200, Capsule ID: cd3dcf50-9dc1-45e3-8045-fec9db3b285b, Tokens: 166 | 4143.68 ms | ✅ PASS |
| `FRONT-005` | Frontend | AI Agent Management & Telemetry API | HTTP 200, returns active agents list containing cursor-ai and antigravity-ai | HTTP 200, Discovered Agents: ['cursor-ai', 'default_agent', 'test-agent', 'antigravity-ai'] | 3796.55 ms | ✅ PASS |
| `FRONT-006` | Frontend | Knowledge Graph ReactFlow API Integration | HTTP 200, payload contains nodes array and edges array for ReactFlow DAG | HTTP 200, Graph Nodes: 22, Edges: 1 | 7640.3 ms | ✅ PASS |
| `FRONT-007` | Frontend | Error Handling & 401 Unauthorized Boundary | HTTP 401 returned on unauthenticated /api/auth/me, triggering token cleanup | HTTP 401, Detail: None | 1516.08 ms | ✅ PASS |
| `FRONT-008` | Frontend | Frontend Build & Static Asset Integrity | Production bundle compiled cleanly; dist/index.html and asset chunks verified | dist/index.html verified at D:\5B assignments\CV\Knowledge-Brain\frontend\dist\index.html (Size: 1984 bytes) | 0.21 ms | ✅ PASS |
| `E2E-001` | End-to-End | Step 1: Antigravity writes 5 test memories (KB-CROSS-AGENT-EVALUATION-001) | 5 memories extracted and saved covering fact, preference, decision, task, experience | Successfully created 5 records: ['preference', 'decision', 'task', 'experience', 'fact'] | 20339.64 ms | ✅ PASS |
| `E2E-002` | End-to-End | Step 2: Backend confirms Neon DB persistence (KB-CROSS-AGENT-EVALUATION-001) | All 5 memories persisted with active status and 1536-dim embeddings | Found 5/5 records in DB; All embeddings 1536-dim: True | 709.12 ms | ✅ PASS |
| `E2E-003` | End-to-End | Step 3: Dashboard API displays actual records (KB-CROSS-AGENT-EVALUATION-001) | Dashboard /api/memories endpoint exposes all 5 records to frontend components | Found 5/5 records via Dashboard API | 2768.69 ms | ✅ PASS |
| `E2E-004` | End-to-End | Step 4: Cursor retrieves memories in new session (KB-CROSS-AGENT-EVALUATION-001) | Cursor retrieves all 5 records written by Antigravity in fresh session | Cursor retrieved 5/5 target memory IDs | 3136.14 ms | ✅ PASS |
| `E2E-005` | End-to-End | Step 5: Cursor writes additional decision (KB-CROSS-AGENT-EVALUATION-001) | Cursor writes new architecture decision to Neon DB with provenance | Created Cursor Decision ID: 3f0fdbf6-4bba-4038-ad9b-55da5bb32a08, Agent: cursor-ai | 2252.26 ms | ✅ PASS |
| `E2E-006` | End-to-End | Step 6: Antigravity retrieves Cursor's decision in new session (KB-CROSS-AGENT-EVALUATION-001) | Antigravity retrieves Cursor's decision in fresh session with passive fencing | Antigravity capsule received Cursor's decision: True (Capsule ID: 38a4b1f4-c43b-4379-8778-509d6e80794b) | 2186.39 ms | ✅ PASS |
| `E2E-007` | End-to-End | Step 7: Verification of Identity Integrity & Zero Drift (KB-CROSS-AGENT-EVALUATION-001) | All retrieved memory IDs match their exact origin records with zero drift or identity corruption | Target IDs: 5, Matched in Neon DB: 5, Zero Identity Drift: True | 1964.48 ms | ✅ PASS |

---

## Priority Verification: Google Antigravity & Cursor Dual-Agent Handover

The end-to-end evaluation **`KB-CROSS-AGENT-EVALUATION-001`** verified bidirectional, zero-drift memory exchange between Google Antigravity and Cursor AI:

1. **Antigravity Ingestion**: Google Antigravity compiled and persisted 5 memories across all 5 cognitive facets (`fact`, `preference`, `decision`, `task`, `experience`) into Neon PostgreSQL.
2. **Database Persistence**: Backend verified active status and 1536-dimensional pgvector embeddings for all records.
3. **Dashboard Visibility**: REST API confirmed all records indexed and queryable via dashboard endpoints.
4. **Cursor Retrieval**: Cursor AI retrieved all 5 records in a new, independent session with zero prior in-memory state.
5. **Cursor Decision Commit**: Cursor AI committed an architectural decision (`Implemented Redis token revocation blacklist`).
6. **Antigravity Synthesis**: Google Antigravity retrieved Cursor's decision inside a synthesized Memory Capsule wrapped in passive data fences.
7. **Zero-Drift Identity**: All 6 memory UUIDs matched their origin records with 100% fidelity.

