import React, { useMemo } from 'react';
import { Plus, Trash2, Search, Clock, MessageSquare, PanelLeftClose } from 'lucide-react';
import { ChatSession, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user: UserProfile;
  onOpenAuth: () => void;
  onOpenAccount?: () => void;
  onNavigateHome: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  searchQuery,
  onSearchChange,
  user,
  onOpenAuth,
  onOpenAccount,
  onNavigateHome,
}) => {
  const filteredSessions = useMemo(() => {
    return sessions.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

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
        className={`fixed md:relative z-50 h-full bg-[#050510] border-r border-white/[0.06] flex flex-col transition-all duration-200 ease-in-out shrink-0 ${
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
            <span className="font-semibold tracking-wider text-white text-sm">Zorvik AI</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Collapse Sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* New Thread Action */}
        <div className="p-3 border-b border-white/[0.04] min-w-[260px]">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-iris/40 hover:bg-iris/10 text-xs text-white transition-all group"
          >
            <span className="font-medium">New Thread</span>
            <Plus size={14} className="text-silver/50 group-hover:text-iris" />
          </button>
        </div>


        {/* Search History Filter */}
        {sessions.length > 2 && (
          <div className="px-3 pt-2 pb-1">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-silver/40" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-iris/40 rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-silver/30 outline-none font-light transition-all"
              />
            </div>
          </div>
        )}

        {/* Grouped Threads List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {groupedSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-silver/30 font-light flex flex-col items-center gap-2">
              <MessageSquare size={16} className="text-silver/20" />
              <span>No search threads yet</span>
            </div>
          ) : (
            groupedSessions.map(group => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-silver/40 flex items-center gap-1.5">
                  <Clock size={10} className="text-silver/30" />
                  <span>{group.label}</span>
                </div>
                {group.items.map(session => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-white/[0.06] text-white font-medium border border-white/[0.08]'
                          : 'text-silver/60 hover:text-white hover:bg-white/[0.03] font-light'
                      }`}
                    >
                      <span className="truncate pr-2">{session.title || 'Untitled'}</span>
                      <button
                        onClick={e => onDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-silver/40 hover:text-crimson transition-opacity shrink-0"
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
        <div className="p-3 border-t border-white/[0.04] space-y-1.5 text-xs text-silver/60">
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
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-mono truncate">{user.isGuest ? 'Guest' : user.email}</span>
            <span className="text-[10px] font-mono text-iris uppercase">{user.isGuest ? 'Sign In' : 'Account'}</span>
          </div>

          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full text-left px-2.5 py-1 text-[11px] font-mono text-silver/30 hover:text-crimson transition-colors"
            >
              Clear All Threads
            </button>
          )}
        </div>
      </aside>
    </>
  );
};


