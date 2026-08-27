import React, { useRef, useEffect } from 'react';
import { ArrowUp, StopCircle, Globe, Brain, Code2, Sparkles } from 'lucide-react';
import { ModelMode } from '../types';

interface InputDockProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  mode: ModelMode;
  onModeChange: (m: ModelMode) => void;
  autocompleteHint: string | null;
  onAcceptAutocomplete: () => void;
}

const FOCUS_MODES: { id: ModelMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'auto', label: 'All', icon: Globe },
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
  autocompleteHint,
  onAcceptAutocomplete,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && autocompleteHint) {
      e.preventDefault();
      onAcceptAutocomplete();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-2 sticky bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-sm z-20">
      {/* Autocomplete Hint Banner */}
      {autocompleteHint && (
        <div
          onClick={onAcceptAutocomplete}
          className="mb-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-silver/80 flex items-center justify-between cursor-pointer hover:border-iris/40 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-mono text-iris uppercase tracking-wider">Tab to complete:</span>
            <span className="text-white font-light truncate">{autocompleteHint}</span>
          </div>
          <span className="text-[10px] font-mono text-iris/80 shrink-0">⇥ TAB</span>
        </div>
      )}

      {/* Hairline Follow-up Search Container (Perplexity Style) */}
      <div className="relative rounded-2xl bg-[#080812]/95 border border-white/[0.10] focus-within:border-iris/50 focus-within:shadow-[0_0_24px_rgba(128,82,255,0.12)] transition-all p-3 sm:p-3.5 shadow-2xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow up..."
          rows={1}
          className="w-full bg-transparent text-sm sm:text-base font-light text-white placeholder-silver/30 resize-none outline-none py-0.5 px-1 max-h-36 overflow-y-auto leading-relaxed"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.04]">
          {/* Subtle Focus Mode Chips */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {FOCUS_MODES.map(f => {
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
              disabled={!input.trim()}
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                input.trim()
                  ? 'bg-iris hover:bg-iris-hover text-white shadow-md shadow-iris/30'
                  : 'bg-white/[0.04] text-silver/20 cursor-not-allowed'
              }`}
              title="Send follow-up"
            >
              <ArrowUp size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

