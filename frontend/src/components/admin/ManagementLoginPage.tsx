import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f4f1ea] text-[#141310] flex flex-col items-center justify-center p-4 relative font-['IBM_Plex_Sans',sans-serif] select-none antialiased">
      <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] rounded-lg p-8 shadow-none relative z-10 space-y-6">
        {/* Top Header Lockup */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-10 h-10 rounded border border-[#141310] flex items-center justify-center text-[#141310] font-['IBM_Plex_Mono',monospace] text-xs font-semibold">
            <Shield size={18} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
              ZORVIK AI CONTROL PLANE
            </div>
            <h1 className="text-base font-semibold text-[#141310] tracking-tight mt-0.5">
              {requiresMfa
                ? 'Two-Factor Authentication'
                : masterKeyMode
                ? 'Master Secret Key Sign-In'
                : 'Administrative Authentication'}
            </h1>
          </div>
          <p className="text-xs text-[rgba(20,19,16,0.62)]">
            {requiresMfa
              ? 'Enter the 6-digit verification code from your Authenticator app.'
              : masterKeyMode
              ? 'Provide the emergency system master secret key to proceed.'
              : 'Sign in to access neural routing, quotas, and key management.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded border border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e] text-xs flex items-center gap-2 font-['IBM_Plex_Mono',monospace]">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email & Password */}
        {!requiresMfa && !masterKeyMode && (
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                placeholder="admin@zorvik.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-2 text-xs text-[#141310] outline-none focus:border-[#141310] transition-colors font-['IBM_Plex_Mono',monospace]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  Account Password
                </label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-2 text-xs text-[#141310] outline-none focus:border-[#141310] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[rgba(20,19,16,0.85)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: 2FA / TOTP Challenge */}
        {requiresMfa && (
          <form onSubmit={handleMfaVerifySubmit} className="space-y-4">
            <div className="p-3 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] space-y-1">
              <div className="font-semibold text-[#141310]">Identity Verification</div>
              <div className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                Account: {email}
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                6-Digit Authenticator Code
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                placeholder="000 000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-2 text-center text-lg font-['IBM_Plex_Mono',monospace] tracking-[0.3em] font-bold text-[#141310] outline-none focus:border-[#141310] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="w-full py-2.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[rgba(20,19,16,0.85)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  <span>Verify Security Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequiresMfa(false);
                setMfaCode('');
              }}
              className="w-full text-center text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors pt-1"
            >
              ← Back to password login
            </button>
          </form>
        )}

        {/* Alternative: Master Key Mode */}
        {masterKeyMode && (
          <form onSubmit={handleMasterKeySubmit} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                Emergency Admin Secret Key
              </label>
              <input
                type="password"
                required
                placeholder="zorvik-superadmin-secret-..."
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-2 text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] outline-none focus:border-[#141310] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[rgba(20,19,16,0.85)] transition-colors"
            >
              <KeyRound size={13} />
              <span>Authenticate with Master Key</span>
            </button>
          </form>
        )}

        {/* Footer Navigation & Mode Toggles */}
        <div className="pt-4 border-t border-[rgba(20,19,16,0.14)] flex items-center justify-between text-xs text-[rgba(20,19,16,0.62)]">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 hover:text-[#141310] transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Back to Home</span>
          </button>

          {!requiresMfa && (
            <button
              type="button"
              onClick={() => {
                setMasterKeyMode(!masterKeyMode);
                setError(null);
              }}
              className="hover:text-[#141310] font-['IBM_Plex_Mono',monospace] text-[11px] underline transition-colors"
            >
              {masterKeyMode ? 'Use Email Login' : 'Use Master Key'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
