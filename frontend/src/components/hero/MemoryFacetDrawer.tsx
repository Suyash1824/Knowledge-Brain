import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CognitiveFacet, Memory } from '../../types';
import { X, Brain, Database, Shield, Bot, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MemoryFacetDrawerProps {
  facet: CognitiveFacet | 'agent-cursor' | 'agent-antigravity' | 'core' | null;
  onClose: () => void;
  onSelectMemory?: (memory: Memory) => void;
}

export const MemoryFacetDrawer: React.FC<MemoryFacetDrawerProps> = ({
  facet,
  onClose,
  onSelectMemory,
}) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!facet) return;

    if (facet === 'agent-cursor' || facet === 'agent-antigravity' || facet === 'core') {
      // Load all general memories for agent/core overview
      setLoading(true);
      api.getMemories({ limit: 6 })
        .then(setMemories)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      api.getMemories({ cognitive_facet: facet, limit: 8 })
        .then(setMemories)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [facet]);

  if (!facet) return null;

  const getFacetTitle = () => {
    switch (facet) {
      case 'fact': return 'Fact Memory Cluster';
      case 'decision': return 'Decision Memory Cluster';
      case 'task': return 'Task Memory Cluster';
      case 'preference': return 'Preference Memory Cluster';
      case 'experience': return 'Experience Memory Cluster';
      case 'agent-cursor': return 'Cursor AI Agent Client';
      case 'agent-antigravity': return 'Google Antigravity AI Orchestrator';
      case 'core': return 'Knowledge Brain Persistent Nucleus';
      default: return 'Memory Cluster';
    }
  };

  const getFacetDescription = () => {
    switch (facet) {
      case 'fact': return 'Verified domain truths, environment configurations, and static architectural facts stored in pgvector.';
      case 'decision': return 'Irreversible and critical technical agreements, schema choices, and design standards.';
      case 'task': return 'Pending, active, and completed action items tracked across decoupled agent sessions.';
      case 'preference': return 'User design preferences, styling guidelines, code formatting conventions, and persona constraints.';
      case 'experience': return 'Multi-agent latency benchmarks, error recovery patterns, and previous compilation lessons.';
      case 'agent-cursor': return 'IDE client connected over stdio JSON-RPC 2.0 with collaborative read/write permissions.';
      case 'agent-antigravity': return 'Autonomous orchestrator executing terminal workflows and synthesizing memory capsules.';
      case 'core': return 'Persistent neural repository backed by Neon Cloud PostgreSQL with 1,536-dimensional HNSW cosine index.';
      default: return '';
    }
  };

  const getFacetColor = () => {
    switch (facet) {
      case 'fact': return '#10B981';
      case 'decision': return '#E63946';
      case 'task': return '#F59E0B';
      case 'preference': return '#EC4899';
      case 'experience': return '#657BFF';
      case 'agent-cursor': return '#657BFF';
      case 'agent-antigravity': return '#E63946';
      case 'core': return '#FF334F';
      default: return '#E63946';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md sm:max-w-lg bg-[#0D0D11] border-l border-white/[0.08] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: getFacetColor() }}
            />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              {getFacetTitle()}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.04] text-text-secondary hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Bio */}
        <div className="p-5 border-b border-white/[0.06] bg-white/[0.01]">
          <p className="text-xs text-text-secondary leading-relaxed">
            {getFacetDescription()}
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span>Storage: Neon PostgreSQL</span>
            <span className="text-emerald-400 font-semibold">100% Retained</span>
          </div>
        </div>

        {/* Content Body: Records from Backend */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="text-[11px] font-mono uppercase text-text-secondary mb-2 flex items-center justify-between">
            <span>Live Stored Records ({memories.length}):</span>
            <span className="text-xs text-crimson-400 font-semibold">pgvector Indexed</span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-crimson-500 border-t-transparent animate-spin mx-auto" />
              <div className="text-xs font-mono text-text-muted">Querying neural store...</div>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-text-muted border border-dashed border-white/10 rounded-xl">
              No memories recorded in this facet yet.
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMemory && onSelectMemory(m)}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-crimson-500/40 transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span
                    className="uppercase px-1.5 py-0.5 rounded font-bold border"
                    style={{
                      backgroundColor: `${getFacetColor()}15`,
                      color: getFacetColor(),
                      borderColor: `${getFacetColor()}30`,
                    }}
                  >
                    {m.cognitive_facet}
                  </span>
                  <span className="text-emerald-400">
                    Confidence: {(m.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs font-mono text-text-primary group-hover:text-white transition-colors leading-relaxed">
                  "{m.content}"
                </p>
                <div className="text-[10px] text-text-muted font-mono flex items-center justify-between pt-1 border-t border-white/[0.04]">
                  <span>v{m.current_version} • {m.status}</span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-white/[0.08] bg-black/30 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-crimson-400 hover:text-crimson-300 flex items-center gap-1.5 font-mono"
          >
            <span>Open in Memory Explorer &rarr;</span>
          </Link>
          <span className="text-[10px] font-mono text-text-muted">
            Knowledge Brain v1.0
          </span>
        </div>
      </div>
    </div>
  );
};

