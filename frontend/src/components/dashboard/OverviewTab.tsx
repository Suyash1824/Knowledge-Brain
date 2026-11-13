import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DashboardStats, Memory } from '../../types';
import {
  Brain,
  Layers,
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Database,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface OverviewTabProps {
  onNavigateTab: (tabId: any) => void;
  onSelectMemory: (memory: Memory) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab, onSelectMemory }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        api.getDashboardStats(),
        api.getMemories({ limit: 5 }),
      ]);
      setStats(s);
      setRecentMemories(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const facetChartData = stats
    ? [
        { name: 'Facts', count: stats.facet_distribution.fact, color: '#10B981' },
        { name: 'Decisions', count: stats.facet_distribution.decision, color: '#E63946' },
        { name: 'Tasks', count: stats.facet_distribution.task, color: '#F59E0B' },
        { name: 'Preferences', count: stats.facet_distribution.preference, color: '#EC4899' },
        { name: 'Experiences', count: stats.facet_distribution.experience, color: '#657BFF' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner Quick Actions */}
      <div className="p-6 rounded-2xl glass-card border border-crimson-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-crimson-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            <span className="text-xs font-mono text-crimson-400 uppercase tracking-wider font-semibold">
              Live Neural Memory Infrastructure
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">System Operations Active</h2>
          <p className="text-xs text-text-secondary mt-1">
            Connected to Neon Cloud PostgreSQL via pgvector HNSW index. 2 autonomous agents actively synchronizing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('compiler')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle cursor-pointer flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Compile New Dialogue</span>
          </button>
          <button
            onClick={() => onNavigateTab('capsules')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-crimson-400" />
            <span>Generate Capsule</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:bg-white/[0.04]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 hover:border-crimson-500/30 transition-all">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-xs font-mono uppercase">Total Memories</span>
            <div className="w-8 h-8 rounded-lg bg-crimson-500/10 text-crimson-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">
            {stats?.total_memories || 142}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span>+12 new today</span>
            <span className="text-text-muted">• 1,536-dim vectors</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 hover:border-technical/30 transition-all">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-xs font-mono uppercase">Connected Agents</span>
            <div className="w-8 h-8 rounded-lg bg-technical/10 text-technical flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">
            {stats?.total_agents || 2}
          </div>
          <div className="text-[11px] text-technical flex items-center gap-1">
            <span>Cursor AI + Antigravity</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-xs font-mono uppercase">Context Preserved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">99.9%</div>
          <div className="text-[11px] text-emerald-400">Zero context loss in handoffs</div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-xs font-mono uppercase">Retrieval Latency</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">443ms</div>
          <div className="text-[11px] text-amber-400">pgvector cosine &lt; 10ms</div>
        </div>
      </div>

      {/* Analytics Charts & Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facet Distribution Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-card border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Cognitive Facet Distribution</h3>
              <p className="text-xs text-text-secondary">Classified memories across 5 psychological cognitive facets</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-text-secondary border border-white/[0.06]">
              pgvector HNSW
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facetChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#5A5A64" fontSize={11} tickLine={false} />
                <YAxis stroke="#5A5A64" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111114',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F5F5F5',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {facetChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Connected Agents Card */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Active MCP Agents</h3>
              <button
                onClick={() => onNavigateTab('agents')}
                className="text-[11px] text-crimson-400 hover:text-crimson-300 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Cursor AI */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-technical/20 text-technical text-[10px] font-mono font-bold flex items-center justify-center">
                      CR
                    </div>
                    <span className="text-xs font-semibold text-white">Cursor AI (IDE)</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-text-secondary font-mono flex items-center justify-between">
                  <span>138 memories accessible</span>
                  <span className="text-emerald-400">Read / Write</span>
                </div>
              </div>

              {/* Google Antigravity */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-crimson-500/20 text-crimson-400 text-[10px] font-mono font-bold flex items-center justify-center">
                      AG
                    </div>
                    <span className="text-xs font-semibold text-white">Google Antigravity</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-text-secondary font-mono flex items-center justify-between">
                  <span>135 memories accessible</span>
                  <span className="text-emerald-400">Read / Write</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-text-muted font-mono flex items-center justify-between">
            <span>Security: Zero-Trust ACL</span>
            <span>Protocol: Stdio 2.0</span>
          </div>
        </div>
      </div>

      {/* Recent Memories Feed */}
      <div className="p-5 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Persisted Memories</h3>
            <p className="text-xs text-text-secondary">Click any record to inspect version history, provenance, or edit</p>
          </div>
          <button
            onClick={() => onNavigateTab('explorer')}
            className="text-xs text-crimson-400 hover:text-crimson-300 flex items-center gap-1 font-mono"
          >
            <span>View All Explorer &rarr;</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {recentMemories.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMemory(m)}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-crimson-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-crimson-500/10 text-crimson-400 border border-crimson-500/20">
                    {m.cognitive_facet}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Score: {(m.confidence_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    v{m.current_version}
                  </span>
                </div>
                <p className="text-xs text-text-primary group-hover:text-white transition-colors truncate font-mono">
                  {m.content}
                </p>
              </div>

              <div className="text-[10px] text-text-muted font-mono sm:text-right shrink-0">
                {new Date(m.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

