import React, { useState } from 'react';
import { CognitiveFacet, MemoryStatus } from '../../types';
import { api } from '../../services/api';
import { X, Plus, Sparkles, Check } from 'lucide-react';

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryCreated: () => void;
}

export const CreateMemoryModal: React.FC<CreateMemoryModalProps> = ({
  isOpen,
  onClose,
  onMemoryCreated,
}) => {
  const [content, setContent] = useState('');
  const [facet, setFacet] = useState<CognitiveFacet>('fact');
  const [importance, setImportance] = useState(0.85);
  const [confidence, setConfidence] = useState(0.95);
  const [status, setStatus] = useState<MemoryStatus>('trusted');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createMemory({
        content,
        cognitive_facet: facet,
        importance_score: importance,
        confidence_score: confidence,
        status,
      });
      onMemoryCreated();
      setContent('');
      onClose();
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0E0E12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Persist New Cognitive Memory
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
              Memory Content / Fact / Decision
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono leading-relaxed"
              placeholder="e.g., Primary database is Neon Cloud PostgreSQL with pgvector 0.8.7 for HNSW cosine similarity vector search."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                Cognitive Facet
              </label>
              <select
                value={facet}
                onChange={(e) => setFacet(e.target.value as CognitiveFacet)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono capitalize"
              >
                <option value="fact">Fact</option>
                <option value="decision">Decision</option>
                <option value="task">Task</option>
                <option value="preference">Preference</option>
                <option value="experience">Experience</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary uppercase mb-1.5 block">
                Initial Trust Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemoryStatus)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-crimson-500 font-mono capitalize"
              >
                <option value="trusted">Trusted (Verified)</option>
                <option value="provisional">Provisional (Unconfirmed)</option>
                <option value="quarantined">Quarantined (Fenced)</option>
              </select>
            </div>
          </div>

          {/* Scores Sliders */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                <span>Importance</span>
                <span className="text-crimson-400 font-bold">{(importance * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={importance}
                onChange={(e) => setImportance(parseFloat(e.target.value))}
                className="w-full accent-crimson-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                <span>Confidence</span>
                <span className="text-emerald-400 font-bold">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-crimson-600 hover:bg-crimson-500 transition-all shadow-crimson-subtle flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Embedding & Indexing...' : 'Persist Memory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

