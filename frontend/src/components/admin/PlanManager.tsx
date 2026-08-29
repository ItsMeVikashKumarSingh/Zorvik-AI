import React, { useState, useEffect } from 'react';
import {
  Check,
  RotateCw,
  Edit2,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  monthly_price_usd?: number;
  price_usd?: number;
  monthly_token_quota: number;
  rate_limit_per_minute: number;
  features: string[];
  stripe_price_id?: string;
  is_active: boolean;
}

interface PlanManagerProps {
  token: string;
}

export const PlanManager: React.FC<PlanManagerProps> = ({ token }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQuota, setEditQuota] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editFeatures, setEditFeatures] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/plans', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setPlans(json.plans || []);
      }
    } catch (err) {
      console.warn('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const handleOpenEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditPrice(plan.monthly_price_usd ?? plan.price_usd ?? 0);
    setEditQuota(plan.monthly_token_quota);
    setEditRate(plan.rate_limit_per_minute);
    setEditFeatures(Array.isArray(plan.features) ? plan.features.join('\n') : '');
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);

    try {
      const featuresArray = editFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await fetch(`/api/v1/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': token,
        },
        body: JSON.stringify({
          name: editName.trim(),
          monthly_price_usd: Number(editPrice),
          monthly_token_quota: Number(editQuota),
          rate_limit_per_minute: Number(editRate),
          features: featuresArray,
        }),
      });

      if (res.ok) {
        setMessage(`Plan "${editName}" updated successfully in database.`);
        setEditingPlan(null);
        fetchPlans();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Error updating plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            MONETIZATION & QUOTA TIERS
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            Subscription Pricing & Token Quota Tiers
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Configure monthly token budgets, concurrency rate limits, and plan capabilities stored in database.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Plans</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] text-xs text-[#141310] font-['IBM_Plex_Mono',monospace] flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#141310]" />
          <span>{message}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isFeatured = p.id === 'pro';
          const price = p.monthly_price_usd ?? p.price_usd ?? 0;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-lg bg-[#faf8f3] border transition-all flex flex-col justify-between ${
                isFeatured
                  ? 'border-[#141310] ring-1 ring-[#141310]'
                  : 'border-[rgba(20,19,16,0.14)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#141310]">{p.name}</span>
                  {isFeatured && (
                    <span className="px-1.5 py-0.5 rounded bg-[#141310] text-[#faf8f3] text-[10px] font-semibold font-['IBM_Plex_Mono',monospace]">
                      POPULAR
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-2xl font-bold font-['IBM_Plex_Mono',monospace] text-[#141310]">
                    ${price}
                  </span>
                  <span className="text-xs text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">/ month</span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-[rgba(20,19,16,0.10)] mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[rgba(20,19,16,0.62)]">Monthly Tokens</span>
                    <span className="font-['IBM_Plex_Mono',monospace] font-medium text-[#141310]">
                      {(p.monthly_token_quota / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[rgba(20,19,16,0.62)]">Rate Limit</span>
                    <span className="font-['IBM_Plex_Mono',monospace] font-medium text-[#141310]">
                      {p.rate_limit_per_minute} req/min
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-[rgba(20,19,16,0.10)]">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                    INCLUDED CAPABILITIES
                  </div>
                  <ul className="space-y-1.5 text-xs text-[rgba(20,19,16,0.75)]">
                    {p.features?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={12} className="text-[#141310] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[rgba(20,19,16,0.10)]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(p)}
                  className="w-full py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={12} />
                  <span>Edit Plan Terms</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-[#141310]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.20)] rounded-lg p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
              <div>
                <h3 className="text-sm font-semibold text-[#141310]">Edit Pricing Plan: {editingPlan.id}</h3>
                <p className="text-[11px] text-[rgba(20,19,16,0.42)]">Changes save directly to database.</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-[rgba(20,19,16,0.42)] hover:text-[#141310]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                    Monthly Price ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                    Rate Limit (Req / min)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Monthly Token Quota
                </label>
                <input
                  type="number"
                  min="100000"
                  step="1000000"
                  value={editQuota}
                  onChange={(e) => setEditQuota(Number(e.target.value))}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Features List (One per line)
                </label>
                <textarea
                  rows={4}
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(20,19,16,0.14)]">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-[#141310] hover:bg-[rgba(20,19,16,0.85)] text-[#faf8f3] text-xs font-medium flex items-center gap-1.5"
                >
                  <Save size={12} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
