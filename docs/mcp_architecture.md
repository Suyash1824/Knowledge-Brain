# Knowledge Brain — Standalone Model Context Protocol (MCP) Architecture

The **Model Context Protocol (MCP)** server for Knowledge Brain provides a standardized, low-latency interface enabling independent AI coding environments (specifically **Cursor AI** and **Google Antigravity AI**) to access, compile, update, and forget persistent memories across sessions and projects without user repetition.

---

## 1. System Topology & Dual-Agent Integration

```mermaid
flowchart TD
    subgraph Clients["Independent AI Coding Agents"]
        CURSOR["Cursor AI Client\n(.cursor/mcp.json)\nIdentity: cursor-ai"]
        AGY["Google Antigravity AI Client\n(.agents/mcp_config.json)\nIdentity: antigravity-ai"]
    end

    subgraph MCPServer["Knowledge Brain Standalone MCP Server (backend/mcp_server.py)"]
        STDIO["Stdio JSON-RPC 2.0 Transport Engine\n(Official MCP SDK)"]
        ACL["Multi-Agent Access Control & Clearance\n(memory_permissions: standard vs restricted)"]
        FENCE["Passive Data Wrapping & Injection Defanging\n(<memory_data is_instruction='false'>)"]
        TOOLS["6 Registered MCP Tools\n(compile, retrieve, capsule, conflict, update, forget)"]
    end

    subgraph CoreEngine["Core Intelligence Engine"]
        COMPILER["Memory Compiler\n(5 Cognitive Facets & Salience)"]
        CAPSULE["Memory Capsule Generator\n(Composite Ranking & Token Budget)"]
        CONFLICT["Conflict & Supersession Detector"]
        FORGET["Dependency-Aware Forgetting Engine"]
    end

    subgraph StorageLayer["Authoritative Live Storage (Neon Cloud PostgreSQL)"]
        REL["10 Relational Tables\n(memories, versions, sources, permissions, etc.)"]
        VEC["pgvector Engine\n(1536-dim HNSW Cosine Index)"]
    end

    CURSOR <-->|stdio JSON-RPC| STDIO
    AGY <-->|stdio JSON-RPC| STDIO
    STDIO --> ACL
    ACL --> FENCE
    FENCE --> TOOLS
    TOOLS --> CoreEngine
    CoreEngine <--> StorageLayer
```

---

## 2. Six Registered MCP Tools

The server registers 6 core tools via the official Python MCP SDK (`mcp.server.mcpserver.MCPServer`):

### 1. `compile_memory`
- **Purpose:** Decomposes dialogue or notes into normalized cognitive facets (`fact`, `preference`, `decision`, `task`, `experience`) with salience scoring and automatic persistence.
- **Parameters:**
  | Name | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `raw_content` | `string` | Yes | Raw conversation stream, user prompt, or agent notes. |
  | `conversation_id` | `string` | No | Scope UUID for session isolation. If omitted, uses active workspace. |
  | `source_type` | `string` | No | Origin tag (`conversation_turn`, `tool_output`, `api`). Defaults to `conversation_turn`. |
  | `agent_id` | `string` | No | Requesting agent identifier (e.g. `cursor-ai`, `antigravity-ai`). |
  | `classification_level` | `string` | No | Access classification: `standard` (shared workspace) or `restricted` (author-only private). |
  | `persist` | `boolean` | No | Whether to persist immediately to Neon PostgreSQL. Defaults to `true`. |
- **Security:** Wraps all extracted content in `<memory_data is_instruction="false">`. Quarantines detected prompt injection payloads.

### 2. `retrieve_memories`
- **Purpose:** Retrieves active memories filtered by conversation, memory type, or agent clearance.
- **Parameters:**
  | Name | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `conversation_id` | `string` | No | UUID filter for conversation scope. |
  | `memory_type` | `string` | No | Filter by facet: `fact`, `preference`, `decision`, `task`, `experience`. |
  | `limit` | `integer` | No | Max records to retrieve (default: `20`, max: `100`). |
  | `agent_id` | `string` | No | Agent identity for ACL filtering. Enforces read clearance. |

### 3. `generate_memory_capsule`
- **Purpose:** Compiles a task-specific, compacted Memory Capsule ranked by composite relevance ($0.45$), importance ($0.25$), recency decay ($0.20$), and confidence ($0.10$).
- **Parameters:**
  | Name | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `task_description` | `string` | Yes | Current agent objective or contextual query. |
  | `max_tokens` | `integer` | No | Strict token-budget cap (default: `1500`). Guaranteed never to overflow. |
  | `conversation_id` | `string` | No | Conversation scope UUID. |
  | `filter_types` | `array[string]`| No | Subset of memory facets to include. |
  | `agent_id` | `string` | No | Agent identifier. Enforces memory access permissions. |
  | `include_provenance`| `boolean` | No | Whether to attach origin provenance metadata. Defaults to `true`. |

### 4. `check_memory_conflicts`
- **Purpose:** Evaluates candidate statements against existing memories to detect contradictions, superseding decisions, or temporal shifts.
- **Parameters:**
  | Name | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `new_content` | `string` | Yes | Candidate memory or assertion to check. |
  | `existing_content` | `string` | No | Explicit reference text to compare against. |
  | `memory_id` | `string` | No | UUID of existing memory in database to compare against. |

### 5. `update_memory`
- **Purpose:** Updates an existing memory with new information while preserving immutable historical versions and recording semantic update links.
- **Parameters:**
  | Name | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `memory_id` | `string` | Yes | Target memory UUID to update. |
  | `new_content` | `string` | Yes | New updated content string. |
  | `change_reason` | `string` | No | Explanation for revision (e.g. `agent_update`, `superseded`). |
  | `agent_id` | `string` | No | Modifying agent identifier. Enforces write permission. |

### 6. `forget_memory`
- **Purpose:** Executes dependency-aware cascade deletion on target memory and downstream derivations, producing a tamper-evident audit receipt.
- **Parameters:**
  | Name | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `memory_id` | `string` | Yes | Target memory UUID to purge. |
  | `requested_by` | `string` | No | User UUID authorizing the erasure. |
  | `reason` | `string` | No | Right-to-be-forgotten reason. |
- **Output:** Returns deletion receipt containing timestamp, verified storage count, and 64-character SHA-256 integrity hash.

---

## 3. Client Configuration & Locations

### Cursor AI Client Setup

- **Workspace Configuration:** `.cursor/mcp.json`
- **Global Configuration:** `%USERPROFILE%\.cursor\mcp.json` (Windows)
- **Configuration JSON:**
```json
{
  "mcpServers": {
    "knowledge-brain": {
      "command": "d:\\5B assignments\\CV\\DevX\\venv\\Scripts\\python.exe",
      "args": [
        "d:\\5B assignments\\CV\\DevX\\backend\\mcp_server.py"
      ],
      "env": {
        "PYTHONPATH": "d:\\5B assignments\\CV\\DevX\\backend",
        "KB_AGENT_ID": "cursor-ai"
      }
    }
  }
}
```

### Google Antigravity AI Client Setup

- **Workspace Configuration:** `.agents/mcp_config.json` and root `mcp_config.json`
- **Global Configuration:** `~/.gemini/config/mcp_config.json`
- **Configuration JSON:**
```json
{
  "mcpServers": {
    "knowledge-brain": {
      "command": "d:\\5B assignments\\CV\\DevX\\venv\\Scripts\\python.exe",
      "args": [
        "d:\\5B assignments\\CV\\DevX\\backend\\mcp_server.py"
      ],
      "env": {
        "PYTHONPATH": "d:\\5B assignments\\CV\\DevX\\backend",
        "KB_AGENT_ID": "antigravity-ai"
      }
    }
  }
}
```

---

## 4. Two-Way Memory Continuity Demonstrations

### Demonstration A: Cursor AI $\to$ Google Antigravity AI Handover

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Cursor as Cursor AI (Agent 1)
    participant KB as Knowledge Brain MCP Server
    participant DB as Neon PostgreSQL (Live DB)
    participant AGY as Google Antigravity (Agent 2)

    User->>Cursor: "Implement JWT authentication and Redis blacklist"
    Cursor->>Cursor: Decides RS256 algorithm, completes auth middleware, notes pending blacklist task
    Cursor->>KB: compile_memory(dialogue, agent_id="cursor-ai")
    KB->>DB: Store memories, versions, provenance (source=cursor-ai), permissions
    Note over Cursor: Cursor session terminates. No prompt repeated by user.
    User->>AGY: "Continue our authentication work"
    AGY->>KB: generate_memory_capsule(task="Implement Redis token revocation blacklist", agent_id="antigravity-ai")
    KB->>DB: Query active memories, rank composite relevance, enforce budget
    DB-->>KB: Candidate memories & metadata
    KB-->>AGY: Memory Capsule with Cursor's decisions & unfinished task (<memory_data> fenced)
    AGY->>AGY: Implements Redis token revocation in auth/blacklist.py
    AGY->>KB: update_memory(task_id, "Completed Redis blacklist...", agent_id="antigravity-ai")
    KB->>DB: Record Version 2 (immutable history) + semantic update link
    DB-->>KB: Verified version 2
    KB-->>AGY: Task marked complete
```

### Demonstration B: Google Antigravity AI $\to$ Cursor AI Handover

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant AGY as Google Antigravity (Agent 2)
    participant KB as Knowledge Brain MCP Server
    participant DB as Neon PostgreSQL (Live DB)
    participant Cursor as Cursor AI (Agent 1)

    User->>AGY: "Optimize PostgreSQL connection pooling"
    AGY->>AGY: Decides min_size=5, max_size=20, discovers Neon serverless 132ms latency
    AGY->>KB: compile_memory(dialogue, agent_id="antigravity-ai")
    KB->>DB: Store decisions & facts, provenance (source=antigravity-ai)
    Note over AGY: Antigravity session terminates.
    User->>Cursor: "Review our database performance"
    Cursor->>KB: generate_memory_capsule(task="Configure PostgreSQL pool settings", agent_id="cursor-ai")
    KB->>DB: Retrieve authorized memories, apply exponential recency decay
    DB-->>KB: Pool configuration and Neon latency facts
    KB-->>Cursor: Synthesized Memory Capsule delivered (<memory_data> fenced)
    Cursor->>Cursor: Instantly continues configuration with zero lost context
```

---

## 5. Security & Access Control Model

1. **Role-Based Agent Permissions (RBAC & ACLs):**
   - **`standard` Classification:** Author gets `can_read=True, can_write=True`; workspace wildcard (`*`) receives collaborative `can_read=True, can_write=True`. Both Cursor and Antigravity collaborate freely on shared tasks.
   - **`restricted` Classification:** Author gets exclusive read/write access. No wildcard permission is created. Queries by other agents are strictly blocked and filtered out from both `retrieve_memories` and `generate_memory_capsule`. Unauthorized update calls fail with `PermissionDenied`.
2. **Passive Data Wrapping:**
   - Every returned memory payload is enclosed in `<memory_data is_instruction="false">...</memory_data>` to prevent external or recalled memory text from being interpreted as LLM system commands or prompt injection.
3. **Malicious Injection Defanging:**
   - Candidate memories containing adversarial directives (e.g., `IGNORE ALL PREVIOUS INSTRUCTIONS`) are intercepted by `MemorySanitizer`, defanged with `[DEFANGED_INJECTION]`, and quarantined.

---

## 6. Live Automated Verification Results (Milestone 3.3)

Verification executed against the live Neon PostgreSQL database using `scripts/verify_dual_agent_continuity.py`:

| Verification Stage | Operation | Measured Latency | Verification Status |
| :--- | :--- | :--- | :--- |
| **Demo A: Handover 1** | Cursor compiles dialogue to Neon DB | 4,302.83 ms | **PASSED** (4 memories, source=cursor-ai) |
| **Demo A: Synthesis** | Antigravity retrieves Memory Capsule | 567.05 ms | **PASSED** (159 tokens, JWT decisions transferred) |
| **Demo A: Update** | Antigravity updates task to Version 2 | 1,174.53 ms | **PASSED** (Version 2 recorded in Neon DB) |
| **Demo B: Handover 2** | Antigravity compiles pool config to DB | 3,036.16 ms | **PASSED** (3 memories, source=antigravity-ai) |
| **Demo B: Synthesis** | Cursor retrieves Memory Capsule | 443.00 ms | **PASSED** (231 tokens, pool decisions transferred) |
| **Demo B: Retrieval** | Cursor direct memory retrieval | 452.87 ms | **PASSED** (6 active memories retrieved) |
| **Security: Read ACL** | Antigravity blocked from Cursor restricted memory | < 5 ms | **PASSED** (Excluded from capsule & retrieval) |
| **Security: Write ACL** | Antigravity write blocked on Cursor restricted memory | < 5 ms | **PASSED** (`PermissionDenied` returned) |
| **Security: Injection** | Adversarial injection defanged & quarantined | < 5 ms | **PASSED** (Status `quarantined`, fenced) |

**Verification Result:** 100% Passed. Zero mock responses, zero Docker dependencies. Full multi-agent zero-copy continuity confirmed between Cursor AI and Google Antigravity.
