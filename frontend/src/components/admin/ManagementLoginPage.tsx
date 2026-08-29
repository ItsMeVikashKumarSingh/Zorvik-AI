import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

interface ManagementLoginPageProps {
  onLoginSuccess: (token: string, email: string) => void;
  onNavigateHome: () => void;
}

export const ManagementLoginPage: React.FC<ManagementLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterKeyMode, setMasterKeyMode] = useState(false);
  const [masterKey, setMasterKey] = useState('');

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase client is not configured. Use Master Key authentication.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !data.session) {
        throw new Error(authError?.message || 'Invalid administrative credentials.');
      }

      // Check if MFA / TOTP is enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === 'verified');

      if (totpFactor) {
        // Create an MFA challenge
        const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });
        if (chalErr || !challenge) {
          throw new Error('Failed to initiate MFA challenge: ' + chalErr?.message);
        }

        setMfaFactorId(totpFactor.id);
        setMfaChallengeId(challenge.id);
        setRequiresMfa(true);
        setLoading(false);
        return;
      }

      // If no MFA required, complete login
      localStorage.setItem('zorvik_admin_jwt', data.session.access_token);
      onLoginSuccess(data.session.access_token, data.session.user.email || email.trim());
    } catch (err: any) {
      setError(err.message || 'Administrative login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || !mfaFactorId || !mfaChallengeId) return;

    setLoading(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode.trim(),
      });

      if (verifyErr || !data.access_token) {
        throw new Error(verifyErr?.message || 'Invalid 6-digit MFA security code.');
      }

      localStorage.setItem('zorvik_admin_jwt', data.access_token);
      onLoginSuccess(data.access_token, email.trim());
    } catch (err: any) {
      setError(err.message || 'MFA verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey.trim()) return;

    localStorage.setItem('zorvik_admin_key', masterKey.trim());
    onLoginSuccess(masterKey.trim(), 'Superadmin Master');
  };

  return (
    <div className="min-h-screen bg-[#050510] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0a0a14] border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Top Header Lockup */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Management Control Plane</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            {requiresMfa
              ? 'Multi-Factor Authenticator Challenge'
              : masterKeyMode
              ? 'Enter emergency master secret key'
              : 'Sign in with your verified Superadmin account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email & Password */}
        {!requiresMfa && !masterKeyMode && (
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
                Admin Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zorvik.tech"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-[#0e0e1a] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:border-purple-500/60 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-[#0e0e1a] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:border-purple-500/60 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Verify Identity</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: MFA / TOTP 6-Digit Challenge */}
        {requiresMfa && (
          <form onSubmit={handleMfaVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
                6-Digit Authenticator Code (TOTP)
              </label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                required
                className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-2xl bg-[#0e0e1a] border border-purple-500/40 text-purple-300 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Authenticate & Enter</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequiresMfa(false);
                setMfaCode('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2"
            >
              Back to email login
            </button>
          </form>
        )}

        {/* Emergency Master Key Form */}
        {masterKeyMode && (
          <form onSubmit={handleMasterKeySubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
                Master Secret Key
              </label>
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="zorvik-superadmin-secret-..."
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-2xl bg-[#0e0e1a] border border-white/[0.08] text-white text-sm font-mono placeholder-slate-500 focus:border-purple-500/60 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              <KeyRound size={15} />
              <span>Authenticate with Secret</span>
            </button>
          </form>
        )}

        {/* Bottom Switcher */}
        <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-slate-300 transition-colors"
          >
            ← Back to App
          </button>
          <button
            type="button"
            onClick={() => {
              setMasterKeyMode(!masterKeyMode);
              setError(null);
            }}
            className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            {masterKeyMode ? 'Standard Login' : 'Use Master Key'}
          </button>
        </div>
      </div>
    </div>
  );
};
