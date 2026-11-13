# Knowledge Brain — Complete REST API Reference & Frontend Integration Contract

**Document Version:** 1.0.0  
**Backend Base URL:** `http://localhost:8000` (Local) / Custom Reverse Proxy  
**Authentication Standard:** RFC 6750 HTTP Bearer Token (`Authorization: Bearer <jwt_access_token>`)  
**Security Standard:** Passwords hashed with `bcrypt` (12 rounds); Passive Data Fencing (`<memory_data is_instruction="false">`); Strict ACL isolation.

---

## 1. Authentication & Session Management

All protected endpoints require the HTTP header:
```http
Authorization: Bearer <token>
```
Tokens are signed with HS256 and expire according to `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60 minutes).

### 1.1 Register User
- **Method / Path:** `POST /api/auth/register`
- **Frontend View:** Auth Modal / Signup View
- **Request Body (`application/json`):**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "role": "user",
    "is_active": true,
    "created_at": "2026-11-13T10:00:00Z"
  }
  ```
- **Error Codes:** `400 Bad Request` (Invalid input), `409 Conflict` (Email already registered).

### 1.2 User Login
- **Method / Path:** `POST /api/auth/login`
- **Frontend View:** Auth Modal / Login View
- **Request Body (`application/json`):**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "user@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "2026-11-13T10:00:00Z"
    }
  }
  ```
- **Error Codes:** `401 Unauthorized` (Incorrect email or password).

### 1.3 Get Current User Profile
- **Method / Path:** `GET /api/auth/me`
- **Frontend View:** App Header / User Profile
- **Security:** Bearer Token Required
- **Response (`200 OK`):**
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "role": "user",
    "is_active": true,
    "created_at": "2026-11-13T10:00:00Z"
  }
  ```
- **Error Codes:** `401 Unauthorized` (Missing, invalid, or expired token).

---

## 2. Health & Dashboard Telemetry

### 2.1 System Health
- **Method / Path:** `GET /api/health`
- **Frontend View:** System Status Indicator / Header Pill
- **Response (`200 OK`):**
  ```json
  {
    "status": "healthy",
    "database": {
      "status": "connected",
      "target": "postgresql://<db_user>:***@<neon-pooler-host>/neondb?sslmode=require"
    },
    "mcp_server": "active",
    "supported_clients": ["cursor-ai", "antigravity-ai", "generic-mcp-client"]
  }
  ```

### 2.2 Dashboard Overview Stats
- **Method / Path:** `GET /api/dashboard/stats`
- **Frontend View:** Overview Tab / KPI Stat Cards
- **Response (`200 OK`):**
  ```json
  {
    "total_memories": 142,
    "total_conversations": 18,
    "total_agents": 2,
    "facet_distribution": {
      "fact": 58,
      "decision": 34,
      "task": 26,
      "preference": 18,
      "experience": 6
    },
    "status_distribution": {
      "trusted": 135,
      "quarantined": 4,
      "tombstone": 3
    },
    "connected_agents": [
      {
        "agent_id": "cursor-ai",
        "accessible_memories": 138,
        "read_count": 138,
        "write_count": 138
      },
      {
        "agent_id": "antigravity-ai",
        "accessible_memories": 135,
        "read_count": 135,
        "write_count": 135
      }
    ],
    "storage_backend": "Neon PostgreSQL (pgvector HNSW)"
  }
  ```

---

## 3. Conversation Management

### 3.1 List Conversations
- **Method / Path:** `GET /api/conversations`
- **Frontend View:** Conversation Selector / Sidebar
- **Query Parameters:** `limit` (default 50), `offset` (default 0)
- **Response (`200 OK`):** Array of Conversation objects.

### 3.2 Create Conversation
- **Method / Path:** `POST /api/conversations`
- **Frontend View:** "New Session" button
- **Request Body:**
  ```json
  {
    "title": "Architecture Redesign Sprint",
    "metadata": { "platform": "desktop" }
  }
  ```
- **Response (`201 Created`):** Conversation object.

### 3.3 Delete Conversation
- **Method / Path:** `DELETE /api/conversations/{id}`
- **Response (`204 No Content`)**

---

## 4. Memory CRUD & Semantic Search

### 4.1 List & Filter Memories
- **Method / Path:** `GET /api/memories`
- **Frontend View:** Memory Explorer Tab
- **Query Parameters:**
  - `conversation_id` (UUID, optional)
  - `cognitive_facet` (`fact`, `preference`, `decision`, `task`, `experience`, optional)
  - `status` (`trusted`, `quarantined`, `tombstone`, optional)
  - `agent_id` (Filter by agent ACL clearance, optional)
  - `search` (Keyword substring search, optional)
  - `limit` (default 50), `offset` (default 0)
- **Response (`200 OK`):** Array of Memory objects with pagination headers.

### 4.2 Create Memory
- **Method / Path:** `POST /api/memories`
- **Frontend View:** "Add Memory" Modal
- **Request Body:**
  ```json
  {
    "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "content": "Primary database is Neon PostgreSQL with pgvector.",
    "cognitive_facet": "fact",
    "confidence_score": 0.95,
    "importance_score": 0.90,
    "status": "trusted",
    "metadata": { "environment": "production" }
  }
  ```
- **Behavior:** Automatically generates 1536-dimensional vector embedding, stores in `memories.embedding`, wraps content in passive data fences if untrusted, creates initial `MemoryVersion` (version 1), and records provenance.
- **Response (`201 Created`):** Memory object with ID.

### 4.3 Semantic Similarity Search (pgvector)
- **Method / Path:** `POST /api/memories/search`
- **Frontend View:** Memory Explorer Search Bar (with Semantic toggle)
- **Request Body:**
  ```json
  {
    "query": "Which database is deployed in production?",
    "cognitive_facet": "fact",
    "limit": 10,
    "min_similarity": 0.20
  }
  ```
- **Behavior:** Embeds query and performs `<=>` cosine similarity search against `memories.embedding` using the HNSW index in Neon. Falls back gracefully to text ILIKE if embedding unavailable.
- **Response (`200 OK`):** Array of Memory objects with attached `similarity` score.

### 4.4 Get Memory Details
- **Method / Path:** `GET /api/memories/{id}`
- **Frontend View:** Memory Drawer / Detail Panel
- **Response (`200 OK`):** Detailed Memory object.

### 4.5 Update Memory (Non-Destructive Versioning)
- **Method / Path:** `PUT /api/memories/{id}`
- **Frontend View:** Memory Edit Form
- **Request Body:**
  ```json
  {
    "content": "Primary database is Neon PostgreSQL with pgvector and Redis caching.",
    "change_reason": "Added Redis caching tier"
  }
  ```
- **Behavior:** Creates an immutable `MemoryVersion` record incrementing version number, updates `memories.current_version`, updates `memories.content`, recomputes vector embedding, and preserves historical versions.
- **Response (`200 OK`):** Updated Memory object.

### 4.6 Delete Memory
- **Method / Path:** `DELETE /api/memories/{id}`
- **Response (`204 No Content`)**

---

## 5. Versions & Provenance

### 5.1 Memory Version History
- **Method / Path:** `GET /api/memories/{id}/versions`
- **Frontend View:** Memory Timeline / Version History Panel
- **Response (`200 OK`):**
  ```json
  [
    {
      "id": "7fa85f64-5717-4562-b3fc-2c963f66afa7",
      "memory_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "version_number": 1,
      "content": "Primary database is Neon PostgreSQL with pgvector.",
      "change_reason": "Initial creation",
      "created_at": "2026-11-13T10:00:00Z"
    },
    {
      "id": "8fa85f64-5717-4562-b3fc-2c963f66afa8",
      "memory_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "version_number": 2,
      "content": "Primary database is Neon PostgreSQL with pgvector and Redis caching.",
      "change_reason": "Added Redis caching tier",
      "created_at": "2026-11-13T10:15:00Z"
    }
  ]
  ```

### 5.2 Memory Provenance
- **Method / Path:** `GET /api/memories/{id}/provenance`
- **Frontend View:** Provenance & Audit Inspector
- **Response (`200 OK`):** Array of `MemorySource` records showing originating agent, conversation turn, timestamp, and metadata.

---

## 6. Knowledge Graph & Relationship Engine

### 6.1 Get Relationships for Memory
- **Method / Path:** `GET /api/memories/{id}/relationships`
- **Response (`200 OK`):**
  ```json
  {
    "memory_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "dependencies": [
      { "parent_id": "...", "child_id": "...", "type": "depends_on" }
    ],
    "semantic_links": [
      { "source_id": "...", "target_id": "...", "type": "updates" }
    ]
  }
  ```

### 6.2 Create Relationship Edge
- **Method / Path:** `POST /api/memories/relationships`
- **Frontend View:** Knowledge Graph Interactive Node Linker
- **Request Body:**
  ```json
  {
    "source_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "target_id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "relationship_category": "dependency",
    "type": "depends_on"
  }
  ```
- **Cycle Prevention:** If `relationship_category == "dependency"`, the backend runs graph cycle detection on `memory_dependencies`. If adding the edge introduces a directed cycle, it rejects with `400 Bad Request` and descriptive error.
- **Response (`201 Created`):** Relationship response.

### 6.3 Complete Knowledge Graph Visualization Data
- **Method / Path:** `GET /api/graph`
- **Frontend View:** Knowledge Graph Tab (Force-directed graph / React Flow / Cytoscape)
- **Response (`200 OK`):**
  ```json
  {
    "nodes": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "label": "Primary database is Neon PostgreSQL...",
        "cognitive_facet": "fact",
        "importance": 0.90,
        "status": "trusted",
        "color": "#10b981"
      }
    ],
    "edges": [
      {
        "source": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "target": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
        "category": "dependency",
        "type": "depends_on",
        "animated": false
      }
    ],
    "total_nodes": 1,
    "total_edges": 1
  }
  ```

---

## 7. Agent Access Control & Permissions

### 7.1 List Connected Agents & Access Metrics
- **Method / Path:** `GET /api/agents`
- **Frontend View:** Agents & Permissions Tab
- **Response (`200 OK`):**
  ```json
  [
    {
      "agent_id": "cursor-ai",
      "name": "Cursor AI",
      "description": "IDE agent for code generation and refactoring",
      "total_permissions": 45,
      "read_access_count": 45,
      "write_access_count": 45
    },
    {
      "agent_id": "antigravity-ai",
      "name": "Google Antigravity AI",
      "description": "Orchestrator agent for multi-step reasoning and terminal execution",
      "total_permissions": 42,
      "read_access_count": 42,
      "write_access_count": 42
    }
  ]
  ```

### 7.2 Memory Permissions Management
- **Method / Path:** `GET /api/memories/{id}/permissions`
- **Method / Path:** `POST /api/memories/{id}/permissions`
- **Frontend View:** Memory Access Control Modal
- **Request Body (POST):**
  ```json
  {
    "agent_id": "cursor-ai",
    "can_read": true,
    "can_write": false,
    "classification_level": "confidential"
  }
  ```

---

## 8. Core Intelligence & Compilation Endpoints

### 8.1 Compile Conversation
- **Method / Path:** `POST /api/compiler/compile`
- **Frontend View:** Dialogue Compiler Playground / Manual Ingest
- **Request Body:**
  ```json
  {
    "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "turns": [
      { "speaker": "user", "text": "We decided to migrate authentication to JWT tokens." }
    ],
    "source_agent": "antigravity-ai"
  }
  ```
- **Response (`200 OK`):** Extracted and persisted structured memories with assigned facets and confidence scores.

### 8.2 Conflict Detection
- **Method / Path:** `POST /api/compiler/detect-conflicts`
- **Request Body:**
  ```json
  {
    "new_content": "We decided to migrate authentication to session cookies.",
    "cognitive_facet": "decision",
    "memory_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "conflict_detected": true,
    "conflict_type": "direct_contradiction",
    "conflicting_memory_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "confidence": 0.94,
    "recommended_action": "update_version",
    "explanation": "Contradictory architectural decision detected."
  }
  ```

### 8.3 Synthesize Memory Capsule
- **Method / Path:** `POST /api/capsules/generate`
- **Frontend View:** Capsule Generator / Context Previewer
- **Request Body:**
  ```json
  {
    "task_description": "Implement authentication endpoints",
    "agent_id": "antigravity-ai",
    "max_tokens": 1500
  }
  ```
- **Response (`200 OK`):** Compact, token-budgeted memory capsule formatted with passive data fences and provenance citations.

---

## 9. Dependency-Aware Forgetting & Multi-Store Audit

### 9.1 Request Cascading Memory Deletion
- **Method / Path:** `POST /api/forgetting/request-deletion`
- **Frontend View:** Right-to-be-Forgotten / Memory Deletion Action
- **Request Body:**
  ```json
  {
    "memory_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "User right-to-be-forgotten request"
  }
  ```
- **Behavior:**
  1. Traces the DAG exclusively via `memory_dependencies`.
  2. Purges the target memory.
  3. Replaces derived memories with sanitized tombstones and nulls embeddings.
  4. Generates a multi-store verification receipt across relational DB, pgvector, and cache.
  5. Computes a cryptographic SHA-256 integrity hash over audit metadata.
- **Response (`200 OK`):** Verification record.

### 9.2 Verify Deletion Audit Record
- **Method / Path:** `GET /api/forgetting/verify/{request_id}`
- **Frontend View:** Audit Log Tab / Verification Viewer
- **Response (`200 OK`):** Verifiable deletion receipt with SHA-256 hash.

---

## 10. Frontend Component Mapping Matrix

| Dashboard View / Component | Relevant Backend Endpoints | Key Features |
|:---------------------------|:---------------------------|:-------------|
| **System Header** | `GET /api/health`, `GET /api/auth/me` | Real-time Neon DB connection status, user profile, logout |
| **Overview Dashboard** | `GET /api/dashboard/stats` | KPI counters, facet donut chart, trust breakdown, agent activity |
| **Memory Explorer** | `GET /api/memories`, `POST /api/memories/search`, `POST /api/memories`, `DELETE /api/memories/{id}` | Facet filtering, full-text & pgvector cosine similarity search, memory creation |
| **Memory Detail & Drawer** | `GET /api/memories/{id}`, `PUT /api/memories/{id}`, `GET /api/memories/{id}/versions`, `GET /api/memories/{id}/provenance` | Non-destructive editing, version timeline diff, provenance source inspector |
| **Knowledge Graph** | `GET /api/graph`, `POST /api/memories/relationships` | Interactive node-link DAG visualization, edge creation with cycle prevention |
| **Agents & Access Control** | `GET /api/agents`, `GET /api/memories/{id}/permissions`, `POST /api/memories/{id}/permissions` | Per-agent read/write permission matrix, confidential memory locks |
| **Capsule Playground** | `POST /api/capsules/generate` | Interactive context preview, token budget slider, multi-factor ranking visualization |
| **Audit & Forgetting Log** | `POST /api/forgetting/request-deletion`, `GET /api/forgetting/verify/{request_id}` | Cascading deletion trigger, SHA-256 verifiable cryptographic audit receipts |
