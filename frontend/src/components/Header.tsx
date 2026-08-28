import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, LogOut, KeyRound, User, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';
import { AuthModalTab } from './AuthModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
  user: UserProfile;
  onOpenAuth: (tab?: AuthModalTab) => void;
  onOpenAccount?: () => void;
  onSignOut?: () => void;
  activeTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  sidebarOpen,
  user,
  onOpenAuth,
  onOpenAccount,
  onSignOut,
  activeTitle,
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

      <div className="flex items-center gap-2 sm:gap-3 text-xs relative" ref={dropdownRef}>
        {user.isGuest ? (
          <button
            onClick={() => onOpenAuth('signin')}
            className="text-xs font-mono text-iris hover:text-white font-medium px-3 py-1.5 rounded-lg bg-iris/10 hover:bg-iris/20 border border-iris/30 transition-all shadow-sm"
          >
            Sign In
          </button>
        ) : (
          <div>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-iris/40 text-xs text-white transition-all font-light"
            >
              <div className="w-4 h-4 rounded-full bg-iris/20 text-iris flex items-center justify-center text-[10px]">
                <User size={10} />
              </div>
              <span className="max-w-[120px] sm:max-w-[160px] truncate">{user.email || 'Account'}</span>
              <ChevronDown size={12} className="text-silver/40" />
            </button>

            {/* Account Popover Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#090914] border border-white/[0.08] p-2 shadow-2xl z-50 animate-fadeIn space-y-1">
                <div className="px-3 py-2 border-b border-white/[0.04]">
                  <p className="text-[10px] font-mono text-silver/40 uppercase">Signed in as</p>
                  <p className="text-xs font-medium text-white truncate">{user.email}</p>
                </div>

                {onOpenAccount && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAccount();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-silver/80 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                  >
                    <User size={13} className="text-iris" />
                    <span>Account & Memories</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAuth('reset_password');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-silver/80 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2"
                >
                  <KeyRound size={13} className="text-silver/40" />
                  <span>Change Password</span>
                </button>

                {onSignOut && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-crimson hover:bg-crimson/10 transition-colors flex items-center gap-2"
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


