import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Lock,
  Compass,
  Activity,
  ChevronsUpDown,
  Key,
  BarChart2,
  Users,
  Sparkles,
} from 'lucide-react';
import { OpenRouterCatalog } from './OpenRouterCatalog';
import { AdminDashboard } from './AdminDashboard';
import { PlanManager } from './PlanManager';
import { AuditLogViewer } from './AuditLogViewer';
import { KeyVaultManager } from './KeyVaultManager';
import { QuotaAnalyticsDashboard } from './QuotaAnalyticsDashboard';
import { UserManager } from './UserManager';
import { MediaStudio } from './MediaStudio';
import { MfaSecurityModal } from './MfaSecurityModal';
import { getSupabase } from '../../lib/supabase';

interface AdminLayoutProps {
  onNavigateHome: () => void;
  onNavigateApp: () => void;
  onNavigateLogin?: () => void;
}

export type AdminTab =
  | 'overview'
  | 'analytics'
  | 'media'
  | 'users'
  | 'openrouter'
  | 'keys'
  | 'plans'
  | 'audit';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onNavigateHome: _onNavigateHome,
  onNavigateApp,
  onNavigateLogin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [mfaModalOpen, setMfaModalOpen] = useState<boolean>(false);
  const [tokenUsage, setTokenUsage] = useState<number>(2450000);
  const [userQuota, setUserQuota] = useState<number>(100000000);
  const [currentTier, setCurrentTier] = useState<string>('Enterprise');

  // Auto-authenticate admin from active Supabase session or secret key
  useEffect(() => {
    const checkAdminAuth = async () => {
      setLoading(true);
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            setAdminToken(data.session.access_token);
            setAdminEmail(data.session.user.email || 'Superadmin');
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch {
          // Fallback
        }
      }

      // Check localStorage for dev/admin master key
      const storedKey = localStorage.getItem('zorvik_admin_key');
      const storedJwt = localStorage.getItem('zorvik_admin_jwt');
      if (storedKey || storedJwt) {
        const token = storedKey || storedJwt || '';
        setAdminToken(token);
        setAdminEmail('vikashbro111@gmail.com');
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  // Sync real-time token telemetry for quota meter for the authenticated user
  useEffect(() => {
    if (!adminToken) return;
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/v1/admin/users', {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'x-admin-key': adminToken,
            'x-admin-secret': adminToken,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.users) && json.users.length > 0) {
            const current = json.users.find(
              (u: any) => u.email.toLowerCase() === adminEmail.toLowerCase()
            ) || json.users[0];
            if (current) {
              setTokenUsage(current.tokens_used_this_month || 0);
              setUserQuota(current.monthly_token_quota || 100000000);
              setCurrentTier(current.tier ? current.tier.toUpperCase() : 'ENTERPRISE');
            }
          }
        }
      } catch {
        // Non-blocking
      }
    };
    fetchUsage();
  }, [adminToken, adminEmail, activeTab]);

  const handleSignOutAdmin = async () => {
    localStorage.removeItem('zorvik_admin_key');
    localStorage.removeItem('zorvik_admin_jwt');
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Non-blocking
      }
    }
    setIsAuthenticated(false);
    setAdminToken('');
    if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      onNavigateApp();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] text-[#141310] flex items-center justify-center font-['IBM_Plex_Sans',sans-serif] select-none">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-[#141310]" size={18} />
          <span className="text-xs font-medium text-[rgba(20,19,16,0.62)]">Validating Management Credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (onNavigateLogin) {
      onNavigateLogin();
      return null;
    }
    return (
      <div className="min-h-screen bg-[#f4f1ea] text-[#141310] flex items-center justify-center p-4 select-none font-['IBM_Plex_Sans',sans-serif]">
        <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] rounded-lg p-8 text-center space-y-4 shadow-none">
          <Lock className="mx-auto text-[#141310]" size={28} />
          <h2 className="text-base font-semibold text-[#141310]">Management Access Required</h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)]">Please sign in to the management plane to continue.</p>
          <button
            onClick={onNavigateLogin || onNavigateApp}
            className="w-full py-2 rounded bg-[#141310] hover:bg-[rgba(20,19,16,0.85)] text-[#faf8f3] text-xs font-medium transition-colors"
          >
            Go to Management Login
          </button>
        </div>
      </div>
    );
  }

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'overview', label: 'Neural Operations', icon: Activity },
    { id: 'analytics', label: 'Quota Analytics', icon: BarChart2 },
    { id: 'media', label: 'Media Studio', icon: Sparkles },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'openrouter', label: 'OpenRouter Matrix', icon: Compass },
    { id: 'keys', label: 'Neural Key Vault', icon: Key },
    { id: 'plans', label: 'Pricing Plans', icon: CreditCard },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  const userInitials = (adminEmail.split('@')[0] || 'ZT').slice(0, 2).toUpperCase();
  const userName = adminEmail.split('@')[0] || 'Superadmin';

  return (
    <div className="flex h-screen w-screen bg-[#f4f1ea] text-[#141310] overflow-hidden select-none font-['IBM_Plex_Sans',sans-serif] antialiased">
      {/* Unified Single E-Ink Sidebar */}
      <aside className="w-64 border-r border-[rgba(20,19,16,0.14)] bg-[#faf8f3] flex flex-col justify-between shrink-0">
        <div>
          {/* Workspace Branding */}
          <div className="p-3 border-b border-[rgba(20,19,16,0.14)]">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-[rgba(20,19,16,0.04)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded border border-[#141310] flex items-center justify-center font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold text-[#141310] shrink-0">
                  ZT
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[#141310] truncate">Zorvik Tech</div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] truncate">
                    Multi-Engine Management
                  </div>
                </div>
              </div>
              <ChevronsUpDown size={14} className="text-[rgba(20,19,16,0.42)] shrink-0 ml-1" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full relative flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-[rgba(20,19,16,0.05)] text-[#141310] font-semibold'
                      : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.02)]'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#141310]" />}
                  <IconComp size={14} className={isActive ? 'text-[#141310]' : 'text-[rgba(20,19,16,0.42)]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Back to App */}
        <div className="p-3 border-t border-[rgba(20,19,16,0.14)] space-y-2">
          {/* Dynamic Real Token Usage Meter for Authenticated User */}
          <div className="p-2.5 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[10px] font-semibold text-[#141310] uppercase font-['IBM_Plex_Mono',monospace] tracking-wider">
                {currentTier} Quota
              </span>
              <span className="text-[10.5px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)]">
                {(tokenUsage / 1000000).toFixed(2)}M / {(userQuota / 1000000).toFixed(0)}M
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-[rgba(20,19,16,0.14)] overflow-hidden">
              <div
                className="h-full bg-[#141310] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(1, (tokenUsage / (userQuota || 1)) * 100))}%` }}
              />
            </div>
          </div>

          <div className="px-2.5 py-2 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <div className="w-5 h-5 rounded border border-[rgba(20,19,16,0.20)] bg-[#faf8f3] flex items-center justify-center font-['IBM_Plex_Mono',monospace] text-[9.5px] font-semibold text-[#141310] shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 truncate">
                <div className="text-[9.5px] font-['IBM_Plex_Mono',monospace] uppercase text-[rgba(20,19,16,0.42)] leading-none truncate">
                  {userName}
                </div>
                <div className="text-xs text-[#141310] font-medium truncate mt-0.5">{adminEmail}</div>
              </div>
            </div>
            <button
              onClick={() => setMfaModalOpen(true)}
              className="p-1 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] text-[#141310] hover:bg-[#f4f1ea] transition-colors shrink-0"
              title="Configure Authenticator MFA"
            >
              <ShieldCheck size={12} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <button
              onClick={onNavigateApp}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Workspace</span>
            </button>
            <button
              onClick={handleSignOutAdmin}
              className="p-1.5 rounded border border-[rgba(20,19,16,0.14)] text-[rgba(20,19,16,0.42)] hover:text-[#c8321e] hover:border-[#c8321e]/30 transition-colors"
              title="Sign Out Management"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f4f1ea] p-6 lg:p-8">
        {activeTab === 'overview' && <AdminDashboard token={adminToken} onSwitchTab={setActiveTab} />}
        {activeTab === 'analytics' && <QuotaAnalyticsDashboard token={adminToken} />}
        {activeTab === 'media' && <MediaStudio adminToken={adminToken} />}
        {activeTab === 'users' && <UserManager token={adminToken} />}
        {activeTab === 'openrouter' && <OpenRouterCatalog token={adminToken} />}
        {activeTab === 'keys' && <KeyVaultManager adminToken={adminToken} />}
        {activeTab === 'plans' && <PlanManager token={adminToken} />}
        {activeTab === 'audit' && <AuditLogViewer token={adminToken} />}
      </main>

      {/* MFA Security Enrollment Modal */}
      <MfaSecurityModal isOpen={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  );
};
