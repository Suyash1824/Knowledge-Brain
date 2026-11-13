import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Check, Code, Play, RefreshCw, Shield, Sparkles } from 'lucide-react';

export const AgentEcosystemSection: React.FC = () => {
  const [handoverStage, setHandoverStage] = useState<0 | 1 | 2>(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    setHandoverStage(0);
    setTimeout(() => {
      setHandoverStage(1);
      setTimeout(() => {
        setHandoverStage(2);
        setIsSimulating(false);
      }, 1200);
    }, 1200);
  };

  return (
    <section id="ecosystem" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.04]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
          INTEROPERABILITY MATRIX
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
          Dual-Agent Zero-Copy Continuity
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Cursor AI and Google Antigravity operate as decoupled autonomous systems. Knowledge Brain provides the unified persistent memory layer over official Model Context Protocol (MCP) clients.
        </p>
      </div>

      {/* Interactive Handover Simulator Canvas */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 shadow-card-elevated relative overflow-hidden">
        {/* Simulator Controls Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
              MCP Continuity Pipeline (stdio JSON-RPC 2.0)
            </span>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle disabled:opacity-50 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating Handover...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Interactive Handover Test</span>
              </>
            )}
          </button>
        </div>

        {/* 3-Stage Visual Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8 items-center">
          {/* Node 1: Cursor AI */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 ${
              handoverStage === 0
                ? 'bg-technical/10 border-technical shadow-[0_0_25px_rgba(101,123,255,0.25)]'
                : 'bg-white/[0.02] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-technical/20 border border-technical/40 flex items-center justify-center text-technical font-mono font-bold text-xs">
                  CR
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Cursor AI (IDE Agent)</div>
                  <div className="text-[10px] text-technical font-mono">.cursor/mcp.json</div>
                </div>
              </div>
              {handoverStage >= 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Completes authentication refactor. Invokes <code className="text-technical font-mono text-[11px]">compile_memory</code> with decision & task status.
            </p>
            <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] font-mono text-[10px] text-text-secondary">
              <span className="text-technical">POST</span> /api/compiler/compile <br />
              payload: "JWT Bearer tokens standard"
            </div>
          </div>

          {/* Node 2: Knowledge Brain Central Core */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 relative ${
              handoverStage === 1
                ? 'bg-crimson-500/10 border-crimson-500 shadow-crimson-glow'
                : 'bg-white/[0.02] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center text-crimson-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Knowledge Brain Engine</div>
                  <div className="text-[10px] text-crimson-400 font-mono">Neon pgvector HNSW</div>
                </div>
              </div>
              {handoverStage >= 1 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Sanitizes passive fences, indexes 1,536-dim vector embedding, detects DAG dependencies, increments version to V2.
            </p>
            <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] font-mono text-[10px] text-emerald-400">
              Cosine similarity indexed (0.94 score) <br />
              Capsule synthesized: 142 tokens
            </div>
          </div>

          {/* Node 3: Google Antigravity */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 ${
              handoverStage === 2
                ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                : 'bg-white/[0.02] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                  AG
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Google Antigravity AI</div>
                  <div className="text-[10px] text-emerald-400 font-mono">.agents/mcp_config.json</div>
                </div>
              </div>
              {handoverStage >= 2 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Retrieves Memory Capsule in 567ms. Immediately continues implementing verified JWT middleware without repeating questions.
            </p>
            <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] font-mono text-[10px] text-text-secondary">
              <span className="text-emerald-400">GET</span> /api/capsules/generate <br />
              Context match: 100% | Zero Hallucinations
            </div>
          </div>
        </div>

        {/* Real Code / Stdio RPC Inspection Drawer */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs text-text-secondary">
          <div className="text-[11px] font-semibold text-text-primary mb-2 flex items-center justify-between">
            <span>Live Stdio Protocol Verification Receipt</span>
            <span className="text-emerald-400">Latency: 567ms • Status: 200 OK</span>
          </div>
          <pre className="overflow-x-auto text-emerald-300/90 text-[11px] leading-relaxed">
{`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "generate_memory_capsule",
    "arguments": {
      "task_description": "Implement authentication endpoints",
      "agent_id": "antigravity-ai",
      "max_tokens": 1500
    }
  },
  "result": {
    "capsule_text": "<memory_data is_instruction='false'>[DECISION #1] JWT Bearer Tokens HS256</memory_data>",
    "token_count": 142
  }
}`}
          </pre>
        </div>
      </div>
    </section>
  );
};

