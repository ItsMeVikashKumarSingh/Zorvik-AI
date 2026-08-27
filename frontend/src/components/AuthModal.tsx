import React, { useState } from 'react';
import { X, ArrowRight, Lock, Mail } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (u: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserUpdate }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      // Simulate guest account
      setTimeout(() => {
        onUserUpdate({
          id: 'user_' + crypto.randomUUID(),
          email,
          isGuest: false,
        });
        setLoading(false);
        onClose();
      }, 500);
      return;
    }

    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Account created successfully! You can now sign in.');
        if (data.user) {
          onUserUpdate({
            id: data.user.id,
            email: data.user.email || email,
            isGuest: false,
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          onUserUpdate({
            id: data.user.id,
            email: data.user.email || email,
            isGuest: false,
          });
          onClose();
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#080810] border border-white/[0.08] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-silver/60 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="font-semibold tracking-wider text-white text-sm">ZORVIK</span>
          <span className="text-iris font-mono text-xs">·</span>
          <span className="text-iris font-mono text-xs uppercase tracking-widest">ACCOUNT</span>
        </div>

        <p className="text-xs text-silver/70 mb-5 font-light">
          Sign in to sync your conversations across devices and retain deep memory continuity.
        </p>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.05] mb-5">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'signin' ? 'bg-white/[0.08] text-white shadow' : 'text-silver/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'signup' ? 'bg-white/[0.08] text-white shadow' : 'text-silver/60 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                placeholder="you@zorviktech.com"
                className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-silver/30 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-silver/60 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={14} className="absolute left-3 text-silver/40 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-silver/30 outline-none transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-crimson/10 border border-crimson/20 text-xs text-crimson">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-iris hover:bg-iris-hover text-white text-xs font-medium tracking-wide shadow-lg shadow-iris/20 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : tab === 'signin' ? 'Continue' : 'Create Account'}</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
