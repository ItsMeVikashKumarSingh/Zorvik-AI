import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, LogOut, KeyRound, User, ChevronDown, Share2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { AuthModalTab } from './AuthModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
  user: UserProfile;
  onOpenAuth: (tab?: AuthModalTab) => void;
  onOpenAccount?: () => void;
  onOpenShare?: () => void;
  onSignOut?: () => void;
  activeTitle?: string;
  hasMessages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  sidebarOpen,
  user,
  onOpenAuth,
  onOpenAccount,
  onOpenShare,
  onSignOut,
  activeTitle,
  hasMessages,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <header className="h-13 py-2 px-4 sm:px-6 border-b border-white/[0.06] bg-[#07070a]/90 backdrop-blur-xl flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3 min-w-0">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}

        {/* Minimal Brand & Thread Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 shrink-0">
            <span className="text-white font-medium tracking-wide">Zorvik AI</span>
          </div>

          {activeTitle && (
            <span className="text-xs text-slate-400 font-light truncate hidden sm:inline max-w-xs">
              / {activeTitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-xs relative" ref={dropdownRef}>
        {/* Whole-Thread Share & Export Button (Top Bar) */}
        {hasMessages && onOpenShare && (
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.06] text-xs text-slate-300 hover:text-white transition-all font-medium"
            title="Export Thread (Markdown, HTML Report, JSON, Link)"
          >
            <Share2 size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Export Thread</span>
          </button>
        )}

        {user.isGuest ? (
          <button
            onClick={() => onOpenAuth('signin')}
            className="text-xs font-medium text-white px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white hover:text-black border border-white/[0.12] transition-all shadow-sm"
          >
            Sign In
          </button>
        ) : (
          <div>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.16] text-xs text-slate-200 transition-all font-medium"
            >
              <div className="w-4 h-4 rounded-full bg-white/[0.1] text-white flex items-center justify-center text-[10px]">
                <User size={10} />
              </div>
              <span className="max-w-[120px] sm:max-w-[160px] truncate">{user.email || 'Account'}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {/* Account Popover Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0c0c14]/95 border border-white/[0.10] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                <div className="px-3 py-2 border-b border-white/[0.04]">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Signed in as</p>
                  <p className="text-xs font-medium text-white truncate mt-0.5">{user.email}</p>
                </div>

                {onOpenAccount && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAccount();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                  >
                    <Sparkles size={13} className="text-indigo-400" />
                    <span>Account & Settings</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAuth('reset_password');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                >
                  <KeyRound size={13} className="text-slate-400" />
                  <span>Change Password</span>
                </button>

                {onSignOut && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
