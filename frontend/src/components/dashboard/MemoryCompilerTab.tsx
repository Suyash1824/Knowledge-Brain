import React, { useState } from 'react';
import { api } from '../../services/api';
import { CompilationTurn, Memory } from '../../types';
import { Brain, Sparkles, Cpu, Check, Play, RefreshCw, ShieldCheck } from 'lucide-react';

export const MemoryCompilerTab: React.FC = () => {
  const [turnsText, setTurnsText] = useState(
`user: We decided to deploy the primary database on Neon Cloud PostgreSQL with pgvector 0.8.7.
assistant: Understood. I will configure the connection pool with keepalives and build the HNSW index on the memory vectors.
user: Also ensure that Cursor AI and Google Antigravity have read and write permissions to collaborative memories.`
  );
  const [sourceAgent, setSourceAgent] = useState('cursor-ai');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResults, setCompiledResults] = useState<Memory[]>([]);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const loadSample = (type: 'cursor' | 'antigravity') => {
    if (type === 'cursor') {
      setSourceAgent('cursor-ai');
      setTurnsText(
`user: We decided to migrate authentication to RFC 7519 JWT Bearer tokens with HS256.
assistant: Implemented bcrypt 12-round password hashing and auth routers.
user: Don't forget to implement the Redis token blacklist in the next sprint.`
      );
    } else {
      setSourceAgent('antigravity-ai');
      setTurnsText(
`agent: Verified phase 2 intelligence engine with 10 passing tests.
user: We must maintain strict DAG cycle rejection in memory_dependencies.
agent: Configured cycle detector and updated schema migration.`
      );
    }
  };

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnsText.trim()) return;

    setIsCompiling(true);
    setCompiledResults([]);

    // Parse lines into CompilationTurn[]
    const lines = turnsText.split('\n').filter((l) => l.trim().length > 0);
    const turns: CompilationTurn[] = lines.map((line) => {
      const parts = line.split(':');
      if (parts.length > 1) {
        const speaker = parts[0].trim().toLowerCase();
        const text = parts.slice(1).join(':').trim();
        return {
          speaker: speaker === 'user' ? 'user' : 'assistant',
          text,
        };
      }
      return { speaker: 'user', text: line };
    });

    try {
      const res = await api.compileDialogue({
        turns,
        source_agent: sourceAgent,
      });

      setCompiledResults(res.memories_extracted);
      setProcessingTime(res.processing_time_ms);
    } catch (err: any) {
      alert(`Compilation failed: ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            <span className="text-xs font-mono text-crimson-400 uppercase tracking-wider font-semibold">
              Dialogue Cognitive Compiler
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Multi-Facet Memory Extraction</h2>
          <p className="text-xs text-text-secondary mt-1">
            Ingests developer conversations, extracts psychological cognitive facets, and assigns importance scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSample('cursor')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.02]"
          >
            Sample: Cursor Session
          </button>
          <button
            onClick={() => loadSample('antigravity')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-text-secondary hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.02]"
          >
            Sample: Antigravity Session
          </button>
        </div>
      </div>

      {/* Main Compiler Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Editor */}
        <form onSubmit={handleCompile} className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono text-text-secondary uppercase">
                Raw Dialogue / Conversation Turns
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted font-mono">Agent:</span>
                <select
                  value={sourceAgent}
                  onChange={(e) => setSourceAgent(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono"
                >
                  <option value="cursor-ai">cursor-ai</option>
                  <option value="antigravity-ai">antigravity-ai</option>
                  <option value="user-direct">user-direct</option>
                </select>
              </div>
            </div>

            <textarea
              rows={12}
              value={turnsText}
              onChange={(e) => setTurnsText(e.target.value)}
              className="w-full p-4 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-crimson-500"
              placeholder="Paste dialogue turns..."
              required
            />
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <div className="text-[11px] text-text-muted font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sanitization & Defanging Active</span>
            </div>

            <button
              type="submit"
              disabled={isCompiling}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling Facets...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compile Memory</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Compiled Records Output */}
        <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Extracted Cognitive Memories</span>
                {processingTime && (
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                    {processingTime}ms
                  </span>
                )}
              </h3>
              <span className="text-xs font-mono text-text-muted">
                {compiledResults.length} records extracted
              </span>
            </div>

            {isCompiling ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-crimson-500 border-t-transparent animate-spin" />
                <div className="text-xs font-mono text-crimson-400 animate-pulse">
                  Analyzing semantic intent & assigning facets...
                </div>
              </div>
            ) : compiledResults.length === 0 ? (
              <div className="py-20 text-center text-text-muted text-xs font-mono border border-dashed border-white/10 rounded-xl">
                Ready to compile. Click "Compile Memory" to extract structured knowledge.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {compiledResults.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-crimson-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-crimson-500/10 text-crimson-400 border border-crimson-500/20 font-bold">
                        {m.cognitive_facet}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-emerald-400">
                          Confidence: {(m.confidence_score * 100).toFixed(0)}%
                        </span>
                        <span className="text-white">
                          Importance: {(m.importance_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-text-primary leading-relaxed">
                      "{m.content}"
                    </p>
                    <div className="text-[10px] text-text-muted font-mono flex items-center justify-between pt-1 border-t border-white/[0.04]">
                      <span>Indexed to pgvector</span>
                      <span>v1 (immutable)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-text-muted flex justify-between">
            <span>Storage: Neon Cloud PostgreSQL</span>
            <span>Dimensions: 1,536-dim HNSW</span>
          </div>
        </div>
      </div>
    </div>
  );
};

