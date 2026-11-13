import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Layers,
  CheckCircle2,
  Cpu,
  FileCode,
  ArrowRight,
  Database,
} from 'lucide-react';
import { api } from '../../api/client';

export const IngestTab: React.FC = () => {
  const [rawText, setRawText] = useState(
    'Architecture Decision: Migrate database connections to internal Docker hostname db:5432. Note: verify that SSL requirements are bypassed locally.'
  );
  const [agentId, setAgentId] = useState('cursor-ai');
  const [eventType, setEventType] = useState('conversation_turn');
  const [syncPromotion, setSyncPromotion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.ingestRuntimeEvent({
        raw_text: rawText,
        agent_id: agentId,
        event_type: eventType,
        synchronous_promotion: syncPromotion,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to ingest event');
    } finally {
      setLoading(false);
    }
  };

  const samplePresets = [
    {
      title: 'Architectural Decision',
      text: 'Decision: We selected PostgreSQL with pgvector for unified relational and vector memory storage.',
      agent: 'antigravity-ai',
      type: 'conversation_turn',
    },
    {
      title: 'Task Handover',
      text: 'Task: Complete frontend dashboard with Vite, React 18, and Tailwind CSS. Target port is 5173.',
      agent: 'cursor-ai',
      type: 'observation',
    },
    {
      title: 'Casual Chatter (Withheld at L1)',
      text: 'Good morning! Can you check the build status when you get a chance? Thanks!',
      agent: 'mcp-agent',
      type: 'conversation_turn',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>Runtime Event Ingestion Pipeline</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Test the live 10-stage ingestion engine. Incoming raw conversational turns, tool outputs, and observations enter Level 1 Experience memory and are conditionally consolidated.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
        {samplePresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setRawText(preset.text);
              setAgentId(preset.agent);
              setEventType(preset.type);
            }}
            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs transition"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Ingestion Form */}
      <form onSubmit={handleIngest} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Agent Identity */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Source Agent
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none w-full"
              >
                <option value="cursor-ai" className="bg-slate-900">Cursor AI</option>
                <option value="antigravity-ai" className="bg-slate-900">Antigravity AI</option>
                <option value="mcp-agent" className="bg-slate-900">MCP Client</option>
              </select>
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Event Type
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none w-full"
              >
                <option value="conversation_turn" className="bg-slate-900">Conversation Turn</option>
                <option value="observation" className="bg-slate-900">Observation</option>
                <option value="tool_output" className="bg-slate-900">Tool Output</option>
              </select>
            </div>
          </div>

          {/* Promotion Policy */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Promotion Mode
            </label>
            <label className="flex items-center space-x-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={syncPromotion}
                onChange={(e) => setSyncPromotion(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">Synchronous Context Promotion</span>
            </label>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Raw Message or Event Payload
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            placeholder="Type or paste agent conversation turn..."
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running 10-Stage Pipeline...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Ingest Into Knowledge Brain</span>
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

      {/* Pipeline Result Inspection */}
      {result && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ingestion Pipeline Succeeded</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              ID: {result.experience_memory_id}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Tier Assigned</div>
              <div className="text-sky-400 font-bold mt-0.5">Level 1: Experience</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Candidates Extracted</div>
              <div className="text-white font-bold mt-0.5">{result.extracted_candidates_count} fact(s)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Deduplication State</div>
              <div className="text-emerald-400 font-bold mt-0.5">Idempotent Absorbed</div>
            </div>
          </div>

          {/* Candidate list */}
          {result.candidates && result.candidates.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Extracted Candidate Memories</span>
              <div className="space-y-2">
                {result.candidates.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase mr-2">
                        {c.memory_type}
                      </span>
                      <span className="text-slate-200">{c.content}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {Math.round((c.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
