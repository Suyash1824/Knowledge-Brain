import React, { useEffect, useState } from 'react';
import {
  Network,
  RefreshCw,
  Plus,
  ArrowRight,
  Layers,
  Info,
} from 'lucide-react';
import { api } from '../../api/client';
import { KnowledgeGraphData, GraphNode, GraphEdge } from '../../types';

export const KnowledgeGraphTab: React.FC = () => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // New relationship state
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState<'derives_from' | 'relates_to' | 'supersedes'>('derives_from');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getGraph();
      setGraphData(data);
      if (data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    setLinkLoading(true);
    setLinkMsg(null);
    try {
      // Direct call to relationship endpoint
      await fetch('http://localhost:8000/api/memories/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          target_id: targetId,
          relationship_type: relType,
        }),
      });
      setLinkMsg('Relationship created successfully!');
      fetchGraph();
    } catch (err: any) {
      setLinkMsg(`Failed: ${err.message}`);
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Knowledge Graph & Dependency DAG</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interconnected memory network across Experience, Context, and Knowledge tiers.
          </p>
        </div>

        <button
          onClick={fetchGraph}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Graph</span>
        </button>
      </div>

      {/* Main Grid: Visual Graph + Node Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Network Map */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[460px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Network Topology ({graphData.nodes.length} Nodes, {graphData.edges.length} Edges)
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-slate-400">L1 Experience</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-slate-400">L2 Context</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">L3 Knowledge</span>
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>Computing DAG layout...</span>
              </div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex h-80 items-center justify-center text-xs text-slate-500">
              No nodes found in the knowledge graph yet.
            </div>
          ) : (
            <div className="relative w-full h-[360px] my-3 flex items-center justify-center">
              {/* SVG Link lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {graphData.edges.map((edge, i) => {
                  const sIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                  const tIdx = graphData.nodes.findIndex((n) => n.id === edge.target);
                  if (sIdx === -1 || tIdx === -1) return null;
                  const total = graphData.nodes.length;
                  const x1 = 50 + 40 * Math.cos((2 * Math.PI * sIdx) / total);
                  const y1 = 50 + 40 * Math.sin((2 * Math.PI * sIdx) / total);
                  const x2 = 50 + 40 * Math.cos((2 * Math.PI * tIdx) / total);
                  const y2 = 50 + 40 * Math.sin((2 * Math.PI * tIdx) / total);
                  return (
                    <line
                      key={i}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                      strokeDasharray={edge.type === 'supersedes' ? '3,3' : 'none'}
                      opacity="0.4"
                    />
                  );
                })}
              </svg>

              {/* Positioned Node Pills */}
              {graphData.nodes.map((node, idx) => {
                const total = graphData.nodes.length;
                const angle = (2 * Math.PI * idx) / total;
                const radius = 38; // percent
                const left = 50 + radius * Math.cos(angle);
                const top = 50 + radius * Math.sin(angle);
                const isSelected = selectedNode?.id === node.id;

                const nodeColor =
                  node.level === 3
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                    : node.level === 2
                    ? 'border-purple-500 bg-purple-950/80 text-purple-300'
                    : 'border-sky-500 bg-sky-950/80 text-sky-300';

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition shadow-lg ${nodeColor} ${
                      isSelected ? 'ring-2 ring-white scale-110 z-20' : 'hover:scale-105 z-10'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span className="max-w-[120px] truncate">{node.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-[11px] text-slate-500 italic">
            Click on any node to view relational dependencies and provenance.
          </div>
        </div>

        {/* Selected Node Details & Create Link Panel */}
        <div className="space-y-6">
          {/* Selected Node Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Inspected Node</span>
            </h3>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedNode.level === 3
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : selectedNode.level === 2
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                    }`}
                  >
                    Level {selectedNode.level}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 capitalize">
                    {selectedNode.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Score: {Math.round(selectedNode.confidence * 100)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 leading-relaxed font-sans">
                  {selectedNode.label}
                </div>

                <div className="text-[10px] font-mono text-slate-500 truncate">
                  ID: {selectedNode.id}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Select a node to inspect details.</div>
            )}
          </div>

          {/* Create Relationship Form */}
          <form
            onSubmit={handleCreateRelationship}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs"
          >
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Link Memories (DAG Edge)</span>
            </h4>

            {linkMsg && (
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-300 text-[11px]">
                {linkMsg}
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold">Source Memory</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 mt-1"
                >
                  <option value="">Select source...</option>
                  {graphData.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.level}] {n.label.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold">Relationship Type</label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 mt-1"
                >
                  <option value="derives_from">derives_from (Causal Dependency)</option>
                  <option value="relates_to">relates_to (Contextual Association)</option>
                  <option value="supersedes">supersedes (Replaces Prior Fact)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold">Target Memory</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 mt-1"
                >
                  <option value="">Select target...</option>
                  {graphData.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.level}] {n.label.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={linkLoading || !sourceId || !targetId}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition mt-2"
            >
              {linkLoading ? 'Creating Edge...' : 'Create Relationship'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
