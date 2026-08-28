import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppWorkspace } from './components/AppWorkspace';
import { LegalPage, LegalPageType } from './components/LegalPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { getSupabase } from './lib/supabase';

export type AppView = 'landing' | 'app' | 'admin' | LegalPageType;

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

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/admin' || p.startsWith('/admin/')) {
        setCurrentView('admin');
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

    // Listen for OAuth sign-in completion to automatically navigate to app
    const supabase = getSupabase();
    let authSub: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (window.location.pathname !== '/app' && window.location.pathname !== '/admin') {
            window.history.pushState({}, '', '/app');
            setCurrentView('app');
          }
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

  if (currentView === 'app') {
    return <AppWorkspace onNavigateHome={navigateToLanding} />;
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
