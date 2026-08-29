import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  AlertCircle,
  Globe,
  ExternalLink,
  Plus,
  RotateCw,
  Play,
  FileText,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Message, SourceItem, ArtifactContent } from '../types';
import { renderMarkdown } from '../lib/markdown';

interface MessageItemProps {
  message: Message;
  onSelectFollowup?: (prompt: string) => void;
  onRegenerate?: () => void;
  onOpenArtifact?: (artifact: ArtifactContent) => void;
  onSwitchVariant?: (messageId: string, targetIndex: number) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectFollowup,
  onRegenerate,
  onOpenArtifact,
  onSwitchVariant,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';

  // Run Mermaid diagrams when message content stabilizes
  useEffect(() => {
    if (!message.isStreaming && message.content && contentRef.current) {
      const mermaidElements = contentRef.current.querySelectorAll('.mermaid');
      if (mermaidElements.length > 0 && typeof window !== 'undefined' && (window as any).mermaid) {
        try {
          (window as any).mermaid.run({
            nodes: Array.from(mermaidElements),
          });
        } catch (_e) {
          // Non-blocking diagram render error
        }
      }
    }
  }, [message.content, message.isStreaming]);

  // Stop speech when message unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text to Speech Readout
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~[\]()]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Detect code artifacts
  const detectArtifact = (): ArtifactContent | null => {
    if (isUser || !message.content) return null;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
    const match = message.content.match(codeBlockRegex);
    if (!match) return null;

    const lang = (match[1] || 'javascript').toLowerCase();
    const code = match[2].trim();

    if (['html', 'htm', 'svg', 'javascript', 'js', 'react', 'tsx', 'jsx', 'typescript', 'ts', 'css'].includes(lang)) {
      return {
        id: 'art_' + message.id,
        title: `${lang.toUpperCase()} Sandbox`,
        language: lang,
        code,
      };
    }
    return null;
  };

  const detectedArtifact = detectArtifact();
  const htmlContent = isUser ? message.content : renderMarkdown(message.content);

  // Variant pagination calculations
  const totalVariants = message.variants && message.variants.length > 0 ? message.variants.length : 1;
  const currentVariantIndex = message.activeVariantIndex !== undefined ? message.activeVariantIndex : totalVariants - 1;
  const hasMultipleVariants = totalVariants > 1;

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-md bg-[#12121c] border border-white/[0.09] px-4 py-3 text-slate-100 text-sm sm:text-base font-normal shadow-md">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((att) => {
                const isImage = att.type.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300"
                  >
                    {isImage ? (
                      <img src={att.dataUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <FileText size={12} className="text-indigo-400" />
                    )}
                    <span className="truncate max-w-[120px]">{att.name}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="whitespace-pre-wrap select-text leading-relaxed">{message.content}</div>
        </div>
      </div>
    );
  }

  // Related follow-up questions
  const followups = message.relatedQuestions || [];

  return (
    <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* 1. Grounded Search Sources with Live Favicons */}
      {message.sources && message.sources.length > 0 && (
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 tracking-wider font-semibold">
            <Globe size={13} className="text-cyan-400" />
            <span>GROUNDED SOURCES ({message.sources.length})</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {message.sources.map((src: SourceItem, idx: number) => {
              let domain = src.domain;
              if (!domain && src.url) {
                try {
                  domain = new URL(src.url).hostname.replace(/^www\./, '');
                } catch {
                  domain = src.url;
                }
              }
              const faviconUrl = domain ? `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(domain)}` : '';
              return (
                <a
                  key={src.id || idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#0c0c14] border border-white/[0.08] hover:border-white/[0.20] hover:bg-white/[0.03] transition-all shrink-0 max-w-[240px] group shadow-sm"
                >
                  <div className="w-5 h-5 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden border border-white/[0.06]">
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt=""
                        className="w-3.5 h-3.5 rounded-sm object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe size={10} className="text-cyan-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-200 group-hover:text-white font-medium truncate">
                      {src.title || domain}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1 group-hover:text-cyan-400/80 transition-colors">
                      <span>{domain}</span>
                    </div>
                  </div>
                  <ExternalLink size={11} className="text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                </a>
              );
            })}
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
              ref={contentRef}
              className="prose-editorial text-sm sm:text-base font-light text-silver/90 leading-relaxed tracking-normal select-text"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Answer Action Bar */}
            {!message.isStreaming && message.content && (
              <div className="mt-5 pt-3 flex items-center justify-between border-t border-white/[0.04] flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Version Toggle (like ChatGPT) */}
                  {hasMultipleVariants && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-silver/60 mr-1">
                      <button
                        onClick={() => onSwitchVariant && onSwitchVariant(message.id, currentVariantIndex - 1)}
                        disabled={currentVariantIndex <= 0}
                        className="p-0.5 hover:text-white disabled:opacity-25 disabled:hover:text-silver/60 transition-colors"
                        title="Previous Version"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <span className="px-0.5 font-sans text-[10px] text-silver/80">
                        {currentVariantIndex + 1} / {totalVariants}
                      </span>
                      <button
                        onClick={() => onSwitchVariant && onSwitchVariant(message.id, currentVariantIndex + 1)}
                        disabled={currentVariantIndex >= totalVariants - 1}
                        className="p-0.5 hover:text-white disabled:opacity-25 disabled:hover:text-silver/60 transition-colors"
                        title="Next Version"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-light text-silver/50 hover:text-white hover:bg-white/[0.04] transition-all"
                    title="Copy output"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span className="text-[11px] font-mono uppercase">{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* Audio Readback Button with Active Equalizer Waveform */}
                  <button
                    onClick={handleToggleSpeech}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-light transition-all ${
                      isSpeaking
                        ? 'bg-iris/20 text-iris border border-iris/40 shadow-[0_0_15px_rgba(128,82,255,0.2)]'
                        : 'text-silver/50 hover:text-white hover:bg-white/[0.04]'
                    }`}
                    title={isSpeaking ? 'Stop Audio Readout' : 'Listen to Answer'}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={13} className="text-iris" />
                        <span className="text-[11px] font-mono uppercase font-medium text-iris">Speaking</span>
                        {/* Dynamic Mini TTS Waveform Equalizer */}
                        <div className="flex items-center gap-0.5 h-3 ml-0.5">
                          <style>{`
                            @keyframes ttsWave {
                              0%, 100% { height: 3px; }
                              50% { height: 12px; }
                            }
                          `}</style>
                          {[0, 150, 300, 100].map((d, i) => (
                            <span
                              key={i}
                              className="w-0.5 rounded-full bg-iris"
                              style={{
                                height: '3px',
                                animation: `ttsWave 0.6s ease-in-out infinite alternate`,
                                animationDelay: `${d}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} />
                        <span className="text-[11px] font-mono uppercase">Listen</span>
                      </>
                    )}
                  </button>

                  {/* Single Message Download */}
                  <button
                    onClick={() => {
                      const md = `# Zorvik AI Response\n\n*Exported on ${new Date().toLocaleString()}*\n\n${message.content}`;
                      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `zorvik-response-${message.id.slice(0, 8)}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-light text-silver/50 hover:text-white hover:bg-white/[0.04] transition-all"
                    title="Download Response as Markdown"
                  >
                    <Download size={13} />
                    <span className="text-[11px] font-mono uppercase">Save</span>
                  </button>

                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-light text-silver/50 hover:text-white hover:bg-white/[0.04] transition-all"
                      title="Rewrite / Regenerate this response"
                    >
                      <RotateCw size={13} />
                      <span className="text-[11px] font-mono uppercase">Rewrite</span>
                    </button>
                  )}
                </div>

                {/* Right Side: Response Type Badge & Artifact Canvas */}
                <div className="flex items-center gap-2">
                  {message.responseType && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-silver/60">
                      <Sparkles size={10} className="text-iris" />
                      <span>{message.responseType}</span>
                    </span>
                  )}

                  {/* Canvas Live Preview Button */}
                  {detectedArtifact && onOpenArtifact && (
                    <button
                      onClick={() => onOpenArtifact(detectedArtifact)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-iris/10 border border-iris/30 text-iris hover:bg-iris hover:text-white text-xs font-medium transition-all shadow-sm"
                    >
                      <Play size={12} />
                      <span>Open Live Artifact Canvas</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Related Follow-Up Questions */}
      {!message.isStreaming && !message.error && message.content && onSelectFollowup && followups.length > 0 && (
        <div className="pt-4 border-t border-white/[0.04] space-y-2">
          <div className="text-[11px] font-mono text-silver/40 uppercase">Suggested Inquiries</div>
          <div className="flex flex-col gap-1.5">
            {followups.map((q: string, idx: number) => (
              <button
                key={idx}
                onClick={() => onSelectFollowup(q)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-iris/40 hover:bg-white/[0.04] text-left text-xs text-silver/80 hover:text-white transition-all group"
              >
                <span className="font-light">{q}</span>
                <Plus size={12} className="text-silver/20 group-hover:text-iris shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
