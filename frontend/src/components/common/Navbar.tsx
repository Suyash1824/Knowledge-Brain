import React from 'react';
import { ArrowRight, Activity, Terminal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  onOpenDashboard?: () => void;
  systemStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDashboard, systemStatus = 'healthy' }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/[0.06] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-crimson-500/10 border border-crimson-500/30 flex items-center justify-center text-crimson-500 group-hover:shadow-crimson-subtle transition-all duration-300">
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 17.93V17a1 1 0 0 0-2 0v2.93A8 8 0 0 1 4.07 13H7a1 1 0 0 0 0-2H4.07A8 8 0 0 1 11 4.07V7a1 1 0 0 0 2 0V4.07A8 8 0 0 1 19.93 11H17a1 1 0 0 0 0 2h2.93A8 8 0 0 1 13 19.93z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wider text-text-primary uppercase flex items-center gap-1 font-mono">
            KNOWLEDGE <span className="text-crimson-500 font-extrabold">BRAIN</span>
          </span>
        </Link>

        {/* Center Nav Links (Hidden on mobile) */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-text-secondary">
            <a href="#hero" className="hover:text-text-primary transition-colors">Home</a>
            <a href="#problem" className="hover:text-text-primary transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a>
            <a href="#ecosystem" className="hover:text-text-primary transition-colors">Ecosystem</a>
            <a href="#capabilities" className="hover:text-text-primary transition-colors">Capabilities</a>
            <a href="#architecture" className="hover:text-text-primary transition-colors">Architecture</a>
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3.5">
          {/* Real-time Health Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px]">Neon DB Connected</span>
          </div>

          {/* CTA Button */}
          {isDashboard ? (
            <Link
              to="/"
              className="text-xs font-medium text-text-secondary hover:text-white px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all"
            >
              Back to Landing
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-crimson-600 to-crimson-glow hover:from-crimson-500 hover:to-crimson-400 transition-all duration-300 shadow-crimson-glow hover:shadow-crimson-strong group cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

