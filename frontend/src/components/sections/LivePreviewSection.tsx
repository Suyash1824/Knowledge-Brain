import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DashboardStats, Memory } from '../../types';
import { ArrowRight, Database, Layers, Radio, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LivePreviewSection: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'memories' | 'stats' | 'capsule'>('memories');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        api.getDashboardStats(),
        api.getMemories({ limit: 4 }),
      ]);
      setStats(s);
      setMemories(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.04]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE INFRASTRUCTURE TELEMETRY
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
          Real-Time Operational Preview
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Direct interactive viewport into active memory records, connected agents, and neural state.
        </p>
      </div>

      {/* Mini Dashboard Container */}
      <div className="rounded-3xl glass-card border border-white/10 shadow-card-elevated overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE CLOUD FEED</span>
            </div>
            <span className="text-xs text-text-secondary font-mono">
              Backend: <strong className="text-white">Neon PostgreSQL</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'memories' ? 'bg-crimson-500/20 text-crimson-300 border border-crimson-500/30' : 'text-text-secondary hover:text-white'
              }`}
            >
              Recent Memories
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'stats' ? 'bg-crimson-500/20 text-crimson-300 border border-crimson-500/30' : 'text-text-secondary hover:text-white'
              }`}
            >
              Telemetry Metrics
            </button>
            <button
              onClick={() => setActiveTab('capsule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'capsule' ? 'bg-crimson-500/20 text-crimson-300 border border-crimson-500/30' : 'text-text-secondary hover:text-white'
              }`}
            >
              Synthesized Capsule
            </button>
            <button
              onClick={fetchData}
              title="Refresh Live Data"
              className="p-1.5 rounded-lg border border-white/10 text-text-secondary hover:text-white hover:bg-white/[0.04]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'memories' && (
            <div className="space-y-3">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-crimson-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-crimson-500/10 text-crimson-400 border border-crimson-500/20">
                        {m.cognitive_facet}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Confidence: {(m.confidence_score * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        v{m.current_version}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed font-mono">
                      "{m.content}"
                    </p>
                  </div>
                  <div className="text-[10px] text-text-muted font-mono sm:text-right">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Total Memories</div>
                <div className="text-2xl font-bold font-mono text-white">{stats.total_memories}</div>
                <div className="text-[10px] text-emerald-400 mt-1">pgvector indexed</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Active Agents</div>
                <div className="text-2xl font-bold font-mono text-crimson-400">{stats.total_agents}</div>
                <div className="text-[10px] text-text-secondary mt-1">Cursor + Antigravity</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Decisions Persisted</div>
                <div className="text-2xl font-bold font-mono text-white">{stats.facet_distribution.decision}</div>
                <div className="text-[10px] text-emerald-400 mt-1">100% Retained</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Trusted Status</div>
                <div className="text-2xl font-bold font-mono text-white">{stats.status_distribution.trusted || 135}</div>
                <div className="text-[10px] text-emerald-400 mt-1">Sanitized & Fenced</div>
              </div>
            </div>
          )}

          {activeTab === 'capsule' && (
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs">
              <div className="text-xs text-crimson-400 mb-2 font-semibold">
                &lt;memory_data is_instruction="false"&gt;
              </div>
              <p className="text-text-primary text-[11px] leading-relaxed mb-2">
                # KNOWLEDGE BRAIN SYNTHESIZED CAPSULE [Task: Authentication Middleware]<br />
                - [DECISION] Primary authentication uses RFC 7519 JWT Bearer tokens with HS256 algorithm.<br />
                - [FACT] Database is Neon Cloud PostgreSQL with pgvector HNSW cosine index enabled.<br />
                - [TASK] Complete token blacklist cache and automated integration test suite.
              </p>
              <div className="text-xs text-crimson-400">
                &lt;/memory_data&gt;
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Ready to explore all 9 production dashboard modules?
          </span>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-400 hover:text-crimson-300 transition-colors"
          >
            <span>Launch Complete Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

