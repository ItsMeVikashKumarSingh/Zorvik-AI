import React, { useRef, useEffect } from 'react';
import { ArrowUp, StopCircle } from 'lucide-react';
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

const MODES: { id: ModelMode; label: string }[] = [
  { id: 'auto', label: 'AUTO' },
  { id: 'casual', label: 'CASUAL' },
  { id: 'deep', label: 'DEEP THINKER' },
  { id: 'code', label: 'CODE' },
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 pb-6">
      {/* Autocomplete Hint Banner */}
      {autocompleteHint && (
        <div
          onClick={onAcceptAutocomplete}
          className="mb-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-silver flex items-center justify-between cursor-pointer hover:border-iris/40 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-mono text-saffron uppercase tracking-wider">Tab to complete:</span>
            <span className="text-white font-light truncate">{autocompleteHint}</span>
          </div>
          <span className="text-[10px] font-mono text-iris shrink-0">⇥ TAB</span>
        </div>
      )}

      {/* Hairline Input Container (Dala / ThoughtLab Minimalist Void Dock) */}
      <div className="relative rounded-2xl bg-black border border-white/[0.12] focus-within:border-white/30 transition-all p-3 sm:p-4 flex flex-col justify-between gap-3 shadow-2xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Zorvik anything... (Shift+Enter for newline)"
          rows={1}
          className="w-full bg-transparent text-sm sm:text-base font-light text-white placeholder-silver/30 resize-none outline-none py-1 px-1 max-h-48 overflow-y-auto leading-relaxed"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          {/* Subtle Ghost Mode Selector */}
          <div className="flex items-center gap-4 text-[11px] font-mono tracking-wider uppercase">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`transition-colors py-1 ${
                  mode === m.id
                    ? 'text-white font-semibold border-b border-iris'
                    : 'text-silver/40 hover:text-silver'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Singular Filled Action Trigger: Dala Electric Iris Pill */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="px-4 py-2 rounded-full bg-crimson hover:bg-crimson/80 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all"
              title="Stop generating"
            >
              <StopCircle size={14} />
              <span>STOP</span>
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className={`px-5 py-2 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase ${
                input.trim()
                  ? 'bg-iris hover:bg-iris-hover text-white shadow-lg shadow-iris/25'
                  : 'bg-white/[0.04] text-silver/30 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <span>SEND</span>
              <ArrowUp size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="text-center mt-3 text-[11px] font-light text-silver/40">
        Zorvik AI can make mistakes. Verify important information.
      </div>
    </div>
  );
};
