import React, { useEffect, useState } from 'react';
import { Memory, MemoryVersion, MemorySource } from '../../types';
import { api } from '../../services/api';
import {
  X,
  History,
  GitCommit,
  Shield,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
  Bot
} from 'lucide-react';

interface MemoryDetailDrawerProps {
  memory: Memory | null;
  onClose: () => void;
  onMemoryUpdated: () => void;
  onMemoryDeleted: () => void;
}

export const MemoryDetailDrawer: React.FC<MemoryDetailDrawerProps> = ({
  memory,
  onClose,
  onMemoryUpdated,
  onMemoryDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'provenance' | 'edit'>('details');
  const [versions, setVersions] = useState<MemoryVersion[]>([]);
  const [provenance, setProvenance] = useState<MemorySource[]>([]);
  const [editContent, setEditContent] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!memory) return;
    setEditContent(memory.content);
    setChangeReason('');
    setActiveTab('details');

    api.getMemoryVersions(memory.id).then(setVersions).catch(console.error);
    api.getMemoryProvenance(memory.id).then(setProvenance).catch(console.error);
  }, [memory]);

  if (!memory) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      await api.updateMemory(memory.id, editContent, changeReason || 'User updated memory');
      onMemoryUpdated();
      setActiveTab('details');
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this memory?')) return;

    setIsDeleting(true);
    try {
      await api.deleteMemory(memory.id);
      onMemoryDeleted();
      onClose();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0E0E12] border-l border-white/[0.08] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-crimson-500/10 text-crimson-400 border border-crimson-500/20 font-bold">
              {memory.cognitive_facet}
            </span>
            <span className="text-xs font-mono text-text-muted">ID: {memory.id.slice(0, 8)}...</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('edit')}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                activeTab === 'edit'
                  ? 'bg-crimson-600 text-white border-crimson-500'
                  : 'bg-white/[0.04] text-text-secondary hover:text-white border-white/10'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs"
              title="Delete Memory"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.04] text-text-secondary hover:text-white border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-black/20 px-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-crimson-500 text-white font-semibold'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            Memory Details
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'border-crimson-500 text-white font-semibold'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versions ({versions.length || memory.current_version})</span>
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'provenance'
                ? 'border-crimson-500 text-white font-semibold'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Provenance ({provenance.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Content Box */}
              <div>
                <label className="text-xs font-mono text-text-secondary uppercase mb-2 block">
                  Memory Content (Active Version {memory.current_version})
                </label>
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-text-primary leading-relaxed select-text">
                  {memory.content}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Status</div>
                  <div className="text-xs font-semibold text-emerald-400 capitalize flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {memory.status}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Confidence Score</div>
                  <div className="text-xs font-semibold font-mono text-white">
                    {(memory.confidence_score * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Importance Score</div>
                  <div className="text-xs font-semibold font-mono text-white">
                    {(memory.importance_score * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[10px] text-text-secondary font-mono uppercase mb-1">Vector Embedding</div>
                  <div className="text-xs font-mono text-crimson-400">1,536-dim (HNSW)</div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono space-y-2 text-text-secondary">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-text-primary">{new Date(memory.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversation:</span>
                  <span className="text-text-primary">{memory.conversation_id}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="text-xs text-text-secondary mb-2">
                Immutable version history. Every modification is preserved non-destructively:
              </div>

              {versions.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-crimson-400">
                      Version #{v.version_number}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-text-primary leading-relaxed">
                    {v.content}
                  </p>
                  {v.change_reason && (
                    <div className="text-[11px] text-text-secondary italic pt-1 border-t border-white/[0.04]">
                      Reason: {v.change_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <div className="text-xs text-text-secondary mb-2">
                Cryptographic origin & agent interaction audit trail:
              </div>

              {provenance.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-technical">
                      Agent: {p.agent_id}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Turn #{p.turn_index}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary font-mono leading-relaxed">
                    "{p.raw_text}"
                  </p>
                  <div className="text-[10px] font-mono text-text-muted pt-1 border-t border-white/[0.04]">
                    Recorded: {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                  Updated Content
                </label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono leading-relaxed"
                  placeholder="Enter updated memory statement..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                  Change Reason (Recorded in Version History)
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500"
                  placeholder="e.g., Added Redis caching tier"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Incrementing Version...' : 'Save as New Version'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

