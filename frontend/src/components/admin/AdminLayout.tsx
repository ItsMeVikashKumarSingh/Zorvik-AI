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
  AlertTriangle,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { TenantManager } from './TenantManager';
import { PlanManager } from './PlanManager';
import { CircuitBreakerControl } from './CircuitBreakerControl';
import { AuditLogViewer } from './AuditLogViewer';
import { getSupabase } from '../../lib/supabase';

interface AdminLayoutProps {
  onNavigateHome: () => void;
  onNavigateApp: () => void;
}

export type AdminTab = 'overview' | 'tenants' | 'plans' | 'circuit' | 'audit';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onNavigateHome,
  onNavigateApp,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
            setAdminEmail(data.session.user.email || 'Admin');
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
      if (storedKey) {
        setAdminToken(storedKey);
        setAdminEmail('Master Key Admin');
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  const handleAdminKeyLogin = (key: string) => {
    if (!key.trim()) return;
    localStorage.setItem('zorvik_admin_key', key.trim());
    setAdminToken(key.trim());
    setAdminEmail('Master Key Admin');
    setIsAuthenticated(true);
    setError(null);
  };

  const handleSignOutAdmin = () => {
    localStorage.removeItem('zorvik_admin_key');
    setIsAuthenticated(false);
    setAdminToken('');
    onNavigateApp();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-iris" size={20} />
          <span className="text-sm font-light text-silver">Validating Administrative Credentials...</span>
        </div>
      </div>
    );
  }

  // Admin Login Prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#0a0a16] border border-white/[0.12] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-iris/20 text-iris flex items-center justify-center mx-auto mb-2">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-medium text-white tracking-tight">Zorvik AI Control Plane</h2>
            <p className="text-xs text-silver/50 font-light">
              Restricted Administrative Gateway & Monetization Console.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson text-xs flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-silver/50 mb-1.5">
                Admin Master Key / Bearer Secret
              </label>
              <input
                type="password"
                placeholder="Enter ADMIN_SECRET_KEY..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-iris"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminKeyLogin((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>

            <button
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling?.querySelector('input') as HTMLInputElement);
                if (input) handleAdminKeyLogin(input.value);
              }}
              className="w-full py-3 rounded-xl bg-iris hover:bg-iris-hover text-white text-sm font-medium transition-all shadow-lg shadow-iris/20"
            >
              Authenticate to Control Plane
            </button>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-silver/40">
            <button onClick={onNavigateApp} className="hover:text-white flex items-center gap-1">
              <ArrowLeft size={12} /> Back to Chat Workspace
            </button>
            <button onClick={onNavigateHome} className="hover:text-white">
              Public Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants & API Keys', icon: Key },
    { id: 'plans', label: 'Pricing Plans', icon: CreditCard },
    { id: 'circuit', label: 'Model Circuit Breaker', icon: Zap },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#050510] text-silver overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-white/[0.08] bg-[#070714] flex flex-col justify-between shrink-0">
        <div className="p-4 space-y-6">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3 px-2 py-1">
            <img src="/logo.png" alt="Zorvik AI" className="w-8 h-8 rounded-xl object-contain" />
            <div>
              <div className="text-sm font-medium text-white tracking-tight">Zorvik Admin</div>
              <div className="text-[10px] font-mono text-iris uppercase tracking-wider">Control Plane v1.0</div>
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-iris/20 text-white border border-iris/40 font-medium shadow-sm'
                      : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <IconComp size={16} className={isActive ? 'text-iris' : 'text-silver/40'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Back to App */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[10px] font-mono uppercase text-silver/40">Authenticated As</div>
            <div className="text-xs text-white font-medium truncate">{adminEmail}</div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onNavigateApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-silver/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Workspace</span>
            </button>
            <button
              onClick={handleSignOutAdmin}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-crimson/20 hover:text-crimson text-silver/50 transition-colors"
              title="Sign Out Admin"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#050510] p-6 lg:p-8">
        {activeTab === 'overview' && <AdminDashboard token={adminToken} onSwitchTab={setActiveTab} />}
        {activeTab === 'tenants' && <TenantManager token={adminToken} />}
        {activeTab === 'plans' && <PlanManager token={adminToken} />}
        {activeTab === 'circuit' && <CircuitBreakerControl token={adminToken} />}
        {activeTab === 'audit' && <AuditLogViewer token={adminToken} />}
      </main>
    </div>
  );
};
