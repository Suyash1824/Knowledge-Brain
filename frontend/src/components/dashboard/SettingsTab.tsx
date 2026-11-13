import React, { useState } from 'react';
import { api } from '../../services/api';
import { Settings, Key, Database, Sliders, Check, Shield, Lock, Terminal } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [tokenInput, setTokenInput] = useState(api.getToken() || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // pgvector params
  const [hnswM, setHnswM] = useState(16);
  const [efConstruction, setEfConstruction] = useState(64);
  const [efSearch, setEfSearch] = useState(40);

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    api.setToken(tokenInput.trim() || null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const res = await api.login(email, password);
      setTokenInput(res.access_token);
      setAuthStatus(`Authenticated as ${res.user.email} (Role: ${res.user.role})`);
    } catch (err: any) {
      setAuthStatus(`Auth error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            <span className="text-xs font-mono text-crimson-400 uppercase tracking-wider font-semibold">
              Infrastructure Control Plane
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">System Settings & Authentication</h2>
          <p className="text-xs text-text-secondary mt-1">
            Manage JWT access tokens, database connection vectors, and client parameters.
          </p>
        </div>
      </div>

      {/* Section 1: Authentication */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
          <Key className="w-4 h-4 text-crimson-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            RFC 7519 JWT Bearer Authentication
          </h3>
        </div>

        {authStatus && (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-text-primary">
            {authStatus}
          </div>
        )}

        <form onSubmit={handleLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (bcrypt 12)"
            className="p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all cursor-pointer"
          >
            Authenticate / Login
          </button>
        </form>

        <form onSubmit={handleSaveToken} className="pt-2 space-y-2">
          <label className="text-xs font-mono text-text-secondary uppercase block">
            Manual Bearer Access Token Override
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="flex-1 p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{savedSuccess ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: pgvector HNSW Parameters */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Neon pgvector HNSW Hyperparameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>m (Max Edges)</span>
              <span className="text-white font-bold">{hnswM}</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={hnswM}
              onChange={(e) => setHnswM(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>ef_construction</span>
              <span className="text-white font-bold">{efConstruction}</span>
            </div>
            <input
              type="range"
              min="32"
              max="256"
              value={efConstruction}
              onChange={(e) => setEfConstruction(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
              <span>ef_search</span>
              <span className="text-white font-bold">{efSearch}</span>
            </div>
            <input
              type="range"
              min="10"
              max="128"
              value={efSearch}
              onChange={(e) => setEfSearch(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

