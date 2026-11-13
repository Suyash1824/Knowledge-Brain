import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  FileKey,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import { api } from '../../api/client';
import { DeletionVerification, MemoryItem } from '../../types';

export const AuditTab: React.FC = () => {
  const [targetMemoryId, setTargetMemoryId] = useState('');
  const [reason, setReason] = useState('User right-to-be-forgotten data privacy request');
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<DeletionVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Verification lookup
  const [lookupRequestId, setLookupRequestId] = useState('');
  const [lookupResult, setLookupResult] = useState<DeletionVerification | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const list = await api.listMemories({ limit: 15 });
        setMemories(list);
        if (list.length > 0 && !targetMemoryId) {
          setTargetMemoryId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load candidate memories:', err);
      }
    };
    loadCandidates();
  }, []);

  const handleCascadeDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemoryId) return;
    if (!confirm('Execute cascading DAG deletion? Downstream derived memories will be safely tombstoned.')) return;
    setLoading(true);
    setError(null);
    setVerification(null);

    try {
      const res = await api.requestCascadeDeletion(targetMemoryId, reason);
      setVerification(res);
      // Reload candidate list
      const list = await api.listMemories({ limit: 15 });
      setMemories(list);
    } catch (err: any) {
      setError(err.message || 'Cascade deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRequestId.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await api.verifyDeletionReceipt(lookupRequestId.trim());
      setLookupResult(res);
    } catch (err: any) {
      setError(`Receipt verification failed: ${err.message}`);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <span>Dependency-Aware Forgetting & Audit Receipts</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          GDPR/CCPA compliant right-to-be-forgotten engine. Cascade deletes memories across relational DB and pgvector stores while issuing cryptographic SHA-256 verifiable receipts.
        </p>
      </div>

      {/* Main Cascade Deletion Form */}
      <form onSubmit={handleCascadeDelete} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Select Target Memory to Delete</span>
          </label>
          <select
            value={targetMemoryId}
            onChange={(e) => setTargetMemoryId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
          >
            {memories.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 font-sans">
                [L{m.hierarchy_level} - {m.memory_type}] {m.content.slice(0, 70)}...
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Deletion Reason / Audit Provenance
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Audit justification..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-sans"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !targetMemoryId}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Tracing DAG & Nulling Vectors...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Execute Cascading Memory Deletion</span>
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

      {/* Verification Receipt Card */}
      {verification && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Store Cryptographic Verification Receipt</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Request ID: {verification.request_id}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
              <div className="text-emerald-400 font-bold mt-0.5 capitalize">{verification.status}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Purged Targets</span>
              <div className="text-white font-bold mt-0.5">1 memory</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold">DAG Tombstoned</span>
              <div className="text-amber-400 font-bold mt-0.5">{verification.tombstoned_memories_count} derived child(ren)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Multi-Store State</span>
              <div className="text-emerald-400 font-bold mt-0.5">DB + pgvector Synced</div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center space-x-1">
              <FileKey className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cryptographic SHA-256 Verification Hash</span>
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-xs select-all break-all">
              {verification.verification_hash}
            </div>
          </div>
        </div>
      )}

      {/* Verify Existing Receipt Lookup Form */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
          <Search className="w-4 h-4 text-indigo-400" />
          <span>Inspect Prior Cryptographic Receipt</span>
        </h3>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            value={lookupRequestId}
            onChange={(e) => setLookupRequestId(e.target.value)}
            placeholder="Enter deletion request UUID to verify..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {lookupLoading ? 'Verifying...' : 'Verify Receipt'}
          </button>
        </form>

        {lookupResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-emerald-400 font-bold">Receipt Validated (Status: {lookupResult.status})</div>
            <div>Target Memory: {lookupResult.target_memory_id}</div>
            <div>SHA-256 Hash: {lookupResult.verification_hash}</div>
          </div>
        )}
      </div>
    </div>
  );
};
