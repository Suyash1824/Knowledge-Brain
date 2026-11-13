import React, { useEffect, useState } from 'react';
import {
  X,
  Layers,
  Clock,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Trash2,
  Edit3,
  Check,
  GitBranch,
} from 'lucide-react';
import { api } from '../../api/client';
import { MemoryItem, LifecycleEvent } from '../../types';

interface MemoryDetailModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onMemoryUpdated: () => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  onClose,
  onMemoryUpdated,
}) => {
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  const [provenance, setProvenance] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!memory) return;
    setEditContent(memory.content);
    setIsEditing(false);
    setStatusMsg(null);

    const loadDetails = async () => {
      try {
        const [lc, prov, ver] = await Promise.all([
          api.getMemoryLifecycle(memory.id).catch(() => []),
          api.getMemoryProvenance(memory.id).catch(() => []),
          api.getMemoryVersions(memory.id).catch(() => []),
        ]);
        setLifecycle(lc);
        setProvenance(prov);
        setVersions(ver);
      } catch (err) {
        console.error('Failed to load memory details:', err);
      }
    };
    loadDetails();
  }, [memory]);

  if (!memory) return null;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setActionLoading(true);
    try {
      await api.updateMemory(memory.id, editContent);
      setStatusMsg('Memory successfully updated (new revision committed).');
      setIsEditing(false);
      onMemoryUpdated();
    } catch (err: any) {
      setStatusMsg(`Update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async (targetLevel: 2 | 3) => {
    setActionLoading(true);
    try {
      await api.promoteMemory(
        memory.id,
        targetLevel,
        `Promoted via dashboard control to Level ${targetLevel}`
      );
      setStatusMsg(`Successfully promoted to Level ${targetLevel}!`);
      onMemoryUpdated();
      const updatedLifecycle = await api.getMemoryLifecycle(memory.id).catch(() => []);
      setLifecycle(updatedLifecycle);
    } catch (err: any) {
      setStatusMsg(`Promotion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = async (targetLevel: 1 | 2) => {
    setActionLoading(true);
    try {
      await api.demoteMemory(
        memory.id,
        targetLevel,
        `Demoted via dashboard control to Level ${targetLevel}`
      );
      setStatusMsg(`Successfully demoted to Level ${targetLevel}.`);
      onMemoryUpdated();
      const updatedLifecycle = await api.getMemoryLifecycle(memory.id).catch(() => []);
      setLifecycle(updatedLifecycle);
    } catch (err: any) {
      setStatusMsg(`Demotion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cascade delete this memory? Derived memories will be safely tombstoned.')) return;
    setActionLoading(true);
    try {
      const res = await api.requestCascadeDeletion(memory.id, 'User initiated cascade deletion');
      setStatusMsg(`Deleted! SHA-256 Receipt: ${res.verification_hash.slice(0, 16)}...`);
      setTimeout(() => {
        onMemoryUpdated();
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMsg(`Deletion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const tierBadge =
    memory.hierarchy_level === 3
      ? { text: 'Level 3: Knowledge', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      : memory.hierarchy_level === 2
      ? { text: 'Level 2: Context', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
      : { text: 'Level 1: Experience', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${tierBadge.style}`}>
              {tierBadge.text}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 capitalize">
              {memory.memory_type}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400">
              Score: {Math.round(memory.confidence_score * 100)}%
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status Message */}
          {statusMsg && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
              {statusMsg}
            </div>
          )}

          {/* Content Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <span>Memory Content</span>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Content</span>
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-28 p-3 rounded-xl bg-slate-950 border border-indigo-500/50 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={actionLoading}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Revision</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-200 text-sm leading-relaxed font-sans select-text">
                {memory.content}
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
              <div className="text-white font-semibold mt-0.5 capitalize">{memory.status}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Created</span>
              <div className="text-white font-semibold mt-0.5 font-mono text-[11px]">
                {new Date(memory.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Evidence Count</span>
              <div className="text-white font-semibold mt-0.5">{memory.evidence_count ?? 1} source(s)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Promotion Status</span>
              <div className="text-white font-semibold mt-0.5 capitalize">
                {memory.promotion_status || 'stable'}
              </div>
            </div>
          </div>

          {/* Lifecycle Promotion History */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>Immutable Lifecycle Progression Trail</span>
            </div>
            {lifecycle.length > 0 ? (
              <div className="space-y-2 border-l-2 border-slate-800 pl-4 py-1">
                {lifecycle.map((ev) => (
                  <div key={ev.id} className="relative group">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white capitalize">
                          {ev.transition_type} (Level {ev.from_level ?? 1} → Level {ev.to_level ?? 2})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{ev.reason || 'Transition criteria met.'}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Triggered by: <span className="text-indigo-400">{ev.triggered_by}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 italic">
                Initial ingestion state. No lifecycle transitions recorded yet.
              </div>
            )}
          </div>

          {/* Provenance Evidence */}
          {provenance.length > 0 && (
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Source Evidence & Provenance
              </span>
              <div className="space-y-2">
                {provenance.map((p, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-[11px] text-slate-300">
                    <div className="text-indigo-400 font-semibold">Agent: {p.provenance_metadata?.agent_id || 'unknown'}</div>
                    <div className="mt-1 text-slate-400">"{p.source_text || memory.content}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 font-semibold transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cascade Forgetting</span>
          </button>

          <div className="flex items-center space-x-2">
            {memory.hierarchy_level === 1 && (
              <button
                onClick={() => handlePromote(2)}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition shadow-md shadow-purple-600/30"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Promote to L2 Context</span>
              </button>
            )}
            {memory.hierarchy_level === 2 && (
              <>
                <button
                  onClick={() => handleDemote(1)}
                  disabled={actionLoading}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Demote to L1</span>
                </button>
                <button
                  onClick={() => handlePromote(3)}
                  disabled={actionLoading}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-md shadow-emerald-600/30"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Promote to L3 Knowledge</span>
                </button>
              </>
            )}
            {memory.hierarchy_level === 3 && (
              <button
                onClick={() => handleDemote(2)}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Demote to L2 Context</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
