import React from 'react';
import { ArrowRight, Bot, Sparkles, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CtaSection: React.FC = () => {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background ambient crimson burst */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-crimson-500/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto p-8 sm:p-14 rounded-3xl glass-card border border-crimson-500/30 text-center shadow-crimson-glow">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/30 text-crimson-300 text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-400 animate-pulse" />
          UNIVERSAL AI MEMORY INFRASTRUCTURE
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
          Give Your AI Agents <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-400 via-crimson-glow to-crimson-400">
            A Memory That Lasts.
          </span>
        </h2>

        <p className="text-base text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop repeating context. Connect Cursor AI, Google Antigravity, and autonomous agents to a persistent, unified intelligence layer backed by Neon Cloud PostgreSQL.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-crimson-600 to-crimson-glow hover:from-crimson-500 hover:to-crimson-400 transition-all duration-300 shadow-crimson-glow hover:shadow-crimson-strong group cursor-pointer"
          >
            <span>Enter Knowledge Brain</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            <Terminal className="w-4 h-4 text-crimson-400" />
            <span>Interactive API Docs</span>
          </a>
        </div>
      </div>
    </section>
  );
};

