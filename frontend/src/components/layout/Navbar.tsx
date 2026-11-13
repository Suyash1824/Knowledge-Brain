import React, { useEffect, useState } from 'react';
import { Brain, Activity, ShieldCheck, Database, Cpu } from 'lucide-react';
import { api } from '../../api/client';
import { SystemHealth } from '../../types';

interface NavbarProps {
  currentAgent: string;
  onSelectAgent: (agent: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentAgent, onSelectAgent }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const check = async () => {
      const t0 = performance.now();
      try {
        const res = await api.getHealth();
        setHealth(res);
        setLatency(Math.round(performance.now() - t0));
      } catch (err) {
        setHealth(null);
        setLatency(null);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-white tracking-tight">Knowledge Brain</h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              v1.0.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Hierarchical AI Memory Infrastructure</p>
        </div>
      </div>

      {/* Central Telemetry Pills */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Backend Connectivity Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-2 h-2 rounded-full ${
                health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
              }`}
            />
            {health?.status === 'healthy' && (
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <span className="text-slate-300 font-medium">
            {health ? (health.status === 'healthy' ? 'Engine Online' : 'Connecting...') : 'Offline'}
          </span>
          {latency !== null && (
            <span className="text-slate-500 font-mono text-[11px] border-l border-slate-700 pl-2">
              {latency}ms
            </span>
          )}
        </div>

        {/* Database & pgvector badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>PostgreSQL 16</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-medium font-mono text-[11px]">pgvector 0.8.7</span>
        </div>

        {/* Security & Fencing status */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Data Fencing Active</span>
        </div>
      </div>

      {/* Agent Selector */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400">Active Agent:</span>
          <select
            value={currentAgent}
            onChange={(e) => onSelectAgent(e.target.value)}
            className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
          >
            <option value="antigravity-ai" className="bg-slate-900 text-slate-200">
              Google Antigravity
            </option>
            <option value="cursor-ai" className="bg-slate-900 text-slate-200">
              Cursor AI
            </option>
            <option value="mcp-agent" className="bg-slate-900 text-slate-200">
              MCP General Client
            </option>
          </select>
        </div>
      </div>
    </header>
  );
};
