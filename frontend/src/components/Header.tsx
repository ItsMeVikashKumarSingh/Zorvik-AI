import React from 'react';
import { PanelLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
  user: UserProfile;
  onOpenAuth: () => void;
  activeTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  sidebarOpen,
  user,
  onOpenAuth,
  activeTitle,
}) => {
  return (
    <header className="h-13 py-2 px-4 sm:px-6 border-b border-white/[0.05] bg-[#050510]/80 backdrop-blur-md flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3 min-w-0">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-silver/60 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {/* Minimal Brand & Thread Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-silver/70 shrink-0">
            <img src="/logo.png" alt="Zorvik AI" className="w-3.5 h-3.5 rounded-sm object-contain" />
            <span className="text-white font-medium">Zorvik AI</span>
          </div>

          {activeTitle && (
            <span className="text-xs text-silver/40 font-light truncate hidden sm:inline max-w-xs">
              / {activeTitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-xs">
        <button
          onClick={onOpenAuth}
          className="text-xs font-mono text-iris hover:text-white font-medium px-2.5 py-1 rounded-lg bg-iris/10 hover:bg-iris/20 border border-iris/30 transition-colors"
        >
          {user.isGuest ? 'Sign In' : 'Account'}
        </button>
      </div>
    </header>
  );
};


