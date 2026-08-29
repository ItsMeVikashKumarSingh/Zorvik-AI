import React, { useState, useEffect } from 'react';
import {
  Layers,
  Key,
  CreditCard,
  Zap,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Lock,
  Compass,
} from 'lucide-react';
import { EInkDeploymentsConsole } from './EInkDeploymentsConsole';
import { OpenRouterCatalog } from './OpenRouterCatalog';
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

export type AdminTab = 'deployments' | 'overview' | 'openrouter' | 'keys' | 'tenants' | 'plans' | 'circuit' | 'audit';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onNavigateHome: _onNavigateHome,
  onNavigateApp,
  onNavigateLogin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('deployments');
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
      <div className="min-h-screen bg-[#f4f1ea] text-[#141310] flex items-center justify-center font-['IBM_Plex_Sans',sans-serif] select-none">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-[#141310]" size={18} />
          <span className="text-xs font-medium text-[rgba(20,19,16,0.62)]">Validating Management Credentials...</span>
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

  // If in pure E-Ink Deployments Console tab, let it render full two-pane console
  if (activeTab === 'deployments') {
    return (
      <div className="relative min-h-screen bg-[#f4f1ea]">
        <EInkDeploymentsConsole onSwitchTab={(t) => setActiveTab(t as AdminTab)} />
        <MfaSecurityModal isOpen={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
      </div>
    );
  }

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'deployments', label: 'Deployments Console', icon: Layers },
    { id: 'openrouter', label: 'OpenRouter Matrix', icon: Compass },
    { id: 'keys', label: 'Neural Key Vault', icon: Key },
    { id: 'overview', label: 'Telemetry Overview', icon: Sliders },
    { id: 'tenants', label: 'Tenants & API Keys', icon: Sliders },
    { id: 'plans', label: 'Pricing Plans', icon: CreditCard },
    { id: 'circuit', label: 'Circuit Breaker', icon: Zap },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#f4f1ea] text-[#141310] overflow-hidden select-none font-['IBM_Plex_Sans',sans-serif] antialiased">
      {/* Management Sidebar */}
      <aside className="w-60 border-r border-[rgba(20,19,16,0.14)] bg-[#faf8f3] flex flex-col justify-between shrink-0">
        <div className="p-3 space-y-4">
          {/* Logo & Badge */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-6 h-6 rounded border border-[#141310] flex items-center justify-center font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold text-[#141310] shrink-0">
              SD
            </div>
            <div>
              <div className="text-xs font-semibold text-[#141310] tracking-tight">Superdesign</div>
              <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] uppercase tracking-wider">
                Management Plane
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-0.5">
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
          <div className="px-2.5 py-2 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <div className="text-[9.5px] font-['IBM_Plex_Mono',monospace] uppercase text-[rgba(20,19,16,0.42)]">Admin</div>
              <div className="text-xs text-[#141310] font-medium truncate">{adminEmail}</div>
            </div>
            <button
              onClick={() => setMfaModalOpen(true)}
              className="p-1 rounded border border-[rgba(20,19,16,0.14)] bg-[#faf8f3] text-[#141310] hover:bg-[#f4f1ea] transition-colors"
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
        {activeTab === 'openrouter' && <OpenRouterCatalog token={adminToken} />}
        {activeTab === 'keys' && <KeyVaultManager adminToken={adminToken} />}
        {activeTab === 'overview' && <AdminDashboard token={adminToken} onSwitchTab={setActiveTab} />}
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
