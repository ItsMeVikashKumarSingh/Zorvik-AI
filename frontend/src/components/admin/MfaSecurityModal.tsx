import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, RefreshCw, CheckCircle2, AlertCircle, Key, Copy, Check } from 'lucide-react';
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
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

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
        issuer: 'Zorvik AI Platform',
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

      setSuccess('Authenticator app successfully linked & verified!');
      setQrCodeSvg(null);
      setVerifyCode('');
      await fetchFactors();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (id: string) => {
    if (!window.confirm('Are you sure you want to disable this Authenticator device?')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.auth.mfa.unenroll({ factorId: id });
      await fetchFactors();
    } catch (err: any) {
      alert('Failed to remove MFA: ' + err.message);
    }
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(null as any), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141310]/40 backdrop-blur-sm select-none font-['IBM_Plex_Sans',sans-serif]">
      <div className="w-full max-w-md bg-[#faf8f3] border border-[rgba(20,19,16,0.20)] rounded-lg p-6 shadow-none relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.14)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-[#141310] flex items-center justify-center text-[#141310]">
              <ShieldCheck size={13} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#141310] tracking-tight">Two-Factor Authentication (2FA)</h2>
              <p className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                TOTP SECURITY ENFORCEMENT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[rgba(20,19,16,0.42)] hover:text-[#141310] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded border border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e] text-xs flex items-center gap-2 font-['IBM_Plex_Mono',monospace]">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded border border-[rgba(20,19,16,0.25)] bg-[#faf8f3] text-[#141310] text-xs flex items-center gap-2 font-['IBM_Plex_Mono',monospace]">
            <CheckCircle2 size={14} className="text-[#141310]" />
            <span>{success}</span>
          </div>
        )}

        {/* Active Factors List */}
        {!qrCodeSvg && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[10.5px] font-semibold text-[rgba(20,19,16,0.42)] uppercase tracking-[0.08em] font-['IBM_Plex_Mono',monospace] mb-2">
                Active Authenticator Devices
              </h3>
              {loading ? (
                <div className="py-6 flex items-center justify-center text-xs text-[rgba(20,19,16,0.62)] gap-2">
                  <RefreshCw size={13} className="animate-spin text-[#141310]" />
                  <span>Checking security status...</span>
                </div>
              ) : enrolledFactors.length === 0 ? (
                <div className="p-4 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] text-center space-y-3">
                  <p className="text-xs text-[rgba(20,19,16,0.62)]">
                    No Authenticator app enrolled. Add TOTP MFA to require a 6-digit verification code on login.
                  </p>
                  <button
                    onClick={handleStartEnrollment}
                    disabled={enrolling}
                    className="px-4 py-2 rounded bg-[#141310] text-[#faf8f3] text-xs font-semibold hover:bg-[rgba(20,19,16,0.85)] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Key size={12} />
                    <span>{enrolling ? 'Generating Secret...' : 'Enroll Authenticator App'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolledFactors.map((factor) => (
                    <div
                      key={factor.id}
                      className="p-3 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#141310]" />
                        <div>
                          <span className="font-semibold text-[#141310] block">{factor.friendly_name || 'TOTP Authenticator'}</span>
                          <span className="text-[10px] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                            Enrolled: {new Date(factor.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnenroll(factor.id)}
                        className="px-2.5 py-1 rounded border border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e] text-[11px] hover:bg-[#c8321e]/20 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button
                      onClick={handleStartEnrollment}
                      disabled={enrolling}
                      className="text-xs text-[#141310] hover:underline font-semibold"
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
              <p className="text-xs text-[rgba(20,19,16,0.62)]">
                Scan this QR code with <strong>Google Authenticator</strong>, <strong>1Password</strong>, or <strong>Authy</strong>:
              </p>
              <div className="p-3 bg-white border border-[rgba(20,19,16,0.14)] rounded-lg inline-block mx-auto my-1">
                <img src={qrCodeSvg} alt="MFA QR Code" className="w-40 h-40 object-contain" />
              </div>
              {secret && (
                <div className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)] bg-[#f4f1ea] p-2 rounded border border-[rgba(20,19,16,0.14)] flex items-center justify-between gap-2">
                  <span className="truncate">Key: <strong className="text-[#141310]">{secret}</strong></span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1 hover:text-[#141310] shrink-0"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check size={12} className="text-[#141310]" /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10.5px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
                Enter 6-Digit Code from App
              </label>
              <input
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000 000"
                required
                autoFocus
                className="w-full text-center tracking-[0.3em] font-['IBM_Plex_Mono',monospace] font-bold text-lg py-2 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] text-[#141310] outline-none focus:border-[#141310]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQrCodeSvg(null)}
                className="w-1/2 py-2 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="w-1/2 py-2 rounded bg-[#141310] text-[#faf8f3] text-xs font-semibold hover:bg-[rgba(20,19,16,0.85)] transition-colors disabled:opacity-50"
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
