import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Brain,
  Cpu,
  Layers,
  Bot,
  Share2,
  AlertOctagon,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Terminal,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { SystemHealth } from '../../types';

export type DashboardTabId =
  | 'overview'
  | 'explorer'
  | 'compiler'
  | 'capsules'
  | 'agents'
  | 'graph'
  | 'conflicts'
  | 'security'
  | 'settings';

interface DashboardLayoutProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(console.error);
  }, []);

  const navItems: Array<{ id: DashboardTabId; label: string; icon: any; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Memory Explorer', icon: Brain, badge: 'Live' },
    { id: 'compiler', label: 'Memory Compiler', icon: Cpu },
    { id: 'capsules', label: 'Memory Capsules', icon: Layers },
    { id: 'agents', label: 'AI Agents', icon: Bot, badge: '2' },
    { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'conflicts', label: 'Conflict Center', icon: AlertOctagon },
    { id: 'security', label: 'Security & Audit', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#07070A] text-text-primary flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0A0D] border-b border-white/[0.08] sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-crimson-500/10 border border-crimson-500/30 flex items-center justify-center text-crimson-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 17.93V17a1 1 0 0 0-2 0v2.93A8 8 0 0 1 4.07 13H7a1 1 0 0 0 0-2H4.07A8 8 0 0 1 11 4.07V7a1 1 0 0 0 2 0V4.07A8 8 0 0 1 19.93 11H17a1 1 0 0 0 0 2h2.93A8 8 0 0 1 13 19.93z" />
            </svg>
          </div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            KNOWLEDGE <span className="text-crimson-500">BRAIN</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white/[0.04] text-text-secondary hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 transition-all duration-300 bg-[#0A0A0D] border-r border-white/[0.08] flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'left-0' : '-left-full md:left-0'}`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 min-w-[32px] rounded-lg bg-crimson-500/10 border border-crimson-500/30 flex items-center justify-center text-crimson-500">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 17.93V17a1 1 0 0 0-2 0v2.93A8 8 0 0 1 4.07 13H7a1 1 0 0 0 0-2H4.07A8 8 0 0 1 11 4.07V7a1 1 0 0 0 2 0V4.07A8 8 0 0 1 19.93 11H17a1 1 0 0 0 0 2h2.93A8 8 0 0 1 13 19.93z" />
                </svg>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase whitespace-nowrap">
                    KNOWLEDGE <span className="text-crimson-500">BRAIN</span>
                  </span>
                  <span className="text-[9px] text-text-muted font-mono">v1.0.0 • Infrastructure</span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1 rounded-md text-text-secondary hover:text-white hover:bg-white/[0.05]"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-crimson-500/15 text-white border border-crimson-500/30 shadow-crimson-subtle'
                      : 'text-text-secondary hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 min-w-[16px] transition-colors ${
                      isActive ? 'text-crimson-400' : 'text-text-muted group-hover:text-text-primary'
                    }`}
                  />
                  {!collapsed && (
                    <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-text-secondary">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: System Status */}
        <div className="p-3 border-t border-white/[0.06] bg-black/20">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Neon DB</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">FastAPI</span>
                <span className="text-text-muted font-mono text-[10px]">127.0.0.1:8000</span>
              </div>
              <Link
                to="/"
                className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-crimson-400 hover:text-crimson-300"
              >
                <span>&larr; View Landing Page</span>
              </Link>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#0A0A0D]/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white capitalize">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <span className="text-xs font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.03]">
              Workspace: Production
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.02]"
            >
              <Terminal className="w-3.5 h-3.5 text-crimson-400" />
              <span>Swagger UI</span>
              <ExternalLink className="w-3 h-3 text-text-muted" />
            </a>

            <div className="w-8 h-8 rounded-full bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center text-xs font-mono text-crimson-400 font-bold">
              KB
            </div>
          </div>
        </header>

        {/* Tab Viewport */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

