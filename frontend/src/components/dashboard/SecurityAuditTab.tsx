import React, { useState } from 'react';
import { api } from '../../services/api';
import { ForgettingReceipt } from '../../types';
import { ShieldCheck, Trash2, Key, Check, RefreshCw, Hash, Lock, Database } from 'lucide-react';

export const SecurityAuditTab: React.FC = () => {
  const [memoryId, setMemoryId] = useState('mem-jwt-auth');
  const [reason, setReason] = useState('User Right-to-be-Forgotten GDPR / compliance audit');
  const [isDeleting, setIsDeleting] = useState(false);
  const [receipt, setReceipt] = useState<ForgettingReceipt | null>(null);

  const handleForgetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryId.trim()) return;

    if (!window.confirm('Trigger cascading forgetting? This will purge the target and scrub derived vectors.')) return;

    setIsDeleting(true);
    setReceipt(null);

    try {
      const res = await api.requestForgetting({
        memory_id: memoryId,
        reason,
      });
      setReceipt(res);
    } catch (err: any) {
      alert(`Forgetting execution failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Cryptographic Audit & Cascade Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Dependency-Aware Forgetting & Audit</h2>
          <p className="text-xs text-text-secondary mt-1">
            Compliant right-to-be-forgotten deletion with DAG derivation invalidation and SHA-256 audit receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
          <span className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10">
            SHA-256 Tamper-Evident Receipts
          </span>
        </div>
      </div>

      {/* Grid: Trigger & Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Cascading Deletion Trigger */}
        <form onSubmit={handleForgetting} className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                Target Memory ID to Purge
              </label>
              <input
                type="text"
                value={memoryId}
                onChange={(e) => setMemoryId(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono"
                placeholder="e.g. mem-jwt-auth"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                Deletion Compliance Reason
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono leading-relaxed"
                placeholder="e.g. Right-to-be-forgotten compliance request"
                required
              />
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/[0.04] border border-rose-500/20 text-xs text-rose-300 leading-relaxed font-mono">
              <strong>Warning:</strong> Cascading deletion will trace <code>memory_dependencies</code>, delete target from Neon DB, set vector embeddings to NULL on derived records, and evict cache keys.
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-muted">
              Zero residual vector leakage
            </span>

            <button
              type="submit"
              disabled={isDeleting}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Purging & Tracing DAG...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Execute Cascading Deletion</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right: Cryptographic Receipt */}
        <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span>Cryptographic Deletion Receipt</span>
              {receipt && (
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Verified SHA-256
                </span>
              )}
            </h3>

            {isDeleting ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                <div className="text-xs font-mono text-rose-400 animate-pulse">
                  Scrubbing relational records, nulling embeddings & hashing receipt...
                </div>
              </div>
            ) : !receipt ? (
              <div className="py-20 text-center text-text-muted text-xs font-mono border border-dashed border-white/10 rounded-xl">
                Ready to verify. Execute cascading deletion to inspect the cryptographic audit receipt.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hash Box */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-text-muted flex items-center gap-1.5 uppercase">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cryptographic Audit Hash (SHA-256):</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 break-all select-all">
                    {receipt.sha256_audit_hash}
                  </div>
                </div>

                {/* Multi-Store Status */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] text-text-muted uppercase mb-0.5">Relational DB</div>
                    <div className="text-emerald-400 font-bold">{receipt.multi_store_verification.relational_db}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] text-text-muted uppercase mb-0.5">pgvector HNSW</div>
                    <div className="text-emerald-400 font-bold">{receipt.multi_store_verification.pgvector_hnsw}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] text-text-muted uppercase mb-0.5">Cache Keys</div>
                    <div className="text-emerald-400 font-bold">{receipt.multi_store_verification.cache}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono space-y-1 text-text-secondary">
                  <div className="flex justify-between">
                    <span>Receipt ID:</span>
                    <span className="text-white">{receipt.request_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invalidated Derived Nodes:</span>
                    <span className="text-amber-400">{receipt.invalidated_derived_nodes.length} nodes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="text-text-primary">{new Date(receipt.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-text-muted flex justify-between">
            <span>Audit Integrity: Tamper-Evident</span>
            <span>GDPR Art. 17 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

