import React, { useState } from 'react';
import { api } from '../../services/api';
import { CognitiveFacet, ConflictCheckResponse } from '../../types';
import { AlertOctagon, ShieldAlert, CheckCircle, ArrowRight, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

export const ConflictCenterTab: React.FC = () => {
  const [newContent, setNewContent] = useState('We decided to migrate authentication to session cookies with express-session.');
  const [facet, setFacet] = useState<CognitiveFacet>('decision');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ConflictCheckResponse | null>(null);

  const loadSample = (type: 'contradiction' | 'drift' | 'clean') => {
    if (type === 'contradiction') {
      setFacet('decision');
      setNewContent('We decided to switch authentication from JWT tokens to session cookies.');
    } else if (type === 'drift') {
      setFacet('task');
      setNewContent('Sprint 3 deadline is postponed from Friday to next Wednesday.');
    } else {
      setFacet('fact');
      setNewContent('The application UI is developed using Vite, React 18, and Tailwind CSS.');
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsChecking(true);
    setResult(null);

    try {
      const res = await api.detectConflicts({
        new_content: newContent,
        cognitive_facet: facet,
      });
      setResult(res);
    } catch (err: any) {
      alert(`Conflict check failed: ${err.message}`);
    } finally {
      setIsChecking(false);
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
              Semantic Contradiction & Drift Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Conflict Detection Center</h2>
          <p className="text-xs text-text-secondary mt-1">
            Evaluates candidate facts and decisions against verified memories to prevent knowledge corruption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSample('contradiction')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-rose-300 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
          >
            Direct Contradiction
          </button>
          <button
            onClick={() => loadSample('drift')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
          >
            Temporal Drift
          </button>
          <button
            onClick={() => loadSample('clean')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
          >
            Clean Statement
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Sandbox */}
        <form onSubmit={handleCheck} className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-text-secondary uppercase">
                Candidate Statement to Evaluate
              </label>
              <select
                value={facet}
                onChange={(e) => setFacet(e.target.value as CognitiveFacet)}
                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono capitalize"
              >
                <option value="decision">decision</option>
                <option value="fact">fact</option>
                <option value="task">task</option>
                <option value="preference">preference</option>
              </select>
            </div>

            <textarea
              rows={7}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-crimson-500"
              placeholder="Enter candidate memory statement..."
              required
            />
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-muted">
              Vector Space: 1,536-dim Cosine Check
            </span>

            <button
              type="submit"
              disabled={isChecking}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Conflicts...</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Check Conflicts</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Conflict Results */}
        <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span>Conflict Analysis Report</span>
              {result && (
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold border ${
                    result.conflict_detected
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {result.conflict_detected ? 'Conflict Flagged' : 'No Conflict'}
                </span>
              )}
            </h3>

            {isChecking ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-crimson-500 border-t-transparent animate-spin" />
                <div className="text-xs font-mono text-crimson-400 animate-pulse">
                  Querying vector space & comparing against verified decisions...
                </div>
              </div>
            ) : !result ? (
              <div className="py-20 text-center text-text-muted text-xs font-mono border border-dashed border-white/10 rounded-xl">
                Ready to evaluate. Enter statement and click "Check Conflicts".
              </div>
            ) : result.conflict_detected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 font-bold uppercase">
                      Type: {result.conflict_type?.replace('_', ' ')}
                    </span>
                    <span className="text-rose-300">
                      Confidence: {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed font-mono">
                    {result.explanation}
                  </p>
                </div>

                {result.conflicting_content && (
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] space-y-1">
                    <div className="text-[10px] font-mono text-text-muted uppercase">
                      Existing Verified Memory In Database:
                    </div>
                    <p className="text-xs font-mono text-text-primary">
                      "{result.conflicting_content}"
                    </p>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-text-secondary">Recommended Action:</span>
                  <span className="text-amber-400 font-bold uppercase">
                    {result.recommended_action.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-300">Statement Verified Clean</h4>
                <p className="text-xs text-emerald-200/80 font-mono">
                  {result.explanation}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-text-muted flex justify-between">
            <span>Classifier: Negation & Semantic Drift</span>
            <span>Safety Gate: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

