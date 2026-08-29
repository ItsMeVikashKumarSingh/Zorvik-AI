import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Key,
  CreditCard,
  Zap,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Lock,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { TenantManager } from './TenantManager';
import { PlanManager } from './PlanManager';
import { CircuitBreakerControl } from './CircuitBreakerControl';
import { AuditLogViewer } from './AuditLogViewer';
import { KeyVaultManager } from './KeyVaultManager';
import { MfaSecurityModal } from './MfaSecurityModal';
import { getSupabase } from '../../lib/supabase';

interface AdminLayoutProps {
  onNavigateHome: () => void;
  onNavigateApp: () => void;
  onNavigateLogin?: () => void;
}

export type AdminTab = 'overview' | 'keys' | 'tenants' | 'plans' | 'circuit' | 'audit';

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
        setAdminEmail('Master Key Admin');
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

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
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white select-none">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-purple-500" size={20} />
          <span className="text-sm font-light text-slate-300">Validating Management Credentials...</span>
        </div>
      </div>
    );
  }

  // Redirect to management login if not authenticated
  if (!isAuthenticated) {
    if (onNavigateLogin) {
      onNavigateLogin();
      return null;
    }
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-[#0a0a14] border border-white/[0.08] rounded-3xl p-8 text-center space-y-4">
          <Lock className="mx-auto text-purple-400" size={32} />
          <h2 className="text-lg font-bold text-white">Management Access Required</h2>
          <p className="text-xs text-slate-400">Please sign in to the management plane to continue.</p>
          <button
            onClick={onNavigateLogin || onNavigateApp}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            Go to Management Login
          </button>
        </div>
      </div>
    );
  }

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'keys', label: 'Neural Key Vault', icon: Key },
    { id: 'tenants', label: 'Tenants & API Keys', icon: Sliders },
    { id: 'plans', label: 'Pricing Plans', icon: CreditCard },
    { id: 'circuit', label: 'Model Circuit Breaker', icon: Zap },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#050510] text-slate-200 overflow-hidden select-none font-sans">
      {/* Management Sidebar */}
      <aside className="w-64 border-r border-white/[0.08] bg-[#070714] flex flex-col justify-between shrink-0">
        <div className="p-4 space-y-6">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3 px-2 py-1">
            <img src="/logo.png" alt="Zorvik AI" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <div className="text-sm font-semibold text-white tracking-tight">Zorvik Management</div>
              <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Control Plane v1.1</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-white border border-purple-500/40 font-medium shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <IconComp size={16} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Back to App */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <div className="px-3 py-2 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-mono uppercase text-slate-500">Superadmin</div>
              <div className="text-xs text-white font-medium truncate">{adminEmail}</div>
            </div>
            <button
              onClick={() => setMfaModalOpen(true)}
              className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors"
              title="Configure Authenticator MFA"
            >
              <ShieldCheck size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onNavigateApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Workspace</span>
            </button>
            <button
              onClick={handleSignOutAdmin}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
              title="Sign Out Management"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#050510] p-6 lg:p-8">
        {activeTab === 'overview' && <AdminDashboard token={adminToken} onSwitchTab={setActiveTab} />}
        {activeTab === 'keys' && <KeyVaultManager adminToken={adminToken} />}
        {activeTab === 'tenants' && <TenantManager token={adminToken} />}
        {activeTab === 'plans' && <PlanManager token={adminToken} />}
        {activeTab === 'circuit' && <CircuitBreakerControl token={adminToken} />}
        {activeTab === 'audit' && <AuditLogViewer token={adminToken} />}
      </main>

      {/* MFA Security Enrollment Modal */}
      <MfaSecurityModal isOpen={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  );
};
