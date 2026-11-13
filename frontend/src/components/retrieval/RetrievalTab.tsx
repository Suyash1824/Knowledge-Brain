import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../api/client';
import { HierarchicalCapsule } from '../../types';

export const RetrievalTab: React.FC = () => {
  const [query, setQuery] = useState('What is our frontend tooling and port?');
  const [depth, setDepth] = useState<'auto' | 'experience' | 'context' | 'knowledge' | 'all'>('auto');
  const [maxTokens, setMaxTokens] = useState<number>(400);
  const [agentId, setAgentId] = useState('antigravity-ai');
  const [loading, setLoading] = useState(false);
  const [capsule, setCapsule] = useState<HierarchicalCapsule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.retrieveHierarchical({
        query,
        depth,
        agent_id: agentId,
        max_tokens: maxTokens,
      });
      setCapsule(res);
    } catch (err: any) {
      setError(err.message || 'Retrieval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!capsule) return;
    navigator.clipboard.writeText(capsule.capsule_data_wrapped);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleQueries = [
    { text: 'what were the exact raw logs from the test run?', label: 'Tactical (L1 Experience)' },
    { text: 'what is the active status and blocking issues of current tasks?', label: 'Contextual (L2 Context)' },
    { text: 'what are the core architectural invariants and patterns?', label: 'Invariants (L3 Knowledge)' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Search className="w-5 h-5 text-indigo-400" />
          <span>Depth-Aware Hierarchical Retrieval & Memory Capsules</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Analyzes query intent to dynamically retrieve from Level 1, Level 2, or Level 3 memory tiers. Packages memories into defensive, token-budgeted capsules.
        </p>
      </div>

      {/* Query Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Intent Presets:</span>
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(q.text);
              setDepth('auto');
            }}
            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs transition"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Retrieval Controls */}
      <form onSubmit={handleRetrieve} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or enter retrieval query..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Sliders and Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Depth Routing */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Depth Tier Selection</span>
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="auto">Auto (Depth Intent Detection)</option>
              <option value="experience">Level 1: Experience Only</option>
              <option value="context">Level 2: Context Only</option>
              <option value="knowledge">Level 3: Knowledge Only</option>
              <option value="all">Multi-Tier Cross Synthesis</option>
            </select>
          </div>

          {/* Token Budget */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Token Budget</span>
              </span>
              <span className="font-mono text-indigo-400">{maxTokens} tokens</span>
            </div>
            <input
              type="range"
              min={50}
              max={1500}
              step={25}
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg mt-2"
            />
          </div>

          {/* Querying Agent */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Agent Perspective</span>
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="antigravity-ai">Google Antigravity AI</option>
              <option value="cursor-ai">Cursor AI</option>
              <option value="mcp-agent">Generic MCP Client</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Capsule...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Retrieve Memory Capsule</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Capsule Output */}
      {capsule && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/30 space-y-5">
          {/* Header Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">Synthesized Memory Capsule</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Depth: {capsule.determined_depth}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Budget: {capsule.total_tokens} / {capsule.token_budget} tokens used
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Passive Containment Fenced</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Capsule'}</span>
              </button>
            </div>
          </div>

          {/* Individual items included in capsule */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              Retrieved Items ({capsule.entries.length})
            </span>
            {capsule.entries.map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.hierarchy_level === 3
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : entry.hierarchy_level === 2
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      Level {entry.hierarchy_level}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 capitalize">
                      {entry.memory_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Relevance: {Math.round(entry.relevance_score * 100)}% ({entry.token_count} tokens)
                  </span>
                </div>
                <p className="text-xs text-slate-200">{entry.content}</p>
              </div>
            ))}
          </div>

          {/* Defensive XML Output Preview */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              Capsule Prompt Injection Guarded Payload
            </span>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
              {capsule.capsule_data_wrapped}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
