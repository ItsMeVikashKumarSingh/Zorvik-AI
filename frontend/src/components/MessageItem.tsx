import React, { useState } from 'react';
import {
  Copy,
  Check,
  AlertCircle,
  Globe,
  Layers,
  ExternalLink,
  Plus,
  RotateCw,
  Share2,
} from 'lucide-react';
import { Message, SourceItem } from '../types';
import { renderMarkdown } from '../lib/markdown';

interface MessageItemProps {
  message: Message;
  onSelectFollowup?: (prompt: string) => void;
  onRegenerate?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectFollowup,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // User Message -> Clean Monumental Query Header (Perplexity Style)
  if (isUser) {
    return (
      <div className="pt-8 pb-4 border-b border-white/[0.04]">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-white leading-snug">
          {message.content}
        </h2>
      </div>
    );
  }

  const htmlContent = renderMarkdown(message.content);
  const sources: SourceItem[] = message.sources || [];
  const followups = message.relatedQuestions || [];

  return (
    <div className="py-6 space-y-6">
      {/* 1. Sources Header & Horizontal Pill Cards (Perplexity Style) */}
      {!message.error && sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-silver/40 uppercase tracking-wider">
            <Layers size={12} className="text-iris" />
            <span>Sources</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sources.map((src, idx) => (
              <a
                key={src.id || idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-iris/40 hover:bg-white/[0.04] transition-all shrink-0 max-w-[220px] group"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white/[0.05] group-hover:bg-iris/20 text-[9px] font-mono text-silver/60 group-hover:text-iris flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/80 group-hover:text-white font-medium truncate">
                    {src.title}
                  </div>
                  <div className="text-[10px] font-mono text-silver/40 truncate flex items-center gap-1">
                    <Globe size={9} />
                    <span>{src.domain}</span>
                  </div>
                </div>
                <ExternalLink size={10} className="text-silver/20 group-hover:text-iris shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 2. Synthesized Answer Body */}
      <div className="space-y-3 select-text pt-1">
        {message.error ? (
          <div className="flex items-center gap-2 text-crimson text-sm p-4 rounded-xl border border-crimson/30 bg-black/60">
            <AlertCircle size={16} />
            <span>{message.content || 'An error occurred while generating the response.'}</span>
          </div>
        ) : message.isStreaming && !message.content ? (
          <div className="flex items-center gap-2 text-xs text-silver/40 font-light py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-iris animate-pulse" />
            <span>Thinking...</span>
          </div>
        ) : (
          <div className="relative group">
            <div
              className="prose-editorial text-sm sm:text-base font-light text-silver/90 leading-relaxed tracking-normal select-text"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Answer Action Bar */}
            {!message.isStreaming && message.content && (
              <div className="mt-5 pt-3 flex items-center justify-between border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-light text-silver/50 hover:text-white hover:bg-white/[0.04] transition-all"
                    title="Copy output"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span className="text-[11px] font-mono uppercase">{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: 'Zorvik AI', text: message.content });
                      } else {
                        handleCopy();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-light text-silver/50 hover:text-white hover:bg-white/[0.04] transition-all"
                    title="Share Answer"
                  >
                    <Share2 size={13} />
                    <span className="text-[11px] font-mono uppercase">Share</span>
                  </button>

                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-light text-silver/50 hover:text-white hover:bg-white/[0.04] transition-all"
                      title="Rewrite / Regenerate"
                    >
                      <RotateCw size={13} />
                      <span className="text-[11px] font-mono uppercase">Rewrite</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Related Follow-Up Questions (Rendered only when available) */}
      {!message.isStreaming && !message.error && message.content && onSelectFollowup && followups.length > 0 && (
        <div className="pt-4 border-t border-white/[0.04] space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-silver/40 uppercase tracking-wider">
            <Plus size={12} className="text-iris" />
            <span>Related</span>
          </div>

          <div className="space-y-1">
            {followups.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFollowup(q)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.015] border border-white/[0.04] hover:border-iris/30 hover:bg-white/[0.03] transition-all group flex items-center justify-between"
              >
                <span className="text-xs sm:text-sm text-silver/70 group-hover:text-white font-light truncate pr-3">
                  {q}
                </span>
                <span className="text-silver/30 group-hover:text-iris text-xs font-mono shrink-0">
                  +
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

