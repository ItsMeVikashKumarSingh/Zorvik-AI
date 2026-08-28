import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Cpu,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
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
  providers: Record<string, { status: string; failures: number }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onSwitchTab }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch('/api/v1/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.warn('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    const interval = setInterval(fetchOverview, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [token]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-silver/40 text-xs">
        Loading real-time telemetry metrics...
      </div>
    );
  }

  const { metrics, providers } = data;

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const KPI_CARDS = [
    {
      title: 'Estimated Monthly Revenue',
      value: `$${metrics.estimated_monthly_revenue_usd.toLocaleString()}`,
      subtext: 'Based on active enterprise & pro subscriptions',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      actionTab: 'plans' as AdminTab,
    },
    {
      title: 'Active Paid Tenants',
      value: `${metrics.active_tenants} / ${metrics.total_tenants}`,
      subtext: 'API consumers & microservice gateways',
      icon: Users,
      color: 'text-iris',
      bgColor: 'bg-iris/10',
      actionTab: 'tenants' as AdminTab,
    },
    {
      title: 'Token Consumption (30d)',
      value: `${(metrics.total_tokens_month / 1000000).toFixed(2)}M`,
      subtext: `${metrics.total_tokens_month.toLocaleString()} total tokens routed`,
      icon: Cpu,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      actionTab: 'tenants' as AdminTab,
    },
    {
      title: 'Microservice Uptime',
      value: formatUptime(metrics.system_uptime_seconds),
      subtext: 'Zero-downtime multi-cascade engine',
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      actionTab: 'circuit' as AdminTab,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">System Overview</h1>
        <p className="text-xs sm:text-sm text-silver/50 font-light mt-1">
          Real-time monetization metrics, active tenant quotas, and multi-model cascade telemetry.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onSwitchTab(card.actionTab)}
              className="p-5 rounded-2xl bg-[#090916] border border-white/[0.08] hover:border-iris/40 transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color}`}>
                  <IconComp size={18} />
                </div>
                <ArrowRight size={14} className="text-silver/20 group-hover:text-iris transition-colors" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-white tracking-tight">{card.value}</div>
                <div className="text-xs text-white/80 font-medium">{card.title}</div>
                <div className="text-[11px] text-silver/40 font-light truncate">{card.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Cascade Status Card */}
      <div className="p-6 rounded-2xl bg-[#090916] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-iris/10 text-iris">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">AI Provider Cascade Engine</h3>
              <p className="text-xs text-silver/40 font-light">
                Circuit breaker automated health and failover matrix
              </p>
            </div>
          </div>
          <button
            onClick={() => onSwitchTab('circuit')}
            className="text-xs text-iris hover:underline font-mono"
          >
            Manage Circuit Breakers →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {Object.entries(providers).map(([providerName, provData]) => {
            const isOnline = provData.status === 'online' || provData.status === 'half-open';
            return (
              <div
                key={providerName}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-white capitalize">{providerName}</div>
                  <div className="text-[10px] font-mono text-silver/40 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    <span>Failures: {provData.failures || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={10} /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded-md">
                      <AlertCircle size={10} /> Tripped
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
