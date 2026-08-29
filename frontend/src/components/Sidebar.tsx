import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Search, Clock, MessageSquare, PanelLeftClose, BookOpen, Folder, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { ChatSession, UserProfile, ProjectWorkspace } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user: UserProfile;
  onOpenAuth: () => void;
  onOpenAccount?: () => void;
  onOpenPromptLibrary?: () => void;
  onNavigateHome: () => void;
  workspaces?: ProjectWorkspace[];
  activeWorkspaceId?: string | null;
  onSelectWorkspace?: (id: string | null) => void;
  onCreateWorkspace?: (name: string, description: string) => void;
  onDeleteWorkspace?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  searchQuery,
  onSearchChange,
  user,
  onOpenAuth,
  onOpenAccount,
  onOpenPromptLibrary,
  onNavigateHome,
  workspaces = [],
  activeWorkspaceId = null,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
}) => {
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !onCreateWorkspace) return;
    onCreateWorkspace(newWorkspaceName.trim(), 'Project workspace for scoped documents and chats');
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWorkspace = !activeWorkspaceId || s.projectId === activeWorkspaceId;
      return matchesSearch && matchesWorkspace;
    });
  }, [sessions, searchQuery, activeWorkspaceId]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const earlier: ChatSession[] = [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    filteredSessions.forEach(s => {
      const diff = now - s.updatedAt;
      if (diff < oneDay) {
        today.push(s);
      } else if (diff < 2 * oneDay) {
        yesterday.push(s);
      } else if (diff < 7 * oneDay) {
        previous7Days.push(s);
      } else {
        earlier.push(s);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 Days', items: previous7Days },
      { label: 'Earlier', items: earlier },
    ].filter(g => g.items.length > 0);
  }, [filteredSessions]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative z-50 h-full bg-[#07070a] border-r border-white/[0.06] flex flex-col transition-all duration-200 ease-in-out shrink-0 ${
          isOpen
            ? 'w-[260px] translate-x-0 opacity-100'
            : 'w-0 -translate-x-full md:w-0 md:translate-x-0 opacity-0 overflow-hidden border-r-0 pointer-events-none'
        }`}
      >
        {/* Top Header Lockup */}
        <div className="p-4 flex items-center justify-between border-b border-white/[0.04] min-w-[260px]">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-left group"
          >
            <img src="/logo.png" alt="Zorvik AI" className="w-5 h-5 rounded-md object-contain" />
            <span className="font-semibold tracking-wide text-white text-sm">Zorvik AI</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Collapse Sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* New Thread & Prompt Library Actions */}
        <div className="p-3 border-b border-white/[0.04] min-w-[260px] space-y-1.5">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.20] hover:bg-white/[0.08] text-xs text-white transition-all group font-medium"
          >
            <span>New Thread</span>
            <Plus size={14} className="text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {onOpenPromptLibrary && (
            <button
              onClick={onOpenPromptLibrary}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-white/[0.03] text-xs text-slate-400 hover:text-slate-200 transition-all group"
              title="Explore prompt blueprints and templates"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="font-normal">Prompt Library</span>
              </div>
            </button>
          )}

          {/* Project Workspaces & Folders Header */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-1 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              <button
                onClick={() => setIsWorkspacesOpen(!isWorkspacesOpen)}
                className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
              >
                {isWorkspacesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <Folder size={11} className="text-purple-400" />
                <span>Workspaces ({workspaces.length})</span>
              </button>
              <button
                onClick={() => setIsCreatingWorkspace(true)}
                className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Create New Project Workspace"
              >
                <FolderPlus size={12} />
              </button>
            </div>

            {/* Create Workspace Inline Form */}
            {isCreatingWorkspace && (
              <form onSubmit={handleCreateWorkspaceSubmit} className="mt-1 space-y-1 p-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name (e.g. Fintech App)..."
                  className="w-full bg-[#080810] border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-white outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingWorkspace(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-medium"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Workspaces List */}
            {isWorkspacesOpen && workspaces.length > 0 && (
              <div className="space-y-0.5 mt-1">
                <div
                  onClick={() => onSelectWorkspace && onSelectWorkspace(null)}
                  className={`flex items-center justify-between px-2.5 py-1 rounded-xl text-xs cursor-pointer transition-all ${
                    activeWorkspaceId === null
                      ? 'bg-white/[0.06] text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="truncate">All Threads</span>
                </div>
                {workspaces.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => onSelectWorkspace && onSelectWorkspace(w.id)}
                    className={`group flex items-center justify-between px-2.5 py-1 rounded-xl text-xs cursor-pointer transition-all ${
                      activeWorkspaceId === w.id
                        ? 'bg-purple-900/30 border border-purple-500/40 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Folder size={11} className={activeWorkspaceId === w.id ? 'text-purple-400' : 'text-slate-500'} />
                      <span className="truncate">{w.name}</span>
                    </div>
                    {onDeleteWorkspace && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteWorkspace(w.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete Workspace"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search History Filter */}
        {sessions.length > 2 && (
          <div className="px-3 pt-2 pb-1">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-white/[0.20] rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Grouped Threads List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {groupedSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-600 font-light flex flex-col items-center gap-2">
              <MessageSquare size={16} className="text-slate-700" />
              <span>No search threads yet</span>
            </div>
          ) : (
            groupedSessions.map(group => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-semibold">
                  <Clock size={10} className="text-slate-600" />
                  <span>{group.label}</span>
                </div>
                {group.items.map(session => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-white/[0.08] text-white font-medium shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className="truncate pr-2">{session.title || 'Untitled'}</span>
                      <button
                        onClick={e => onDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity shrink-0"
                        title="Delete Thread"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Minimal Footer */}
        <div className="p-3 border-t border-white/[0.04] space-y-1.5 text-xs text-slate-400">
          <div
            onClick={() => {
              if (user.isGuest) {
                onOpenAuth();
              } else if (onOpenAccount) {
                onOpenAccount();
              } else {
                onOpenAuth();
              }
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-mono truncate">{user.isGuest ? 'Guest User' : user.email}</span>
            <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">{user.isGuest ? 'Sign In' : 'Settings'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};


