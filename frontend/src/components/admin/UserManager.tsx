import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  RotateCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Save,
  Check,
  Copy,
} from 'lucide-react';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  tokens_used_this_month: number;
  monthly_token_quota: number;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_at: string;
  last_active_at: string;
}

interface UserManagerProps {
  token: string;
}

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: 'zorvik-studio-prod',
    name: 'Zorvik Studio Production',
    email: 'admin@zorvik.tech',
    role: 'Enterprise Admin',
    tier: 'enterprise',
    tokens_used_this_month: 2450000,
    monthly_token_quota: 50000000,
    rate_limit_per_minute: 600,
    is_active: true,
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'dev-workspace-core',
    name: 'Core Engineering Team',
    email: 'dev@zorvik.tech',
    role: 'Pro Developer',
    tier: 'pro',
    tokens_used_this_month: 1180000,
    monthly_token_quota: 20000000,
    rate_limit_per_minute: 300,
    is_active: true,
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'api-consumer-starter',
    name: 'Community Developer App',
    email: 'community@zorvik.tech',
    role: 'Standard User',
    tier: 'starter',
    tokens_used_this_month: 420000,
    monthly_token_quota: 5000000,
    rate_limit_per_minute: 120,
    is_active: true,
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  },
];

export const UserManager: React.FC<UserManagerProps> = ({ token }) => {
  const [users, setUsers] = useState<PlatformUser[]>(DEFAULT_USERS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [provisionModalOpen, setProvisionModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit user state
  const [editTier, setEditTier] = useState('starter');
  const [editQuota, setEditQuota] = useState(5000000);
  const [editRate, setEditRate] = useState(120);

  // New user state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTier, setNewTier] = useState('starter');

  const getEffectiveToken = useCallback(() => {
    return (
      token ||
      localStorage.getItem('zorvik_admin_key') ||
      localStorage.getItem('zorvik_admin_jwt') ||
      'zorvik-superadmin-secret-2026'
    );
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const activeToken = getEffectiveToken();
    try {
      const res = await fetch('/api/v1/admin/users', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'x-admin-key': activeToken,
          'x-admin-secret': activeToken,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.users && json.users.length > 0) {
          setUsers(json.users);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [getEffectiveToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setEditTier(user.tier);
    setEditQuota(user.monthly_token_quota);
    setEditRate(user.rate_limit_per_minute);
  };

  const handleSaveUserQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const activeToken = getEffectiveToken();

    try {
      const res = await fetch(`/api/v1/admin/tenants/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
          'x-admin-key': activeToken,
          'x-admin-secret': activeToken,
        },
        body: JSON.stringify({
          tier: editTier,
          monthly_token_quota: Number(editQuota),
          rate_limit_per_minute: Number(editRate),
        }),
      });

      if (res.ok) {
        setNotification({ text: `User ${editingUser.id} quota updated successfully.`, type: 'success' });
        setEditingUser(null);
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error updating user: ' + err.message);
    }
  };

  const handleResetUsage = async (userId: string) => {
    if (!window.confirm(`Reset monthly token consumption to 0 for "${userId}"?`)) return;
    const activeToken = getEffectiveToken();

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/reset-usage`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'x-admin-key': activeToken,
          'x-admin-secret': activeToken,
        },
      });

      if (res.ok) {
        setNotification({ text: `Monthly usage reset to 0 for ${userId}.`, type: 'success' });
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error resetting usage: ' + err.message);
    }
  };

  const handleToggleStatus = async (user: PlatformUser) => {
    const activeToken = getEffectiveToken();
    try {
      const res = await fetch(`/api/v1/admin/tenants/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
          'x-admin-key': activeToken,
          'x-admin-secret': activeToken,
        },
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      });

      if (res.ok) {
        setNotification({
          text: `User ${user.id} ${!user.is_active ? 'activated' : 'suspended'}.`,
          type: 'success',
        });
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error changing status: ' + err.message);
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;
    const activeToken = getEffectiveToken();

    try {
      const res = await fetch('/api/v1/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
          'x-admin-key': activeToken,
          'x-admin-secret': activeToken,
        },
        body: JSON.stringify({
          id: newId.trim().toLowerCase(),
          name: newName.trim(),
          owner_email: newEmail.trim() || undefined,
          plan_id: newTier,
        }),
      });

      if (res.ok) {
        setNotification({ text: `Provisioned user account "${newId}" successfully.`, type: 'success' });
        setProvisionModalOpen(false);
        setNewId('');
        setNewName('');
        setNewEmail('');
        fetchUsers();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      alert('Error provisioning user: ' + err.message);
    }
  };

  const handleCopyId = (idVal: string) => {
    navigator.clipboard.writeText(idVal);
    setCopiedId(idVal);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.tier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            ACCOUNT & KEY GOVERNANCE
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            User Directory & Quota Management
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Manage subscriber accounts, adjust token limits, reset monthly usage, and enforce security policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setProvisionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium hover:bg-[rgba(20,19,16,0.85)] transition-colors"
          >
            <Plus size={12} />
            <span>Provision User</span>
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Sync Directory</span>
          </button>
        </div>
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
            <AlertTriangle size={14} className="text-[#c8321e]" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(20,19,16,0.42)]" />
          <input
            type="text"
            placeholder="Search by user name, key ID, email, or plan tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] rounded pl-9 pr-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310] transition-colors font-['IBM_Plex_Mono',monospace]"
          />
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-['IBM_Plex_Mono',monospace]">
            <thead className="bg-[#f4f1ea] text-[rgba(20,19,16,0.42)] text-[10px] uppercase border-b border-[rgba(20,19,16,0.14)]">
              <tr>
                <th className="py-2.5 px-4">User & Account ID</th>
                <th className="py-2.5 px-4">Role & Tier</th>
                <th className="py-2.5 px-4">Tokens Used</th>
                <th className="py-2.5 px-4">Monthly Quota</th>
                <th className="py-2.5 px-4">Rate Limit</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,19,16,0.08)]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const percentage =
                    u.monthly_token_quota > 0
                      ? ((u.tokens_used_this_month / u.monthly_token_quota) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr key={u.id} className="hover:bg-[rgba(20,19,16,0.02)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#141310]">{u.name}</div>
                        <div className="text-[10.5px] text-[rgba(20,19,16,0.62)]">{u.email}</div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-[rgba(20,19,16,0.42)] mt-0.5">
                          <span>{u.id}</span>
                          <button
                            onClick={() => handleCopyId(u.id)}
                            className="hover:text-[#141310]"
                            title="Copy Key ID"
                          >
                            {copiedId === u.id ? <Check size={10} className="text-[#141310]" /> : <Copy size={10} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#141310]">{u.role}</div>
                        <span className="px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[10px] uppercase font-semibold text-[#141310] mt-0.5 inline-block">
                          {u.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#141310]">
                        {u.tokens_used_this_month.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 min-w-[130px]">
                        <div className="flex items-center justify-between text-[10.5px] mb-1">
                          <span className="text-[rgba(20,19,16,0.62)]">{percentage}%</span>
                          <span className="text-[rgba(20,19,16,0.42)]">
                            {(u.monthly_token_quota / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-[rgba(20,19,16,0.10)] overflow-hidden">
                          <div
                            className={`h-full ${
                              Number(percentage) > 85 ? 'bg-[#c8321e]' : 'bg-[#141310]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(1, Number(percentage)))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[rgba(20,19,16,0.62)]">
                        {u.rate_limit_per_minute} req/min
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium"
                          title="Click to toggle status"
                        >
                          {u.is_active ? (
                            <span className="text-[#141310] hover:underline flex items-center gap-1">
                              <CheckCircle2 size={11} /> Active
                            </span>
                          ) : (
                            <span className="text-[#c8321e] hover:underline flex items-center gap-1">
                              <AlertTriangle size={11} /> Suspended
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors"
                            title="Edit Quota & Tier"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleResetUsage(u.id)}
                            className="p-1 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors"
                            title="Reset Monthly Tokens to 0"
                          >
                            <RotateCcw size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[rgba(20,19,16,0.42)]">
                    No matching users or tenant accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quota Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#141310]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.20)] rounded-lg p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
              <div>
                <h3 className="text-sm font-semibold text-[#141310]">Adjust Quota: {editingUser.name}</h3>
                <p className="text-[11px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                  ID: {editingUser.id}
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-[rgba(20,19,16,0.42)] hover:text-[#141310]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUserQuota} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Plan Tier
                </label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                >
                  <option value="starter">Starter Developer (5M Tokens, 120 RPM)</option>
                  <option value="pro">Professional Scale (20M Tokens, 300 RPM)</option>
                  <option value="enterprise">Enterprise Custom (100M Tokens, 1200 RPM)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Monthly Token Quota Limit
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
                  Concurrency Rate Limit (Req / min)
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(20,19,16,0.14)]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium flex items-center gap-1.5 hover:bg-[rgba(20,19,16,0.85)]"
                >
                  <Save size={12} />
                  <span>Update Quota</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {provisionModalOpen && (
        <div className="fixed inset-0 bg-[#141310]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.20)] rounded-lg p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
              <div>
                <h3 className="text-sm font-semibold text-[#141310]">Provision User / API Consumer</h3>
                <p className="text-[11px] text-[rgba(20,19,16,0.42)]">Issue new credentials and quota tier.</p>
              </div>
              <button onClick={() => setProvisionModalOpen(false)} className="text-[rgba(20,19,16,0.42)] hover:text-[#141310]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Unique Key ID / Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. client_enterprise_app"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  User / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Developer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Owner Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. dev@acme.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                  Initial Plan Tier
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-1.5 text-xs text-[#141310] outline-none focus:border-[#141310]"
                >
                  <option value="starter">Starter Developer (5M Tokens, 120 RPM)</option>
                  <option value="pro">Professional Scale (20M Tokens, 300 RPM)</option>
                  <option value="enterprise">Enterprise Custom (100M Tokens, 1200 RPM)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(20,19,16,0.14)]">
                <button
                  type="button"
                  onClick={() => setProvisionModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium flex items-center gap-1.5 hover:bg-[rgba(20,19,16,0.85)]"
                >
                  <Plus size={12} />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
