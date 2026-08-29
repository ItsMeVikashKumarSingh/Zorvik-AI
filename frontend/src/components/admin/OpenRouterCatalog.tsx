import React, { useState, useEffect } from 'react';
import {
  Search,
  Check,
  RotateCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Save,
  Activity,
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

interface ProviderKeyInfo {
  isConfigured: boolean;
  maskedKey: string | null;
  fullKey: string | null;
  isActive: boolean;
}

export const OpenRouterCatalog: React.FC<OpenRouterCatalogProps> = ({ token }) => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [activeModel, setActiveModel] = useState<string>('deepseek/deepseek-r1:free');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'free' | 'top' | 'reasoning' | 'code'>('all');
  const [loading, setLoading] = useState(true);
  const [selectingModel, setSelectingModel] = useState<string | null>(null);
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Master Key State
  const [keysInfo, setKeysInfo] = useState<Record<string, ProviderKeyInfo>>({});
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState('');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'x-admin-key': token,
      };

      // 1. Fetch live OpenRouter catalog
      const resModels = await fetch('/api/v1/manage/openrouter/models', { headers });
      const dataModels = await resModels.json();
      if (dataModels.success && Array.isArray(dataModels.models)) {
        setModels(dataModels.models);
        if (dataModels.activeModel) setActiveModel(dataModels.activeModel);
      }

      // 2. Fetch Keys Info
      const resKeys = await fetch('/api/v1/manage/keys', { headers });
      const dataKeys = await resKeys.json();
      if (dataKeys.success && dataKeys.keys) {
        setKeysInfo(dataKeys.keys);
        if (dataKeys.keys.openrouter?.fullKey) {
          setOpenRouterKeyInput(dataKeys.keys.openrouter.fullKey);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSaveOpenRouterKey = async () => {
    if (!openRouterKeyInput.trim()) return;
    setSavingKey('openrouter');
    try {
      const res = await fetch('/api/v1/manage/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          apiKey: openRouterKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('OpenRouter Master Key successfully updated in runtime memory.');
        fetchData();
      }
    } catch (err: any) {
      alert('Error updating key: ' + err.message);
    } finally {
      setSavingKey(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

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
        setMessage(`Primary active router set to: ${modelId}`);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Failed to set model: ' + err.message);
    } finally {
      setSelectingModel(null);
    }
  };

  const handleTestLatency = async (provider = 'openrouter', modelId?: string) => {
    const target = modelId || provider;
    setTestingModel(target);
    try {
      const res = await fetch('/api/v1/manage/keys/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setLatencies((prev) => ({ ...prev, [target]: data.result.latencyMs }));
      }
    } catch {
      // Non-blocking
    } finally {
      setTestingModel(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredModels = models.filter((m) => {
    if (categoryFilter === 'free' && !m.isFree) return false;
    if (categoryFilter === 'top' && !m.id.includes('claude-3.7') && !m.id.includes('deepseek') && !m.id.includes('llama-3.3') && !m.id.includes('gemini-2.0') && !m.id.includes('o3')) return false;
    if (categoryFilter === 'reasoning' && !m.id.includes('r1') && !m.id.includes('o1') && !m.id.includes('o3') && !m.id.includes('sonnet')) return false;
    if (categoryFilter === 'code' && !m.id.includes('coder') && !m.id.includes('code') && !m.id.includes('claude')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  });

  const openRouterInfo = keysInfo.openrouter || {
    isConfigured: false,
    maskedKey: null,
    fullKey: null,
    isActive: true,
  };

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* ========================================================================= */}
      {/* 1. MASTER OPENROUTER CORE & API KEY CARD                                  */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                UNIVERSAL INTELLIGENCE GATEWAY
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9.5px] font-['IBM_Plex_Mono',monospace] font-semibold border ${
                  openRouterInfo.isConfigured
                    ? 'border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[#141310]'
                    : 'border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e]'
                }`}
              >
                {openRouterInfo.isConfigured ? 'GATEWAY READY' : 'KEY REQUIRED'}
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#141310] tracking-tight">
              OpenRouter Master Gateway ({models.length} Live Models)
            </h2>
            <p className="text-xs text-[rgba(20,19,16,0.62)] mt-0.5">
              One master key powers every AI model across Zorvik (Claude 3.7 Sonnet, DeepSeek R1, Llama 3.3, Gemini 2.0, Qwen).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestLatency('openrouter')}
              disabled={testingModel === 'openrouter'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
            >
              <Activity size={12} className={testingModel === 'openrouter' ? 'animate-pulse' : ''} />
              <span>
                {testingModel === 'openrouter'
                  ? 'Testing...'
                  : latencies.openrouter
                  ? `Ping: ${latencies.openrouter}ms`
                  : 'Test Gateway Ping'}
              </span>
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Sync Catalog</span>
            </button>
          </div>
        </div>

        {/* Master Key Input with Full Reveal & Copy */}
        <div className="pt-3 border-t border-[rgba(20,19,16,0.10)] space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
            OpenRouter Master API Key
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showOpenRouterKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={openRouterKeyInput}
                onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-2 pr-16 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310] transition-colors"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[rgba(20,19,16,0.42)]">
                <button
                  type="button"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="hover:text-[#141310] p-1 rounded"
                  title={showOpenRouterKey ? 'Hide full key' : 'Show complete unmasked key'}
                >
                  {showOpenRouterKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>

                {openRouterKeyInput && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(openRouterKeyInput, 'openrouter_master')}
                    className="hover:text-[#141310] p-1 rounded"
                    title="Copy full key to clipboard"
                  >
                    {copiedKey === 'openrouter_master' ? (
                      <Check size={13} className="text-[#141310]" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveOpenRouterKey}
              disabled={savingKey === 'openrouter' || !openRouterKeyInput.trim()}
              className="px-4 py-2 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium hover:bg-[rgba(20,19,16,0.85)] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <Save size={13} />
              <span>{savingKey === 'openrouter' ? 'Saving...' : 'Save Key'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] pt-1">
            <span>Current Active Router: <strong className="text-[#141310]">{activeModel}</strong></span>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#141310] hover:underline"
            >
              Get OpenRouter Key ↗
            </a>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] text-xs text-[#141310] font-['IBM_Plex_Mono',monospace] flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#141310]" />
          <span>{message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC MODEL CATALOG BROWSER                                          */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Filter Bar */}
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
              Free Tier
            </button>
            <button
              onClick={() => setCategoryFilter('top')}
              className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
                categoryFilter === 'top' ? 'bg-[#141310] text-[#faf8f3]' : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
              }`}
            >
              Top Tier (Claude / DeepSeek)
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
              placeholder="Search 100+ models (e.g. claude, r1, llama)..."
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
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-[#141310]">{m.name}</h3>
                        {m.isFree ? (
                          <span className="px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[10px] font-['IBM_Plex_Mono',monospace] font-semibold text-[#141310]">
                            FREE
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
                    {m.description || 'Universal language model routed through OpenRouter gateway.'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)] mb-3">
                    <span>Context: {Math.round(m.contextLength / 1000)}k</span>
                    <span>·</span>
                    <span>
                      Pricing: {m.isFree ? '$0.00' : `${m.pricing?.prompt || '0'}/1M`}
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
                      onClick={() => handleTestLatency('openrouter', m.id)}
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
    </div>
  );
};
