import React, { useState } from 'react';
import {
  Brain,
  Search,
  Layers,
  History,
  AlertOctagon,
  Trash2,
  ShieldCheck,
  Share2,
  ArrowRight
} from 'lucide-react';

export const CapabilitiesSection: React.FC<{ onSelectCapability?: (id: string) => void }> = ({
  onSelectCapability,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const capabilities = [
    {
      id: 'compiler',
      title: 'Memory Compiler',
      facet: 'Multi-Facet NLP',
      icon: Brain,
      color: '#E63946',
      description:
        'Transforms raw conversation turns into structured cognitive entities categorized across Facts, Decisions, Tasks, Preferences, and Experiences.',
    },
    {
      id: 'semantic-search',
      title: 'Semantic Memory Search',
      facet: 'pgvector HNSW',
      icon: Search,
      color: '#657BFF',
      description:
        'Cosine similarity search across 1,536-dimensional normalized vector embeddings on Neon PostgreSQL with sub-10ms query execution.',
    },
    {
      id: 'capsules',
      title: 'Memory Capsules',
      facet: 'Token Efficient',
      icon: Layers,
      color: '#10B981',
      description:
        'Synthesizes compact, relevance-scored memories packed greedily under strict token caps to eradicate context window bloat.',
    },
    {
      id: 'versioning',
      title: 'Immutable Versioning',
      facet: 'Audit Trail',
      icon: History,
      color: '#F59E0B',
      description:
        'Non-destructive updates record historical versions, change rationale, and update edges without erasing historical context.',
    },
    {
      id: 'conflicts',
      title: 'Conflict Detection',
      facet: 'Contradiction AI',
      icon: AlertOctagon,
      color: '#EF4444',
      description:
        'Flags direct contradictions, superseded facts, and temporal schedule drifts before corrupt memory affects downstream agents.',
    },
    {
      id: 'forgetting',
      title: 'Dependency-Aware Forgetting',
      facet: 'Right-to-be-Forgotten',
      icon: Trash2,
      color: '#8B5CF6',
      description:
        'Traverses memory DAG dependencies, cascades deletions, nullifies derived vectors, and computes SHA-256 audit receipts.',
    },
    {
      id: 'security',
      title: 'Trust Classification',
      facet: 'Security Barrier',
      icon: ShieldCheck,
      color: '#3B82F6',
      description:
        'Classifies memories as Trusted, Provisional, or Quarantined. Defangs prompt injections and wraps content in passive tags.',
    },
    {
      id: 'graph',
      title: 'Knowledge Graph DAG',
      facet: 'Topology Engine',
      icon: Share2,
      color: '#EC4899',
      description:
        'Directed Acyclic Graph separating structural dependencies (strict cycle rejection) from semantic associative links.',
    },
  ];

  return (
    <section id="capabilities" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.04]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
          SYSTEM SPECIFICATION
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
          Engineered for Enterprise Intelligence
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Eight integrated intelligence modules powering true cross-session persistence and deterministic agent safety.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.id}
              onClick={() => {
                setSelectedIdx(idx);
                if (onSelectCapability) onSelectCapability(cap.id);
              }}
              className="p-5 rounded-2xl glass-card border border-white/10 hover:border-crimson-500/40 transition-all duration-300 shadow-card-elevated hover:shadow-crimson-glow cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${cap.color}15`,
                      borderColor: `${cap.color}35`,
                      color: cap.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-text-secondary border border-white/[0.06]">
                    {cap.facet}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-crimson-400 transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {cap.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-text-muted group-hover:text-text-primary transition-colors">
                <span className="font-mono">Explore Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

