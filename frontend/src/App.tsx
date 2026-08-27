import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppWorkspace } from './components/AppWorkspace';
import { LegalPage, LegalPageType } from './components/LegalPage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | LegalPageType>('landing');

  useEffect(() => {
    // Check initial route
    const path = window.location.pathname;
    if (path === '/app' || path === '/chat' || path.startsWith('/app/')) {
      setCurrentView('app');
    } else if (path === '/privacy') {
      setCurrentView('privacy');
    } else if (path === '/terms') {
      setCurrentView('terms');
    } else if (path === '/security') {
      setCurrentView('security');
    } else {
      setCurrentView('landing');
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/app' || p === '/chat') {
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

