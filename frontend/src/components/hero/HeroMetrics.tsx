import React from 'react';
import { Database, Cpu, Zap, ShieldCheck } from 'lucide-react';

interface HeroMetricsProps {
  stats?: {
    total_memories?: number;
    active_agents?: number;
    storage?: string;
  };
}

export const HeroMetrics: React.FC<HeroMetricsProps> = ({ stats }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-2 sm:mt-3">
      <div className="p-3 md:p-3.5 rounded-2xl glass-card border border-white/10 shadow-card-elevated flex flex-wrap items-center justify-between gap-3 sm:gap-6 backdrop-blur-xl">
        {/* Left: Trust & Agents */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-background bg-technical/20 border border-technical/40 flex items-center justify-center text-[10px] font-mono text-technical font-bold">
              CR
            </div>
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-background bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center text-[10px] font-mono text-crimson-400 font-bold">
              AG
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <span>Dual Agent Continuity</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-text-secondary">Cursor AI & Google Antigravity</div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Stat 1: Engine */}
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-crimson-400" />
          <div>
            <div className="text-xs font-semibold text-text-primary">Neon PostgreSQL</div>
            <div className="text-[10px] text-text-secondary font-mono">pgvector HNSW</div>
          </div>
        </div>

        {/* Stat 2: Retention */}
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <div className="text-xs font-semibold text-text-primary">99.9%</div>
            <div className="text-[10px] text-text-secondary">Preservation</div>
          </div>
        </div>

        {/* Stat 3: Speed / Efficiency */}
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-technical" />
          <div>
            <div className="text-xs font-semibold text-text-primary">&lt;500ms</div>
            <div className="text-[10px] text-text-secondary">Capsule Synthesis</div>
          </div>
        </div>

        {/* Stat 4: Security */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <div className="text-xs font-semibold text-text-primary">RFC 7519</div>
            <div className="text-[10px] text-text-secondary font-mono">JWT + SHA-256</div>
          </div>
        </div>
      </div>
    </div>
  );
};
