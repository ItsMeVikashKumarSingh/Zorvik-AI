import React, { useState, useEffect } from 'react';
import {
  Search,
  Check,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';

interface OpenRouterCatalogProps {
  token: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing?: { prompt: string; completion: string };
  isFree?: boolean;
}

export const OpenRouterCatalog: React.FC<OpenRouterCatalogProps> = ({ token }) => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [activeModel, setActiveModel] = useState<string>('deepseek/deepseek-r1:free');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'free' | 'reasoning' | 'code' | 'top'>('all');
  const [loading, setLoading] = useState(true);
  const [selectingModel, setSelectingModel] = useState<string | null>(null);
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/manage/openrouter/models', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setModels(data.models);
        if (data.activeModel) {
          setActiveModel(data.activeModel);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [token]);

  const handleSelectModel = async (modelId: string) => {
    setSelectingModel(modelId);
    try {
      const res = await fetch('/api/v1/manage/openrouter/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModel(modelId);
        setMessage(`Active OpenRouter model set to: ${modelId}`);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Failed to set model: ' + err.message);
    } finally {
      setSelectingModel(null);
    }
  };

  const handleTestLatency = async (modelId: string) => {
    setTestingModel(modelId);
    try {
      const res = await fetch('/api/v1/manage/keys/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({ provider: 'openrouter' }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setLatencies((prev) => ({ ...prev, [modelId]: data.result.latencyMs }));
      }
    } catch {
      // Non-blocking
    } finally {
      setTestingModel(null);
    }
  };

  const filteredModels = models.filter((m) => {
    if (categoryFilter === 'free' && !m.isFree) return false;
    if (categoryFilter === 'reasoning' && !m.id.includes('r1') && !m.id.includes('o1') && !m.id.includes('o3') && !m.id.includes('sonnet')) return false;
    if (categoryFilter === 'code' && !m.id.includes('coder') && !m.id.includes('code') && !m.id.includes('claude')) return false;
    if (categoryFilter === 'top' && !m.id.includes('claude-3.7') && !m.id.includes('deepseek') && !m.id.includes('llama-3.3') && !m.id.includes('gemini-2.0')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            OPENROUTER NEURAL CATALOG & MATRIX
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            Dynamic Model Catalog ({models.length} Models Discovered)
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Browse, benchmark, and route directly to any model on OpenRouter with zero code deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Sync Live Catalog</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] text-xs text-[#141310] font-['IBM_Plex_Mono',monospace] flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#141310]" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter Bar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#faf8f3] p-3 rounded-lg border border-[rgba(20,19,16,0.14)]">
        {/* Category Pills */}
        <div className="inline-flex rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] p-0.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
              categoryFilter === 'all' ? 'bg-[#141310] text-[#faf8f3]' : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            All ({models.length})
          </button>
          <button
            onClick={() => setCategoryFilter('free')}
            className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
              categoryFilter === 'free' ? 'bg-[#141310] text-[#faf8f3]' : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            Zero-Cost / Free
          </button>
          <button
            onClick={() => setCategoryFilter('top')}
            className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
              categoryFilter === 'top' ? 'bg-[#141310] text-[#faf8f3]' : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            Top Tier
          </button>
          <button
            onClick={() => setCategoryFilter('reasoning')}
            className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
              categoryFilter === 'reasoning' ? 'bg-[#141310] text-[#faf8f3]' : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            Reasoning / R1
          </button>
          <button
            onClick={() => setCategoryFilter('code')}
            className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
              categoryFilter === 'code' ? 'bg-[#141310] text-[#faf8f3]' : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            Code Synthesis
          </button>
        </div>

        {/* Search */}
        <div className="relative flex items-center min-w-[240px]">
          <Search size={13} className="absolute left-2.5 text-[rgba(20,19,16,0.42)]" />
          <input
            type="text"
            placeholder="Search OpenRouter models (e.g. claude, r1, llama)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded pl-8 pr-3 py-1.5 text-xs text-[#141310] placeholder-[rgba(20,19,16,0.42)] outline-none focus:border-[#141310] transition-colors"
          />
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModels.map((m) => {
          const isActive = activeModel === m.id;
          const isSelecting = selectingModel === m.id;
          const isTesting = testingModel === m.id;
          const latency = latencies[m.id];

          return (
            <div
              key={m.id}
              className={`p-5 rounded-lg bg-[#faf8f3] border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-[#141310] ring-1 ring-[#141310]'
                  : 'border-[rgba(20,19,16,0.14)] hover:border-[rgba(20,19,16,0.3)]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-[#141310]">{m.name}</h3>
                      {m.isFree ? (
                        <span className="px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[10px] font-['IBM_Plex_Mono',monospace] font-semibold text-[#141310]">
                          FREE TIER
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)]">
                          PAYG
                        </span>
                      )}
                    </div>
                    <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[rgba(20,19,16,0.42)] mt-0.5">
                      {m.id}
                    </div>
                  </div>

                  {isActive && (
                    <span className="px-2 py-0.5 rounded bg-[#141310] text-[#faf8f3] text-[10px] font-semibold font-['IBM_Plex_Mono',monospace] flex items-center gap-1 shrink-0">
                      <Check size={10} /> Active Router
                    </span>
                  )}
                </div>

                <p className="text-xs text-[rgba(20,19,16,0.62)] leading-relaxed line-clamp-2 mb-3">
                  {m.description || 'Enterprise grade language modeling via OpenRouter unified gateway.'}
                </p>

                {/* Specs */}
                <div className="flex items-center gap-3 text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)] mb-3">
                  <span>Context: {Math.round(m.contextLength / 1000)}k</span>
                  <span>·</span>
                  <span>
                    Pricing: {m.isFree ? '$0.00 / 1M' : `${m.pricing?.prompt || '0'} / 1M`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[rgba(20,19,16,0.10)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isActive ? (
                    <button
                      onClick={() => handleSelectModel(m.id)}
                      disabled={isSelecting}
                      className="px-3 py-1 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium hover:bg-[rgba(20,19,16,0.85)] transition-colors disabled:opacity-50"
                    >
                      {isSelecting ? 'Activating...' : 'Route to Model'}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-[#141310] font-['IBM_Plex_Mono',monospace]">
                      Primary Active
                    </span>
                  )}

                  <button
                    onClick={() => handleTestLatency(m.id)}
                    disabled={isTesting}
                    className="px-2.5 py-1 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[#f4f1ea] transition-colors font-['IBM_Plex_Mono',monospace]"
                  >
                    {isTesting ? 'Pinging...' : 'Ping'}
                  </button>
                </div>

                {latency !== undefined && (
                  <span className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[#141310] font-semibold">
                    {latency}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
