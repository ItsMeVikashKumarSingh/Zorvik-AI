import React, { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { Message } from '../types';
import { renderMarkdown } from '../lib/markdown';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="py-6 border-b border-white/[0.04] space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-silver/40 uppercase">
          YOU
        </div>
        <div className="text-base text-white font-normal leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  const htmlContent = renderMarkdown(message.content);

  return (
    <div className="py-8 border-b border-white/[0.04] space-y-4">
      {/* Header meta: Dala / Auros monospace kicker */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-iris tracking-wider uppercase font-semibold">
          <span>ZORVIK</span>
          <span>·</span>
          <span>AI</span>
        </div>
        {message.model && (
          <span className="text-[10px] font-mono text-silver/40 uppercase">
            / {message.model}
          </span>
        )}
        {message.intent && (
          <span className="text-[10px] font-mono text-saffron uppercase tracking-widest">
            [{message.intent}]
          </span>
        )}
      </div>

      {/* Message body: Pure typographic flow on black void */}
      {message.error ? (
        <div className="flex items-center gap-2 text-crimson text-sm p-4 rounded-xl border border-crimson/30 bg-black">
          <AlertCircle size={16} />
          <span>{message.content || 'An error occurred while generating the response.'}</span>
        </div>
      ) : (
        <div className="relative group">
          <div
            className="prose-editorial text-sm sm:text-base font-extralight text-ash leading-relaxed tracking-normal"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-iris animate-pulse align-middle" />
          )}

          {/* Action Bar: Ghost trigger */}
          {!message.isStreaming && message.content && (
            <div className="mt-4 pt-2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-silver/40 hover:text-white transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'COPIED' : 'COPY OUTPUT'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
