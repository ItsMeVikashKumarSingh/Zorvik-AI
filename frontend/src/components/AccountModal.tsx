import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Brain,
  Sliders,
  Trash2,
  Plus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  CreditCard,
} from 'lucide-react';
import { UserProfile } from '../types';
import { signOutUser, updateUserPassword } from '../lib/supabase';
import {
  fetchUserMemories,
  saveUserMemory,
  deleteUserMemory,
  UserMemoryItem,
  UserPreferences,
} from '../lib/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserUpdate: (u: UserProfile) => void;
}

type TabType = 'profile' | 'personalization' | 'memories' | 'quota';

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Personalization & Tone State
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedTone, setSelectedTone] = useState('auto');
  const [selectedPersona, setSelectedPersona] = useState('general');
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Memories State
  const [memories, setMemories] = useState<UserMemoryItem[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);

  // Load Memories on open
  useEffect(() => {
    if (!isOpen || user.isGuest) return;

    const loadData = async () => {
      try {
        const memRes = await fetchUserMemories();
        if (memRes.memories) {
          setMemories(memRes.memories);
        }
      } catch (err) {
        console.warn('Could not load user data:', err);
      }
    };

    loadData();
  }, [isOpen, user.isGuest]);

  if (!isOpen) return null;

  // Handle Save Tone & Persona Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const prefs: UserPreferences = {
        tone: selectedTone,
        persona: selectedPersona,
        customInstructions: customInstructions.trim(),
      };
      localStorage.setItem('zorvik_user_prefs', JSON.stringify(prefs));
      setSuccessMsg('Persona & tone calibrated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  // Handle Add Memory
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    setAddingMemory(true);
    setErrorMsg(null);
    try {
      const res = await saveUserMemory({ text: newMemoryText.trim() });
      if (res.memories) {
        setMemories(res.memories);
      }
      setNewMemoryText('');
      setSuccessMsg('Memory saved to persistent store.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setAddingMemory(false);
    }
  };

  // Handle Delete Memory
  const handleDeleteMemory = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await deleteUserMemory(id);
      if (res.memories) {
        setMemories(res.memories);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  };

  // Handle Clear All Memories
  const handleClearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all stored memories?')) return;
    setErrorMsg(null);
    try {
      const res = await deleteUserMemory('all');
      setMemories(res.memories || []);
      setSuccessMsg('All memories have been cleared.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to clear memories');
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await updateUserPassword(newPassword);
      if (error) throw error;
      setSuccessMsg('Password updated successfully!');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await signOutUser();
    onUserUpdate({
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: null,
      isGuest: true,
    });
    onClose();
  };

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  const toneOptions = [
    {
      id: 'auto',
      title: 'Adaptive Auto',
      desc: 'Dynamically shifts tone based on conversation context',
    },
    {
      id: 'concise',
      title: 'Direct & Concise',
      desc: 'Straight to the point with zero unnecessary filler',
    },
    {
      id: 'deep',
      title: 'Deep Engineering',
      desc: 'Rigorous technical depth with architectural context',
    },
    {
      id: 'witty',
      title: 'Charismatic & Witty',
      desc: 'Engaging, witty banter with high conversational IQ',
    },
    {
      id: 'genz',
      title: 'GenZ Culture',
      desc: 'Internet slang, punchy memes & hyper-modern vibe',
    },
  ];

  const personaOptions = [
    {
      id: 'general',
      title: 'General Polymath',
      desc: 'Balanced generalist assistant across coding, reasoning, and analysis',
    },
    {
      id: 'architect',
      title: 'System Architect',
      desc: 'Specialized in microservice topologies, database schemas, and scalability',
    },
    {
      id: 'security',
      title: 'Security Auditor',
      desc: 'Rigorous inspection for OWASP flaws, injection risks, and secret leakage',
    },
    {
      id: 'designer',
      title: 'UI/UX Designer',
      desc: 'Expert in Glassmorphism 2.0, Tailwind CSS, and cinematic aesthetics',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#090912] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-purple-950/30 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-iris/20 text-iris">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-white tracking-tight">Account & Calibration Hub</h3>
              <p className="text-[11px] text-silver/50 font-light">
                Manage quotas, neural memory, tone profiles, and security.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-silver/40 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl my-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-white/[0.08] text-white shadow'
                : 'text-silver/60 hover:text-white'
            }`}
          >
            <User size={13} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quota');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'quota'
                ? 'bg-white/[0.08] text-white shadow'
                : 'text-silver/60 hover:text-white'
            }`}
          >
            <CreditCard size={13} />
            <span>Quota & Plan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('personalization');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'personalization'
                ? 'bg-white/[0.08] text-white shadow'
                : 'text-silver/60 hover:text-white'
            }`}
          >
            <Sliders size={13} />
            <span>Personas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('memories');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'memories'
                ? 'bg-white/[0.08] text-white shadow'
                : 'text-silver/60 hover:text-white'
            }`}
          >
            <Brain size={13} />
            <span className="flex items-center gap-1">
              <span>Memories</span>
              {memories.length > 0 && (
                <span className="px-1.5 py-0.2 bg-iris/30 text-iris text-[10px] rounded-full font-mono">
                  {memories.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-crimson/10 border border-crimson/20 text-xs text-crimson flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-iris/30 to-cyan-500/30 border border-white/[0.1] flex items-center justify-center text-lg font-semibold text-white shadow-inner">
                    {userInitial}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{user.email || 'Authenticated Member'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <Shield size={10} /> Active Member
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson hover:bg-crimson/20 text-xs transition-colors"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Password Section */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Security & Password</div>
                    <div className="text-[11px] text-silver/40 font-light mt-0.5">
                      Update your account master password
                    </div>
                  </div>
                  {!showPasswordForm && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(true)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-silver/80 hover:text-white transition-colors"
                    >
                      Change Password
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-silver/50 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-iris"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-silver/50 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password..."
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-iris"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-silver/70 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-1.5 rounded-lg bg-iris hover:bg-iris-hover text-white font-medium shadow-md"
                      >
                        {loading ? 'Updating...' : 'Save Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Quota & Token Meter */}
          {activeTab === 'quota' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c0c20] to-[#070714] border border-iris/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-iris/20 text-iris">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Active Plan: Pro Developer</h4>
                      <span className="text-[10px] font-mono text-iris uppercase">Fast Cascade Routing</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Active
                  </span>
                </div>

                {/* Token Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-silver/60">Monthly Token Quota:</span>
                    <span className="text-white font-semibold">1,245,000 / 20,000,000 tokens (6.2%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-iris to-cyan-400 rounded-full" style={{ width: '6.2%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-silver/40">
                    <span>Rate limit: 300 req/min</span>
                    <span>Resets on the 1st of next month</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] font-mono uppercase text-silver/40">Inference Engines</div>
                    <div className="text-xs text-white font-medium mt-0.5">Gemini 2.5, Groq, Cerebras</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] font-mono uppercase text-silver/40">Grounding</div>
                    <div className="text-xs text-white font-medium mt-0.5">Unlimited Google Search</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Personas & Tone */}
          {activeTab === 'personalization' && (
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-2">Specialized AI Persona</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {personaOptions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedPersona === p.id
                          ? 'border-iris bg-iris/10 text-white shadow-sm'
                          : 'border-white/[0.05] bg-white/[0.015] text-silver/70 hover:border-white/[0.1]'
                      }`}
                    >
                      <div className="font-medium text-xs text-white">{p.title}</div>
                      <div className="text-[11px] text-silver/40 font-light mt-0.5 leading-snug">{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-2">Conversational Tone</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {toneOptions.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTone(t.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedTone === t.id
                          ? 'border-iris bg-iris/10 text-white shadow-sm'
                          : 'border-white/[0.05] bg-white/[0.015] text-silver/70 hover:border-white/[0.1]'
                      }`}
                    >
                      <div className="font-medium text-xs text-white">{t.title}</div>
                      <div className="text-[11px] text-silver/40 font-light mt-0.5 leading-snug">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Custom Instructions Override</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always respond in TypeScript, omit unnecessary commentary, prioritize functional clean code..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-iris resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPreferences}
                  className="px-5 py-2 rounded-xl bg-iris hover:bg-iris-hover text-white font-medium shadow-md shadow-iris/20"
                >
                  {savingPreferences ? 'Saving...' : 'Apply Calibrations'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Memories */}
          {activeTab === 'memories' && (
            <div className="space-y-4">
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Remember fact (e.g., 'Primary stack is Next.js 15 and Supabase')..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-iris"
                />
                <button
                  type="submit"
                  disabled={addingMemory || !newMemoryText.trim()}
                  className="px-4 py-2 rounded-xl bg-iris hover:bg-iris-hover text-white font-medium disabled:opacity-40 flex items-center gap-1 shrink-0"
                >
                  <Plus size={13} />
                  <span>Store</span>
                </button>
              </form>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono uppercase text-silver/40">Stored Neural Facts</span>
                {memories.length > 0 && (
                  <button
                    onClick={handleClearAllMemories}
                    className="text-[11px] text-crimson hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {memories.length === 0 ? (
                  <div className="p-6 text-center text-silver/40 font-light">
                    No memories stored yet. Zorvik AI automatically learns facts during conversation or you can add them above.
                  </div>
                ) : (
                  memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-3"
                    >
                      <div className="text-white text-xs font-light">{m.text}</div>
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="p-1 rounded-md text-silver/30 hover:text-crimson hover:bg-crimson/10 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
