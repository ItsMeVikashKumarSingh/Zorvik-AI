import React, { useState, useEffect } from 'react';
import {
  Key,
  Zap,
  Activity,
  Save,
  RotateCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
} from 'lucide-react';

interface KeyVaultManagerProps {
  adminToken: string;
}

interface ProviderKeyInfo {
  isConfigured: boolean;
  maskedKey: string | null;
  isActive: boolean;
  isRuntimeOverride: boolean;
}

const PROVIDER_METADATA: Record<
  string,
  { name: string; tag: string; description: string; placeholder: string; docUrl: string }
> = {
  gemini: {
    name: 'Google Gemini AI',
    tag: 'Vision & Grounding Engine',
    description: 'Powers Google Search grounding, multi-modal image understanding, and high-context reasoning.',
    placeholder: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/apikey',
  },
  groq: {
    name: 'Groq Cloud LPU',
    tag: 'Sub-50ms Fast Stream',
    description: 'High-speed LPU acceleration for sub-50ms first-token latency and 500+ tok/s streaming.',
    placeholder: 'gsk_...',
    docUrl: 'https://console.groq.com/keys',
  },
  cerebras: {
    name: 'Cerebras LPU Matrix',
    tag: 'Ultra-Fast Stream Matrix',
    description: 'Wafer-scale LPU engine delivering 2,000+ tok/s throughput for complex code generation.',
    placeholder: 'csk-...',
    docUrl: 'https://cloud.cerebras.ai',
  },
  mistral: {
    name: 'Mistral AI / Codestral',
    tag: 'Code & Architecture Synthesis',
    description: 'Specialized deep coding models with comprehensive repository-level code comprehension.',
    placeholder: 'mis_...',
    docUrl: 'https://console.mistral.ai/api-keys',
  },
  openrouter: {
    name: 'OpenRouter Deep Reasoning',
    tag: 'Multi-Step Mathematical Logic',
    description: 'Access to DeepSeek R1 and open reasoning models for step-by-step chain-of-thought proofs.',
    placeholder: 'sk-or-v1-...',
    docUrl: 'https://openrouter.ai/keys',
  },
  sambanova: {
    name: 'SambaNova Systems',
    tag: 'Reconfigurable Dataflow Matrix',
    description: 'Enterprise open-weight model acceleration with true sub-100ms precision.',
    placeholder: 'sn_...',
    docUrl: 'https://cloud.sambanova.ai',
  },
  together: {
    name: 'Together AI',
    tag: 'Distributed Inference Mesh',
    description: 'Global distributed inference network for scalable open LLM acceleration.',
    placeholder: 'tog_...',
    docUrl: 'https://api.together.ai/settings/api-keys',
  },
};

export const KeyVaultManager: React.FC<KeyVaultManagerProps> = ({ adminToken }) => {
  const [keys, setKeys] = useState<Record<string, ProviderKeyInfo>>({});
  const [inputKeys, setInputKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [latencies, setLatencies] = useState<Record<string, { latencyMs: number; error?: string }>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/v1/manage/keys', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
      });
      const data = await res.json();
      if (data.success && data.keys) {
        setKeys(data.keys);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [adminToken]);

  const handleSaveKey = async (provider: string) => {
    const key = inputKeys[provider];
    if (!key || !key.trim()) return;

    setSavingProvider(provider);
    try {
      const res = await fetch('/api/v1/manage/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
        body: JSON.stringify({ provider, apiKey: key.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`API Key for ${PROVIDER_METADATA[provider]?.name || provider} updated in runtime vault.`);
        setInputKeys((prev) => ({ ...prev, [provider]: '' }));
        await fetchKeys();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Failed to save key: ' + err.message);
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestKey = async (provider: string) => {
    setTestingProvider(provider);
    setLatencies((prev) => ({ ...prev, [provider]: undefined as any }));

    try {
      const res = await fetch('/api/v1/manage/keys/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
        body: JSON.stringify({
          provider,
          testKey: inputKeys[provider] ? inputKeys[provider].trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setLatencies((prev) => ({
          ...prev,
          [provider]: { latencyMs: data.result.latencyMs },
        }));
      } else {
        setLatencies((prev) => ({
          ...prev,
          [provider]: { latencyMs: 0, error: data.error || 'Connection check failed' },
        }));
      }
    } catch (err: any) {
      setLatencies((prev) => ({
        ...prev,
        [provider]: { latencyMs: 0, error: err.message },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleToggleProvider = async (provider: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/v1/manage/keys/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
        body: JSON.stringify({ provider, enabled: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setKeys((prev) => ({
          ...prev,
          [provider]: { ...prev[provider], isActive: data.enabled },
        }));
      }
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-[#090912] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-purple-600/20 text-purple-400">
              <Key size={16} />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Neural Engines & Key Vault</h2>
          </div>
          <p className="text-xs text-slate-400">
            Rotate API keys in real time, benchmark millisecond latency, and manage the zero-cost cascade matrix without redeploying.
          </p>
        </div>

        <button
          onClick={fetchKeys}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.20] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white transition-all font-mono"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Provider Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PROVIDER_METADATA).map(([providerId, meta]) => {
          const keyInfo = keys[providerId] || { isConfigured: false, maskedKey: null, isActive: true, isRuntimeOverride: false };
          const latency = latencies[providerId];
          const isTesting = testingProvider === providerId;
          const isSaving = savingProvider === providerId;
          const isKeyVisible = showKeys[providerId];

          return (
            <div
              key={providerId}
              className={`p-5 rounded-3xl bg-[#0a0a14] border transition-all flex flex-col justify-between ${
                keyInfo.isActive
                  ? 'border-white/[0.08] hover:border-purple-500/30'
                  : 'border-white/[0.03] opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{meta.name}</h3>
                      {keyInfo.isConfigured ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Configured</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                          Missing Key
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-purple-400/90">{meta.tag}</span>
                  </div>

                  <button
                    onClick={() => handleToggleProvider(providerId, keyInfo.isActive)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title={keyInfo.isActive ? 'Disable Provider' : 'Enable Provider'}
                  >
                    {keyInfo.isActive ? (
                      <ToggleRight size={26} className="text-purple-500" />
                    ) : (
                      <ToggleLeft size={26} className="text-slate-600" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">{meta.description}</p>

                {/* Masked Key Display (if configured) */}
                {keyInfo.maskedKey && (
                  <div className="mb-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} className="text-slate-500" />
                      <span>Key: {keyInfo.maskedKey}</span>
                    </div>
                    {keyInfo.isRuntimeOverride && (
                      <span className="text-[10px] text-purple-400 uppercase font-mono">Hot Vault Active</span>
                    )}
                  </div>
                )}

                {/* Input New Key */}
                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <input
                      type={isKeyVisible ? 'text' : 'password'}
                      value={inputKeys[providerId] || ''}
                      onChange={(e) =>
                        setInputKeys((prev) => ({ ...prev, [providerId]: e.target.value }))
                      }
                      placeholder={keyInfo.isConfigured ? 'Replace existing key...' : meta.placeholder}
                      className="w-full pl-3 pr-16 py-2 rounded-xl bg-[#0e0e1a] border border-white/[0.08] focus:border-purple-500/50 text-white text-xs font-mono placeholder-slate-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }))
                      }
                      className="absolute right-2.5 text-slate-500 hover:text-white transition-colors p-1"
                    >
                      {isKeyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveKey(providerId)}
                    disabled={isSaving || !inputKeys[providerId]?.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 text-xs font-medium transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Save size={12} />
                    <span>{isSaving ? 'Saving...' : 'Save & Hot-Reload'}</span>
                  </button>

                  <button
                    onClick={() => handleTestKey(providerId)}
                    disabled={isTesting || (!keyInfo.isConfigured && !inputKeys[providerId]?.trim())}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.20] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white transition-all font-mono disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Activity size={12} className={isTesting ? 'animate-spin text-purple-400' : ''} />
                    <span>{isTesting ? 'Pinging...' : 'Ping Test'}</span>
                  </button>
                </div>

                {/* Latency Output */}
                {latency && (
                  <div className="text-[11px] font-mono flex items-center gap-1.5">
                    {latency.error ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>Error</span>
                      </span>
                    ) : (
                      <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                        <Zap size={11} className="text-cyan-300" />
                        <span>{latency.latencyMs}ms</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
