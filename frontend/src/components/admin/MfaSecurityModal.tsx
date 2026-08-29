import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

interface MfaSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MfaSecurityModal: React.FC<MfaSecurityModalProps> = ({ isOpen, onClose }) => {
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [enrolledFactors, setEnrolledFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFactors = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp) {
        setEnrolledFactors(data.totp.filter((f) => f.status === 'verified'));
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFactors();
    }
  }, [isOpen]);

  const handleStartEnrollment = async () => {
    setEnrolling(true);
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Zorvik AI Management',
      });

      if (enrollErr || !data) {
        throw new Error(enrollErr?.message || 'Failed to start MFA enrollment.');
      }

      setFactorId(data.id);
      setQrCodeSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim() || !factorId) return;

    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (chalErr || !challenge) {
        throw new Error(chalErr?.message || 'Failed to generate verification challenge.');
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode.trim(),
      });

      if (verifyErr) {
        throw new Error(verifyErr.message || 'Invalid verification code.');
      }

      setSuccess('Multi-Factor Authentication (TOTP) successfully activated!');
      setQrCodeSvg(null);
      setSecret(null);
      setVerifyCode('');
      await fetchFactors();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (id: string) => {
    if (!confirm('Are you sure you want to disable this MFA authenticator?')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.auth.mfa.unenroll({ factorId: id });
      await fetchFactors();
    } catch (err: any) {
      alert('Failed to remove MFA: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-[#0a0a14] border border-white/[0.08] rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-600/20 text-purple-400">
              <ShieldCheck size={16} />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">Superadmin MFA Security</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* List Active Factors */}
        {!qrCodeSvg && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-2">
                Active Authenticator Factors
              </h3>
              {loading ? (
                <div className="py-6 flex items-center justify-center text-xs text-slate-400 gap-2">
                  <RefreshCw size={14} className="animate-spin text-purple-400" />
                  <span>Loading security status...</span>
                </div>
              ) : enrolledFactors.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <p className="text-xs text-slate-400 mb-3">
                    No Authenticator app enrolled. Add TOTP MFA to require a 6-digit code on management logins.
                  </p>
                  <button
                    onClick={handleStartEnrollment}
                    disabled={enrolling}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    {enrolling ? 'Generating Secret...' : 'Enroll Authenticator App'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolledFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <div>
                          <span className="font-medium text-white">{factor.friendly_name || 'TOTP Authenticator'}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">Enrolled: {new Date(factor.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnenroll(factor.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] hover:bg-rose-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button
                      onClick={handleStartEnrollment}
                      disabled={enrolling}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                    >
                      + Add another authenticator device
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Enrollment Step */}
        {qrCodeSvg && (
          <form onSubmit={handleVerifyEnrollment} className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-300">
                Scan this QR code with <strong>Google Authenticator</strong>, <strong>1Password</strong>, or <strong>Authy</strong>:
              </p>
              <div className="p-3 bg-white rounded-2xl inline-block shadow-inner mx-auto my-2">
                <img src={qrCodeSvg} alt="MFA QR Code" className="w-44 h-44 object-contain" />
              </div>
              {secret && (
                <div className="text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded-xl border border-white/[0.06] select-all">
                  Manual Key: <span className="text-purple-300">{secret}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
                Enter 6-Digit Code from Authenticator App:
              </label>
              <input
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="w-full text-center tracking-[0.5em] font-mono text-xl py-2.5 rounded-2xl bg-[#0e0e1a] border border-purple-500/40 text-purple-300 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQrCodeSvg(null)}
                className="w-1/2 py-2.5 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Activating...' : 'Verify & Enable'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
