import React from 'react';
import { ArrowRight, BrainCircuit, Cpu, Filter, Layers, Sparkles } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Capture',
      subtitle: 'Cognitive Ingestion & Sanitization',
      icon: Cpu,
      description:
        'AI agents save important architectural decisions, domain facts, user preferences, and unfinished tasks during active workflows.',
      details: [
        '5 Cognitive Facet classification',
        'Passive data fencing (<memory_data>)',
        'Prompt injection defanging',
      ],
      badge: 'Agent Turn Intercept',
    },
    {
      step: '02',
      title: 'Organize',
      subtitle: 'Knowledge Graph & Vector Embedding',
      icon: BrainCircuit,
      description:
        'Knowledge Brain compiles memory records, indexes 1,536-dimensional embeddings with pgvector HNSW, and validates DAG dependencies without cycles.',
      details: [
        'Non-destructive version increments',
        'Direct contradiction detection',
        'Strict DAG cycle rejection',
      ],
      badge: 'Neon PostgreSQL',
    },
    {
      step: '03',
      title: 'Retrieve',
      subtitle: 'Token-Efficient Memory Capsules',
      icon: Layers,
      description:
        'Authorized downstream agents receive dense, relevance-ranked Memory Capsules packed up to strict token budgets (<1500 tokens).',
      details: [
        'Multi-factor scoring (0.45 rel + 0.25 imp + 0.20 rec + 0.10 conf)',
        'Temporal expiration filtering',
        'Zero prompt bloat guarantee',
      ],
      badge: 'Cross-Agent Delivery',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.04]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-400" />
          PIPELINE ARCHITECTURE
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5">
          How Knowledge Brain Works
        </h2>
        <p className="text-base text-text-secondary leading-relaxed">
          From unstructured developer dialogue to mathematical vector graphs and token-budgeted memory capsules.
        </p>
      </div>

      {/* 3-Step Cards with Connecting Lines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connecting Line across desktop cards */}
        <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-crimson-500/20 via-crimson-500/40 to-crimson-500/20 -translate-y-12 z-0" />

        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="relative z-10 p-6 sm:p-7 rounded-2xl glass-card border border-white/10 hover:border-crimson-500/40 transition-all duration-300 shadow-card-elevated hover:shadow-crimson-glow group"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-2xl font-mono font-bold text-crimson-500 text-glow-crimson">
                  {item.step}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-text-secondary group-hover:text-crimson-300 group-hover:border-crimson-500/30 transition-colors">
                  {item.badge}
                </span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-crimson-500/10 border border-crimson-500/30 flex items-center justify-center text-crimson-400 mb-4 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-white transition-colors">
                {item.title}
              </h3>
              <div className="text-xs font-mono text-crimson-400 mb-3">
                {item.subtitle}
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-5">
                {item.description}
              </p>

              <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                {item.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson-500/60" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

