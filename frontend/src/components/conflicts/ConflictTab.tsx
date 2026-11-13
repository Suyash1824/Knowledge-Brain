import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import { ConflictReport } from '../../types';

export const ConflictTab: React.FC = () => {
  const [existingContent, setExistingContent] = useState(
    'Architecture Decision: We selected AWS ECS for container orchestration in production.'
  );
  const [newContent, setNewContent] = useState(
    'Architecture Decision: We selected Docker Compose on a single VM for container orchestration in production.'
  );
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ConflictReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingContent.trim() || !newContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.detectConflicts(existingContent, newContent);
      setReport(res);
    } catch (err: any) {
      setError(err.message || 'Conflict detection failed');
    } finally {
      setLoading(false);
    }
  };

  const samplePairs = [
    {
      title: 'Architectural Contradiction',
      existing: 'Decision: Deploy all services on AWS ECS.',
      newText: 'Decision: Deploy all services on Docker Compose on a single VM.',
    },
    {
      title: 'Schedule / Temporal Drift',
      existing: 'Task: Sprint review meeting is scheduled for Monday at 10:00 AM.',
      newText: 'Task: Sprint review meeting is scheduled for Thursday at 2:00 PM.',
    },
    {
      title: 'Direct Negation / Antonym',
      existing: 'Preference: Always enable dark mode by default.',
      newText: 'Preference: Never enable dark mode; use light mode exclusively.',
    },
    {
      title: 'No Conflict (Distinct Topics)',
      existing: 'Fact: The PostgreSQL database port is 5432.',
      newText: 'Fact: The Vite frontend development server runs on port 5173.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Contradiction & Semantic Conflict Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Detects semantic contradictions, temporal schedule drift, and superseded facts. Recommends resolution actions without silently overwriting existing knowledge.
        </p>
      </div>

      {/* Preset Pairs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Test Presets:</span>
        {samplePairs.map((pair, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setExistingContent(pair.existing);
              setNewContent(pair.newText);
              setReport(null);
            }}
            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs transition"
          >
            {pair.title}
          </button>
        ))}
      </div>

      {/* Detection Form */}
      <form onSubmit={handleDetect} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Existing Memory */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Existing Memory Statement</span>
            </label>
            <textarea
              value={existingContent}
              onChange={(e) => setExistingContent(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* New Candidate Content */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>New Candidate Statement</span>
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Comparing Semantic Vectors...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-3.5 h-3.5" />
                <span>Evaluate Semantic Conflict</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Output */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Conflict Report Output */}
      {report && (
        <div
          className={`p-6 rounded-2xl border ${
            report.has_conflict
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-emerald-950/20 border-emerald-500/40'
          } space-y-4`}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              {report.has_conflict ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300">
                    Conflict Detected: {report.conflict_type.toUpperCase().replace('_', ' ')}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">
                    No Contradiction — Statements Coexist Harmoniously
                  </span>
                </>
              )}
            </div>
            <span className="text-xs font-mono text-slate-400">
              Confidence: {Math.round(report.confidence * 100)}%
            </span>
          </div>

          {report.has_conflict && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  Recommended Resolution Policy
                </div>
                <div className="text-amber-400 font-bold text-sm font-mono mt-0.5">
                  {report.recommended_action}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {report.recommended_action === 'update_version'
                    ? 'Create a new superseded version preserving prior audit history.'
                    : report.recommended_action === 'quarantine_new'
                    ? 'Quarantine candidate claim until corroborating evidence arrives.'
                    : 'Flag for human user verification before updating.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  Conflict Classification
                </div>
                <div className="text-white font-semibold capitalize mt-0.5">
                  {report.conflict_type.replace('_', ' ')}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Evaluated against opposing term lexicons, temporal markers, and source trust policies.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
