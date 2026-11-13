# Knowledge Brain — Repository Audit and Redevelopment Plan

**Sprint:** Sprint 1 — Repository Audit & Architectural Investigation  
**Date:** November 2026  
**Status:** Approved & Implemented  

---

## 1. Executive Summary

This repository audit provides a comprehensive inspection of the existing Knowledge Brain codebase (`d:\5B assignments\CV\DevX\`), evaluating its current architectural state against the external evaluation feedback and requirements for the **Progressive Hierarchical Memory Architecture (Level 1 Experience $\to$ Level 2 Context $\to$ Level 3 Knowledge)**.

The audit identifies:
1. High-value working components to retain and build upon.
2. Incomplete and missing architectural capabilities.
3. Incorrect architectural assumptions requiring correction.
4. Redesign specifications for the database, ingestion engine, retrieval engine, and Docker infrastructure.
5. Migration and backward-compatibility strategies.

---

## 2. Component-by-Component Audit

### 2.1 Backend Architecture & API Layer (`backend/app/`)
- **FastAPI Core (`main.py`):**
  - *Status:* Working and robust.
  - *Retain:* CORS configuration, performance timing middleware (`X-Process-Time-Ms`), structured global exception handling.
  - *Enhancement Needed:* Add startup lifecycle hooks for background worker initialization and hierarchical tier health checks.
- **REST Endpoints (`api.py`):**
  - *Status:* 34 endpoints covering auth, conversations, memories, search, versions, graph, permissions, compiler, conflicts, capsules, forgetting, health, and MCP gateway.
  - *Retain:* Strict error handling, authentication dependencies, response schema typing.
  - *Enhancement Needed:* Introduce dedicated endpoints for Hierarchical Ingestion (`/api/hierarchical/ingest`), Tier Management (`/api/hierarchical/promote`, `/api/hierarchical/demote`), and Depth-Aware Retrieval (`/api/hierarchical/retrieve`).

### 2.2 Database Schema & Connectivity (`models.py`, `database.py`)
- **Current Entities (10 tables):**
  - `User`, `Conversation`, `Memory`, `MemoryVersion`, `MemorySource`, `MemoryPermission`, `DeletionRequest`, `VerificationRecord`, `memory_dependencies` (DAG), `memory_semantic_links`.
  - *Status:* Solid foundation for provenance and DAG relationships.
  - *Critical Flaw:* Flat memory structure. All memories are stored in a single `memories` table with a basic `memory_type` enum (`fact`, `preference`, `decision`, `task`, `experience`). There is no structural representation of:
    - **Level 1 (Experience):** Raw turns, events, observations, candidate extractions with transient lifespan.
    - **Level 2 (Context):** Consolidated tasks, project constraints, dependencies, active situation state.
    - **Level 3 (Knowledge):** Validated long-term patterns, stable architectural rules, verified user preferences.
  - *Critical Flaw in `database.py`:* Hardcoded `connect_args={"sslmode": "require"}` and automatic appending of `sslmode=require` breaks local Docker PostgreSQL containers!
  - *Fix Required:* Make SSL conditional on Neon or explicit connection string parameters, allowing seamless local Docker pgvector execution.

### 2.3 Memory Intelligence Engine
- **Extractor (`compiler/extractor.py`):**
  - *Status:* Clean 5-facet rule-based extraction (facts, preferences, decisions, tasks, experiences), salience boosters/reducers, temporal validity detection.
  - *Retain:* Core regex and salience logic.
  - *Enhancement Needed:* Integration into the Level 1 Experience candidate generator and consolidation pipelines.
- **Sanitizer (`compiler/sanitizer.py`):**
  - *Status:* High quality. Defangs prompt injections, isolates threats into `quarantined` state, applies passive data tags (`<memory_data is_instruction='false'>`).
  - *Retain:* 100% of security logic.
- **Capsule Generator (`capsule/generator.py`):**
  - *Status:* Multi-factor composite ranking ($0.45\text{rel} + 0.25\text{imp} + 0.20\text{rec} + 0.10\text{conf}$), exponential 30-day half-life decay, strict token budget packing.
  - *Retain & Elevate:* Upgrade to support Depth-Aware Multi-Tier Capsule generation.
- **Conflict Detector (`conflict/detector.py`):**
  - *Status:* Detects antonym/negation clashes, supersessions, temporal drifts, and routes untrusted sources to quarantine.
  - *Retain:* Fully functional.
- **Forgetting Engine (`forgetting/engine.py`):**
  - *Status:* Traverses DAG on `memory_dependencies`, performs cascade deletion and vector nulling, generates SHA-256 tamper-evident multi-store receipts without retaining sensitive data.
  - *Retain:* Exceptional auditability.

### 2.4 Vector Embeddings (`services/embedding_service.py`)
- *Status:* 1,536-dimensional normalized vectors. Supports OpenAI `text-embedding-3-small` when an API key is provided, and features a deterministic n-gram semantic hash fallback when offline.
- *Retain:* Completely reliable across offline and cloud environments.

### 2.5 Model Context Protocol (MCP) (`backend/mcp_server.py`)
- *Status:* Implements official Python MCP SDK over stdio JSON-RPC 2.0 with 6 tools: `compile_memory`, `retrieve_memories`, `generate_memory_capsule`, `check_memory_conflicts`, `update_memory`, `forget_memory`.
- *Retain & Extend:* Add hierarchical tools (`ingest_experience`, `retrieve_hierarchical_memory`, `promote_context_to_knowledge`) while preserving complete backward compatibility for Cursor and Antigravity clients.

---

## 3. Identification Matrix

| Category | Component / Feature | Current State | Target Redevelopment Strategy |
| :--- | :--- | :--- | :--- |
| **Retain** | Security Barrier & Sanitizer | Complete & tested | Maintain passive wrapping and prompt injection defense. |
| **Retain** | Forgetting & Audit Engine | Complete & tested | Maintain SHA-256 receipts and DAG cascade deletion. |
| **Retain** | Conflict Detection Engine | Complete & tested | Integrate directly into ingestion conflict evaluation. |
| **Retain** | Vector Embedding Service | Complete & tested | Retain 1,536-dim pgvector HNSW compatibility. |
| **Redesign** | Database Schema | Flat memory model | Implement 3-Tier Progressive Hierarchy (`level` 1/2/3, promotion metadata, lifecycle state machine). |
| **Redesign** | Database Connection Logic | Enforces SSL require | Support both local Docker PostgreSQL and remote Neon SSL. |
| **Implement** | Ingestion Engine | Synchronous flat commit | Dedicated pipeline: Raw Ingress $\to$ L1 Experience $\to$ L2 Context Consolidation $\to$ Gated L3 Knowledge Promotion. |
| **Implement** | Retrieval Engine | Flat vector/facet filter | Depth-Aware Retrieval: Intent analysis $\to$ Tier routing (L1/L2/L3) $\to$ Token-budgeted synthesis. |
| **Implement** | Docker Infrastructure | Missing Dockerfiles/Compose | Docker Compose: FastAPI backend, pgvector DB, background worker, health checks, persistent volumes. |
| **Implement** | Background Processing | None (all in-process) | Background task worker for asynchronous context consolidation and consolidation batching. |

---

## 4. Migration & Backward Compatibility Strategy

To ensure zero downtime, zero data loss, and uninterrupted operation of existing test suites and frontends:
1. **Schema Evolution:**
   Rather than dropping existing tables, we enhance the schema by:
   - Adding hierarchical columns to `memories`: `hierarchy_level` (1=Experience, 2=Context, 3=Knowledge, default=2 for existing legacy records), `promotion_status`, `evidence_count`, `last_promoted_at`, `promoted_by`, `lifecycle_state`.
   - Creating specialized tables for raw experience logs (`experience_records`), context consolidations (`context_records`), and knowledge validations (`knowledge_records`) linked to the primary `memories` table, or unified hierarchical memory records with full backward compatibility.
2. **API Compatibility:**
   - Existing `/api/memories/*` endpoints continue to function without breaking contracts.
   - New hierarchical endpoints (`/api/hierarchical/*`) provide progressive ingestion, depth-aware retrieval, and promotion controls.
3. **MCP Compatibility:**
   - Existing 6 MCP tools remain active and operational.
   - New hierarchical parameters and tools are layered on top seamlessly.

---

## 5. Sprint Execution Plan
- **Sprint 1 (Current):** Repository Audit & Mem0 Investigation (Completed).
- **Sprint 2:** Database and Hierarchical Model Design & Migration.
- **Sprint 3:** Independent Runtime Ingestion Engine.
- **Sprint 4:** Independent Depth-Aware Retrieval Engine.
- **Sprint 5:** Docker-First Infrastructure (Dockerfile, Compose, pgvector, Worker).
- **Sprint 6:** REST, MCP, and Multi-Agent Security Upgrades.
- **Sprint 7:** Comprehensive Verification, Testing, and Benchmarking against Mem0 & Conventional RAG.

