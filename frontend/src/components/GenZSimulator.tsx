import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Brain, Layers, Check, Copy } from 'lucide-react';

interface IntelligenceMode {
  id: 'concise' | 'genz' | 'engineering' | 'combined';
  label: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  userPrompt: string;
  aiResponse: string;
  highlights: string[];
}

const MODES: IntelligenceMode[] = [
  {
    id: 'concise',
    label: 'To The Point',
    badge: 'DIRECT · ZERO FLUFF',
    badgeColor: 'text-cyan bg-cyan/10 border-cyan/30',
    icon: <Zap size={15} className="text-cyan" />,
    userPrompt: 'What is a zero-knowledge proof in the simplest terms?',
    aiResponse: 'A cryptographic method where one party proves to another that a statement is true, without revealing any secret information beyond the validity itself.',
    highlights: [],
  },
  {
    id: 'genz',
    label: 'Gen Z Slang & Emojis',
    badge: 'NATIVE CULTURAL FLUENCY',
    badgeColor: 'text-saffron-spark bg-saffron-spark/10 border-saffron-spark/30',
    icon: <Sparkles size={15} className="text-saffron-spark" />,
    userPrompt: 'bro really pushed to master on friday 5pm with no tests and went offline 💀💅',
    aiResponse: "nah that's actually generational criminal behavior lowkey 😭🙏 blud left a live hand grenade in production and went into witness protection. one unhandled promise rejection and the whole company's weekend is permanently cooked on god 🍳💀",
    highlights: [],
  },
  {
    id: 'engineering',
    label: 'Complex Engineering',
    badge: 'RATIONALE & VERIFIED CODE',
    badgeColor: 'text-electric-iris bg-electric-iris/10 border-electric-iris/30',
    icon: <Brain size={15} className="text-electric-iris" />,
    userPrompt: 'Implement a high-performance token bucket rate limiter in TypeScript with sliding expiration.',
    aiResponse: `\`\`\`typescript
export class TokenBucketLimiter {
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRatePerSecond: number
  ) {
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  tryConsume(tokensToConsume = 1): boolean {
    this.refill();
    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return true; // Request admitted
    }
    return false; // Rate limit exceeded (429)
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }
}
\`\`\`

**Invariants & Complexity:**
• $\\mathcal{O}(1)$ deterministic constant time operations with zero mutex locks needed.
• Memory footprint bounded to 16 bytes per client state with sliding refill window.`,
    highlights: [],
  },
  {
    id: 'combined',
    label: 'Combined (Hybrid Synthesis)',
    badge: 'WIT + COMPLEX LOGIC',
    badgeColor: 'text-deep-verdant bg-deep-verdant/10 border-deep-verdant/30',
    icon: <Layers size={15} className="text-deep-verdant" />,
    userPrompt: 'Our database queries take 14 seconds and our team lead is having a breakdown 😭',
    aiResponse: `Not the full table scan doing cardio across 2 million unindexed rows 💀 blud is executing nested loops on every join like it's 1999.

Here is the exact composite index & query optimization that drops latency from 14s to 12ms:

\`\`\`sql
-- 1. Eliminate full table scan with composite B-Tree index
CREATE INDEX CONCURRENTLY idx_orders_tenant_status_created 
ON orders (tenant_id, status, created_at DESC);

-- 2. Query with strict index-only coverage
SELECT id, user_id, total_amount, created_at
FROM orders
WHERE tenant_id = 'ten_9941' AND status = 'COMPLETED'
ORDER BY created_at DESC
LIMIT 50;
\`\`\`

Now your queries are instant and your team lead can finally sleep at night fr fr 🚀✨`,
    highlights: [],
  },
];

export const GenZSimulator: React.FC = () => {
  const [activeMode, setActiveMode] = useState<IntelligenceMode>(MODES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMode.aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 sm:px-12 select-none">
      {/* Section Header (Clean, No extra yellow kicker badge) */}
      <div className="space-y-4 mb-12 max-w-3xl">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-bone-white tracking-monumental leading-[1.02]">
          To the point. Culturally fluent. <br />
          <span className="text-silver-mist">Rigorously engineered.</span>
        </h2>
        <p className="text-lg sm:text-xl text-silver-mist font-extralight leading-relaxed">
          Zorvik AI understands direct sub-20 word answers, Gen Z slang &amp; emojis, complex multi-step engineering logic, or a seamless combination of both.
        </p>
      </div>

      {/* Mode Selector Pill Bar */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {MODES.map(mode => {
          const isActive = mode.id === activeMode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode)}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                isActive
                  ? 'bg-white/[0.10] border-white/[0.25] text-bone-white shadow-lg backdrop-blur-md'
                  : 'bg-white/[0.02] border-white/[0.06] text-ash-gray hover:text-bone-white hover:bg-white/[0.05]'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Display Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="rounded-2xl bg-void/80 border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          {/* Card Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase border font-semibold ${activeMode.badgeColor}`}>
                {activeMode.badge}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-mono text-ash-gray hover:text-bone-white transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check size={14} className="text-electric-iris" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* User Prompt */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ash-gray font-semibold">
                USER PROMPT
              </span>
              <p className="text-base text-bone-white font-normal">
                "{activeMode.userPrompt}"
              </p>
            </div>

            {/* AI Response Output */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-electric-iris font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-iris" />
                <span>ZORVIK AI RESPONSE</span>
              </div>
              <div className="p-5 rounded-xl bg-void border border-white/[0.06] text-sm text-silver-mist font-mono leading-relaxed whitespace-pre-wrap">
                {activeMode.aiResponse}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

