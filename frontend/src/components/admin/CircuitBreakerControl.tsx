import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, AlertCircle, RefreshCw, Power } from 'lucide-react';

interface ProviderStatus {
  status: string;
  failures: number;
  lastFailure: number | null;
  cooldownEnds: number | null;
}

interface CircuitBreakerControlProps {
  token: string;
}

export const CircuitBreakerControl: React.FC<CircuitBreakerControlProps> = ({ token }) => {
  const [providers, setProviders] = useState<Record<string, ProviderStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setProviders(json.providers || {});
      }
    } catch (err) {
      console.warn('Failed to fetch circuit status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleToggle = async (provider: string, action: 'trip' | 'reset') => {
    try {
      const res = await fetch('/api/v1/admin/circuit-breaker/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, action }),
      });

      if (res.ok) {
        setActionMessage(`Provider ${provider.toUpperCase()} state switched to: ${action === 'trip' ? 'TRIPPED' : 'ONLINE'}`);
        setTimeout(() => setActionMessage(null), 3000);
        fetchStatus();
      }
    } catch (err) {
      console.warn('Failed to toggle circuit breaker:', err);
    }
  };

  const PROVIDER_METADATA: Record<string, { label: string; tier: string; speed: string }> = {
    gemini: { label: 'Google Gemini 2.5 Flash', tier: 'Primary Engine', speed: '< 250ms TTFT' },
    groq: { label: 'Groq Cloud Llama 3.3 70B', tier: 'Fallback Tier 1', speed: '500+ tok/sec' },
    cerebras: { label: 'Cerebras Cloud LPU', tier: 'Fallback Tier 2', speed: '2,000+ tok/sec' },
    mistral: { label: 'Mistral / Codestral AI', tier: 'Code Reasoning', speed: 'High Precision' },
    openrouter: { label: 'OpenRouter Free Gateway', tier: 'Fallback Tier 4', speed: 'General' },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white tracking-tight">AI Multi-Model Circuit Breaker</h1>
          <p className="text-xs sm:text-sm text-silver/50 font-light mt-1">
            Real-time provider cascade health monitor with manual failover overrides and cooldown recovery.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-silver/50 hover:text-white transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-iris/10 border border-iris/30 text-iris text-xs flex items-center gap-2">
          <Zap size={14} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Provider Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(providers).map(([providerKey, provState]) => {
          const meta = PROVIDER_METADATA[providerKey] || {
            label: providerKey,
            tier: 'AI Provider',
            speed: 'Dynamic',
          };
          const isOnline = provState.status === 'online';

          return (
            <div
              key={providerKey}
              className="p-5 rounded-2xl bg-[#090916] border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{meta.label}</h3>
                    <span className="text-[10px] font-mono uppercase bg-white/[0.04] text-silver/60 px-2 py-0.5 rounded-md border border-white/[0.06]">
                      {meta.tier}
                    </span>
                  </div>
                  <div className="text-xs text-silver/40 font-light mt-0.5">Inference Speed: {meta.speed}</div>
                </div>

                {isOnline ? (
                  <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-mono text-crimson bg-crimson/10 px-2.5 py-1 rounded-lg border border-crimson/20">
                    <AlertCircle size={12} /> Tripped / Cooldown
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                <div>
                  <span className="text-silver/40 block text-[10px] font-mono uppercase">Failures Recorded</span>
                  <span className="text-white font-mono">{provState.failures || 0}</span>
                </div>
                <div>
                  <span className="text-silver/40 block text-[10px] font-mono uppercase">Status</span>
                  <span className="text-white font-mono uppercase">{provState.status}</span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {isOnline ? (
                  <button
                    onClick={() => handleToggle(providerKey, 'trip')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-crimson/10 hover:bg-crimson/20 text-crimson text-xs font-medium transition-colors"
                  >
                    <Power size={13} />
                    <span>Force Trip Circuit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggle(providerKey, 'reset')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Reset to Online</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
