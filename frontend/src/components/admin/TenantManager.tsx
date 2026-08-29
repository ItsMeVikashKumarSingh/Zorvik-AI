import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Check,
  X,
  RotateCw,
  Copy,
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  plan_id?: string;
  tier: string;
  rate_limit_per_minute: number;
  monthly_token_quota: number;
  tokens_used_this_month?: number;
  custom_system_prompt?: string | null;
  is_active: boolean;
  owner_email?: string | null;
  created_at: string;
}

interface TenantManagerProps {
  token: string;
}

export const TenantManager: React.FC<TenantManagerProps> = ({ token }) => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Tenant Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState('pro');
  const [newEmail, setNewEmail] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/tenants', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTenants(json.tenants || []);
      }
    } catch (err) {
      console.warn('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [token]);

  const handleCopyKey = (keyId: string) => {
    navigator.clipboard.writeText(keyId);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newId.trim() || !newName.trim()) {
      setFormError('Tenant ID and Name are required.');
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: newId.trim(),
          name: newName.trim(),
          plan_id: newPlan,
          owner_email: newEmail.trim() || null,
          custom_system_prompt: newPrompt.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create tenant');
      }

      setCreateModalOpen(false);
      setNewId('');
      setNewName('');
      setNewEmail('');
      setNewPrompt('');
      fetchTenants();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleToggleTenant = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/v1/admin/tenants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      fetchTenants();
    } catch (err) {
      console.warn('Failed to toggle tenant:', err);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.owner_email && t.owner_email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            MULTI-TENANT AUTHORIZATION
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            Tenant Provisioning & API Keys
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Manage enterprise API keys, token deduction quotas, rate limits, and custom persona prompts.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#141310] hover:bg-[rgba(20,19,16,0.85)] text-[#faf8f3] text-xs font-medium transition-colors shrink-0"
        >
          <Plus size={14} />
          <span>Provision Tenant</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgba(20,19,16,0.42)]" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] rounded pl-8 pr-3 py-1.5 text-xs text-[#141310] placeholder-[rgba(20,19,16,0.42)] outline-none focus:border-[#141310] transition-colors"
          />
        </div>

        <button
          onClick={fetchTenants}
          className="flex items-center gap-1 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] hover:bg-[#f4f1ea] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors font-medium"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tenants Table */}
      <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] overflow-hidden">
        <div className="overflow-x-auto min-w-[700px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(20,19,16,0.14)] bg-[#f4f1ea]/60">
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  TENANT ID / KEY
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  NAME & OWNER
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  TIER
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] text-right">
                  MONTHLY QUOTA
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] text-right">
                  STATUS
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,19,16,0.14)]">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[rgba(20,19,16,0.42)] text-xs">
                    No tenants found. Click "Provision Tenant" to generate a key.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const used = t.tokens_used_this_month || 0;
                  const quota = t.monthly_token_quota || 1000000;
                  const pct = Math.min(100, Math.round((used / quota) * 100));

                  return (
                    <tr key={t.id} className="hover:bg-[rgba(20,19,16,0.02)] transition-colors h-[48px]">
                      {/* Key */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace]">
                          <span className="text-xs font-medium text-[#141310]">{t.id}</span>
                          <button
                            onClick={() => handleCopyKey(t.id)}
                            className="text-[rgba(20,19,16,0.42)] hover:text-[#141310] p-1 rounded"
                            title="Copy API Key"
                          >
                            {copiedKey === t.id ? (
                              <Check size={11} className="text-[#141310]" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name & Owner */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#141310]">{t.name}</div>
                        <div className="text-[10.5px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                          {t.owner_email || 'No owner assigned'}
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[10.5px] font-['IBM_Plex_Mono',monospace] font-semibold text-[#141310] uppercase">
                          {t.tier || t.plan_id || 'free'}
                        </span>
                      </td>

                      {/* Quota */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-right font-['IBM_Plex_Mono',monospace] text-[11px]">
                        <div>
                          <span className="text-[#141310] font-medium">{(used / 1000).toFixed(0)}k</span>
                          <span className="text-[rgba(20,19,16,0.42)]"> / {(quota / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="w-20 h-1 rounded-full bg-[rgba(20,19,16,0.10)] ml-auto mt-1 overflow-hidden">
                          <div className="h-full bg-[#141310]" style={{ width: `${pct}%` }} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-right">
                        <span
                          className={`text-[10.5px] font-['IBM_Plex_Mono',monospace] px-2 py-0.5 rounded border ${
                            t.is_active
                              ? 'border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[#141310]'
                              : 'border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e]'
                          }`}
                        >
                          {t.is_active ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleToggleTenant(t.id, t.is_active)}
                          className={`text-xs font-medium hover:underline ${
                            t.is_active ? 'text-[rgba(20,19,16,0.62)] hover:text-[#c8321e]' : 'text-[#141310]'
                          }`}
                        >
                          {t.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-[#141310]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.20)] rounded-lg p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
              <h3 className="text-sm font-semibold text-[#141310]">Provision Tenant Key</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[rgba(20,19,16,0.42)] hover:text-[#141310]"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded border border-[#c8321e]/30 bg-[#c8321e]/10 text-xs text-[#c8321e] font-['IBM_Plex_Mono',monospace]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Tenant Unique Key / Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. acme_corp_prod"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Tenant Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Plan Tier
                </label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                >
                  <option value="free">Free (10k tokens / 10 req/min)</option>
                  <option value="pro">Pro ($29/mo · 5M tokens / 60 req/min)</option>
                  <option value="enterprise">Enterprise ($299/mo · 50M tokens / 300 req/min)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Owner Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="admin@acmecorp.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Custom System Persona / Directives (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Inject tenant-specific rules or context..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(20,19,16,0.14)]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#141310] hover:bg-[rgba(20,19,16,0.85)] text-[#faf8f3] text-xs font-medium"
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
