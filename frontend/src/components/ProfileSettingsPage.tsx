import React, { useState, useEffect } from 'react';
import {
  User,
  Brain,
  Sliders,
  Sparkles,
  Shield,
  Trash2,
  Plus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  ArrowLeft,
  RefreshCw,
  Palette,
  Activity,
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

interface ProfileSettingsPageProps {
  user: UserProfile;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
  onUserUpdate?: (u: UserProfile) => void;
}

type TabType = 'profile' | 'instructions' | 'memories' | 'quotas' | 'appearance' | 'data';

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  user,
  onNavigateBack,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Password Form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Personalization & Tone
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedTone, setSelectedTone] = useState('auto');
  const [selectedPersona, setSelectedPersona] = useState('general');
  const [includeLatex, setIncludeLatex] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Memories
  const [memories, setMemories] = useState<UserMemoryItem[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const [memorySearch, setMemorySearch] = useState('');

  // Appearance
  const [accentColor, setAccentColor] = useState('iris');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Load Preferences & Memories
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem('zorvik_user_prefs');
      if (savedPrefs) {
        const parsed: UserPreferences = JSON.parse(savedPrefs);
        if (parsed.tone) setSelectedTone(parsed.tone);
        if (parsed.persona) setSelectedPersona(parsed.persona);
        if (parsed.customInstructions) setCustomInstructions(parsed.customInstructions);
      }

      const savedMems = localStorage.getItem('zorvik_user_memories');
      if (savedMems) {
        const parsedMems = JSON.parse(savedMems);
        if (Array.isArray(parsedMems)) setMemories(parsedMems);
      }
    } catch (_err) {
      // Non-blocking
    }

    const loadData = async () => {
      try {
        const memRes = await fetchUserMemories();
        if (memRes.preferences) {
          if (memRes.preferences.tone) setSelectedTone(memRes.preferences.tone);
          if (memRes.preferences.persona) setSelectedPersona(memRes.preferences.persona);
          if (memRes.preferences.customInstructions) setCustomInstructions(memRes.preferences.customInstructions);
          localStorage.setItem('zorvik_user_prefs', JSON.stringify(memRes.preferences));
        }
        if (memRes.memories && Array.isArray(memRes.memories)) {
          setMemories(memRes.memories);
          localStorage.setItem('zorvik_user_memories', JSON.stringify(memRes.memories));
        }
      } catch (err) {
        console.warn('[Settings Load Warning]', err);
      }
    };

    loadData();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateUserPassword(newPassword);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message);
    } else {
      setSuccessMsg('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const prefs: UserPreferences = {
        tone: selectedTone,
        persona: selectedPersona,
        customInstructions: customInstructions.trim(),
      };
      await saveUserMemory({ preferences: prefs });
      localStorage.setItem('zorvik_user_prefs', JSON.stringify(prefs));
      setSuccessMsg('System instructions & preferences saved successfully.');
    } catch (_err) {
      setErrorMsg('Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    setAddingMemory(true);
    setErrorMsg(null);
    try {
      const res = await saveUserMemory({ text: newMemoryText.trim() });
      if (res.memories && Array.isArray(res.memories)) {
        setMemories(res.memories);
        localStorage.setItem('zorvik_user_memories', JSON.stringify(res.memories));
      } else {
        const fallbackItem: UserMemoryItem = {
          id: 'mem_' + Date.now(),
          text: newMemoryText.trim(),
          createdAt: Date.now(),
        };
        const updated = [fallbackItem, ...memories];
        setMemories(updated);
        localStorage.setItem('zorvik_user_memories', JSON.stringify(updated));
      }
      setNewMemoryText('');
      setSuccessMsg('Neural memory successfully saved.');
    } catch (_err) {
      setErrorMsg('Failed to store memory.');
    } finally {
      setAddingMemory(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteUserMemory(id);
      const updated = memories.filter((m) => m.id !== id);
      setMemories(updated);
      localStorage.setItem('zorvik_user_memories', JSON.stringify(updated));
    } catch (_err) {
      setErrorMsg('Failed to delete memory.');
    }
  };

  const handleExportMemories = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `zorvik-memories-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleExportChatHistory = () => {
    try {
      const stored = localStorage.getItem('zorvik_chat_sessions') || '[]';
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(stored);
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `zorvik-conversations-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setSuccessMsg('Conversation history exported successfully.');
    } catch (_e) {
      setErrorMsg('Export failed.');
    }
  };

  const filteredMemories = memories.filter((m) =>
    m.text.toLowerCase().includes(memorySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#050510] text-slate-100 font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.06] bg-[#070714]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-silver/80 hover:text-white transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to Workspace</span>
          </button>
          <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />
          <button onClick={onNavigateHome} className="flex items-center gap-2">
            <img src="/logo.png" alt="Zorvik AI" className="w-5 h-5 rounded-md object-contain" />
            <span className="font-semibold tracking-wider text-white text-sm">Zorvik AI</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-iris/20 text-iris border border-iris/30">
              Control Center
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!user.isGuest && (
            <button
              onClick={() => signOutUser().then(onNavigateHome)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 text-xs text-crimson transition-all"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1.5">
          <div className="px-3 pb-3 mb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-[#070714] flex items-center justify-center font-bold text-sm text-white">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : 'GS'}
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {user.email || 'Guest User'}
                </h4>
                <span className="text-[11px] font-mono text-silver/50">
                  {user.isGuest ? 'Local Identity' : 'Verified Member'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-iris/20 text-iris border border-iris/40 shadow-sm'
                : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <User size={15} />
            <span>Profile & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'instructions'
                ? 'bg-iris/20 text-iris border border-iris/40 shadow-sm'
                : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Sliders size={15} />
            <span>Custom Instructions & Persona</span>
          </button>

          <button
            onClick={() => setActiveTab('memories')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'memories'
                ? 'bg-iris/20 text-iris border border-iris/40 shadow-sm'
                : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Brain size={15} />
            <span>Autonomous Neural Memory</span>
          </button>

          <button
            onClick={() => setActiveTab('quotas')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'quotas'
                ? 'bg-iris/20 text-iris border border-iris/40 shadow-sm'
                : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Activity size={15} />
            <span>Quota & Engine Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'appearance'
                ? 'bg-iris/20 text-iris border border-iris/40 shadow-sm'
                : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Palette size={15} />
            <span>Interface & Aesthetics</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'data'
                ? 'bg-iris/20 text-iris border border-iris/40 shadow-sm'
                : 'text-silver/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Database size={15} />
            <span>Data, Privacy & Exports</span>
          </button>
        </aside>

        {/* Tab Detail Pane */}
        <main className="flex-1 min-w-0 bg-[#080816] rounded-2xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-crimson/10 border border-crimson/30 flex items-center gap-3 text-xs text-crimson">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Profile & Security */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-semibold text-white">Profile & Identity</h3>
                <p className="text-xs text-silver/50">Manage your credentials, security keys, and access privileges.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-mono uppercase text-silver/40">User Identifier</span>
                  <div className="font-mono text-xs text-white truncate">{user.id}</div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-mono uppercase text-silver/40">Account Status</span>
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <Shield size={14} />
                    <span>{user.isGuest ? 'Guest Local Session' : 'Secured Member (Active)'}</span>
                  </div>
                </div>
              </div>

              {!user.isGuest ? (
                <div className="pt-4 border-t border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Password & Security</h4>
                      <p className="text-xs text-silver/50">Update your account authentication credentials.</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white font-medium transition-all"
                    >
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <label className="block text-xs font-mono text-silver/60 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#050510] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-iris/60 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-silver/60 mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#050510] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-iris/60 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-iris hover:bg-iris-light text-white text-xs font-medium transition-all"
                      >
                        {loading ? 'Updating...' : 'Save New Password'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-iris/10 border border-iris/30 text-xs text-silver/80 space-y-2">
                  <div className="flex items-center gap-2 text-iris font-medium">
                    <Sparkles size={15} />
                    <span>Create a Free Cloud Account</span>
                  </div>
                  <p>
                    Sign in or register to sync your custom instructions, conversation threads, and autonomous neural memories across all your devices.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Custom Instructions & Persona */}
          {activeTab === 'instructions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-semibold text-white">Custom Instructions & Persona</h3>
                <p className="text-xs text-silver/50">Tailor how Zorvik AI formats responses, technical depth, and architectural reasoning.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-silver/50 mb-2">Technical Persona Role</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'general', label: 'Polymath Engineer', desc: 'Balanced architecture, full-stack, and reasoning' },
                      { id: 'architect', label: 'Systems Architect', desc: 'Distributed systems, scalability, and clean code' },
                      { id: 'researcher', label: 'AI/ML Researcher', desc: 'Deep mathematical foundations, papers, and theory' },
                      { id: 'devops', label: 'Senior SRE / DevOps', desc: 'Kubernetes, cloud pipelines, security & reliability' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPersona(p.id)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          selectedPersona === p.id
                            ? 'bg-iris/20 border-iris text-white shadow-sm'
                            : 'bg-white/[0.02] border-white/[0.06] text-silver/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="text-xs font-semibold">{p.label}</div>
                        <div className="text-[10px] text-silver/40 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-silver/50 mb-2">Conversational Tone</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'auto', label: 'Adaptive Auto' },
                      { id: 'technical', label: 'Rigorous & Deep' },
                      { id: 'concise', label: 'Executive Brief' },
                      { id: 'creative', label: 'Innovative' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTone(t.id)}
                        className={`p-2.5 rounded-xl text-center text-xs font-medium border transition-all ${
                          selectedTone === t.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/[0.02] border-white/[0.06] text-silver/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-silver/50 mb-2">
                    Persistent System Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Always write TypeScript instead of plain JS. Prioritize functional programming and provide code explanations concisely."
                    className="w-full bg-[#050510] border border-white/[0.1] rounded-xl p-3 text-xs text-white focus:border-iris/60 outline-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPreferences}
                    className="px-5 py-2.5 rounded-xl bg-iris hover:bg-iris-light text-white text-xs font-medium transition-all shadow-md flex items-center gap-2"
                  >
                    {savingPreferences ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    <span>Save Instructions</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Autonomous Neural Memory */}
          {activeTab === 'memories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Autonomous Neural Memory</h3>
                  <p className="text-xs text-silver/50">Facts, stack preferences, and goals remembered automatically across chats.</p>
                </div>
                <button
                  onClick={handleExportMemories}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-silver/80 hover:text-white transition-all"
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Teach Zorvik a permanent fact (e.g. 'I work on Next.js 15 & PostgreSQL')..."
                  className="flex-1 bg-[#050510] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:border-iris/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={addingMemory || !newMemoryText.trim()}
                  className="px-4 py-2 rounded-xl bg-iris hover:bg-iris-light disabled:opacity-40 text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Remember</span>
                </button>
              </form>

              {/* Filter */}
              {memories.length > 3 && (
                <input
                  type="text"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder="Filter remembered facts..."
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-silver/80 outline-none"
                />
              )}

              {/* Memory Cards */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredMemories.length === 0 ? (
                  <div className="py-8 text-center text-xs text-silver/30 font-light flex flex-col items-center gap-2">
                    <Brain size={24} className="text-silver/20" />
                    <span>No neural memories stored yet. As you chat, key facts will be captured automatically.</span>
                  </div>
                ) : (
                  filteredMemories.map((m) => (
                    <div
                      key={m.id}
                      className="group flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-iris/30 text-xs text-silver/90 transition-all gap-3"
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-iris mt-1.5 shrink-0" />
                        <span className="leading-relaxed select-text">{m.text}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-silver/40 hover:text-crimson transition-opacity shrink-0"
                        title="Forget this memory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Quotas & Telemetry */}
          {activeTab === 'quotas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-semibold text-white">Quota & Engine Matrix</h3>
                <p className="text-xs text-silver/50">Real-time telemetry on rate limits, token allocations, and active inference engines.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-silver/60">Monthly Token Allocation</span>
                  <span className="text-white">Active (Uncapped $0 Tier)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-iris to-cyan-400 w-1/4 rounded-full" />
                </div>
                <div className="text-[11px] font-mono text-silver/40 flex justify-between">
                  <span>Usage: Healthy</span>
                  <span>Rate Limit: 60 req / min</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-silver/50 mb-3">Multi-Engine Neural Matrix</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Google Gemini 2.5 Flash', role: 'Primary Vision & Web Grounding Engine', status: 'Operational' },
                    { name: 'Groq LPU (Llama 3.3 70B)', role: 'Ultra-Fast 500+ tok/s Cascade', status: 'Operational' },
                    { name: 'Mistral & Codestral', role: 'Specialized Code Intelligence', status: 'Operational' },
                    { name: 'OpenRouter (DeepSeek R1)', role: 'Deep Multi-Step Mathematical Reasoning', status: 'Operational' },
                  ].map((eng, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-white">{eng.name}</div>
                        <div className="text-[10px] text-silver/40">{eng.role}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {eng.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Appearance & Interface */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-semibold text-white">Interface & Aesthetics</h3>
                <p className="text-xs text-silver/50">Customize the visual density, cyber glow effects, and animation intensity.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-silver/50 mb-2">Accent Glow Theme</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'iris', label: 'Iris Purple', color: 'bg-purple-600' },
                      { id: 'cyan', label: 'Cyber Cyan', color: 'bg-cyan-500' },
                      { id: 'crimson', label: 'Neon Crimson', color: 'bg-rose-500' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setAccentColor(th.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          accentColor === th.id
                            ? 'border-white/40 bg-white/[0.06] text-white shadow-md'
                            : 'border-white/[0.06] bg-white/[0.02] text-silver/60 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${th.color}`} />
                        <span>{th.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Smooth Motion Animations</div>
                      <div className="text-[10px] text-silver/40">Enable Glassmorphism 2.0 animated floating backgrounds.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={animationsEnabled}
                      onChange={(e) => setAnimationsEnabled(e.target.checked)}
                      className="accent-purple-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Format Math with LaTeX</div>
                      <div className="text-[10px] text-silver/40">Render formulas like $E=mc^2$ via KaTeX engine.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeLatex}
                      onChange={(e) => setIncludeLatex(e.target.checked)}
                      className="accent-purple-600 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Data, Privacy & Exports */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-semibold text-white">Data, Privacy & Local Storage</h3>
                <p className="text-xs text-silver/50">Export your conversation transcripts, wipe cache, or inspect security protocols.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-white">Export All Conversations</h4>
                    <p className="text-[10px] text-silver/40">Download a complete JSON backup of all stored thread histories.</p>
                  </div>
                  <button
                    onClick={handleExportChatHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white font-medium transition-all"
                  >
                    <Download size={13} />
                    <span>Export Archive</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-white">Security & Encryption</h4>
                    <p className="text-[10px] text-silver/40">All requests are TLS 1.3 encrypted with ephemeral token streaming.</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    AES-256 Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
