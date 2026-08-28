import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Globe,
  Search,
  Brain,
  Code2,
  Sparkles,
  Compass,
  Cpu,
  Paperclip,
  X,
  FileText,
  Mic,
  MicOff,
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
    prompt: 'bro what is the actual origin of brainrot memes and skibidi lore explain like a sociologist',
    mode: 'casual' as ModelMode,
  },
];

const FOCUS_MODES: { id: ModelMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'auto', label: 'All', icon: Globe },
  { id: 'search', label: 'Web Search', icon: Search },
  { id: 'deep', label: 'Deep Thinker', icon: Brain },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'casual', label: 'Casual', icon: Sparkles },
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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !onAddAttachment) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        onAddAttachment({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: result,
          mimeType: file.type || 'application/octet-stream',
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file && onAddAttachment) {
          const reader = new FileReader();
          reader.onload = () => {
            onAddAttachment({
              id: `paste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: `Pasted-Image-${new Date().toLocaleTimeString()}.png`,
              type: file.type,
              size: file.size,
              dataUrl: reader.result as string,
              mimeType: file.type,
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-silver/70 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zorvik AI Enterprise · Sub-50ms Inference</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
          Where would you like to begin?
        </h1>
        <p className="text-xs sm:text-sm text-silver/50 font-light max-w-lg mx-auto">
          Synthesize knowledge, analyze codebases, execute live code artifacts, and search the real-time web.
        </p>
      </div>

      {/* Hero Monumental Search Bar */}
      <div className="w-full space-y-2">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att) => {
              const isImage = att.type.startsWith('image/') || att.dataUrl.startsWith('data:image/');
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white max-w-[200px] shrink-0 group relative shadow-md"
                >
                  {isImage ? (
                    <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded-lg object-cover bg-black/40" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-iris/20 text-iris flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                  )}
                  <span className="truncate flex-1 text-[11px] font-light">{att.name}</span>
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
          className={`rounded-2xl bg-[#080812] border transition-all p-3 sm:p-4 shadow-2xl ${
            isListening
              ? 'border-crimson/80 shadow-[0_0_32px_rgba(244,63,94,0.25)] ring-1 ring-crimson/50'
              : 'border-white/[0.10] focus-within:border-iris/50 focus-within:shadow-[0_0_30px_rgba(128,82,255,0.15)]'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isListening ? 'Listening to your voice...' : 'Ask anything, attach code/images, or search the web...'}
            rows={1}
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base font-light text-white placeholder-silver/30 resize-none outline-none py-1 px-1 max-h-40 overflow-y-auto leading-relaxed"
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
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.04]">
            {/* Focus Modes & File Attachment */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-1 text-xs"
                title="Attach image or file"
              >
                <Paperclip size={14} />
              </button>

              {/* Voice Dictation Button */}
              <button
                onClick={toggleListening}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs ${
                  isListening
                    ? 'bg-crimson text-white animate-pulse shadow-md shadow-crimson/30'
                    : 'text-silver/50 hover:text-white hover:bg-white/[0.04]'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Dictation'}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {FOCUS_MODES.map((f) => {
                const IconComponent = f.icon;
                const isActive = mode === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onModeChange(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-light flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-iris/20 text-iris border border-iris/40 font-medium'
                        : 'text-silver/50 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <IconComponent size={12} className={isActive ? 'text-iris' : 'text-silver/40'} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Send Trigger */}
            <button
              onClick={() => onSend()}
              disabled={!input.trim() && attachments.length === 0}
              className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                input.trim() || attachments.length > 0
                  ? 'bg-iris hover:bg-iris-hover text-white shadow-md shadow-iris/30 scale-100'
                  : 'bg-white/[0.04] text-silver/20 cursor-not-allowed'
              }`}
              title="Search and synthesize"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Curated Suggestion Chips */}
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-silver/40 uppercase mb-3">
          <Compass size={11} className="text-silver/40" />
          <span>Curated Explorations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TOPIC_SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onModeChange(item.mode);
                  onSend(item.prompt);
                }}
                className="text-left p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.05] hover:border-iris/40 hover:bg-white/[0.03] transition-all group flex items-start gap-3 shadow-sm"
              >
                <div className="p-2 rounded-lg bg-white/[0.03] group-hover:bg-iris/20 text-silver/40 group-hover:text-iris transition-colors shrink-0 mt-0.5">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white/90 group-hover:text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-silver/40 font-light truncate mt-0.5">
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
