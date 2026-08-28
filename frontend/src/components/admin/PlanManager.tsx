import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, ShieldAlert } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  monthly_price_usd: number;
  monthly_token_quota: number;
  rate_limit_per_minute: number;
  overage_rate_per_million: number;
  max_api_keys: number;
  features: string[];
  is_active: boolean;
}

interface PlanManagerProps {
  token: string;
}

export const PlanManager: React.FC<PlanManagerProps> = ({ token }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/v1/admin/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPlans(json.plans || []);
      }
    } catch (err) {
      console.warn('Failed to fetch plans:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await fetch(`/api/v1/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingPlan),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setEditingPlan(null);
        fetchPlans();
      }
    } catch (err) {
      console.warn('Failed to save plan:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-medium text-white tracking-tight">Monetization & Pricing Plans</h1>
        <p className="text-xs sm:text-sm text-silver/50 font-light mt-1">
          Configure paid API subscription tiers, token quotas, overage charges, and rate limits.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check size={14} />
          <span>Plan configuration updated successfully & logged in audit trail.</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEnterprise = plan.id === 'enterprise';
          const isPro = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-[#090916] border transition-all flex flex-col justify-between shadow-xl relative ${
                isEnterprise
                  ? 'border-purple-500/40 shadow-purple-950/20'
                  : isPro
                  ? 'border-iris/40 shadow-iris/10'
                  : 'border-white/[0.08]'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-iris text-[10px] font-mono uppercase text-white font-semibold">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                    <span className="text-[10px] font-mono uppercase text-silver/40">{plan.id}</span>
                  </div>
                  <div className={`p-2 rounded-xl ${isEnterprise ? 'bg-purple-500/10 text-purple-400' : 'bg-iris/10 text-iris'}`}>
                    {isEnterprise ? <ShieldAlert size={18} /> : isPro ? <Sparkles size={18} /> : <Zap size={18} />}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white tracking-tight">${plan.monthly_price_usd}</span>
                    <span className="text-xs text-silver/40 font-light">/ month</span>
                  </div>
                  <div className="text-xs text-silver/50 font-light mt-1">
                    Includes {(plan.monthly_token_quota / 1000000).toFixed(0)}M tokens / month
                  </div>
                </div>

                {/* Quota & Limits Info */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-silver/40">Rate Limit:</span>
                    <span className="text-white font-mono">{plan.rate_limit_per_minute} req/min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-silver/40">Overage Rate:</span>
                    <span className="text-white font-mono">${plan.overage_rate_per_million}/1M tok</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-silver/40">Max API Keys:</span>
                    <span className="text-white font-mono">{plan.max_api_keys} keys</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] font-mono uppercase text-silver/40">Tier Features</div>
                  {plan.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-silver/80 font-light">
                      <Check size={13} className="text-iris shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white transition-colors"
                >
                  Edit Tier Parameters
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0a0a16] border border-white/[0.12] shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-medium text-white">Edit Plan: {editingPlan.name}</h3>

            <form onSubmit={handleUpdatePlan} className="space-y-3">
              <div>
                <label className="block text-silver/50 font-mono uppercase mb-1">Monthly Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.monthly_price_usd}
                  onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price_usd: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white"
                />
              </div>

              <div>
                <label className="block text-silver/50 font-mono uppercase mb-1">Monthly Token Quota</label>
                <input
                  type="number"
                  value={editingPlan.monthly_token_quota}
                  onChange={(e) => setEditingPlan({ ...editingPlan, monthly_token_quota: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-silver/50 font-mono uppercase mb-1">Rate Limit (Req/Min)</label>
                  <input
                    type="number"
                    value={editingPlan.rate_limit_per_minute}
                    onChange={(e) => setEditingPlan({ ...editingPlan, rate_limit_per_minute: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white"
                  />
                </div>
                <div>
                  <label className="block text-silver/50 font-mono uppercase mb-1">Overage ($/1M Tokens)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.overage_rate_per_million}
                    onChange={(e) => setEditingPlan({ ...editingPlan, overage_rate_per_million: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-silver hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-iris hover:bg-iris-hover text-white font-medium shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
