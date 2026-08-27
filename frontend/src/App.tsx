import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppWorkspace } from './components/AppWorkspace';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');

  useEffect(() => {
    // Check initial route
    const path = window.location.pathname;
    if (path === '/app' || path === '/chat' || path.startsWith('/app/')) {
      setCurrentView('app');
    } else {
      setCurrentView('landing');
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/app' || p === '/chat') {
        setCurrentView('app');
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

  if (currentView === 'app') {
    return <AppWorkspace onNavigateHome={navigateToLanding} />;
  }

  return <LandingPage onLaunchApp={navigateToApp} />;
};

export default App;
