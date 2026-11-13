import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '../../services/api';
import { KnowledgeGraphData } from '../../types';
import { Share2, RefreshCw, Layers, ShieldAlert, Filter, Plus, Info } from 'lucide-react';

export const KnowledgeGraphTab: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'dependency' | 'semantic'>('all');

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data: KnowledgeGraphData = await api.getKnowledgeGraph();

      // Convert backend nodes to ReactFlow nodes
      const rfNodes: Node[] = data.nodes.map((n, idx) => {
        // Arrange in a pleasing distributed circular/layered layout
        const angle = (idx / data.nodes.length) * Math.PI * 2;
        const radius = 220;
        const x = 360 + Math.cos(angle) * radius;
        const y = 260 + Math.sin(angle) * radius;

        return {
          id: n.id,
          position: { x, y },
          data: {
            label: (
              <div className="p-3 rounded-xl glass-card border border-white/20 text-xs shadow-card-elevated hover:border-crimson-500 transition-all max-w-[200px]">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-crimson-500/20 text-crimson-300 font-bold">
                    {n.cognitive_facet}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">
                    {(n.importance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-text-primary font-mono text-[11px] truncate">
                  {n.label}
                </div>
              </div>
            ),
            rawNode: n,
          },
          style: { background: 'transparent', border: 'none', padding: 0 },
        };
      });

      // Convert backend edges to ReactFlow edges
      const rfEdges: Edge[] = data.edges
        .filter((e) => edgeFilter === 'all' || e.category === edgeFilter)
        .map((e, idx) => ({
          id: e.id || `edge-${idx}`,
          source: e.source,
          target: e.target,
          animated: e.animated ?? e.category === 'dependency',
          style: {
            stroke: e.category === 'dependency' ? '#E63946' : '#657BFF',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: e.category === 'dependency' ? '#E63946' : '#657BFF',
          },
          label: e.type,
          labelStyle: { fill: '#92929B', fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#111114', fillOpacity: 0.8 },
        }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [edgeFilter]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data.rawNode);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            <span className="text-xs font-mono text-crimson-400 uppercase tracking-wider font-semibold">
              Topology & Dependency Graph
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Directed Acyclic Memory DAG</h2>
          <p className="text-xs text-text-secondary mt-1">
            Visualizes structural dependencies (strict cycle rejection) and semantic associative links.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Edge Filter Toggle */}
          <div className="p-1 rounded-xl bg-black/50 border border-white/10 flex items-center text-xs font-mono">
            <button
              onClick={() => setEdgeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                edgeFilter === 'all' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              All Edges
            </button>
            <button
              onClick={() => setEdgeFilter('dependency')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                edgeFilter === 'dependency' ? 'bg-crimson-500/20 text-crimson-400' : 'text-text-muted hover:text-white'
              }`}
            >
              Dependencies
            </button>
            <button
              onClick={() => setEdgeFilter('semantic')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                edgeFilter === 'semantic' ? 'bg-technical/20 text-technical' : 'text-text-muted hover:text-white'
              }`}
            >
              Semantic
            </button>
          </div>

          <button
            onClick={fetchGraph}
            title="Refresh graph"
            className="p-2 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:bg-white/[0.04]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Canvas and Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ReactFlow Interactive Canvas */}
        <div className="lg:col-span-3 h-[560px] rounded-2xl glass-card border border-white/10 overflow-hidden relative shadow-card-elevated">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#16161D" gap={18} size={1} />
            <Controls />
          </ReactFlow>

          {nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="p-4 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-text-muted text-center max-w-sm">
                No graph entities found in current scope. Ingest or compile memories to visualize relational DAG links.
              </div>
            </div>
          )}

          {/* Canvas Floating Legend */}
          <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-crimson-500" />
              <span className="text-text-secondary">Dependency Edge (Cycle-Checked)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-technical" />
              <span className="text-text-secondary">Semantic Link (Updates / Relates)</span>
            </div>
          </div>
        </div>

        {/* Right: Node Inspector Drawer */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Info className="w-4 h-4 text-crimson-400" />
              <span>Node Inspector</span>
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Click any node in the graph to inspect metadata and connected edges.
            </p>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-crimson-500/10 text-crimson-400 font-bold">
                      {selectedNode.cognitive_facet}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Importance: {(selectedNode.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{selectedNode.label}</h4>
                  <p className="text-xs text-text-secondary font-mono leading-relaxed">
                    "{selectedNode.content || selectedNode.label}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono space-y-1 text-text-secondary">
                  <div className="flex justify-between">
                    <span>Node ID:</span>
                    <span className="text-white">{selectedNode.id.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400">{selectedNode.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs font-mono text-text-muted border border-dashed border-white/10 rounded-xl">
                No node selected. Click a node in the graph canvas.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-text-muted">
            DAG Integrity: Cycle-Free (Validated)
          </div>
        </div>
      </div>
    </div>
  );
};

