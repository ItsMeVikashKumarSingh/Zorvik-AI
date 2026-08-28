import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { WelcomeHero } from './WelcomeHero';
import { MessageItem } from './MessageItem';
import { InputDock } from './InputDock';
import { AuthModal, AuthModalTab } from './AuthModal';
import { ChatSession, Message, ModelMode, UserProfile } from '../types';
import { streamChat, fetchAutocomplete } from '../lib/api';
import { getOrCreateGuestId, getSupabase, signOutUser } from '../lib/supabase';

interface AppWorkspaceProps {
  onNavigateHome: () => void;
}

const STORAGE_KEY = 'zorvik_chat_sessions';

export const AppWorkspace: React.FC<AppWorkspaceProps> = ({ onNavigateHome }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ModelMode>('auto');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('signin');
  const [autocompleteHint, setAutocompleteHint] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>({
    id: getOrCreateGuestId(),
    email: null,
    isGuest: true,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autocompleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const closeSidebarIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleOpenAuth = (tab: AuthModalTab = 'signin') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser({
      id: getOrCreateGuestId(),
      email: null,
      isGuest: true,
    });
  };

  // Sync Supabase Auth State on mount
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || null,
          isGuest: false,
        });

        // Clean up OAuth access_token hash from address bar
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    // Listen for auth state change & password recovery triggers
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        handleOpenAuth('reset_password');
      } else if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || null,
          isGuest: false,
        });

        // Clean up OAuth access_token hash from address bar
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser({
          id: getOrCreateGuestId(),
          email: null,
          isGuest: true,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ChatSession[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        }
      }
    } catch (err) {
      console.warn('[Storage Load Warning]:', err);
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[Storage Save Warning]:', err);
    }
  }, []);

  // Get active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isStreaming]);

  // Handle Autocomplete prediction as user types
  const handleInputChange = (val: string) => {
    setInput(val);

    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }

    if (val.trim().length > 3 && !isStreaming) {
      autocompleteTimerRef.current = setTimeout(async () => {
        const hint = await fetchAutocomplete(val);
        setAutocompleteHint(hint);
      }, 350);
    } else {
      setAutocompleteHint(null);
    }
  };

  const handleAcceptAutocomplete = () => {
    if (autocompleteHint) {
      setInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + autocompleteHint);
      setAutocompleteHint(null);
    }
  };

  // Create new session
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession: ChatSession = {
      id: 'sess_' + crypto.randomUUID(),
      title: 'New Thread',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    saveSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setInput('');
    closeSidebarIfMobile();
  };

  // Select session
  const handleSelectSession = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveSessionId(id);
    closeSidebarIfMobile();
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Clear all sessions
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all thread history?')) {
      saveSessions([]);
      setActiveSessionId(null);
    }
  };

  // Stop active stream
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message
  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isStreaming) return;

    setInput('');
    setAutocompleteHint(null);

    let currentSession = activeSession;
    let updatedSessions = [...sessions];

    // Create session if none exists
    if (!currentSession) {
      currentSession = {
        id: 'sess_' + crypto.randomUUID(),
        title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      updatedSessions = [currentSession, ...sessions];
      setActiveSessionId(currentSession.id);
    } else if (currentSession.messages.length === 0) {
      currentSession.title = textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '');
    }

    const userMessage: Message = {
      id: 'msg_' + crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const assistantMessageId = 'msg_' + crypto.randomUUID();

    const placeholderAssistant: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const sessionWithUser = {
      ...currentSession,
      updatedAt: Date.now(),
      messages: [...currentSession.messages, userMessage, placeholderAssistant],
    };

    const nextSessions = updatedSessions.map(s => (s.id === sessionWithUser.id ? sessionWithUser : s));
    saveSessions(nextSessions);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = '';

    // Pass prior conversation history for full multi-turn conversational memory
    const priorHistory = currentSession.messages
      .filter(m => m.content && !m.isStreaming)
      .map(m => ({ role: m.role, content: m.content }));

    await streamChat({
      message: textToSend,
      sessionId: currentSession.id,
      history: priorHistory,
      mode,
      signal: controller.signal,
      onChunk: chunk => {
        accumulatedContent += chunk;
        setSessions(prev =>
          prev.map(s => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map(m =>
                m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m
              ),
            };
          })
        );
      },
      onDone: (finalContent, metadata) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions(prev => {
          const finalSessions = prev.map(s => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map(m =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: finalContent,
                      isStreaming: false,
                      model: metadata?.model || 'Zorvik AI',
                      intent: metadata?.intent,
                      sources: metadata?.sources,
                      relatedQuestions: metadata?.relatedQuestions,
                    }
                  : m
              ),
            };
          });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSessions));
          } catch (err) {
            console.warn('[Storage Save Error]:', err);
          }
          return finalSessions;
        });
      },
      onError: error => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions(prev =>
          prev.map(s => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map(m =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: error.message || 'Failed to generate response.',
                      isStreaming: false,
                      error: true,
                    }
                  : m
              ),
            };
          })
        );
      },
    });
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length < 2 || isStreaming) return;
    const userMessages = activeSession.messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050510] text-silver overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onOpenAuth={() => handleOpenAuth('signin')}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Perplexity Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#050510] relative">
        <Header
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          sidebarOpen={sidebarOpen}
          user={user}
          onOpenAuth={handleOpenAuth}
          onSignOut={handleSignOut}
          activeTitle={activeSession?.messages.length ? activeSession.title : undefined}
        />

        {/* Viewport: Centered Search Hero OR Active Knowledge Synthesis Thread */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 flex flex-col">
          {!activeSession || activeSession.messages.length === 0 ? (
            <WelcomeHero
              input={input}
              onInputChange={handleInputChange}
              onSend={prompt => handleSend(prompt)}
              mode={mode}
              onModeChange={setMode}
              autocompleteHint={autocompleteHint}
              onAcceptAutocomplete={handleAcceptAutocomplete}
            />
          ) : (
            <div className="max-w-3xl mx-auto w-full flex-1 pb-4">
              {activeSession.messages.map(msg => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onSelectFollowup={prompt => handleSend(prompt)}
                  onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Follow-Up Dock (Shown only when in an active thread) */}
        {activeSession && activeSession.messages.length > 0 && (
          <InputDock
            input={input}
            onInputChange={handleInputChange}
            onSend={() => handleSend()}
            onStop={handleStopStreaming}
            isStreaming={isStreaming}
            mode={mode}
            onModeChange={setMode}
            autocompleteHint={autocompleteHint}
            onAcceptAutocomplete={handleAcceptAutocomplete}
          />
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onUserUpdate={updatedUser => setUser(updatedUser)}
      />
    </div>
  );
};

