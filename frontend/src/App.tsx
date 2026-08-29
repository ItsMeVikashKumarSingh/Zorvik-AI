import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppWorkspace } from './components/AppWorkspace';
import { LegalPage, LegalPageType } from './components/LegalPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProfileSettingsPage } from './components/ProfileSettingsPage';
import { getSupabase, getOrCreateGuestId } from './lib/supabase';
import { UserProfile } from './types';

export type AppView = 'landing' | 'app' | 'admin' | 'settings' | LegalPageType;

const getInitialView = (): AppView => {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  // Auto-detect OAuth redirect (access_token, refresh_token, or code)
  if (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('type=recovery') ||
    search.includes('code=')
  ) {
    return 'app';
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    return 'admin';
  }
  if (path === '/settings' || path === '/profile') {
    return 'settings';
  }
  if (path === '/app' || path === '/chat' || path.startsWith('/app/')) {
    return 'app';
  }
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  if (path === '/security') return 'security';
  return 'landing';
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [user, setUser] = useState<UserProfile>({
    id: getOrCreateGuestId(),
    email: null,
    isGuest: true,
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/admin' || p.startsWith('/admin/')) {
        setCurrentView('admin');
      } else if (p === '/settings' || p === '/profile') {
        setCurrentView('settings');
      } else if (p === '/app' || p === '/chat' || p.startsWith('/app/')) {
        setCurrentView('app');
      } else if (p === '/privacy') {
        setCurrentView('privacy');
      } else if (p === '/terms') {
        setCurrentView('terms');
      } else if (p === '/security') {
        setCurrentView('security');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Sync active session user
    const supabase = getSupabase();
    let authSub: { unsubscribe: () => void } | null = null;
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || null,
            isGuest: false,
          });
        }
      });

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || null,
            isGuest: false,
          });
          if (window.location.pathname !== '/app' && window.location.pathname !== '/admin' && window.location.pathname !== '/settings') {
            window.history.pushState({}, '', '/app');
            setCurrentView('app');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser({
            id: getOrCreateGuestId(),
            email: null,
            isGuest: true,
          });
        }
      });
      authSub = data.subscription;
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  const navigateToApp = () => {
    window.history.pushState({}, '', '/app');
    setCurrentView('app');
  };

  const navigateToSettings = () => {
    window.history.pushState({}, '', '/settings');
    setCurrentView('settings');
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentView('admin');
  };

  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('landing');
  };

  const navigateToLegal = (type: LegalPageType) => {
    window.history.pushState({}, '', `/${type}`);
    setCurrentView(type);
  };

  if (currentView === 'admin') {
    return <AdminLayout onNavigateHome={navigateToLanding} onNavigateApp={navigateToApp} />;
  }

  if (currentView === 'settings') {
    return (
      <ProfileSettingsPage
        user={user}
        onNavigateBack={navigateToApp}
        onNavigateHome={navigateToLanding}
      />
    );
  }

  if (currentView === 'app') {
    return (
      <AppWorkspace
        onNavigateHome={navigateToLanding}
        onNavigateSettings={navigateToSettings}
      />
    );
  }

  if (currentView === 'privacy' || currentView === 'terms' || currentView === 'security') {
    return (
      <LegalPage
        type={currentView}
        onNavigateHome={navigateToLanding}
        onLaunchApp={navigateToApp}
        onNavigateLegal={navigateToLegal}
      />
    );
  }

  return (
    <LandingPage
      onLaunchApp={navigateToApp}
      onNavigateLegal={navigateToLegal}
      onNavigateAdmin={navigateToAdmin}
    />
  );
};

export default App;
