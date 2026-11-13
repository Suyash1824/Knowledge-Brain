import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, RefreshCw, Layers, ArrowRight } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'disconnected' | 'persistent'>('persistent');

  return (
    <section id="problem" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-crimson-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
          THE ARCHITECTURAL GAP
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
          Every New AI Session <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-400 to-crimson-glow">
            Shouldn't Start From Zero.
          </span>
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Modern AI agents are brilliant within single sessions, but suffer catastrophic context amnesia the moment a thread closes or an IDE switches. Critical decisions, schema agreements, and progress are lost forever.
        </p>
      </div>

      {/* Interactive Toggle */}
      <div className="flex justify-center mb-10">
        <div className="p-1 rounded-full bg-[#111114] border border-white/10 flex items-center gap-1 shadow-card-elevated">
          <button
            onClick={() => setActiveTab('disconnected')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'disconnected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Disconnected Sessions (Default)
          </button>
          <button
            onClick={() => setActiveTab('persistent')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'persistent'
                ? 'bg-crimson-600 text-white shadow-crimson-subtle'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <span>With Knowledge Brain</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left Column: Disconnected AI State */}
        <motion.div
          animate={{ opacity: activeTab === 'disconnected' ? 1 : 0.65, scale: activeTab === 'disconnected' ? 1.01 : 0.99 }}
          transition={{ duration: 0.3 }}
          className={`p-6 sm:p-8 rounded-2xl glass-card border transition-all ${
            activeTab === 'disconnected' ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Siloed & Ephemeral State</h3>
                <div className="text-xs text-rose-400/90 font-mono">Repeated Hallucinations & Context Loss</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              STATUS QUO
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-medium text-text-primary mb-1 flex items-center justify-between">
                <span>Session 1 (Cursor IDE)</span>
                <span className="text-[10px] text-text-secondary">Turn #42</span>
              </div>
              <p className="text-xs text-text-secondary">
                Architectural agreement: "We will migrate to RFC 7519 JWT Bearer tokens with HS256."
              </p>
            </div>

            <div className="flex justify-center">
              <div className="flex items-center gap-1 text-[11px] font-mono text-rose-400/80 bg-rose-500/5 px-3 py-1 rounded-full border border-rose-500/20">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Session Ends — RAM Cleared — Zero Memory Retained
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/[0.04] border border-rose-500/20">
              <div className="text-xs font-medium text-rose-300 mb-1 flex items-center justify-between">
                <span>Session 2 (Google Antigravity)</span>
                <span className="text-[10px] text-rose-400">Turn #1 (Starts from zero)</span>
              </div>
              <p className="text-xs text-rose-200/80">
                Agent hallucination: "Let's use session cookies with express-session." &rarr;
                <strong className="text-rose-400 ml-1">Silent architecture clash!</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Knowledge Brain Shared Intelligence */}
        <motion.div
          animate={{ opacity: activeTab === 'persistent' ? 1 : 0.65, scale: activeTab === 'persistent' ? 1.01 : 0.99 }}
          transition={{ duration: 0.3 }}
          className={`p-6 sm:p-8 rounded-2xl glass-card border transition-all ${
            activeTab === 'persistent' ? 'border-crimson-500/50 shadow-crimson-glow' : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-crimson-500/10 border border-crimson-500/30 flex items-center justify-center text-crimson-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Universal Knowledge Brain</h3>
                <div className="text-xs text-crimson-400 font-mono">Continuous Neural Memory Fabric</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crimson-500/20 text-crimson-300 border border-crimson-500/30">
              KNOWLEDGE BRAIN
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-medium text-text-primary mb-1 flex items-center justify-between">
                <span>Cursor AI Memory Compiler</span>
                <span className="text-[10px] text-emerald-400 font-mono">Status: Trusted</span>
              </div>
              <p className="text-xs text-text-secondary">
                Auto-extracts Decision: "JWT Bearer tokens HS256". Compiles 1536-dim vector & saves to Neon DB.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-crimson-300 bg-crimson-500/10 px-3.5 py-1 rounded-full border border-crimson-500/30 shadow-crimson-subtle">
                <Layers className="w-3 h-3 text-crimson-400" />
                Memory Capsule Generated in &lt;500ms • Zero Context Loss
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/30">
              <div className="text-xs font-medium text-emerald-300 mb-1 flex items-center justify-between">
                <span>Google Antigravity AI Handoff</span>
                <span className="text-[10px] text-emerald-400 font-mono">Verified Continuity</span>
              </div>
              <p className="text-xs text-emerald-200/90">
                Antigravity retrieves capsule: "Resuming JWT implementation from Cursor turn #42 without repeating work."
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

