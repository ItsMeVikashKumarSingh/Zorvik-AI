import React, { useRef, useEffect } from 'react';
import { ArrowUp, StopCircle, Globe, Search, Brain, Code2, Sparkles, Paperclip, X, FileText } from 'lucide-react';
import { ModelMode, FileAttachment } from '../types';

interface InputDockProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  mode: ModelMode;
  onModeChange: (m: ModelMode) => void;
  attachments?: FileAttachment[];
  onAddAttachment?: (file: FileAttachment) => void;
  onRemoveAttachment?: (id: string) => void;
}

const FOCUS_MODES: { id: ModelMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'auto', label: 'All', icon: Globe },
  { id: 'search', label: 'Web Search', icon: Search },
  { id: 'deep', label: 'Deep Thinker', icon: Brain },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'casual', label: 'Casual', icon: Sparkles },
];

export const InputDock: React.FC<InputDockProps> = ({
  input,
  onInputChange,
  onSend,
  onStop,
  isStreaming,
  mode,
  onModeChange,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
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

  // Support paste screenshot directly into textarea
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
    <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-2 sticky bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-sm z-20">
      {/* File Attachments Preview Row */}
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

      {/* Input Box Container */}
      <div className="relative rounded-2xl bg-[#080812]/95 border border-white/[0.10] focus-within:border-iris/50 focus-within:shadow-[0_0_24px_rgba(128,82,255,0.12)] transition-all p-3 sm:p-3.5 shadow-2xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask anything, attach code/images, or search the web..."
          rows={1}
          className="w-full bg-transparent text-sm sm:text-base font-light text-white placeholder-silver/30 resize-none outline-none py-0.5 px-1 max-h-36 overflow-y-auto leading-relaxed"
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

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.04]">
          {/* Left: Mode Chips & File Attach Trigger */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
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
                  className={`px-2 py-0.5 rounded-md text-[11px] font-light flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-iris/20 text-iris border border-iris/30 font-medium'
                      : 'text-silver/40 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <IconComponent size={11} className={isActive ? 'text-iris' : 'text-silver/40'} />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Trigger */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="px-3 py-1.5 rounded-xl bg-crimson hover:bg-crimson/80 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1 transition-all shadow-md"
              title="Stop generating"
            >
              <StopCircle size={13} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim() && attachments.length === 0}
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                input.trim() || attachments.length > 0
                  ? 'bg-iris hover:bg-iris-hover text-white shadow-md shadow-iris/30'
                  : 'bg-white/[0.04] text-silver/20 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <ArrowUp size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
