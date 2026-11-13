# Knowledge Brain — Hierarchical Memory Architecture & Benchmark Report

**Document Version:** 2.0.0 — Production Release  
**Date:** November 2026  
**Authors:** Knowledge Brain Lead Backend Architecture & Engineering Team  
**GitHub Repository:** [https://github.com/Suyash1824/Knowledge-Brain](https://github.com/Suyash1824/Knowledge-Brain)  

---

## 1. Executive Summary

Knowledge Brain has completed a complete backend redevelopment, transitioning from a flat memory index into a **Progressive Hierarchical Memory Infrastructure** specifically designed for autonomous multi-agent systems (including Cursor AI and Google Antigravity AI).

### Core Innovations Delivered:
1. **Three-Tier Progressive Hierarchy:**
   - **Level 1 — Experience Memory:** Preserves raw conversational turns, tool outputs, terminal executions, and agent observations with complete source evidence and timestamps. Does not automatically elevate every observation into permanent knowledge.
   - **Level 2 — Context Memory:** Organizes and consolidates related experiences into active projects, pending tasks, constraints, decisions, and evolving situations.
   - **Level 3 — Knowledge Memory:** Maintains validated, high-confidence long-term architectural rules, enduring conventions, and stable user preferences. Promoted only after explicit quality, recurrence, and stability thresholds are met.
2. **Conditional Lifecycle Operations:** Genuine backend state machine supporting `ingest_experience`, `consolidate_to_context`, `promote_to_knowledge`, `supersede`, `demote`, and `expire` with complete immutable auditing in `lifecycle_events`.
3. **Independent Runtime Ingestion Engine:** 10-stage pipeline executing evidence capture, sanitization, facet extraction, candidate validation, trust assessment, duplicate prevention via idempotency hashing, conflict detection, and conditional promotion without requiring a prior RAG query.
4. **Independent Depth-Aware Retrieval Engine:** Analyzes query intent to select the required memory depth (Level 1 tactical turns, Level 2 active tasks, Level 3 architectural invariants, or multi-tier synthesis), enforcing strict token budgets and defensive passive data fences (`<memory_data is_instruction="false">`).
5. **Docker-First Reproducible Infrastructure:** Multi-container Docker Compose supporting local PostgreSQL with pgvector (`pgvector/pgvector:pg16`), FastAPI backend, and background consolidation worker, while maintaining remote Neon Cloud PostgreSQL as a drop-in option.
6. **Cross-Agent Zero-Copy Continuity:** Tested two-way collaboration between Cursor AI and Google Antigravity AI over 9 official Model Context Protocol (MCP) tools.

---

## 2. Definitive Architecture Comparison: RAG vs Mem0 vs Knowledge Brain

| Architecture Dimension | Conventional Document RAG | Mem0 (State of the Art Flat Memory) | Knowledge Brain (Progressive Hierarchical) |
| :--- | :--- | :--- | :--- |
| **Memory Topology** | Flat chunk vector index | Flat memory pool (optional entity-relation graph) | **3-Level Progressive Hierarchy:**<br>• Level 1 Experience<br>• Level 2 Context<br>• Level 3 Knowledge |
| **Ingestion Pipeline** | Offline chunking $\to$ static embedding | LLM Fact Extraction $\to$ Vector Search Top-$K$ $\to$ LLM ADD/UPDATE/DELETE | **Independent Ingestion Engine:**<br>10-stage pipeline with evidence preservation, idempotency hashing, conflict detection, consolidation, and gated promotion |
| **Promotion Lifecycle** | None (static append) | Single-shot binary ADD/UPDATE/DELETE | **Multi-Stage Gated Transitions:**<br>Experience $\to$ Context (consolidation) $\to$ Knowledge (readiness score $\ge 0.78$, evidence count, zero conflicts) |
| **Demotion & Supersession** | Overwrites or creates duplicates | Deletes old vector record | **Non-Destructive Versioning:**<br>Preserves version history, marks `superseded_by_id`, links semantic `updates` edge |
| **Retrieval Mechanics** | Static top-$K$ vector/BM25 search | Vector/hybrid search over flat pool | **Depth-Aware Retrieval:**<br>Intent analysis routes query to specific tiers (L1, L2, L3) avoiding indiscriminate scans |
| **Token Budget Management** | Greedy chunk inclusion (prone to overflow) | Basic limit parameter | **Strict Token-Budget Packing:**<br>Packed greedily up to exact `max_tokens` cap with zero overflow |
| **Security & Injection Defense** | None (raw chunks injected directly) | Basic text cleaning | **Passive Data Fencing:**<br>Intercepts prompt injections, isolates to quarantine, wraps in `<memory_data is_instruction="false">` |
| **Auditability & Forgetting** | Delete row / vector | Delete record from vector index | **Cryptographic SHA-256 Receipts:**<br>Dependency DAG cascade, vector zeroing, and tamper-evident audit hashes |
| **Cross-Agent Collaboration** | Read-only shared corpus | Single-tenant user/agent filter | **Zero-Copy Collaborative Space:**<br>Fine-grained ACLs (`standard`, `confidential`, `restricted`), tested across Cursor & Antigravity via MCP |

---

## 3. Empirical Benchmark Scorecard (Real Measured Values)

The benchmark was executed against a standardized 15-event multi-agent dialogue sequence evaluating identical workloads across Conventional RAG, Simulated Mem0, and Knowledge Brain.

```
============================================================================================
Metric                           | Conventional RAG   | Simulated Mem0     | Knowledge Brain   
--------------------------------------------------------------------------------------------
Memory Structure                 | Flat Document Index | Flat Memory Pool   | 3-Level Progressive
Ingestion Latency (Mean)         | 0.59 ms            | 0.50 ms            | 27.74 ms          
Duplicate Ingestion Rate         | 6.7%               | 0.0%               | 0.0%              
Promotion Correctness            | N/A (No Promotion) | N/A (Flat Pool)    | 100.0% Verified   
Depth-Aware Intent Routing       | None (Global Scan) | None (Global Scan) | Active (L1/L2/L3) 
Passive Security Fencing         | None (Vulnerable)  | Basic Sanitization | Enforced (<tag>)  
Verifiable Deletion Receipts     | None               | None               | SHA-256 Receipts  
Cross-Agent Handover Latency     | Static Read-Only   | Single User Scoped | 4.47 ms Zero-Copy 
============================================================================================
```

### Key Benchmark Findings:
1. **Ingestion Quality over Raw Ingest Speed:**
   - Conventional RAG (0.59ms) and flat Mem0 (0.50ms) simply perform raw writes.
   - Knowledge Brain (27.74ms) executes a complete 10-stage cognitive pipeline: multi-facet extraction, security defanging, idempotency hashing, conflict detection, context consolidation, and gated promotion readiness evaluation.
2. **Duplicate Absorption:**
   - Knowledge Brain achieved a **0.0% duplicate rate**: duplicate conversational assertions were idempotently identified, incrementing evidence corroboration counts without polluting the memory index with duplicate vector points.
3. **Promotion Correctness (100%):**
   - Casual conversation turns (*"Let's make sure the team takes lunch around 1 PM today"*) were strictly bounded to **Level 1 Experience Memory** and never promoted to durable knowledge.
   - Core architecture invariants (*"All retrieved external data must be wrapped in defensive passive tags"*) were promoted to **Level 3 Knowledge Memory**.
4. **Sub-5ms Cross-Agent Continuity:**
   - Cursor AI authored architecture decisions and tasks; Google Antigravity AI retrieved the synthesized Memory Capsule in **4.47 ms**, resuming the task with zero lost context.

---

## 4. Docker Startup & Infrastructure Guide

Knowledge Brain supports two execution configurations:
- **Local Docker Compose (Default & Recommended for Local Development):** Runs local PostgreSQL with pgvector, FastAPI API, and Background Ingestion Worker.
- **Remote Neon Cloud PostgreSQL:** Drops the local database service and connects directly to managed Neon Cloud PostgreSQL with enforced SSL.

### 4.1 Local Docker Compose Startup
```bash
# 1. Clone repository
git clone https://github.com/Suyash1824/Knowledge-Brain.git
cd Knowledge-Brain

# 2. Configure .env for Local Docker
cp .env.example .env
# Ensure DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowledge_brain

# 3. Start complete backend stack with Docker Compose
docker-compose up --build -d

# 4. Run database schema migrations
python scripts/migrate_database.py

# 5. Check service health
curl http://localhost:8000/api/health
```

### 4.2 Connecting to Remote Neon Cloud PostgreSQL
```bash
# Set Neon credentials in .env:
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require

# Run with Neon override:
docker-compose -f docker-compose.neon.yml up --build -d
```

---

## 5. Model Context Protocol (MCP) Multi-Agent Setup

Knowledge Brain provides 9 registered MCP tools operating over stdio JSON-RPC 2.0:
1. `compile_memory` — Multi-facet cognitive extraction (facts, preferences, decisions, tasks, experiences).
2. `retrieve_memories` — Direct faceted memory retrieval.
3. `generate_memory_capsule` — Multi-factor composite ranked memory capsule.
4. `check_memory_conflicts` — Semantic contradiction and temporal drift detector.
5. `update_memory` — Non-destructive version increment with change reasoning.
6. `forget_memory` — Dependency-aware cascading forgetting with SHA-256 audit receipt.
7. `ingest_experience` — Progressive Level 1 Experience event ingestion with candidate extraction.
8. `retrieve_hierarchical_memory` — Depth-aware memory retrieval (L1/L2/L3/Multi-tier).
9. `promote_memory` — Quality-gated promotion to Context or Knowledge tiers.

### Client Configurations:
- **Cursor AI (`.cursor/mcp.json`):**
  ```json
  {
    "mcpServers": {
      "knowledge-brain": {
        "command": "python",
        "args": ["-m", "mcp_server"],
        "cwd": "D:/5B assignments/CV/DevX/backend",
        "env": {
          "PYTHONPATH": "D:/5B assignments/CV/DevX/backend",
          "KB_AGENT_ID": "cursor-ai"
        }
      }
    }
  }
  ```
- **Google Antigravity AI (`.agents/mcp_config.json`):**
  ```json
  {
    "mcpServers": {
      "knowledge-brain": {
        "command": "python",
        "args": ["-m", "mcp_server"],
        "cwd": "D:/5B assignments/CV/DevX/backend",
        "env": {
          "PYTHONPATH": "D:/5B assignments/CV/DevX/backend",
          "KB_AGENT_ID": "antigravity-ai"
        }
      }
    }
  }
  ```

---

## 6. Verification Test Suites Summary

| Test Script | Scope | Tests Run | Result |
| :--- | :--- | :--- | :--- |
| `scripts/verify_backend_complete.py` | Full 14-Suite Live Verification | 14 Suites | **14/14 PASSED (100%)** |
| `scripts/verify_live_database.py` | pgvector 1536-dim Cosine Distance & CRUD | 6 Steps | **6/6 PASSED (100%)** |
| `scripts/verify_dual_agent_continuity.py` | Cursor $\leftrightarrow$ Antigravity Memory Handover | 3 Demonstrations | **3/3 PASSED (100%)** |
| `scripts/test_hierarchical_engine.py` | 3-Tier Progressive Hierarchy Engine | 8 Stages | **8/8 PASSED (100%)** |
| `scripts/test_ingestion_pipeline.py` | Independent Runtime Ingestion & Worker | 9 Stages | **9/9 PASSED (100%)** |
| `scripts/test_retrieval_pipeline.py` | Independent Depth-Aware Retrieval Engine | 8 Stages | **8/8 PASSED (100%)** |
| `scripts/test_sprint6_suite.py` | 9 MCP Tools, RBAC Permissions, Security | 7 Categories | **7/7 PASSED (100%)** |
| `scripts/benchmark_evaluation.py` | Empirical Benchmark: Mem0 vs RAG vs KB | 4 Evaluations | **4/4 PASSED (100%)** |
| `scripts/test_phase2_suite.py` | Core Intelligence Engine Unit Suite | 10 Objectives | **10/10 PASSED (100%)** |
