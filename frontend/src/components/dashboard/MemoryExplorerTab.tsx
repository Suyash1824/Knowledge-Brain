import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CognitiveFacet, Memory, MemoryStatus } from '../../types';
import {
  Search,
  Filter,
  Plus,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Layers,
  Database
} from 'lucide-react';
import { CreateMemoryModal } from './CreateMemoryModal';

interface MemoryExplorerTabProps {
  onSelectMemory: (memory: Memory) => void;
}

export const MemoryExplorerTab: React.FC<MemoryExplorerTabProps> = ({ onSelectMemory }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacet, setSelectedFacet] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      if (useSemanticSearch && searchQuery.trim()) {
        const results = await api.searchMemories({
          query: searchQuery,
          cognitive_facet: selectedFacet === 'all' ? undefined : selectedFacet,
          limit: 30,
        });
        setMemories(results);
      } else {
        const results = await api.getMemories({
          cognitive_facet: selectedFacet === 'all' ? undefined : selectedFacet,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchQuery || undefined,
          limit: 50,
        });
        setMemories(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [selectedFacet, selectedStatus, useSemanticSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories();
  };

  const facets: Array<{ id: string; label: string; color?: string }> = [
    { id: 'all', label: 'All Facets' },
    { id: 'fact', label: 'Facts', color: '#10B981' },
    { id: 'decision', label: 'Decisions', color: '#E63946' },
    { id: 'task', label: 'Tasks', color: '#F59E0B' },
    { id: 'preference', label: 'Preferences', color: '#EC4899' },
    { id: 'experience', label: 'Experiences', color: '#657BFF' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Memory Explorer</span>
            <span className="text-xs font-mono font-normal text-text-muted px-2 py-0.5 rounded bg-white/[0.04]">
              {memories.length} records
            </span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Query, filter, and inspect verified cognitive entities across the persistence DAG.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
          <button
            onClick={fetchMemories}
            title="Refresh"
            className="p-2 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:bg-white/[0.04]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory records or semantic concepts..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono"
            />
          </div>

          {/* Semantic Search Toggle Pill */}
          <button
            type="button"
            onClick={() => setUseSemanticSearch(!useSemanticSearch)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all cursor-pointer ${
              useSemanticSearch
                ? 'bg-crimson-500/20 border-crimson-500 text-crimson-300 shadow-crimson-subtle'
                : 'bg-white/[0.03] border-white/10 text-text-secondary hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>pgvector Cosine Search: {useSemanticSearch ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Facet Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
          <span className="text-[11px] font-mono text-text-muted mr-1">Facets:</span>
          {facets.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFacet(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedFacet === f.id
                  ? 'bg-white/15 text-white border border-white/30 font-semibold'
                  : 'bg-white/[0.03] text-text-secondary hover:text-white border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memories Table List */}
      <div className="rounded-2xl glass-card border border-white/10 overflow-hidden shadow-card-elevated">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-black/40 text-text-muted font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Facet</th>
                <th className="py-3 px-4">Memory Content</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Importance</th>
                {useSemanticSearch && <th className="py-3 px-4">Similarity</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {memories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-mono">
                    No matching memory records found.
                  </td>
                </tr>
              ) : (
                memories.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMemory(m)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-crimson-500/10 text-crimson-400 border border-crimson-500/20 font-bold">
                        {m.cognitive_facet}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-primary max-w-md truncate group-hover:text-white transition-colors">
                      {m.content}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-text-secondary">
                      v{m.current_version}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-emerald-400">
                      {(m.confidence_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-white">
                      {(m.importance_score * 100).toFixed(0)}%
                    </td>
                    {useSemanticSearch && (
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-amber-400">
                        {m.similarity ? `${(m.similarity * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                    )}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMemory(m);
                        }}
                        className="p-1 rounded-md text-text-secondary hover:text-crimson-400 hover:bg-white/[0.04]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CreateMemoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMemoryCreated={fetchMemories}
      />
    </div>
  );
};

