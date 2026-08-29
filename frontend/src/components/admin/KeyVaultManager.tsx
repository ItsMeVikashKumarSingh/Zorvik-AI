import React, { useState, useEffect } from 'react';
import {
  Activity,
  Save,
  RotateCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
} from 'lucide-react';

interface KeyVaultManagerProps {
  adminToken: string;
}

interface ProviderKeyInfo {
  isConfigured: boolean;
  maskedKey: string | null;
  fullKey: string | null;
  isActive: boolean;
}

const PROVIDER_METADATA: Record<
  string,
  {
    name: string;
    description: string;
    docsUrl: string;
    placeholder: string;
    envVar: string;
    freeTierInfo: string;
  }
> = {
  gemini: {
    name: 'Google Gemini AI',
    description: 'Grounding & multi-modal intelligence core (Gemini 2.5 Flash / 2.0 Flash).',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...',
    envVar: 'GEMINI_API_KEY',
    freeTierInfo: '15 req/min · 1,500 req/day ($0.00)',
  },
  groq: {
    name: 'Groq Cloud LPU',
    description: 'Sub-50ms ultra-fast hardware stream matrix (Llama 3.3 70B Versatile).',
    docsUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    envVar: 'GROQ_API_KEY',
    freeTierInfo: '30 req/min · 14,400 req/day ($0.00)',
  },
  cerebras: {
    name: 'Cerebras Wafer LPU',
    description: '2,000+ tokens/sec wafer-scale high-throughput inference matrix.',
    docsUrl: 'https://cloud.cerebras.ai/',
    placeholder: 'csk-...',
    envVar: 'CEREBRAS_API_KEY',
    freeTierInfo: '30 req/min · 14,400 req/day ($0.00)',
  },
  mistral: {
    name: 'Mistral AI Engine',
    description: 'European high-efficiency reasoning & Codestral coding synthesis.',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    placeholder: 'mis_...',
    envVar: 'MISTRAL_API_KEY',
    freeTierInfo: '1,000,000 free tokens/month ($0.00)',
  },
  openrouter: {
    name: 'OpenRouter Universal Gateway',
    description: 'Dynamic gateway to 100+ top reasoning & open models (DeepSeek R1, Claude 3.7).',
    docsUrl: 'https://openrouter.ai/keys',
    placeholder: 'sk-or-v1-...',
    envVar: 'OPENROUTER_API_KEY',
    freeTierInfo: '20 req/min · 200 req/day per free model ($0.00)',
  },
  kilo: {
    name: 'Kilo Gateway Free Core',
    description: 'Free frontier inference: Kimi K2.5, Arcee Trinity Large, GLM 4.7, MiniMax M2.1.',
    docsUrl: 'https://kilocode.ai/',
    placeholder: 'kilo-... or free-tier',
    envVar: 'KILO_API_KEY',
    freeTierInfo: '5 Free Frontier Models ($0.00)',
  },
  opencode: {
    name: 'OpenCode Zen Gateway',
    description: 'Free coding & reasoning: MiniMax M2.5 Free and Big Pickle stealth model.',
    docsUrl: 'https://opencode.ai/',
    placeholder: 'opencode-... or free-tier',
    envVar: 'OPENCODE_API_KEY',
    freeTierInfo: '2 Free Models ($0.00)',
  },
  cline: {
    name: 'Cline Free Engine',
    description: 'Free CLI intelligence: Kimi K2.5 and MiniMax M2.5 for development tasks.',
    docsUrl: 'https://cline.bot/',
    placeholder: 'cline-... or free-tier',
    envVar: 'CLINE_API_KEY',
    freeTierInfo: '2 Free Models ($0.00)',
  },
};

export const KeyVaultManager: React.FC<KeyVaultManagerProps> = ({ adminToken }) => {
  const [keysInfo, setKeysInfo] = useState<Record<string, ProviderKeyInfo>>({});
  const [inputKeys, setInputKeys] = useState<Record<string, string>>({});
  const [visibleInputs, setVisibleInputs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; latencyMs?: number; message?: string }>
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/manage/keys', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
      });
      const data = await res.json();
      if (data.success && data.keys) {
        setKeysInfo(data.keys);
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
    const keyVal = inputKeys[provider];
    if (!keyVal || !keyVal.trim()) return;

    setSavingProvider(provider);
    try {
      const res = await fetch('/api/v1/manage/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
        body: JSON.stringify({
          provider,
          apiKey: keyVal.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Successfully updated ${PROVIDER_METADATA[provider]?.name || provider} API key.`,
        });
        setInputKeys((prev) => ({ ...prev, [provider]: '' }));
        fetchKeys();
      } else {
        throw new Error(data.error || 'Failed to save key');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Error updating key.',
      });
    } finally {
      setSavingProvider(null);
      setTimeout(() => setNotification(null), 5000);
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
        body: JSON.stringify({
          provider,
          enabled: !currentActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKeysInfo((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            isActive: data.enabled,
          },
        }));
      }
    } catch {
      // Non-blocking
    }
  };

  const handleTestPing = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch('/api/v1/manage/keys/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-key': adminToken,
        },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            success: true,
            latencyMs: data.result.latencyMs,
            message: 'Operational',
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            success: false,
            message: data.error || 'Ping failed or key missing',
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: err.message || 'Connection timeout',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleCopyKey = (keyVal: string, id: string) => {
    navigator.clipboard.writeText(keyVal);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            ZERO-COST MULTI-ENGINE VAULT (30,000+ FREE REQS/DAY)
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            Neural Key Vault & Provider Free Tiers
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Rotate keys, test live roundtrip latencies, inspect complete keys, and hot-swap AI providers in runtime memory.
          </p>
        </div>

        <button
          onClick={fetchKeys}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors self-start md:self-auto"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Sync Vault</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3 rounded border text-xs font-['IBM_Plex_Mono',monospace] flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-[#faf8f3] border-[rgba(20,19,16,0.25)] text-[#141310]'
              : 'bg-[#c8321e]/10 border-[#c8321e]/30 text-[#c8321e]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={14} className="text-[#141310]" />
          ) : (
            <AlertCircle size={14} className="text-[#c8321e]" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(PROVIDER_METADATA).map(([key, meta]) => {
          const info = keysInfo[key] || {
            isConfigured: false,
            maskedKey: null,
            fullKey: null,
            isActive: true,
          };
          const isSaving = savingProvider === key;
          const isTesting = testingProvider === key;
          const pingResult = testResults[key];
          const isVisible = visibleInputs[key] || false;

          return (
            <div
              key={key}
              className={`p-5 rounded-lg bg-[#faf8f3] border transition-all ${
                info.isConfigured && info.isActive
                  ? 'border-[rgba(20,19,16,0.20)]'
                  : 'border-[rgba(20,19,16,0.10)] opacity-90'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xs font-semibold text-[#141310]">{meta.name}</h3>

                    {info.isConfigured ? (
                      <span className="px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[10px] font-['IBM_Plex_Mono',monospace] font-semibold text-[#141310]">
                        CONFIGURED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded border border-[#c8321e]/30 bg-[#c8321e]/10 text-[10px] font-['IBM_Plex_Mono',monospace] text-[#c8321e]">
                        NOT SET
                      </span>
                    )}

                    <span className="text-[10.5px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                      {meta.envVar}
                    </span>

                    <span className="text-[10.5px] font-['IBM_Plex_Mono',monospace] text-[#141310] px-1.5 py-0.5 rounded bg-[rgba(20,19,16,0.04)]">
                      {meta.freeTierInfo}
                    </span>
                  </div>

                  <p className="text-xs text-[rgba(20,19,16,0.62)]">{meta.description}</p>

                  {/* Complete Key Viewer & Copy */}
                  {info.fullKey && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                        Current Key:
                      </span>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] font-['IBM_Plex_Mono',monospace] text-xs text-[#141310]">
                        <span>{isVisible ? info.fullKey : info.maskedKey}</span>
                        <button
                          type="button"
                          onClick={() => setVisibleInputs((prev) => ({ ...prev, [key]: !isVisible }))}
                          className="text-[rgba(20,19,16,0.42)] hover:text-[#141310] p-0.5"
                          title={isVisible ? 'Hide key' : 'Show full unmasked key'}
                        >
                          {isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(info.fullKey!, key)}
                          className="text-[rgba(20,19,16,0.42)] hover:text-[#141310] p-0.5"
                          title="Copy complete key"
                        >
                          {copiedKey === key ? <Check size={11} className="text-[#141310]" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Actions & Status */}
                <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                  <button
                    onClick={() => handleToggleProvider(key, info.isActive)}
                    className="flex items-center gap-1 text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors"
                    title={info.isActive ? 'Disable Provider' : 'Enable Provider'}
                  >
                    {info.isActive ? (
                      <ToggleRight size={22} className="text-[#141310]" />
                    ) : (
                      <ToggleLeft size={22} className="text-[rgba(20,19,16,0.42)]" />
                    )}
                    <span className="text-[11px] font-['IBM_Plex_Mono',monospace]">
                      {info.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleTestPing(key)}
                    disabled={isTesting}
                    className="px-2.5 py-1 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[#f4f1ea] transition-colors font-['IBM_Plex_Mono',monospace] flex items-center gap-1"
                  >
                    <Activity size={11} className={isTesting ? 'animate-pulse' : ''} />
                    <span>{isTesting ? 'Pinging...' : 'Ping Test'}</span>
                  </button>

                  {pingResult && (
                    <span
                      className={`text-[11px] font-['IBM_Plex_Mono',monospace] px-2 py-0.5 rounded border ${
                        pingResult.success
                          ? 'border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[#141310] font-semibold'
                          : 'border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e]'
                      }`}
                    >
                      {pingResult.success ? `${pingResult.latencyMs}ms` : 'Offline'}
                    </span>
                  )}
                </div>
              </div>

              {/* Key Update Form Input */}
              <div className="mt-4 pt-3 border-t border-[rgba(20,19,16,0.10)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="password"
                    placeholder={`Paste new key to rotate (${meta.placeholder})`}
                    value={inputKeys[key] || ''}
                    onChange={(e) =>
                      setInputKeys((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] placeholder-[rgba(20,19,16,0.42)] outline-none focus:border-[#141310] transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveKey(key)}
                  disabled={isSaving || !inputKeys[key]?.trim()}
                  className="px-3 py-1.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium hover:bg-[rgba(20,19,16,0.85)] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Save size={12} />
                  <span>{isSaving ? 'Saving...' : 'Hot-Update'}</span>
                </button>

                <a
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] hover:text-[#141310] hover:underline px-1 flex items-center justify-center sm:justify-start"
                >
                  Get Free Key ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
