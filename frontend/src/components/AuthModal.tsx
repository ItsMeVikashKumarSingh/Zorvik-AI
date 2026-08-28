import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordResetEmail,
  updateUserPassword,
  signInWithOAuth,
  isSupabaseAvailable,
} from '../lib/supabase';
import { UserProfile } from '../types';

export type AuthModalTab = 'signin' | 'signup' | 'forgot' | 'reset_password';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: AuthModalTab;
  onClose: () => void;
  onUserUpdate: (u: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'signin',
  onClose,
  onUserUpdate,
}) => {
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Password validation criteria
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isStrong = hasMinLength && hasNumber && hasSpecial;

  const handleResetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (newTab: AuthModalTab) => {
    handleResetForm();
    setTab(newTab);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (!isStrong) {
          throw new Error('Password must be at least 8 characters and include a number and special character.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { data, error } = await signUpWithEmail(email, password);
        if (error) throw error;

        setSuccessMsg('Account created successfully! Check your email to confirm if required.');
        if (data?.user) {
          onUserUpdate({
            id: data.user.id,
            email: data.user.email || email,
            isGuest: false,
          });
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else if (tab === 'signin') {
        const { data, error } = await signInWithEmail(email, password);
        if (error) throw error;

        if (data?.user) {
          onUserUpdate({
            id: data.user.id,
            email: data.user.email || email,
            isGuest: false,
          });
          onClose();
        }
      } else if (tab === 'forgot') {
        const { error } = await sendPasswordResetEmail(email);
        if (error) throw error;

        setSuccessMsg(`Password reset link sent to ${email}. Please check your inbox.`);
      } else if (tab === 'reset_password') {
        if (!isStrong) {
          throw new Error('New password must be at least 8 characters with a number and special character.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { error } = await updateUserPassword(password);
        if (error) throw error;

        setSuccessMsg('Password updated successfully! You can now sign in with your new password.');
        setTimeout(() => {
          handleSwitchTab('signin');
        }, 1800);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setErrorMsg(null);
    try {
      await signInWithOAuth(provider);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'OAuth provider sign-in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#080810] border border-white/[0.08] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.04] transition-colors"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Brand Lockup */}
        <div className="flex items-center gap-2 mb-2">
          <img src="/logo.png" alt="Zorvik AI" className="w-6 h-6 rounded-lg object-contain" />
          <span className="font-semibold tracking-wider text-white text-base">Zorvik AI</span>
        </div>

        {/* Header Description */}
        <p className="text-xs text-silver/60 mb-5 font-light">
          {tab === 'signin' && 'Sign in to access your synchronized threads and neural memories.'}
          {tab === 'signup' && 'Create your account to unlock continuous knowledge memory and sync.'}
          {tab === 'forgot' && 'Enter your email address to receive a secure password recovery link.'}
          {tab === 'reset_password' && 'Enter and confirm your new secure password.'}
        </p>

        {/* Navigation Tabs (Sign In / Sign Up) */}
        {(tab === 'signin' || tab === 'signup') && (
          <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.05] mb-5">
            <button
              onClick={() => handleSwitchTab('signin')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === 'signin' ? 'bg-white/[0.08] text-white shadow' : 'text-silver/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === 'signup' ? 'bg-white/[0.08] text-white shadow' : 'text-silver/60 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Body (Email & Password on Top) */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Field (for signin, signup, forgot) */}
          {tab !== 'reset_password' && (
            <div>
              <label className="block text-[11px] font-mono text-silver/60 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={14} className="absolute left-3 text-silver/40 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-silver/30 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password Field (for signin, signup, reset_password) */}
          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-silver/60 uppercase tracking-wider">
                  {tab === 'reset_password' ? 'New Password' : 'Password'}
                </label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('forgot')}
                    className="text-[11px] font-light text-iris hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock size={14} className="absolute left-3 text-silver/40 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={tab === 'signin' ? 6 : 8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-silver/30 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-silver/40 hover:text-silver/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field (for signup, reset_password) */}
          {(tab === 'signup' || tab === 'reset_password') && (
            <div>
              <label className="block text-[11px] font-mono text-silver/60 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <KeyRound size={14} className="absolute left-3 text-silver/40 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-silver/30 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password Strength Validation Checklist (Sign Up & Reset) */}
          {(tab === 'signup' || tab === 'reset_password') && password.length > 0 && (
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5 text-[11px] font-light text-silver/70">
              <div className="flex items-center gap-1.5">
                <span className={hasMinLength ? 'text-emerald-400' : 'text-silver/40'}>
                  {hasMinLength ? <CheckCircle2 size={12} /> : '○'}
                </span>
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={hasNumber ? 'text-emerald-400' : 'text-silver/40'}>
                  {hasNumber ? <CheckCircle2 size={12} /> : '○'}
                </span>
                <span>Contains a number</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={hasSpecial ? 'text-emerald-400' : 'text-silver/40'}>
                  {hasSpecial ? <CheckCircle2 size={12} /> : '○'}
                </span>
                <span>Contains a special symbol</span>
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-crimson/10 border border-crimson/20 text-xs text-crimson flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Feedback */}
          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <ShieldCheck size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-iris hover:bg-iris-hover text-white text-xs font-medium tracking-wide shadow-lg shadow-iris/20 transition-all disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Processing...'
                : tab === 'signin'
                ? 'Sign In'
                : tab === 'signup'
                ? 'Create Account'
                : tab === 'forgot'
                ? 'Send Reset Link'
                : 'Save New Password'}
            </span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Social Logins (Google & GitHub) below form */}
        {isSupabaseAvailable() && (tab === 'signin' || tab === 'signup') && (
          <div className="mt-4 pt-1 space-y-2">
            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-white/[0.06]" />
              <span className="absolute bg-[#080810] px-2 text-[10px] uppercase font-mono tracking-wider text-silver/40">
                Or continue with
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-xs text-white font-medium transition-all shadow-sm group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 20.4 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-xs text-white font-medium transition-all shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>
        )}

        {/* Back to Sign In Link (for Forgot / Reset Password) */}
        {(tab === 'forgot' || tab === 'reset_password') && (
          <div className="mt-4 pt-3 border-t border-white/[0.04] text-center">
            <button
              onClick={() => handleSwitchTab('signin')}
              className="inline-flex items-center gap-1.5 text-xs text-silver/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
