import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Search,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleToggleActive = async (tenant: TenantItem) => {
    try {
      const res = await fetch(`/api/v1/admin/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !tenant.is_active,
        }),
      });

      if (res.ok) {
        fetchTenants();
      }
    } catch (err) {
      console.warn('Failed to toggle tenant:', err);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white tracking-tight">Tenants & API Key Gateways</h1>
          <p className="text-xs sm:text-sm text-silver/50 font-light mt-1">
            Provision, manage, and monitor dedicated <code className="text-iris font-mono">x-tenant-id</code> authenticated API keys.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-iris hover:bg-iris-hover text-white text-xs font-medium transition-all shadow-lg shadow-iris/20 shrink-0"
        >
          <Plus size={15} />
          <span>Provision New Key</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tenant ID, name, or plan tier..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090916] border border-white/[0.08] text-xs text-white placeholder-silver/30 focus:outline-none focus:border-iris"
          />
        </div>
        <button
          onClick={fetchTenants}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-silver/50 hover:text-white transition-colors"
          title="Refresh List"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-[#090916] border border-white/[0.08] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-mono uppercase text-silver/40 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Tenant ID & API Key</th>
                <th className="px-5 py-3.5">Name / Owner</th>
                <th className="px-5 py-3.5">Plan Tier</th>
                <th className="px-5 py-3.5">Rate Limit</th>
                <th className="px-5 py-3.5">Token Quota (Mo)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-silver/40">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-white text-xs bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]">
                          {t.id}
                        </code>
                        <button
                          onClick={() => handleCopyKey(t.id)}
                          className="text-silver/40 hover:text-white transition-colors"
                          title="Copy Key"
                        >
                          {copiedKey === t.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{t.name}</div>
                      {t.owner_email && <div className="text-[11px] text-silver/40 font-light">{t.owner_email}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border ${
                        t.tier === 'enterprise'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : t.tier === 'pro'
                          ? 'bg-iris/10 text-iris border-iris/20'
                          : 'bg-white/[0.04] text-silver/70 border-white/[0.08]'
                      }`}>
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-silver/70 font-mono">
                      {t.rate_limit_per_minute} req/min
                    </td>
                    <td className="px-5 py-4 text-silver/70 font-mono">
                      {(t.monthly_token_quota / 1000000).toFixed(1)}M tokens
                    </td>
                    <td className="px-5 py-4">
                      {t.is_active ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded-md border border-crimson/20">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          t.is_active
                            ? 'bg-crimson/10 text-crimson hover:bg-crimson/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {t.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Key Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0a16] border border-white/[0.12] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-iris/10 text-iris">
                  <Key size={16} />
                </div>
                <h3 className="text-base font-medium text-white">Provision Paid API Key</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-silver/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono uppercase text-silver/50 mb-1">
                  Tenant ID / Authenticated Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. zorvik-prod-app or client_company_ai"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-iris font-mono"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-silver/50 mb-1">Tenant Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Mobile App"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-iris"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-silver/50 mb-1">Paid Pricing Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0c0c1e] border border-white/[0.1] text-white focus:outline-none focus:border-iris"
                  >
                    <option value="starter">Starter Plan ($19/mo - 5M tokens)</option>
                    <option value="pro">Pro Scale Plan ($49/mo - 20M tokens)</option>
                    <option value="enterprise">Enterprise Plan ($199/mo - 100M tokens)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono uppercase text-silver/50 mb-1">Owner Email</label>
                  <input
                    type="email"
                    placeholder="client@zorvik.tech"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-iris"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-silver/50 mb-1">
                  Custom System Prompt Override (Optional)
                </label>
                <textarea
                  placeholder="Custom instruction for this tenant's calls..."
                  rows={2}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-iris resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-silver hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-iris hover:bg-iris-hover text-white font-medium shadow-md shadow-iris/20"
                >
                  Create & Activate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
