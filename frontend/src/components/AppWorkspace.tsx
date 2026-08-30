import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { WelcomeHero } from './WelcomeHero';
import { MessageItem } from './MessageItem';
import { InputDock } from './InputDock';
import { AuthModal, AuthModalTab } from './AuthModal';
import { AccountModal } from './AccountModal';
import { ShareModal } from './ShareModal';
import { PromptLibraryModal } from './PromptLibraryModal';
import { ArtifactsCanvas } from './ArtifactsCanvas';
import {
  ChatSession,
  Message,
  ModelMode,
  UserProfile,
  FileAttachment,
  ArtifactContent,
  ProjectWorkspace,
} from '../types';
import { streamChat } from '../lib/api';
import { getOrCreateGuestId, getSupabase, signOutUser, saveUserWorkspaces, loadUserWorkspaces } from '../lib/supabase';

interface AppWorkspaceProps {
  onNavigateHome: () => void;
  onNavigateSettings?: () => void;
}

const STORAGE_KEY = 'zorvik_chat_sessions';

export const AppWorkspace: React.FC<AppWorkspaceProps> = ({
  onNavigateHome,
  onNavigateSettings,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<ProjectWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ModelMode>('auto');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('signin');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<Message | null>(null);
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactContent | null>(null);
  const [artifactCanvasOpen, setArtifactCanvasOpen] = useState(false);

  const [user, setUser] = useState<UserProfile>({
    id: getOrCreateGuestId(),
    email: null,
    isGuest: true,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load workspaces on mount
  useEffect(() => {
    loadUserWorkspaces().then((loaded) => {
      if (Array.isArray(loaded)) {
        setWorkspaces(loaded as ProjectWorkspace[]);
      }
    });
  }, []);

  const handleCreateWorkspace = async (name: string, description: string) => {
    const newWs: ProjectWorkspace = {
      id: 'proj_' + Date.now(),
      name,
      description,
      documents: [],
      sessionIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newWs, ...workspaces];
    setWorkspaces(updated);
    setActiveWorkspaceId(newWs.id);
    await saveUserWorkspaces(updated);
  };

  const handleDeleteWorkspace = async (id: string) => {
    const updated = workspaces.filter((w) => w.id !== id);
    setWorkspaces(updated);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(null);
    }
    await saveUserWorkspaces(updated);
  };

  const closeSidebarIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Sign out handler
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

        // Clean up OAuth query parameters/hash from address bar
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
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

        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          // Check if a specific chat was explicitly requested in URL query
          const params = new URLSearchParams(window.location.search);
          const chatParam = params.get('chat');
          if (chatParam && parsed.some((s) => s.id === chatParam)) {
            setActiveSessionId(chatParam);
          } else {
            // Default to null so visiting or reopening the link starts a clean, fresh conversation dock
            setActiveSessionId(null);
          }
        }
      }
    } catch (err) {
      console.warn('[Storage Load Warning]:', err);
    }
  }, []);

  // Persist sessions helper
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[Storage Save Warning]:', err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isStreaming, scrollToBottom]);

  // Create new session
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession: ChatSession = {
      id: 'sess_' + crypto.randomUUID(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    setInput('');
    setAttachments([]);
    closeSidebarIfMobile();
  };

  // Select session
  const handleSelectSession = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveSessionId(id);
    setAttachments([]);
    closeSidebarIfMobile();
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Stop / Cancel active stream
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Handle blueprint selection from modal
  const handleSelectBlueprint = (template: string, blueprintMode: ModelMode) => {
    setInput(template);
    setMode(blueprintMode);
  };

  // Send message
  const handleSend = async (customPrompt?: string, filesToSend?: FileAttachment[]) => {
    const textToSend = (customPrompt || input).trim();
    const currentAttachments = filesToSend || attachments;

    if ((!textToSend && currentAttachments.length === 0) || isStreaming) return;

    setInput('');
    setAttachments([]);

    let currentSession = activeSession;
    let updatedSessions = [...sessions];

    // Create session if none exists
    if (!currentSession) {
      currentSession = {
        id: 'sess_' + crypto.randomUUID(),
        title: (textToSend || currentAttachments[0]?.name || 'Chat').slice(0, 36),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      updatedSessions = [currentSession, ...sessions];
      setActiveSessionId(currentSession.id);
    } else if (currentSession.messages.length === 0) {
      currentSession.title = (textToSend || currentAttachments[0]?.name || 'Chat').slice(0, 36);
    }

    const userMessage: Message = {
      id: 'msg_' + crypto.randomUUID(),
      role: 'user',
      content: textToSend || `Sent ${currentAttachments.length} file(s)`,
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
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

    const nextSessions = updatedSessions.map((s) => (s.id === sessionWithUser.id ? sessionWithUser : s));
    saveSessions(nextSessions);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Handle /image and /video slash commands directly
    if (textToSend.startsWith('/image ') || textToSend.startsWith('/video ')) {
      const isVideo = textToSend.startsWith('/video ');
      const mediaPrompt = textToSend.replace(/^\/(image|video)\s+/, '').trim();
      const endpoint = isVideo ? '/api/v1/generate/video' : '/api/v1/generate/image';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: mediaPrompt, model: isVideo ? 'wan2.1' : 'flux' }),
        });
        const json = await res.json();
        setIsStreaming(false);
        abortControllerRef.current = null;

        if (json.success && json.url) {
          const mediaMarkdown = `![${isVideo ? 'Generated Video' : 'Generated Image'}](${json.url})\n\n**${isVideo ? '🎬 Wan 2.1 Video Motion' : '🎨 FLUX.1 Neural Synthesis'}**\n> "${mediaPrompt}"\n\n[Direct Link / Download](${json.url})`;
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSession?.id) return s;
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: mediaMarkdown,
                        isStreaming: false,
                        model: isVideo ? 'Wan 2.1 Video Engine' : 'FLUX.1 Schnell Engine',
                        responseType: isVideo ? 'Motion Video Synthesis' : 'Neural Image Synthesis',
                      }
                    : m
                ),
              };
            })
          );
        } else {
          throw new Error(json.message || 'Generation failed.');
        }
      } catch (err: any) {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: `Failed to generate media: ${err.message}`,
                      isStreaming: false,
                    }
                  : m
              ),
            };
          })
        );
      }
      return;
    }

    // Pass prior conversation history for multi-turn conversational memory
    const priorHistory = currentSession.messages
      .filter((m) => m.content && !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    let accumulatedContent = '';

    await streamChat({
      message: textToSend,
      sessionId: currentSession.id,
      history: priorHistory,
      mode,
      files: currentAttachments,
      signal: controller.signal,
      onChunk: (chunk) => {
        accumulatedContent += chunk;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m
              ),
            };
          })
        );
      },
      onDone: (finalContent, metadata) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions((prev) => {
          const finalSessions = prev.map((s) => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) => {
                if (m.id !== assistantMessageId) return m;
                const initialVariant = {
                  content: finalContent,
                  timestamp: Date.now(),
                  model: metadata?.model || 'Zorvik AI',
                  responseType: metadata?.responseType,
                  sources: metadata?.sources,
                  relatedQuestions: metadata?.relatedQuestions,
                };
                return {
                  ...m,
                  content: finalContent,
                  isStreaming: false,
                  model: initialVariant.model,
                  responseType: initialVariant.responseType,
                  intent: metadata?.intent,
                  sources: initialVariant.sources,
                  relatedQuestions: initialVariant.relatedQuestions,
                  variants: [initialVariant],
                  activeVariantIndex: 0,
                };
              }),
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
      onError: (error) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession?.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
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

  // In-place rewrite of an assistant response with version history (like ChatGPT)
  const handleRegenerateMessage = async (assistantMessageId: string) => {
    if (!activeSession || isStreaming) return;

    const messageIndex = activeSession.messages.findIndex((m) => m.id === assistantMessageId);
    if (messageIndex === -1) return;

    const targetMsg = activeSession.messages[messageIndex];
    if (targetMsg.role !== 'assistant') return;

    // Find the matching user prompt
    let userPrompt = '';
    let userAttachments: FileAttachment[] | undefined;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (activeSession.messages[i].role === 'user') {
        userPrompt = activeSession.messages[i].content;
        userAttachments = activeSession.messages[i].attachments;
        break;
      }
    }

    if (!userPrompt && (!userAttachments || userAttachments.length === 0)) return;

    // Build current variant list
    const currentVariants =
      targetMsg.variants && targetMsg.variants.length > 0
        ? [...targetMsg.variants]
        : [
            {
              content: targetMsg.content,
              timestamp: targetMsg.timestamp,
              model: targetMsg.model,
              responseType: targetMsg.responseType,
              sources: targetMsg.sources,
              relatedQuestions: targetMsg.relatedQuestions,
            },
          ];

    // Set target message to streaming
    const updatedMessages = activeSession.messages.map((m) =>
      m.id === assistantMessageId
        ? {
            ...m,
            content: '',
            isStreaming: true,
            error: false,
            variants: currentVariants,
          }
        : m
    );

    const updatedSession = { ...activeSession, messages: updatedMessages };
    const nextSessions = sessions.map((s) => (s.id === activeSession.id ? updatedSession : s));
    saveSessions(nextSessions);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulatedContent = '';

    // Prior history up to the user message
    const priorHistory = activeSession.messages
      .slice(0, messageIndex)
      .filter((m) => m.content && !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    await streamChat({
      message: userPrompt,
      sessionId: activeSession.id,
      history: priorHistory,
      mode,
      files: userAttachments,
      signal: controller.signal,
      onChunk: (chunk) => {
        accumulatedContent += chunk;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m
              ),
            };
          })
        );
      },
      onDone: (finalContent, metadata) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions((prev) => {
          const finalSessions = prev.map((s) => {
            if (s.id !== activeSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) => {
                if (m.id !== assistantMessageId) return m;
                const newVariant = {
                  content: finalContent,
                  timestamp: Date.now(),
                  model: metadata?.model || 'Zorvik AI',
                  responseType: metadata?.responseType,
                  sources: metadata?.sources,
                  relatedQuestions: metadata?.relatedQuestions,
                };
                const newVariants = [...(m.variants || []), newVariant];
                return {
                  ...m,
                  content: finalContent,
                  isStreaming: false,
                  model: newVariant.model,
                  responseType: newVariant.responseType,
                  sources: newVariant.sources,
                  relatedQuestions: newVariant.relatedQuestions,
                  variants: newVariants,
                  activeVariantIndex: newVariants.length - 1,
                };
              }),
            };
          });
          saveSessions(finalSessions);
          return finalSessions;
        });
      },
      onError: (error) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: error.message || 'Failed to rewrite response.',
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

  // Switch version variant
  const handleSwitchVariant = (messageId: string, targetIndex: number) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => {
            if (m.id !== messageId || !m.variants || targetIndex < 0 || targetIndex >= m.variants.length) {
              return m;
            }
            const variant = m.variants[targetIndex];
            return {
              ...m,
              content: variant.content,
              timestamp: variant.timestamp,
              model: variant.model,
              responseType: variant.responseType,
              sources: variant.sources,
              relatedQuestions: variant.relatedQuestions,
              activeVariantIndex: targetIndex,
            };
          }),
        };
      });
      saveSessions(updated);
      return updated;
    });
  };

  // Open share modal
  const handleOpenShareModal = (message?: Message) => {
    setShareMessage(message || null);
    setShareModalOpen(true);
  };

  // Open Artifact Canvas
  const handleOpenArtifact = (artifact: ArtifactContent) => {
    setActiveArtifact(artifact);
    setArtifactCanvasOpen(true);
  };

  // Attachment Management
  const handleAddAttachment = (file: FileAttachment) => {
    setAttachments((prev) => [...prev, file]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleOpenAuth = (tab: AuthModalTab = 'signin') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050510] text-slate-100 font-sans select-none antialiased">
      {/* Dynamic Glassmorphism Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onOpenAuth={() => handleOpenAuth('signin')}
        onOpenAccount={() => (onNavigateSettings ? onNavigateSettings() : setAccountModalOpen(true))}
        onOpenPromptLibrary={() => setPromptLibraryOpen(true)}
        onNavigateHome={onNavigateHome}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#050510] relative z-10">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
          user={user}
          onOpenAuth={handleOpenAuth}
          onOpenAccount={() => (onNavigateSettings ? onNavigateSettings() : setAccountModalOpen(true))}
          onOpenShare={() => handleOpenShareModal()}
          onSignOut={handleSignOut}
          activeTitle={activeSession?.messages.length ? activeSession.title : undefined}
          hasMessages={Boolean(activeSession && activeSession.messages.length > 0)}
        />

        {/* Viewport: Centered Search Hero OR Active Knowledge Synthesis Thread */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 flex flex-col">
          {!activeSession || activeSession.messages.length === 0 ? (
            <WelcomeHero
              input={input}
              onInputChange={setInput}
              onSend={(prompt, files) => handleSend(prompt, files)}
              mode={mode}
              onModeChange={setMode}
              attachments={attachments}
              onAddAttachment={handleAddAttachment}
              onRemoveAttachment={handleRemoveAttachment}
              onOpenPromptLibrary={() => setPromptLibraryOpen(true)}
            />
          ) : (
            <div className="max-w-3xl mx-auto w-full flex-1 pb-4">
              {activeSession.messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onSelectFollowup={(prompt) => handleSend(prompt)}
                  onRegenerate={msg.role === 'assistant' ? () => handleRegenerateMessage(msg.id) : undefined}
                  onOpenArtifact={handleOpenArtifact}
                  onSwitchVariant={handleSwitchVariant}
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
            onInputChange={setInput}
            onSend={() => handleSend()}
            onStop={handleStopStreaming}
            isStreaming={isStreaming}
            mode={mode}
            onModeChange={setMode}
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            onOpenPromptLibrary={() => setPromptLibraryOpen(true)}
          />
        )}
      </div>

      {/* Live Artifacts / Sandbox Canvas Panel */}
      <ArtifactsCanvas
        artifact={activeArtifact}
        isOpen={artifactCanvasOpen}
        onClose={() => setArtifactCanvasOpen(false)}
      />

      {/* Engineering Blueprint & Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={promptLibraryOpen}
        onClose={() => setPromptLibraryOpen(false)}
        onSelectBlueprint={handleSelectBlueprint}
      />

      {/* Share & Multi-Format Export Dialog */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        session={activeSession}
        selectedMessage={shareMessage}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onUserUpdate={(updatedUser) => setUser(updatedUser)}
      />

      {/* Account & Personalization Hub */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        user={user}
        onUserUpdate={(updatedUser) => setUser(updatedUser)}
      />
    </div>
  );
};
