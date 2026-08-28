import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Brain,
  Sliders,
  Trash2,
  Plus,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  KeyRound,
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

type TabType = 'profile' | 'personalization' | 'memories';

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
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Memories State
  const [memories, setMemories] = useState<UserMemoryItem[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Load user memories & preferences when modal opens
  useEffect(() => {
    if (!isOpen || user.isGuest) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingMemories(true);

    fetchUserMemories()
      .then(data => {
        if (data.preferences) {
          setCustomInstructions(data.preferences.customInstructions || '');
          setSelectedTone(data.preferences.tone || 'auto');
        }
        if (data.memories) {
          setMemories(data.memories);
        }
      })
      .catch(err => {
        console.warn('Failed to load user memories:', err);
      })
      .finally(() => {
        setLoadingMemories(false);
      });
  }, [isOpen, user.isGuest]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: { preferences: UserPreferences } = {
        preferences: {
          customInstructions,
          tone: selectedTone,
        },
      };
      await saveUserMemory(payload);
      setSuccessMsg('Personalization preferences saved successfully!');
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
      setSuccessMsg('Memory added to Zorvik AI!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add memory');
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

  // Extract user initial / display name
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#090912] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-purple-950/30 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-iris/10 border border-iris/20 flex items-center justify-center text-iris">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-white tracking-wide">Account & Intelligence</h3>
              <p className="text-[11px] font-light text-silver/60">Manage your profile, custom tone & neural memories</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-silver/40 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl my-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
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
              setActiveTab('personalization');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'personalization'
                ? 'bg-white/[0.08] text-white shadow'
                : 'text-silver/60 hover:text-white'
            }`}
          >
            <Sliders size={13} />
            <span>Tone & Style</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('memories');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'memories'
                ? 'bg-white/[0.08] text-white shadow'
                : 'text-silver/60 hover:text-white'
            }`}
          >
            <Brain size={13} />
            <span className="flex items-center gap-1.5">
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

        {/* Scrollable Tab Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-iris/30 to-cyan-500/30 border border-white/[0.1] flex items-center justify-center text-lg font-semibold text-white shadow-inner">
                    {userInitial}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{user.email || 'Authenticated User'}</div>
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
                    <div className="text-[11px] text-silver/50">Update your account login password</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-xs text-iris hover:underline font-mono"
                  >
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2 border-t border-white/[0.04]">
                    <div>
                      <label className="block text-[10px] font-mono text-silver/60 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={13} className="absolute left-3 text-silver/40 pointer-events-none" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-silver/30 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-silver/60 uppercase tracking-wider mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center">
                        <KeyRound size={13} className="absolute left-3 text-silver/40 pointer-events-none" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-silver/30 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 rounded-xl bg-iris hover:bg-iris-hover text-white text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Personalization & Tone */}
          {activeTab === 'personalization' && (
            <form onSubmit={handleSavePreferences} className="space-y-4">
              {/* Tone Grid */}
              <div>
                <label className="block text-[11px] font-mono text-silver/60 uppercase tracking-wider mb-2">
                  Response Tone & Intelligence Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {toneOptions.map(t => {
                    const isSelected = selectedTone === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTone(t.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-iris/10 border-iris/50 text-white shadow-sm'
                            : 'bg-white/[0.02] border-white/[0.05] text-silver/70 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs text-white">{t.title}</span>
                          {isSelected && <Sparkles size={13} className="text-iris" />}
                        </div>
                        <p className="text-[11px] font-light text-silver/50 leading-relaxed">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Instructions Textarea */}
              <div>
                <label className="block text-[11px] font-mono text-silver/60 uppercase tracking-wider mb-1">
                  Custom Instructions for Zorvik AI
                </label>
                <p className="text-[11px] text-silver/40 mb-2">
                  What would you like Zorvik AI to know about you to provide better responses? (e.g. your role, preferred tech stack, or formatting rules)
                </p>
                <textarea
                  rows={4}
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="e.g. I am a Full-Stack Engineer building with React and Node.js. Keep code examples typed in TypeScript and avoid boilerplate explanations."
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl p-3 text-xs text-white placeholder-silver/30 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingPreferences}
                className="w-full py-2.5 rounded-xl bg-iris hover:bg-iris-hover text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
              >
                {savingPreferences ? 'Saving Preferences...' : 'Save Personalization'}
              </button>
            </form>
          )}

          {/* TAB 3: Memories Hub */}
          {activeTab === 'memories' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-iris/20 text-silver/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                  <Brain size={14} className="text-iris" />
                  <span>Neural Long-Term Memory</span>
                </div>
                <p className="text-[11px] font-light text-silver/60 leading-relaxed">
                  Zorvik AI retains these facts across all conversation threads to tailor responses specifically to you.
                </p>
              </div>

              {/* Add Memory Input */}
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={e => setNewMemoryText(e.target.value)}
                  placeholder="Add a memory (e.g. 'I prefer Tailwind CSS over Bootstrap')"
                  className="flex-1 bg-white/[0.02] border border-white/[0.06] focus:border-iris/50 rounded-xl px-3 py-2 text-xs text-white placeholder-silver/30 outline-none"
                />
                <button
                  type="submit"
                  disabled={addingMemory || !newMemoryText.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-iris hover:bg-iris-hover text-white text-xs font-medium transition-all disabled:opacity-50 shrink-0"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </form>

              {/* Memories List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-silver/60 uppercase tracking-wider">
                    Remembered Facts ({memories.length})
                  </span>
                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllMemories}
                      className="text-[11px] font-mono text-crimson/70 hover:text-crimson transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {loadingMemories ? (
                  <div className="p-6 text-center text-silver/40 font-mono text-xs">Loading memories...</div>
                ) : memories.length === 0 ? (
                  <div className="p-6 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-silver/40 font-light text-xs">
                    No memories stored yet. Add key facts or preferences above!
                  </div>
                ) : (
                  memories.map(m => (
                    <div
                      key={m.id}
                      className="group p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] flex items-start justify-between gap-3 transition-all"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs text-white/90 font-light leading-relaxed">{m.text}</p>
                        <span className="text-[10px] font-mono text-silver/40">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-silver/40 hover:text-crimson transition-opacity shrink-0"
                        title="Delete Memory"
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
