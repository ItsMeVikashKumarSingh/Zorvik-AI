import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  user: UserProfile;
  onOpenAuth: () => void;
  onNavigateHome: () => void;
  accentColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  user,
  onOpenAuth,
  onNavigateHome,
}) => {
  return (
    <header className="h-14 px-4 sm:px-8 border-b border-white/[0.04] bg-black flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-silver hover:text-white transition-colors md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Minimal Monospace Model Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-silver/60">
          <span className="w-1.5 h-1.5 rounded-full bg-iris animate-pulse"></span>
          <span className="text-white font-medium">ZORVIK AI</span>
          <span className="text-[10px] text-silver/40">/ FAST</span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs font-mono tracking-wider uppercase">
        <button
          onClick={onNavigateHome}
          className="text-silver/60 hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          <span>OVERVIEW</span>
        </button>

        <button
          onClick={onOpenAuth}
          className="text-iris hover:text-white font-semibold transition-colors"
        >
          {user.isGuest ? 'SIGN IN' : 'ACCOUNT'}
        </button>
      </div>
    </header>
  );
};
