import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Search,
  Network,
  AlertTriangle,
  History,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'hierarchy'
  | 'ingest'
  | 'retrieval'
  | 'graph'
  | 'conflicts'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const navItems: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'hierarchy', label: 'Hierarchical Explorer', icon: Layers, badge: 'L1/L2/L3' },
  { id: 'ingest', label: 'Runtime Ingestion', icon: Sparkles },
  { id: 'retrieval', label: 'Depth Retrieval', icon: Search },
  { id: 'graph', label: 'Knowledge Graph', icon: Network },
  { id: 'conflicts', label: 'Conflict Engine', icon: AlertTriangle },
  { id: 'audit', label: 'Cascade Forgetting', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between py-6">
      <div className="space-y-1 px-3">
        <div className="px-3 pb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Memory Architecture
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hierarchy Legend */}
      <div className="px-6 py-4 mx-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Memory Tiers
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
            <span className="text-slate-300 font-medium">Level 1: Experience</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
            <span className="text-slate-300 font-medium">Level 2: Context</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-300 font-medium">Level 3: Knowledge</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
