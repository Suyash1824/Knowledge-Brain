import React, { useEffect, useState } from 'react';
import {
  Layers,
  Database,
  Brain,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bookmark,
  CheckSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api/client';
import { DashboardStats, HierarchicalStats } from '../../types';

interface OverviewTabProps {
  onNavigateToHierarchy: (level?: number) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateToHierarchy }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hierarchicalStats, setHierarchicalStats] = useState<HierarchicalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [s, hs] = await Promise.all([
          api.getDashboardStats(),
          api.getHierarchicalStats(),
        ]);
        setStats(s);
        setHierarchicalStats(hs);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-400">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Knowledge Brain telemetry...</span>
        </div>
      </div>
    );
  }

  const l1 = hierarchicalStats?.level_1_experience ?? 0;
  const l2 = hierarchicalStats?.level_2_context ?? 0;
  const l3 = hierarchicalStats?.level_3_knowledge ?? 0;
  const total = hierarchicalStats?.total_memories ?? (stats?.total_memories ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Hierarchical Memory Infrastructure</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Progressive Multi-Tier Agent Memory
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Separates raw conversational events (Level 1 Experience) from project situations (Level 2 Context) and validated invariants (Level 3 Knowledge). Raw chatter never pollutes permanent memory.
            </p>
          </div>
          <button
            onClick={() => onNavigateToHierarchy()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 whitespace-nowrap self-start md:self-auto"
          >
            <span>Explore Hierarchy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Memories */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Memories</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{total}</div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <span className="text-emerald-400 font-semibold">100%</span>
            <span>pgvector indexed</span>
          </div>
        </div>

        {/* Level 1 Experience */}
        <div
          onClick={() => onNavigateToHierarchy(1)}
          className="p-5 rounded-xl bg-slate-900/60 border border-sky-500/30 hover:border-sky-500/60 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-sky-400 text-xs font-medium">
            <span>L1: Experience</span>
            <span className="w-2 h-2 rounded-full bg-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{l1}</div>
          <div className="text-[11px] text-slate-400">Raw turns, logs & candidates</div>
        </div>

        {/* Level 2 Context */}
        <div
          onClick={() => onNavigateToHierarchy(2)}
          className="p-5 rounded-xl bg-slate-900/60 border border-purple-500/30 hover:border-purple-500/60 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium">
            <span>L2: Context</span>
            <span className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{l2}</div>
          <div className="text-[11px] text-slate-400">
            {hierarchicalStats?.active_contexts ?? 0} active task contexts
          </div>
        </div>

        {/* Level 3 Knowledge */}
        <div
          onClick={() => onNavigateToHierarchy(3)}
          className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>L3: Knowledge</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{l3}</div>
          <div className="text-[11px] text-slate-400">
            {hierarchicalStats?.verified_knowledge ?? 0} verified invariants
          </div>
        </div>
      </div>

      {/* Progressive Hierarchy Pyramid Visualization */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Progressive Memory Lifecycle Progression
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Promotion requires explicit quality gates, evidence verification, and immutable audit logs.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-medium bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Conditional Promotion Active</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Level 3 Knowledge Tier */}
          <div
            onClick={() => onNavigateToHierarchy(3)}
            className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-500/60 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs">
                L3
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">Knowledge Memory</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Highest Trust & Durability
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stable preferences, verified architectural decisions, core recurring patterns.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">{l3}</div>
              <div className="text-[10px] text-slate-400">promoted items</div>
            </div>
          </div>

          {/* Level 2 Context Tier */}
          <div
            onClick={() => onNavigateToHierarchy(2)}
            className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 hover:border-purple-500/60 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-xs">
                L2
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">Context Memory</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Project & Task Synthesis
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Active situations, decisions, milestones, and task dependency graphs.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400">{l2}</div>
              <div className="text-[10px] text-slate-400">active contexts</div>
            </div>
          </div>

          {/* Level 1 Experience Tier */}
          <div
            onClick={() => onNavigateToHierarchy(1)}
            className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 hover:border-sky-500/60 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 text-xs">
                L1
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">Experience Memory</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Transient Intake Stream
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Raw conversations, agent observations, tool traces, candidate extractions.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-sky-400">{l1}</div>
              <div className="text-[10px] text-slate-400">intake items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Telemetry: Facets & Trust */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cognitive Facets */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Cognitive Facet Distribution</span>
          </h4>
          <div className="space-y-2.5">
            {[
              { label: 'Decisions', key: 'decision', color: 'bg-indigo-500', icon: CheckSquare },
              { label: 'Facts', key: 'fact', color: 'bg-sky-500', icon: FileText },
              { label: 'Preferences', key: 'preference', color: 'bg-emerald-500', icon: Bookmark },
              { label: 'Tasks', key: 'task', color: 'bg-amber-500', icon: CheckCircle2 },
              { label: 'Experiences', key: 'experience', color: 'bg-purple-500', icon: Sparkles },
            ].map((facet) => {
              const val = (stats?.facets as any)?.[facet.key] ?? 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              const Icon = facet.icon;
              return (
                <div key={facet.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center space-x-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{facet.label}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {val} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${facet.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust & Status Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Trust & Verification Status</span>
          </h4>
          <div className="space-y-3">
            {[
              {
                status: 'trusted',
                label: 'Trusted / Verified',
                desc: 'Passed consistency and quality criteria',
                badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              },
              {
                status: 'provisional',
                label: 'Provisional',
                desc: 'Candidate fact awaiting confirmation',
                badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              },
              {
                status: 'quarantined',
                label: 'Quarantined',
                desc: 'Conflicting or low-confidence memory',
                badge: 'bg-red-500/10 text-red-400 border-red-500/20',
              },
              {
                status: 'revoked',
                label: 'Revoked / Tombstoned',
                desc: 'Cascade forgotten or superseded',
                badge: 'bg-slate-700/30 text-slate-400 border-slate-700',
              },
            ].map((st) => {
              const count = (stats?.statuses as any)?.[st.status] ?? 0;
              return (
                <div
                  key={st.status}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white">{st.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${st.badge}`}>
                        {count}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
