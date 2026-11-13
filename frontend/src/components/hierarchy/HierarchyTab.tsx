import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '../../api/client';
import { MemoryItem, HierarchyLevel } from '../../types';
import { MemoryDetailModal } from './MemoryDetailModal';

interface HierarchyTabProps {
  initialLevel?: number;
}

export const HierarchyTab: React.FC<HierarchyTabProps> = ({ initialLevel }) => {
  const [levelFilter, setLevelFilter] = useState<number | 'all'>(initialLevel || 'all');
  const [facetFilter, setFacetFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await api.searchMemories(
          searchQuery,
          20,
          facetFilter !== 'all' ? facetFilter : undefined
        );
        let list = res.results.map((r) => r.memory);
        if (levelFilter !== 'all') {
          list = list.filter((m) => m.hierarchy_level === levelFilter);
        }
        setMemories(list);
      } else {
        const list = await api.listMemories({
          level: levelFilter !== 'all' ? (levelFilter as number) : undefined,
          memory_type: facetFilter !== 'all' ? facetFilter : undefined,
          limit: 50,
        });
        setMemories(list);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLevel) {
      setLevelFilter(initialLevel);
    }
  }, [initialLevel]);

  useEffect(() => {
    fetchMemories();
  }, [levelFilter, facetFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Hierarchical Memory Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Progressive 3-tier memory store: Experience (L1) → Context (L2) → Knowledge (L3).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchMemories}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'all', label: 'All Tiers' },
          { id: 1, label: 'Level 1: Experience', color: 'sky' },
          { id: 2, label: 'Level 2: Context', color: 'purple' },
          { id: 3, label: 'Level 3: Knowledge', color: 'emerald' },
        ].map((tier) => {
          const isActive = levelFilter === tier.id;
          return (
            <button
              key={tier.id.toString()}
              onClick={() => setLevelFilter(tier.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? tier.id === 1
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : tier.id === 2
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : tier.id === 3
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tier.label}
            </button>
          );
        })}
      </div>

      {/* Search & Facet Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="md:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory text, vector cosine similarity, or decisions..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>

        {/* Facet Select */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={facetFilter}
            onChange={(e) => setFacetFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer w-full font-medium"
          >
            <option value="all" className="bg-slate-900">All Facets</option>
            <option value="decision" className="bg-slate-900">Decisions</option>
            <option value="fact" className="bg-slate-900">Facts</option>
            <option value="preference" className="bg-slate-900">Preferences</option>
            <option value="task" className="bg-slate-900">Tasks</option>
            <option value="experience" className="bg-slate-900">Experiences</option>
          </select>
        </div>
      </div>

      {/* Memory Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center space-x-3 text-indigo-400">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Fetching hierarchical memories...</span>
          </div>
        </div>
      ) : memories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No memories match current filters</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching hierarchy levels, changing your facet filter, or ingesting a new event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((mem) => {
            const tierBadge =
              mem.hierarchy_level === 3
                ? { text: 'L3: Knowledge', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                : mem.hierarchy_level === 2
                ? { text: 'L2: Context', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
                : { text: 'L1: Experience', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };

            return (
              <div
                key={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tierBadge.style}`}>
                    {tierBadge.text}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                      {mem.memory_type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {Math.round(mem.confidence_score * 100)}%
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed font-sans">
                  {mem.content}
                </p>

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{new Date(mem.created_at).toLocaleDateString()}</span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition flex items-center space-x-1">
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Memory Detail Modal Drawer */}
      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onMemoryUpdated={() => {
          fetchMemories();
        }}
      />
    </div>
  );
};
