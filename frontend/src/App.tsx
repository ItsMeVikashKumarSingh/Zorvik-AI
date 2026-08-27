import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppWorkspace } from './components/AppWorkspace';
import { LegalPage, LegalPageType } from './components/LegalPage';

const getInitialView = (): 'landing' | 'app' | LegalPageType => {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname;
  if (path === '/app' || path === '/chat' || path.startsWith('/app/')) {
    return 'app';
  }
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  if (path === '/security') return 'security';
  return 'landing';
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | LegalPageType>(getInitialView);

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/app' || p === '/chat' || p.startsWith('/app/')) {
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
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToApp = () => {
    window.history.pushState({}, '', '/app');
    setCurrentView('app');
  };

  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('landing');
  };

  const navigateToLegal = (type: LegalPageType) => {
    window.history.pushState({}, '', `/${type}`);
    setCurrentView(type);
  };

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

  return <LandingPage onLaunchApp={navigateToApp} onNavigateLegal={navigateToLegal} />;
};

export default App;

