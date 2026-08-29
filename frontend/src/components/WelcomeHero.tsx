import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Globe,
  Search,
  Brain,
  Code2,
  Sparkles,
  Cpu,
  Paperclip,
  X,
  FileText,
  Mic,
  MicOff,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { ModelMode, FileAttachment } from '../types';

interface WelcomeHeroProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: (customPrompt?: string, filesToSend?: FileAttachment[]) => void;
  mode: ModelMode;
  onModeChange: (m: ModelMode) => void;
  attachments?: FileAttachment[];
  onAddAttachment?: (file: FileAttachment) => void;
  onRemoveAttachment?: (id: string) => void;
  onOpenPromptLibrary?: () => void;
}

const TOPIC_SUGGESTIONS = [
  {
    icon: Globe,
    title: 'Quantum Computing',
    subtitle: 'Foundational principles explained via physical analogies',
    prompt: 'Explain quantum entanglement and computing using intuitive physical analogies',
    mode: 'deep' as ModelMode,
  },
  {
    icon: Code2,
    title: 'TypeScript Circuit Breaker',
    subtitle: 'Production-ready resilient API client with failover',
    prompt: 'Write a production TypeScript API client with exponential backoff and circuit breaker failover',
    mode: 'code' as ModelMode,
  },
  {
    icon: Cpu,
    title: 'AI Architecture 2026',
    subtitle: 'Multi-model routing, sub-50ms streaming & vector memory',
    prompt: 'Compare modern multi-model cascade architectures against monolithic LLMs for sub-50ms latency',
    mode: 'deep' as ModelMode,
  },
  {
    icon: Sparkles,
    title: 'GenZ Cultural Subtext',
    subtitle: 'Decode modern slang, internet lore, and meme theory',
    prompt: 'What is the cultural origin of brainrot memes and skibidi lore explained like a sociologist',
    mode: 'casual' as ModelMode,
  },
];

const FOCUS_MODES: {
  id: ModelMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'auto', label: 'All', desc: 'Auto-adaptive zero-cost cascade engine', icon: Globe },
  { id: 'search', label: 'Web Search', desc: 'Real-time live website scraping & web search', icon: Search },
  { id: 'deep', label: 'Deep Thinker', desc: 'Rigorous multi-step reasoning & architecture', icon: Brain },
  { id: 'code', label: 'Code Wizard', desc: 'Production-ready typed code & refactoring', icon: Code2 },
  { id: 'casual', label: 'Casual', desc: 'Internet culture, Gen Z & Gen Alpha fluency', icon: Sparkles },
];

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  input,
  onInputChange,
  onSend,
  mode,
  onModeChange,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  onOpenPromptLibrary,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  // Auto resize textarea to support at least 5 lines of multi-line input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const nextH = Math.min(Math.max(scrollH, 26), 180);
      textareaRef.current.style.height = `${nextH}px`;
    }
  }, [input]);

  // Voice Dictation (Speech to Text)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        onInputChange((input ? input.trim() + ' ' : '') + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || attachments.length > 0) {
        onSend();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFileSelect(e.clipboardData.files);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !onAddAttachment) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 15MB limit`);
        continue;
      }

      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          onAddAttachment({
            id: 'att_' + crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            base64,
            mimeType: file.type,
          });
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          const textContent = reader.result as string;
          const base64 = btoa(unescape(encodeURIComponent(textContent)));
          onAddAttachment({
            id: 'att_' + crypto.randomUUID(),
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            dataUrl: 'data:text/plain;base64,' + base64,
            base64,
            mimeType: file.type || 'text/plain',
          });
        };
      }
    }
  };

  const currentFocusMode = FOCUS_MODES.find((f) => f.id === mode) || FOCUS_MODES[0];
  const CurrentIcon = currentFocusMode.icon;

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto px-2">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-6 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-900/40 via-iris/20 to-cyan-500/20 border border-white/[0.08] flex items-center justify-center mx-auto shadow-xl shadow-purple-950/20">
          <img src="/logo.png" alt="Zorvik AI" className="w-6 h-6 object-contain" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
          What do you want to explore?
        </h2>
        <p className="text-xs sm:text-sm text-silver/50 font-light max-w-md mx-auto">
          Ultra-fast intelligence with live web grounding, code generation, and neural memory.
        </p>
      </div>

      {/* Main Search & Query Box */}
      <div className="w-full space-y-4">
        {/* File Previews */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
            {attachments.map((att) => {
              const isImage = att.type.startsWith('image/');
              return (
                <div
                  key={att.id}
                  className="relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-silver/80 shrink-0 max-w-[200px]"
                >
                  {isImage ? (
                    <img src={att.dataUrl} alt={att.name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <FileText size={14} className="text-iris shrink-0" />
                  )}
                  <span className="truncate font-light">{att.name}</span>
                  {onRemoveAttachment && (
                    <button
                      onClick={() => onRemoveAttachment(att.id)}
                      className="p-1 rounded-md text-silver/40 hover:text-white hover:bg-white/[0.1] transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          className={`rounded-2xl bg-[#0c0c14]/90 border transition-all p-3 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl ${
            isListening
              ? 'border-rose-500/70 shadow-[0_0_32px_rgba(244,63,94,0.20)] ring-1 ring-rose-500/40'
              : 'border-white/[0.08] focus-within:border-white/[0.22] focus-within:ring-1 focus-within:ring-white/[0.10]'
          }`}
        >
          {/* Live Audio Visualizer Waveform Animation when Recording */}
          {isListening && (
            <div className="flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-semibold">
                  Listening to Voice...
                </span>
              </div>
              {/* Live Waveform Spectrum */}
              <div className="flex items-center gap-1 h-5 px-2">
                <style>{`
                  @keyframes zorvikWaveHero {
                    0%, 100% { height: 3px; opacity: 0.3; }
                    50% { height: 18px; opacity: 1; }
                  }
                `}</style>
                {[0, 140, 280, 70, 210, 350, 110, 250, 35, 180, 320, 90, 260, 50].map((delay, idx) => (
                  <span
                    key={idx}
                    className="w-0.5 rounded-full bg-gradient-to-t from-rose-500 to-rose-300"
                    style={{
                      height: '5px',
                      animation: `zorvikWaveHero 0.75s ease-in-out infinite alternate`,
                      animationDelay: `${delay}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isListening ? 'Listening in real-time...' : 'Message Zorvik AI, attach code/images, or search the web...'}
            rows={1}
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base font-normal text-slate-100 placeholder-slate-500 resize-none outline-none py-1 px-1 min-h-[26px] max-h-48 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.js,.ts,.tsx,.jsx,.py,.html,.css,.json"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* Bottom Bar Controls */}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-white/[0.04]">
            {/* Focus Modes & File Attachment */}
            <div className="flex items-center gap-1 sm:gap-1.5 relative" ref={dropdownRef}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center gap-1 text-xs"
                title="Attach image or file"
              >
                <Paperclip size={14} />
              </button>

              {/* Mode & Prompt Blueprint Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.06] text-xs text-slate-200 transition-all font-medium select-none"
                  title="Select Intelligence Mode"
                >
                  <CurrentIcon size={12} className="text-indigo-400" />
                  <span className="text-[11px] font-medium">{currentFocusMode.label}</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </button>

                {/* Focus Mode Popover Menu */}
                {isDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl bg-[#0e0e18]/95 border border-white/[0.10] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Intelligence Modes
                    </div>

                    {FOCUS_MODES.map((f) => {
                      const ModeIcon = f.icon;
                      const isActive = mode === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            onModeChange(f.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-white/[0.08] text-white font-medium shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <ModeIcon size={13} className={`mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium leading-tight">{f.label}</div>
                            <div className="text-[10px] text-slate-400 font-light truncate mt-0.5">{f.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dedicated Standalone Prompt Blueprints Button */}
              {onOpenPromptLibrary && (
                <button
                  onClick={onOpenPromptLibrary}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.06] text-xs text-slate-300 hover:text-white transition-all font-medium select-none group"
                  title="Open Prompt Blueprint Library"
                >
                  <BookOpen size={12} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium hidden sm:inline">Prompts</span>
                </button>
              )}
            </div>

            {/* Right Side: Mic on Right & Send Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleListening}
                className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Dictation'}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              <button
                onClick={() => onSend()}
                disabled={!input.trim() && attachments.length === 0}
                className="p-2 rounded-xl bg-white text-black hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white transition-all flex items-center justify-center font-medium shadow-md shadow-black/40 active:scale-95"
                title="Send Message"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Starter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {TOPIC_SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onModeChange(item.mode);
                  onSend(item.prompt);
                }}
                className="group p-3 rounded-2xl bg-[#0c0c14]/60 border border-white/[0.06] hover:border-white/[0.16] hover:bg-white/[0.03] text-left transition-all flex items-start gap-3 shadow-sm hover:shadow-md"
              >
                <div className="p-2 rounded-xl bg-white/[0.04] text-slate-400 group-hover:bg-indigo-500/15 group-hover:text-indigo-400 transition-colors shrink-0">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 font-light truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
