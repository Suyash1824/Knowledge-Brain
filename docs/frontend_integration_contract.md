# Knowledge Brain — Frontend Integration Contract (Frozen Specification)

**Status:** **FROZEN & RATIFIED**  
**API Version:** `1.0.0`  
**Backend Host:** `http://localhost:8000`  
**Frontend Host:** `http://localhost:5173` (Vite Dev Server)  
**Authentication Standard:** RFC 6750 Bearer JWT (`Authorization: Bearer <access_token>`)  
**CORS Allowed Origins:** `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`  
**Architecture Policy:** Schema and core ingestion/retrieval architecture are locked. No backend modifications will occur during frontend development unless a genuine blocking bug is discovered.

---

## 1. Core Endpoints & Route Definitions

| Method | Endpoint Path | Functionality | Request Type | Response Type | Protected |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | System health & pgvector status | None | `SystemHealthResponse` | No |
| `GET` | `/api/dashboard/stats` | Aggregated metrics & facet stats | None | `DashboardStatsResponse` | No |
| `GET` | `/api/hierarchical/stats` | Hierarchy L1/L2/L3 counts | None | `HierarchicalStatsResponse`| No |
| `POST` | `/api/auth/register` | User signup | `UserRegisterRequest` | `UserProfileResponse` | No |
| `POST` | `/api/auth/login` | User login (returns JWT token) | `UserLoginRequest` | `TokenResponse` | No |
| `GET` | `/api/auth/me` | Current user profile | None | `UserProfileResponse` | **Yes** |
| `GET` | `/api/memories` | Paginated & filtered memory list | Query params | `List[MemoryResponse]` | No |
| `POST` | `/api/memories` | Create standalone memory | `MemoryCreate` | `MemoryResponse` | No |
| `GET` | `/api/memories/{id}` | Single memory details | Path param | `MemoryResponse` | No |
| `PUT` | `/api/memories/{id}` | Edit memory content (versioned) | `MemoryUpdateRequest` | `MemoryResponse` | No |
| `DELETE`| `/api/memories/{id}` | Remove memory record | Path param | `{"status": "deleted"}` | No |
| `POST` | `/api/memories/search` | Full-text & pgvector cosine search | `MemorySearchRequest` | `MemorySearchResponse` | No |
| `GET` | `/api/memories/{id}/versions` | Version timeline history | Path param | `List[MemoryVersionResponse]` | No |
| `GET` | `/api/memories/{id}/provenance` | Source evidence & agents | Path param | `List[MemorySourceResponse]` | No |
| `GET` | `/api/memories/{id}/relationships`| Connected graph edges | Path param | `List[RelationshipResponse]` | No |
| `POST` | `/api/memories/relationships` | Link memories (derives_from, etc.) | `RelationshipCreateRequest` | `RelationshipResponse` | No |
| `GET` | `/api/graph` | Full Knowledge Graph (nodes/edges)| Query params | `KnowledgeGraphResponse` | No |
| `GET` | `/api/agents` | Registered AI agents & permission counts | None | `List[AgentSummaryResponse]`| No |
| `GET` | `/api/memories/{id}/permissions` | Memory ACL permissions | Path param | `List[MemoryPermissionResponse]` | No |
| `POST` | `/api/memories/{id}/permissions`| Grant agent ACL permission | `MemoryPermissionCreateRequest` | `MemoryPermissionResponse` | No |
| `POST` | `/api/hierarchical/ingest` | Ingest raw event into L1 Experience | `RuntimeEventIngestRequest` | `RuntimeEventIngestResponse` | No |
| `POST` | `/api/hierarchical/retrieve` | Depth-aware multi-tier retrieval | `HierarchicalRetrieveRequest` | `HierarchicalCapsuleResponse` | No |
| `POST` | `/api/hierarchical/promote/{id}` | Promote memory (L1->L2 or L2->L3)| `MemoryPromoteRequest` | `MemoryResponse` | No |
| `POST` | `/api/hierarchical/demote/{id}` | Demote memory down hierarchy | `MemoryDemoteRequest` | `MemoryResponse` | No |
| `GET` | `/api/hierarchical/lifecycle/{id}`| Lifecycle promotion/demotion trail | Path param | `List[LifecycleEventResponse]` | No |
| `POST` | `/api/compiler/compile` | Compile dialogue turns to memories | `MemoryCompileInput` | `List[ExtractedMemoryItem]` | No |
| `POST` | `/api/compiler/detect-conflicts`| Detect semantic contradictions | `ConflictCheckRequest` | `ConflictReport` | No |
| `POST` | `/api/capsules/generate` | Synthesize token-budgeted capsule | `CapsuleQueryRequest` | `MemoryCapsuleResponse` | No |
| `POST` | `/api/forgetting/request-deletion`| Cascade deletion with tombstoning | `DeletionRequestCreate` | `DeletionVerificationResponse` | No |
| `GET` | `/api/forgetting/verify/{id}` | Verify SHA-256 cryptographic receipt | Path param | `DeletionVerificationResponse` | No |
| `POST` | `/api/mcp/tools/call` | Call MCP tools via standard JSON-RPC | `MCPToolCallRequest` | `MCPToolCallResponse` | No |

---

## 2. Core TypeScript Schemas for Frontend Integration

### 2.1 Memory Object (`MemoryResponse`)
```typescript
export interface MemoryItem {
  id: string; // UUID
  conversation_id?: string | null;
  content: string;
  memory_type: 'fact' | 'preference' | 'decision' | 'task' | 'experience';
  status: 'trusted' | 'provisional' | 'quarantined' | 'revoked';
  confidence_score: number;
  importance_score: number;
  metadata: Record<string, any>;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
  
  // Hierarchical Fields
  hierarchy_level: 1 | 2 | 3; // 1: Experience, 2: Context, 3: Knowledge
  promotion_status?: string | null; // 'received', 'promoted', 'demoted'
  evidence_count?: number;
  quality_score?: number;
  promoted_at?: string | null;
  promoted_by?: string | null;
  parent_context_id?: string | null;
  superseded_by_id?: string | null;
}
```

### 2.2 Dashboard Stats (`DashboardStatsResponse`)
```typescript
export interface DashboardStats {
  total_memories: number;
  total_conversations: number;
  total_agents: number;
  total_verifications: number;
  facets: {
    fact: number;
    preference: number;
    decision: number;
    task: number;
    experience: number;
  };
  statuses: {
    trusted: number;
    provisional: number;
    quarantined: number;
    revoked: number;
  };
  top_agents: Array<{ agent_id: string; memory_count: number }>;
}
```

### 2.3 Hierarchical Stats (`HierarchicalStatsResponse`)
```typescript
export interface HierarchicalStats {
  level_1_experience: number;
  level_2_context: number;
  level_3_knowledge: number;
  total_memories: number;
  active_contexts: number;
  verified_knowledge: number;
}
```

### 2.4 Hierarchical Retrieval (`HierarchicalCapsuleResponse`)
```typescript
export interface HierarchicalCapsule {
  capsule_id: string;
  query: string;
  determined_depth: 'auto' | 'experience' | 'context' | 'knowledge' | 'multi_tier';
  total_tokens: number;
  token_budget: number;
  budget_exhausted: boolean;
  experience_items_count: number;
  context_items_count: number;
  knowledge_items_count: number;
  entries: Array<{
    memory_id: string;
    hierarchy_level: number;
    content: string;
    memory_type: string;
    status: string;
    relevance_score: number;
    token_count: number;
    source_agent?: string;
  }>;
  capsule_data_wrapped: string;
}
```

### 2.5 Knowledge Graph (`KnowledgeGraphResponse`)
```typescript
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  level: number;
  status: string;
  confidence: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'derives_from' | 'relates_to' | 'contradicts' | 'supersedes';
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

---

## 3. Frontend Architecture Plan

The frontend will be built inside `frontend/` using **React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons**:
1. **API Client (`src/api/client.ts`)**: Type-safe fetch client with JWT token management, automatic error handling, and latency tracking.
2. **Navigation & Shell (`src/components/layout/`)**:
   - Header: System status indicator (live health check to `/api/health`), user badge, quick agent switch.
   - Sidebar: Clean tab navigation (Overview, Hierarchical Explorer, Graph Visualizer, Ingestion Stream, Access Control, Capsule Playground, Audit & Deletion).
3. **Views**:
   - **Overview Dashboard**: KPI stat cards, Hierarchy Level Pyramid (L1 Experience $\to$ L2 Context $\to$ L3 Knowledge), Facet donut chart, Trust distribution.
   - **Hierarchical Explorer**: Filter by Tier (Level 1, 2, 3), Semantic + Vector Search bar, Memory cards with confidence & status pills, Detail drawer with version history and promotion audit trail.
   - **Ingestion & Compilation Stream**: Real-time event submitter for testing agent dialogue ingestion, candidate extraction review, and promotion controls.
   - **Knowledge Graph Visualizer**: Interactive Canvas/SVG node-link graph with tier-colored nodes and relationship edges.
   - **Capsule Playground**: Interactive depth-aware retriever with token budget slider, prompt injection containment viewer, and markdown formatter.
   - **Access Control & Agents**: Agent permission matrix (Cursor AI vs Antigravity AI) and confidential memory locks.
   - **Audit & Cryptographic Receipts**: Cascade deletion console with SHA-256 receipt inspection.
