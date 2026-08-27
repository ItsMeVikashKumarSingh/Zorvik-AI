import React from 'react';
import { Plus, X, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
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
  onNavigateHome,
}) => {
  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:relative z-50 h-full w-[260px] bg-black border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Lockup */}
        <div className="p-5 flex items-center justify-between border-b border-white/[0.04]">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-left group"
          >
            <span className="font-semibold tracking-wider text-white text-xs">ZORVIK</span>
            <span className="text-iris font-mono text-xs">·</span>
            <span className="text-iris font-mono text-xs uppercase tracking-widest">AI</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-silver/60 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat Trigger: Ghost Link */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between py-2 text-xs font-mono tracking-wider text-white hover:text-iris uppercase transition-colors"
          >
            <span>+ NEW CONVERSATION</span>
            <Plus size={14} />
          </button>
        </div>

        {/* Filter Input */}
        {sessions.length > 3 && (
          <div className="px-4 py-2 border-b border-white/[0.04]">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-b border-white/[0.06] focus:border-iris/60 py-1 text-xs text-white placeholder-silver/30 outline-none font-light transition-colors"
            />
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="py-6 text-xs text-silver/30 font-light text-center">
              No conversations
            </div>
          ) : (
            filteredSessions.map(session => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between py-2 text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'text-white font-medium pl-2 border-l-2 border-iris'
                      : 'text-silver/60 hover:text-white font-light'
                  }`}
                >
                  <span className="truncate pr-2">{session.title || 'Untitled'}</span>
                  <button
                    onClick={e => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-silver/30 hover:text-crimson transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Dala / ThoughtLab Ghost Meta Links */}
        <div className="p-4 border-t border-white/[0.04] space-y-2 text-[11px] font-mono text-silver/50">
          <div
            onClick={onOpenAuth}
            className="flex items-center justify-between py-1 cursor-pointer hover:text-white transition-colors"
          >
            <span>{user.isGuest ? 'GUEST' : user.email?.toUpperCase()}</span>
            <span className="text-iris font-semibold uppercase">{user.isGuest ? 'SIGN IN' : 'MANAGE'}</span>
          </div>

          <button
            onClick={onNavigateHome}
            className="w-full flex items-center gap-1.5 py-1 hover:text-white transition-colors text-left"
          >
            <ArrowLeft size={11} />
            <span>OVERVIEW</span>
          </button>

          <a
            href="https://zorviktech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-1 hover:text-white transition-colors"
          >
            <span>ZORVIK TECH</span>
            <ExternalLink size={10} />
          </a>

          {sessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full text-left py-1 text-silver/30 hover:text-crimson transition-colors"
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
