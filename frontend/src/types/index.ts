// Knowledge Brain — Universal AI Memory Infrastructure Type Definitions

export type CognitiveFacet = 'fact' | 'preference' | 'decision' | 'task' | 'experience';
export type MemoryStatus = 'trusted' | 'provisional' | 'quarantined' | 'revoked' | 'tombstone';
export type RelationshipCategory = 'dependency' | 'semantic';
export type DependencyType = 'depends_on' | 'derived_from' | 'conflicts_with';
export type SemanticLinkType = 'updates' | 'relates_to' | 'contradicts' | 'corroborates';

export interface User {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Conversation {
  id: string;
  title: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Memory {
  id: string;
  conversation_id: string;
  content: string;
  cognitive_facet: CognitiveFacet;
  confidence_score: number;
  importance_score: number;
  status: MemoryStatus;
  current_version: number;
  valid_until?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  similarity?: number; // Attached on semantic similarity search
}

export interface MemoryVersion {
  id: string;
  memory_id: string;
  version_number: number;
  content: string;
  change_reason?: string;
  created_at: string;
}

export interface MemorySource {
  id: string;
  memory_id: string;
  agent_id: string;
  turn_index: number;
  speaker: string;
  raw_text?: string;
  created_at: string;
}

export interface MemoryPermission {
  id?: string;
  memory_id: string;
  agent_id: string;
  can_read: boolean;
  can_write: boolean;
  classification_level: 'standard' | 'confidential' | 'restricted';
}

export interface AgentMetric {
  agent_id: string;
  name: string;
  description: string;
  total_permissions: number;
  read_access_count: number;
  write_access_count: number;
  accessible_memories?: number;
  status?: 'active' | 'idle' | 'syncing';
  last_active?: string;
}

export interface DashboardStats {
  total_memories: number;
  total_conversations: number;
  total_agents: number;
  facet_distribution: Record<CognitiveFacet, number>;
  status_distribution: Record<string, number>;
  connected_agents: Array<{
    agent_id: string;
    accessible_memories: number;
    read_count: number;
    write_count: number;
  }>;
  storage_backend: string;
}

export interface SystemHealth {
  status: string;
  database: {
    status: string;
    target: string;
  };
  mcp_server: string;
  supported_clients: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  cognitive_facet: CognitiveFacet;
  importance: number;
  status: MemoryStatus;
  color?: string;
  content?: string;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  category: RelationshipCategory;
  type: string;
  animated?: boolean;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface CompilationTurn {
  speaker: 'user' | 'assistant' | 'agent' | 'system';
  text: string;
}

export interface CompilationRequest {
  conversation_id?: string;
  turns: CompilationTurn[];
  source_agent: string;
}

export interface CompilationResponse {
  memories_extracted: Memory[];
  total_extracted: number;
  processing_time_ms: number;
  sanitization_applied: boolean;
}

export interface CapsuleRequest {
  task_description: string;
  agent_id: string;
  max_tokens?: number;
  conversation_id?: string;
}

export interface CapsuleMemoryItem {
  id: string;
  content: string;
  cognitive_facet: CognitiveFacet;
  composite_score: number;
  relevance: number;
  importance: number;
  recency: number;
  confidence: number;
  token_count: number;
}

export interface CapsuleResponse {
  capsule_text: string;
  token_count: number;
  max_tokens_budget: number;
  memories_included: CapsuleMemoryItem[];
  passive_wrapping_active: boolean;
  agent_id: string;
  generated_at: string;
}

export interface ConflictCheckRequest {
  new_content: string;
  cognitive_facet: CognitiveFacet;
  memory_id?: string;
}

export interface ConflictCheckResponse {
  conflict_detected: boolean;
  conflict_type?: 'direct_contradiction' | 'superseded_fact' | 'temporal_drift' | 'none';
  conflicting_memory_id?: string;
  conflicting_content?: string;
  confidence: number;
  recommended_action: 'update_version' | 'quarantine_new' | 'flag_user' | 'none';
  explanation: string;
}

export interface ForgettingRequest {
  memory_id: string;
  reason: string;
}

export interface ForgettingReceipt {
  request_id: string;
  target_memory_id: string;
  purged_target: boolean;
  affected_dependencies_count: number;
  invalidated_derived_nodes: string[];
  multi_store_verification: {
    relational_db: 'purged' | 'verified';
    pgvector_hnsw: 'scrubbed' | 'nullified';
    cache: 'evicted';
  };
  sha256_audit_hash: string;
  timestamp: string;
}

