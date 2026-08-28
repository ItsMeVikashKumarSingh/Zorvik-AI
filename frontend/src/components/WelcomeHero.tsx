import React, { useRef, useEffect } from 'react';
import { ArrowUp, Globe, Search, Brain, Code2, Sparkles, Compass, Cpu, Paperclip, X, FileText } from 'lucide-react';
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
    subtitle: 'Deconstruct internet slang & modern viral linguistics',
    prompt: 'Analyze the linguistic evolution of Gen Z and Gen Alpha slang with zero corporate cringe',
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

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
    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto w-full py-8">
      {/* Minimal Greeting */}
      <div className="text-center mb-8 space-y-2 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Zorvik AI"
          className="w-12 h-12 rounded-2xl object-contain mb-1 shadow-2xl shadow-black/80"
        />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white">
          Where knowledge begins.
        </h1>
        <p className="text-xs sm:text-sm text-silver/50 font-light max-w-md mx-auto">
          Instant multi-model synthesis, citation-backed reasoning, and verified code.
        </p>
      </div>

      {/* Centered Perplexity-Style Search Box */}
      <div className="w-full relative mb-8">
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

        <div className="relative rounded-2xl bg-[#090914]/90 border border-white/[0.10] focus-within:border-iris/50 focus-within:shadow-[0_0_24px_rgba(128,82,255,0.12)] transition-all p-3 sm:p-4 shadow-xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask anything, attach code/images, or search the web..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {TOPIC_SUGGESTIONS.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onModeChange(item.mode);
                  onSend(item.prompt);
                }}
                className="text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-white/[0.03] text-silver/50 group-hover:text-iris group-hover:bg-iris/10 transition-colors shrink-0">
                  <ItemIcon size={14} />
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
