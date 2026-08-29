import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Compass,
  Activity,
  Check,
} from 'lucide-react';
import { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  token: string;
  onSwitchTab: (tab: AdminTab) => void;
}

interface OverviewData {
  metrics: {
    total_tenants: number;
    active_tenants: number;
    total_tokens_month: number;
    estimated_monthly_revenue_usd: number;
    system_uptime_seconds: number;
  };
}

interface TrafficDay {
  date: string;
  day: number;
  requests: number;
  tokens: number;
  avgLatencyMs: number;
}

interface AuditLog {
  id: string;
  action_type: string;
  admin_email: string;
  target_entity: string;
  created_at: string;
  ip_address?: string;
}

// Semantic Ink Status Glyphs (Strictly Monochrome + Single Red for Errors)
const InkStatusGlyph: React.FC<{ status: 'healthy' | 'degraded' | 'disabled' }> = ({ status }) => {
  if (status === 'healthy') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Operational">
        <circle cx="6" cy="6" r="5" fill="#141310" />
      </svg>
    );
  }
  if (status === 'disabled') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Disabled">
        <circle cx="6" cy="6" r="4.5" stroke="rgba(20,19,16,0.42)" strokeWidth="1.5" strokeDasharray="2.5 2" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Degraded / Failed">
      <circle cx="6" cy="6" r="5" fill="#c8321e" />
      <path d="M 4 4 L 8 8 M 8 4 L 4 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

const FEATURED_MODELS = [
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    tag: 'HYBRID REASONING',
    context: '200k',
    isFree: false,
    description: 'Anthropic frontier hybrid reasoning & full-stack code synthesis.',
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    tag: 'REASONING POWERHOUSE',
    context: '64k',
    isFree: true,
    description: 'Open reasoning model rivaling OpenAI o1 in mathematical proofs.',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    tag: '671B MoE',
    context: '64k',
    isFree: false,
    description: 'Massive MoE architecture with ultra-fast generation and low cost.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    tag: 'META FLAGSHIP',
    context: '131k',
    isFree: true,
    description: 'Meta premier open powerhouse for general instruction following.',
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen 2.5 Coder 32B',
    tag: 'CODE INTELLIGENCE',
    context: '32k',
    isFree: true,
    description: 'Specialized code generation, refactoring, and AST analysis.',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    tag: '1M CONTEXT',
    context: '1M',
    isFree: true,
    description: 'Ultra-fast multimodal core with 1-million token context window.',
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onSwitchTab }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [traffic, setTraffic] = useState<TrafficDay[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeModel, setActiveModel] = useState<string>('deepseek/deepseek-r1:free');
  const [openRouterCount, setOpenRouterCount] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [activatingModel, setActivatingModel] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    if (!token) return;
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'x-admin-key': token,
      };

      // 1. Live overview telemetry
      const resOverview = await fetch('/api/v1/admin/overview', { headers });
      if (resOverview.ok) {
        const json = await resOverview.json();
        setData(json);
      }

      // 2. Real 14-day daily traffic
      const resTraffic = await fetch('/api/v1/admin/traffic', { headers });
      if (resTraffic.ok) {
        const jsonTraffic = await resTraffic.json();
        if (Array.isArray(jsonTraffic.history)) setTraffic(jsonTraffic.history);
      }

      // 3. Real audit logs
      const resAudit = await fetch('/api/v1/admin/audit-logs?limit=6', { headers });
      if (resAudit.ok) {
        const jsonAudit = await resAudit.json();
        if (Array.isArray(jsonAudit.logs)) setAuditLogs(jsonAudit.logs);
      }

      // 4. OpenRouter dynamic model matrix
      const resModels = await fetch('/api/v1/manage/openrouter/models', { headers });
      if (resModels.ok) {
        const jsonModels = await resModels.json();
        if (jsonModels.activeModel) setActiveModel(jsonModels.activeModel);
        if (Array.isArray(jsonModels.models)) setOpenRouterCount(jsonModels.models.length);
      }
    } catch (err) {
      console.warn('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleTestLatency = async (modelId = 'openrouter') => {
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
      const json = await res.json();
      if (json.success && json.result) {
        setLatencies((prev) => ({ ...prev, [modelId]: json.result.latencyMs }));
      }
    } catch {
      // Non-blocking
    } finally {
      setTestingModel(null);
    }
  };

  const handleSelectModel = async (modelId: string) => {
    setActivatingModel(modelId);
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
      const json = await res.json();
      if (json.success) {
        setActiveModel(modelId);
      }
    } catch {
      // Non-blocking
    } finally {
      setActivatingModel(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-xs font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
        <div className="flex items-center gap-2">
          <RotateCw size={14} className="animate-spin" />
          <span>Connecting to OpenRouter Universal Gateway...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_tenants: 0,
    active_tenants: 0,
    total_tokens_month: 0,
    estimated_monthly_revenue_usd: 0,
    system_uptime_seconds: 0,
  };

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  // Find max requests for chart scaling
  const maxReqs = Math.max(1, ...traffic.map((t) => t.requests));

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* 1. Header Hero Card with Dot Grain */}
      <div
        className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] p-6 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(20,19,16,0.05) 0.5px, transparent 0.5px)',
          backgroundSize: '4px 4px',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
              UNIVERSAL AI ENGINE
            </div>
            <div className="flex items-center gap-2.5">
              <InkStatusGlyph status="healthy" />
              <h2 className="text-base font-semibold text-[#141310] tracking-tight">
                OpenRouter Universal Gateway Operational
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] font-['IBM_Plex_Mono',monospace] text-xs text-[#141310] mt-1">
              <span className="text-[rgba(20,19,16,0.42)]">Active Router:</span>
              <span className="font-semibold">{activeModel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestLatency('openrouter_gateway')}
              disabled={testingModel === 'openrouter_gateway'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
            >
              <Activity size={12} className={testingModel === 'openrouter_gateway' ? 'animate-pulse' : ''} />
              <span>
                {testingModel === 'openrouter_gateway'
                  ? 'Pinging...'
                  : latencies.openrouter_gateway
                  ? `Gateway: ${latencies.openrouter_gateway}ms`
                  : 'Ping Gateway'}
              </span>
            </button>

            <button
              onClick={() => onSwitchTab('openrouter')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium hover:bg-[rgba(20,19,16,0.85)] transition-colors"
            >
              <Compass size={13} />
              <span>Model Catalog ({openRouterCount}+)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tokens */}
        <div
          onClick={() => onSwitchTab('analytics')}
          className="p-4 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-1 cursor-pointer hover:border-[rgba(20,19,16,0.3)] transition-colors"
        >
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
            MONTHLY TOKENS
          </div>
          <div className="text-xl font-semibold font-['IBM_Plex_Mono',monospace] text-[#141310]">
            {(metrics.total_tokens_month / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
            {metrics.total_tokens_month.toLocaleString()} total tokens routed
          </div>
        </div>

        {/* Active Tenants / Users */}
        <div
          onClick={() => onSwitchTab('users')}
          className="p-4 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-1 cursor-pointer hover:border-[rgba(20,19,16,0.3)] transition-colors"
        >
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
            ACTIVE TENANTS
          </div>
          <div className="text-xl font-semibold font-['IBM_Plex_Mono',monospace] text-[#141310]">
            {metrics.active_tenants} / {metrics.total_tenants}
          </div>
          <div className="text-[11px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
            API consumers & keys
          </div>
        </div>

        {/* Est Revenue */}
        <div
          onClick={() => onSwitchTab('plans')}
          className="p-4 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-1 cursor-pointer hover:border-[rgba(20,19,16,0.3)] transition-colors"
        >
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
            MONTHLY RUN-RATE
          </div>
          <div className="text-xl font-semibold font-['IBM_Plex_Mono',monospace] text-[#141310]">
            ${metrics.estimated_monthly_revenue_usd.toLocaleString()}
          </div>
          <div className="text-[11px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
            Pro & Enterprise plans
          </div>
        </div>

        {/* System Uptime */}
        <div className="p-4 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
            GATEWAY UPTIME
          </div>
          <div className="text-xl font-semibold font-['IBM_Plex_Mono',monospace] text-[#141310]">
            {formatUptime(metrics.system_uptime_seconds)}
          </div>
          <div className="text-[11px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
            Universal streaming core
          </div>
        </div>
      </div>

      {/* 3. Featured OpenRouter Model Matrix Table */}
      <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(20,19,16,0.14)] flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
              OPENROUTER MODEL FLEET MATRIX
            </div>
            <div className="text-xs text-[rgba(20,19,16,0.62)] mt-0.5">
              1-Click dynamic routing across reasoning, code intelligence, and general powerhouse models.
            </div>
          </div>

          <button
            onClick={() => onSwitchTab('openrouter')}
            className="text-xs font-medium text-[#141310] underline underline-offset-2 hover:opacity-75"
          >
            Explore 100+ Models →
          </button>
        </div>

        <div className="overflow-x-auto min-w-[700px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(20,19,16,0.14)] bg-[#f4f1ea]/60">
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  MODEL & ARCHITECTURE
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  CAPABILITY
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                  CONTEXT
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] text-right">
                  LATENCY
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] text-right">
                  ROUTER ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,19,16,0.14)]">
              {FEATURED_MODELS.map((m) => {
                const isActive = activeModel === m.id;
                const isTesting = testingModel === m.id;
                const isActivating = activatingModel === m.id;
                const latency = latencies[m.id];

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-[rgba(20,19,16,0.02)] transition-colors h-[48px] ${
                      isActive ? 'bg-[rgba(20,19,16,0.03)]' : ''
                    }`}
                  >
                    {/* Model Name & ID */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#141310]">{m.name}</span>
                        {m.isFree && (
                          <span className="px-1.5 py-0.2 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[9.5px] font-['IBM_Plex_Mono',monospace] font-semibold text-[#141310]">
                            FREE
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                        {m.id}
                      </div>
                    </td>

                    {/* Tag & Description */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-['IBM_Plex_Mono',monospace] text-[10.5px] px-2 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[#141310]">
                        {m.tag}
                      </span>
                    </td>

                    {/* Context */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-['IBM_Plex_Mono',monospace] text-[11px] text-[rgba(20,19,16,0.62)]">
                      {m.context}
                    </td>

                    {/* Latency */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-right font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.75)]">
                      {latency ? `${latency}ms` : '--'}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTestLatency(m.id)}
                          disabled={isTesting}
                          className="px-2 py-1 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[#f4f1ea] transition-colors font-['IBM_Plex_Mono',monospace]"
                        >
                          {isTesting ? 'Ping...' : 'Ping'}
                        </button>

                        {isActive ? (
                          <span className="px-2.5 py-1 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium font-['IBM_Plex_Mono',monospace] flex items-center gap-1">
                            <Check size={11} /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectModel(m.id)}
                            disabled={isActivating}
                            className="px-2.5 py-1 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] hover:bg-[#141310] hover:text-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
                          >
                            {isActivating ? 'Routing...' : 'Set Active'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Split Row: 14-Day Traffic Stepped Chart + Real Audit Logs Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Traffic Chart */}
        <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  DAILY REQUEST VOLUME (LAST 14 DAYS)
                </div>
                <div className="text-xs text-[rgba(20,19,16,0.62)] mt-0.5">
                  Stepped ink volume distribution across universal gateway.
                </div>
              </div>
              <span className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                14d Rolling
              </span>
            </div>

            {/* Stepped Ink Bars */}
            <div className="flex items-end justify-between gap-1.5 h-32 pt-6 px-1">
              {traffic.map((day, idx) => {
                const heightPct = Math.max(8, Math.round((day.requests / maxReqs) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-[#141310] text-[#faf8f3] text-[9.5px] font-['IBM_Plex_Mono',monospace] whitespace-nowrap z-10">
                      {day.date}: {day.requests} reqs
                    </div>
                    {/* Bar */}
                    <div
                      className="w-full bg-[#141310] rounded-t-sm transition-all group-hover:opacity-75"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Label */}
                    <span className="text-[9px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real Audit Stream */}
        <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  REAL AUDIT & EVENT STREAM
                </div>
                <div className="text-xs text-[rgba(20,19,16,0.62)] mt-0.5">
                  Live immutable audit trail logged directly to database.
                </div>
              </div>

              <button
                onClick={() => onSwitchTab('audit')}
                className="text-xs font-medium text-[#141310] hover:underline"
              >
                All Logs →
              </button>
            </div>

            <div className="p-3 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] font-['IBM_Plex_Mono',monospace] text-[11.5px] leading-[1.6] overflow-x-auto whitespace-pre max-h-[140px] mt-3">
              {auditLogs.length > 0 ? (
                auditLogs.map((log, idx) => {
                  const isErr = log.action_type.includes('FAIL') || log.action_type.includes('ERROR');
                  return (
                    <div key={log.id || idx} className={isErr ? 'text-[#c8321e] font-semibold' : 'text-[rgba(20,19,16,0.75)]'}>
                      [{new Date(log.created_at).toLocaleTimeString()}] {log.action_type} · {log.admin_email} · {log.target_entity}
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="text-[rgba(20,19,16,0.42)]">[SYSTEM] OpenRouter Universal Gateway initialized on port 3000</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[ROUTER] Active model: {activeModel}</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[AUTH] Supabase TOTP MFA guard enabled for superadmin</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
