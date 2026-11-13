/**
 * Knowledge Brain — Core Frontend TypeScript Type Definitions
 * Matches the frozen backend API specification.
 */

export type HierarchyLevel = 1 | 2 | 3;
export type MemoryType = 'fact' | 'preference' | 'decision' | 'task' | 'experience';
export type MemoryStatus = 'trusted' | 'provisional' | 'quarantined' | 'revoked';
export type DepthFilter = 'auto' | 'experience' | 'context' | 'knowledge' | 'all';

export interface MemoryItem {
  id: string;
  conversation_id?: string | null;
  content: string;
  memory_type: MemoryType;
  status: MemoryStatus;
  confidence_score: number;
  importance_score: number;
  metadata: Record<string, any>;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;

  // Hierarchical Memory Fields
  hierarchy_level: HierarchyLevel;
  promotion_status?: string | null;
  evidence_count?: number;
  quality_score?: number;
  promoted_at?: string | null;
  promoted_by?: string | null;
  parent_context_id?: string | null;
  superseded_by_id?: string | null;
}

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

export interface HierarchicalStats {
  level_1_experience: number;
  level_2_context: number;
  level_3_knowledge: number;
  total_memories: number;
  active_contexts: number;
  verified_knowledge: number;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  database: {
    status: string;
    pgvector_available: boolean;
    vector_extension?: string;
  };
}

export interface CapsuleEntry {
  memory_id: string;
  hierarchy_level: number;
  content: string;
  memory_type: string;
  status: string;
  relevance_score: number;
  token_count: number;
  source_agent?: string;
}

export interface HierarchicalCapsule {
  capsule_id: string;
  query: string;
  determined_depth: string;
  total_tokens: number;
  token_budget: number;
  budget_exhausted: boolean;
  experience_items_count: number;
  context_items_count: number;
  knowledge_items_count: number;
  entries: CapsuleEntry[];
  capsule_data_wrapped: string;
}

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

export interface AgentSummary {
  agent_id: string;
  name: string;
  description: string;
  total_permissions: number;
  read_access_count: number;
  write_access_count: number;
}

export interface ConflictReport {
  has_conflict: boolean;
  existing_memory_id?: string | null;
  existing_content?: string | null;
  conflicting_content?: string | null;
  conflict_type: string;
  confidence: number;
  recommended_action: string;
}

export interface DeletionVerification {
  request_id: string;
  target_memory_id: string;
  status: string;
  verification_hash: string;
  affected_memories_count: number;
  tombstoned_memories_count: number;
  stores_verified: {
    relational_db: boolean;
    pgvector_store: boolean;
    memory_cache: boolean;
  };
  timestamp: string;
}

export interface LifecycleEvent {
  id: string;
  memory_id: string;
  transition_type: string;
  from_level?: number | null;
  to_level?: number | null;
  reason?: string | null;
  triggered_by: string;
  metadata: Record<string, any>;
  created_at: string;
}
