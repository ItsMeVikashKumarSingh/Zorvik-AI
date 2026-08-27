import React from 'react';

interface WelcomeHeroProps {
  onSelectPrompt: (prompt: string) => void;
}

const MINIMAL_PROMPTS = [
  "Explain quantum entanglement through physical analogies",
  "Write a production TypeScript API client with circuit breaker",
  "Break down career leverage in 2026 with zero corporate fluff",
  "Formulate game theory dynamics for status & interpersonal charisma",
];

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-start justify-center px-4 sm:px-12 md:px-20 py-12 max-w-5xl mx-auto w-full select-none">
      {/* Eyebrow kicker: Dala / Auros 14px tracked uppercase */}
      <div className="text-[13px] font-mono tracking-[0.12em] text-saffron uppercase mb-6">
        ZORVIK AI // WORKSPACE
      </div>

      {/* Monolithic Sculptural Headline: Dala 78px–96px weight 400 with -0.04em tracking */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-normal text-white tracking-monumental leading-[0.98] mb-6">
        What shall we <br />
        <span className="text-white/90">solve today?</span>
      </h1>

      {/* Ultra-light body description */}
      <p className="text-base sm:text-lg text-ash font-extralight max-w-xl mb-12 leading-relaxed">
        Instant answers, long-term memory, and verified code synthesis with zero waiting.
      </p>

      {/* Ghost text suggestions: Zero box containers, pure typographic elegance */}
      <div className="space-y-3 w-full max-w-xl">
        <div className="text-[11px] font-mono tracking-widest text-silver/40 uppercase mb-2">
          EXPLORE PROMPTS →
        </div>
        {MINIMAL_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="w-full text-left py-2.5 px-0 text-sm font-light text-silver hover:text-white transition-colors flex items-center justify-between group border-b border-white/[0.04] hover:border-iris/40"
          >
            <span className="truncate pr-4 group-hover:translate-x-1 transition-transform">
              {prompt}
            </span>
            <span className="text-silver/30 group-hover:text-iris text-xs font-mono shrink-0">
              ↗
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
