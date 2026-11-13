/**
 * Knowledge Brain — Type-safe REST API Client
 */

import {
  MemoryItem,
  DashboardStats,
  HierarchicalStats,
  SystemHealth,
  HierarchicalCapsule,
  KnowledgeGraphData,
  AgentSummary,
  ConflictReport,
  DeletionVerification,
  LifecycleEvent,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(public status: number, public message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('kb_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `HTTP ${response.status} ${response.statusText}`;
    let errDetails;
    try {
      const errJson = await response.json();
      errMsg = errJson.message || errJson.detail || errMsg;
      errDetails = errJson;
    } catch {}
    throw new ApiError(response.status, errMsg, errDetails);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // 1. Telemetry & Stats
  getHealth: () => request<SystemHealth>('/health'),
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),
  getHierarchicalStats: () => request<HierarchicalStats>('/hierarchical/stats'),

  // 2. Memory CRUD & Explorer
  listMemories: (params?: {
    level?: number;
    memory_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.level) query.append('hierarchy_level', params.level.toString());
    if (params?.memory_type) query.append('memory_type', params.memory_type);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    const qs = query.toString();
    return request<MemoryItem[]>(`/memories${qs ? `?${qs}` : ''}`);
  },

  getMemory: (id: string) => request<MemoryItem>(`/memories/${id}`),

  createMemory: (data: {
    content: string;
    memory_type: string;
    conversation_id?: string;
    hierarchy_level?: number;
    status?: string;
    confidence_score?: number;
  }) =>
    request<MemoryItem>('/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMemory: (id: string, content: string, reason?: string) =>
    request<MemoryItem>(`/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content, change_reason: reason || 'User edit via dashboard' }),
    }),

  deleteMemory: (id: string) =>
    request<{ status: string }>(`/memories/${id}`, {
      method: 'DELETE',
    }),

  searchMemories: (query: string, limit: number = 10, facetFilter?: string) =>
    request<{ results: Array<{ memory: MemoryItem; similarity: number }> }>('/memories/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        limit,
        facet_filter: facetFilter && facetFilter !== 'all' ? facetFilter : undefined,
      }),
    }),

  getMemoryVersions: (id: string) => request<any[]>(`/memories/${id}/versions`),
  getMemoryProvenance: (id: string) => request<any[]>(`/memories/${id}/provenance`),
  getMemoryLifecycle: (id: string) => request<LifecycleEvent[]>(`/hierarchical/lifecycle/${id}`),

  // 3. Hierarchical Engine Endpoints
  ingestRuntimeEvent: (data: {
    raw_text: string;
    event_type?: string;
    agent_id?: string;
    conversation_id?: string;
    synchronous_promotion?: boolean;
  }) =>
    request<{
      experience_memory_id: string;
      content: string;
      hierarchy_level: number;
      extracted_candidates_count: number;
      candidates: any[];
    }>('/hierarchical/ingest', {
      method: 'POST',
      body: JSON.stringify({
        raw_text: data.raw_text,
        event_type: data.event_type || 'conversation_turn',
        agent_id: data.agent_id || 'user_agent',
        conversation_id: data.conversation_id || '00000000-0000-0000-0000-000000000001',
        synchronous_promotion: data.synchronous_promotion ?? false,
      }),
    }),

  retrieveHierarchical: (data: {
    query: string;
    depth?: 'auto' | 'experience' | 'context' | 'knowledge' | 'all';
    agent_id?: string;
    max_tokens?: number;
  }) =>
    request<HierarchicalCapsule>('/hierarchical/retrieve', {
      method: 'POST',
      body: JSON.stringify({
        query: data.query,
        depth: data.depth || 'auto',
        agent_id: data.agent_id || 'antigravity-ai',
        max_tokens: data.max_tokens || 400,
      }),
    }),

  promoteMemory: (id: string, targetLevel: 2 | 3, reason: string, promotedBy: string = 'dashboard_user') =>
    request<MemoryItem>(`/hierarchical/promote/${id}`, {
      method: 'POST',
      body: JSON.stringify({
        target_level: targetLevel,
        reason,
        promoted_by: promotedBy,
      }),
    }),

  demoteMemory: (id: string, targetLevel: 1 | 2, reason: string) =>
    request<MemoryItem>(`/hierarchical/demote/${id}`, {
      method: 'POST',
      body: JSON.stringify({
        target_level: targetLevel,
        reason,
      }),
    }),

  // 4. Graph & Agents
  getGraph: () => request<KnowledgeGraphData>('/graph'),
  listAgents: () => request<AgentSummary[]>('/agents'),

  // 5. Conflict & Quality
  detectConflicts: (existingContent: string, newContent: string) =>
    request<ConflictReport>('/compiler/detect-conflicts', {
      method: 'POST',
      body: JSON.stringify({
        existing_content: existingContent,
        new_content: newContent,
      }),
    }),

  // 6. Capsule Playground
  generateCapsule: (taskDescription: string, agentId: string = 'antigravity-ai', maxTokens: number = 800) =>
    request<{ capsule: string; metadata: any }>('/capsules/generate', {
      method: 'POST',
      body: JSON.stringify({
        task_description: taskDescription,
        agent_id: agentId,
        max_tokens: maxTokens,
      }),
    }),

  // 7. Forgetting & Receipts
  requestCascadeDeletion: (memoryId: string, reason: string) =>
    request<DeletionVerification>('/forgetting/request-deletion', {
      method: 'POST',
      body: JSON.stringify({
        memory_id: memoryId,
        reason,
      }),
    }),

  verifyDeletionReceipt: (requestId: string) =>
    request<DeletionVerification>(`/forgetting/verify/${requestId}`),
};
