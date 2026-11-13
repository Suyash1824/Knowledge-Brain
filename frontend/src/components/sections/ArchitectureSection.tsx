import React from 'react';
import { Database, Network, ShieldCheck, Cpu, Terminal, ArrowDown, GitBranch } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.04]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
          SYSTEM TOPOLOGY
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
          Decoupled Multi-Store Architecture
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Built for high throughput, cryptographic auditability, and sub-second multi-agent retrieval over standard protocols.
        </p>
      </div>

      {/* Layered Architectural Blueprint */}
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Layer 1: Client & Ingestion Layer */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 hover:border-technical/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-technical uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Layer 1: Autonomous Agent & Client Ingestion
            </span>
            <span className="text-[10px] font-mono text-text-secondary bg-white/[0.03] px-2 py-0.5 rounded">
              Stdio JSON-RPC 2.0 / REST
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs">
              <div className="font-semibold text-white mb-0.5">Cursor AI IDE</div>
              <div className="text-[10px] text-text-secondary">.cursor/mcp.json</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs">
              <div className="font-semibold text-white mb-0.5">Google Antigravity AI</div>
              <div className="text-[10px] text-text-secondary">.agents/mcp_config.json</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs">
              <div className="font-semibold text-white mb-0.5">REST API Clients</div>
              <div className="text-[10px] text-text-secondary">FastAPI Bearer Tokens</div>
            </div>
          </div>
        </div>

        {/* Downward Pulse Indicator */}
        <div className="flex justify-center -my-2">
          <div className="w-6 h-6 rounded-full bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center text-crimson-400">
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>

        {/* Layer 2: Intelligence & Security Barrier */}
        <div className="p-5 rounded-2xl glass-card border border-crimson-500/30 shadow-crimson-subtle">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-crimson-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Layer 2: Intelligence Engine & Security Barrier
            </span>
            <span className="text-[10px] font-mono text-crimson-300 bg-crimson-500/10 px-2 py-0.5 rounded border border-crimson-500/20">
              Zero Trust Passive Fencing
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Memory Compiler</div>
              <div className="text-[10px] text-text-secondary">5 Facet Extractor</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Conflict Detector</div>
              <div className="text-[10px] text-text-secondary">Contradiction Engine</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Security Sanitizer</div>
              <div className="text-[10px] text-text-secondary">Prompt Defanging</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Capsule Synthesizer</div>
              <div className="text-[10px] text-text-secondary">Multi-Factor Ranking</div>
            </div>
          </div>
        </div>

        {/* Downward Pulse Indicator */}
        <div className="flex justify-center -my-2">
          <div className="w-6 h-6 rounded-full bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center text-crimson-400">
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>

        {/* Layer 3: Dual Relationship & Storage Engine */}
        <div className="p-5 rounded-2xl glass-card border border-white/10 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Layer 3: Neon Cloud PostgreSQL & pgvector Engine
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              10 Domain Tables • HNSW Cosine Index
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Memory Dependencies</div>
              <div className="text-[10px] text-text-secondary">Strict DAG (Cycle Rejected)</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Semantic Links</div>
              <div className="text-[10px] text-text-secondary">Associative & Update Graph</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div className="font-semibold text-white mb-0.5">Cryptographic Audit</div>
              <div className="text-[10px] text-text-secondary">SHA-256 Cascade Receipts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

