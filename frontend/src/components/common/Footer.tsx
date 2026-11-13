import React from 'react';
import { Github, FileText, Terminal, Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#070709] py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson-500 shadow-[0_0_8px_#E63946]" />
            <span className="font-mono text-xs tracking-wider text-text-primary uppercase font-bold">
              KNOWLEDGE <span className="text-crimson-500">BRAIN</span>
            </span>
          </div>
          <p className="text-xs text-text-secondary max-w-sm text-center md:text-left">
            Universal AI Memory Infrastructure. Your AI agents may change. Their knowledge doesn't have to.
          </p>
        </div>

        {/* Real Links */}
        <div className="flex items-center gap-6 text-xs text-text-secondary">
          <a
            href="https://github.com/Suyash1824/Knowledge-Brain"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4 text-white" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3 text-text-muted" />
          </a>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4 text-crimson-400" />
            <span>FastAPI Swagger Docs</span>
            <ExternalLink className="w-3 h-3 text-text-muted" />
          </a>
          <div className="flex items-center gap-1.5 text-text-muted">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>MIT License</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-muted">
        <div>© 2026 Knowledge Brain Platform. Connected to Neon Cloud PostgreSQL (pgvector 0.8.7).</div>
        <div className="font-mono">Native Windows Execution • Zero Docker Overhead</div>
      </div>
    </footer>
  );
};

