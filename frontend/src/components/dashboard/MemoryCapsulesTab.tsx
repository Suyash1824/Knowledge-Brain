import React, { useState } from 'react';
import { api } from '../../services/api';
import { CapsuleResponse } from '../../types';
import { Layers, Sparkles, Shield, Cpu, RefreshCw, Copy, Check, Terminal } from 'lucide-react';

export const MemoryCapsulesTab: React.FC = () => {
  const [taskDescription, setTaskDescription] = useState('Implement authentication endpoints and middleware');
  const [targetAgent, setTargetAgent] = useState('antigravity-ai');
  const [maxTokens, setMaxTokens] = useState(1500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [capsuleData, setCapsuleData] = useState<CapsuleResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;

    setIsGenerating(true);
    setCapsuleData(null);

    try {
      const res = await api.generateCapsule({
        task_description: taskDescription,
        agent_id: targetAgent,
        max_tokens: maxTokens,
      });
      setCapsuleData(res);
    } catch (err: any) {
      alert(`Capsule generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!capsuleData) return;
    navigator.clipboard.writeText(capsuleData.capsule_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            <span className="text-xs font-mono text-crimson-400 uppercase tracking-wider font-semibold">
              Context Synthesizer
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Memory Capsule Generator</h2>
          <p className="text-xs text-text-secondary mt-1">
            Packs relevance-scored memories greedily into strict token budgets for targeted downstream agents.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10">
            Formula: <span className="text-crimson-400">0.45R + 0.25I + 0.20T + 0.10C</span>
          </div>
        </div>
      </div>

      {/* Generator Controls and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <form onSubmit={handleGenerate} className="p-6 rounded-2xl glass-card border border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                Target Downstream Agent
              </label>
              <select
                value={targetAgent}
                onChange={(e) => setTargetAgent(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono"
              >
                <option value="antigravity-ai">Google Antigravity AI (Orchestrator)</option>
                <option value="cursor-ai">Cursor AI (IDE Agent)</option>
                <option value="generic-mcp">Generic MCP Client</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                Current Agent Task Description
              </label>
              <textarea
                rows={4}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono leading-relaxed"
                placeholder="e.g. Implement authentication endpoints..."
                required
              />
            </div>

            {/* Token Budget Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-text-secondary mb-2">
                <span>Max Token Budget Cap</span>
                <span className="text-crimson-400 font-bold">{maxTokens} tokens</span>
              </div>
              <input
                type="range"
                min="256"
                max="3000"
                step="64"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-crimson-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                <span>256 (Hyper-Dense)</span>
                <span>1500 (Standard)</span>
                <span>3000 (Extended)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-muted">
              Enforces &lt;memory_data is_instruction='false'&gt;
            </span>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Capsule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Capsule</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Capsule Output and Ranked Memories */}
        <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Synthesized Capsule Context</span>
                {capsuleData && (
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                    {capsuleData.token_count} / {capsuleData.max_tokens_budget} tokens
                  </span>
                )}
              </h3>

              {capsuleData && (
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono text-text-secondary hover:text-white flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-crimson-500 border-t-transparent animate-spin" />
                <div className="text-xs font-mono text-crimson-400 animate-pulse">
                  Ranking candidate memories by composite score & packing tokens...
                </div>
              </div>
            ) : !capsuleData ? (
              <div className="py-20 text-center text-text-muted text-xs font-mono border border-dashed border-white/10 rounded-xl">
                Ready to synthesize. Enter task description and click "Generate Capsule".
              </div>
            ) : (
              <div className="space-y-4">
                {/* Passive Data Wrapped Capsule Code Block */}
                <div className="p-4 rounded-xl bg-black/70 border border-white/10 font-mono text-xs text-text-primary overflow-x-auto max-h-56 leading-relaxed select-text">
                  <pre className="whitespace-pre-wrap">{capsuleData.capsule_text}</pre>
                </div>

                {/* Ranked Memories Breakdown */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-text-secondary uppercase">
                    Memories Converged in Capsule:
                  </div>
                  {capsuleData.memories_included.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-3">
                        <span className="text-[10px] font-mono text-crimson-400 font-bold mr-2 uppercase">
                          [{item.cognitive_facet}]
                        </span>
                        <span className="font-mono text-text-primary">{item.content}</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 shrink-0">
                        Score: {(item.composite_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-text-muted flex justify-between">
            <span>Isolation: Defensive Passive Fencing</span>
            <span>Delivery: stdio JSON-RPC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

