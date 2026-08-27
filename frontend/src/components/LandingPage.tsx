import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ConstellationCanvas } from './ConstellationCanvas';
import { GenZSimulator } from './GenZSimulator';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    curl: `curl -X POST https://ai.zorviktech.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ZORVIK_ENTERPRISE_KEY" \\
  -d '{
    "prompt": "Analyze dataset variance and draft production recommendations",
    "mode": "analytical"
  }'`,
    js: `import { ZorvikAI } from '@zorvik/ai-client';

const zorvik = new ZorvikAI({
  apiKey: process.env.ZORVIK_ENTERPRISE_KEY,
});

const response = await zorvik.chat.create({
  prompt: 'Analyze dataset variance and draft production recommendations',
  mode: 'analytical',
});

console.log(response.content);`,
    python: `from zorvik_ai import ZorvikClient

client = ZorvikClient(api_key="YOUR_ZORVIK_ENTERPRISE_KEY")

response = client.chat.create(
    prompt="Analyze dataset variance and draft production recommendations",
    mode="analytical"
)

print(response.content)`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kinetic split-text animation variants
  const lineRevealVariants = {
    hidden: { y: '110%', rotate: 4, opacity: 0 },
    visible: {
      y: '0%',
      rotate: 0,
      opacity: 1,
      transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div className="relative min-h-screen bg-void text-bone-white selection:bg-electric-iris selection:text-bone-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Full-Page Persistent 3D Particle Universe Canvas */}
      <ConstellationCanvas />

      {/* Floating Island Glassmorphic Header (Matching User Reference Image) */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw]">
        <div className="px-2.5 py-2 rounded-2xl bg-void/70 hover:bg-void/85 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-void/80 flex items-center gap-2 sm:gap-6 transition-all">
          {/* Left Icon Square Box (Official Zorvik AI Logo Mark) */}
          <a
            href="/"
            className="w-10 h-10 rounded-xl overflow-hidden bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] flex items-center justify-center text-bone-white transition-all shadow-sm group"
            title="Zorvik AI Home"
          >
            <img
              src="/zorvik-logo.jpg"
              alt="Zorvik AI Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </a>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-[13px] font-medium text-silver-mist">
            <a
              href="#features"
              className="px-3.5 py-1.5 rounded-lg hover:text-bone-white hover:bg-white/[0.04] transition-all"
            >
              Features
            </a>
            <a
              href="#memory"
              className="px-3.5 py-1.5 rounded-lg hover:text-bone-white hover:bg-white/[0.04] transition-all"
            >
              Deep Memory
            </a>
            <a
              href="#intelligence"
              className="px-3.5 py-1.5 rounded-lg hover:text-bone-white hover:bg-white/[0.04] transition-all"
            >
              Intelligence
            </a>
            <a
              href="#enterprise"
              className="px-3.5 py-1.5 rounded-lg hover:text-bone-white hover:bg-white/[0.04] transition-all"
            >
              Enterprise API
            </a>
          </nav>

          {/* Right Dark High-Contrast CTA Button */}
          <button
            onClick={onLaunchApp}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#141422] hover:bg-[#1e1e32] text-bone-white border border-white/[0.14] hover:border-electric-iris/50 shadow-inner flex items-center gap-2 text-[13px] font-medium transition-all group cursor-pointer"
          >
            <span>Launch Workspace</span>
            <span className="w-5 h-5 rounded-full bg-white/[0.10] group-hover:bg-electric-iris/40 flex items-center justify-center text-[10px] text-bone-white transition-colors">
              ↗
            </span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* HERO SECTION (Part 1: 3D Volumetric Human on the Right) */}
        <section className="pt-24 sm:pt-28 pb-20 px-6 sm:px-12 max-w-7xl mx-auto min-h-[85vh] flex items-center" id="hero">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center w-full">
            {/* Left Column: Monolithic Heading & Narrative */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-1">
                <div className="overflow-hidden">
                  <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={lineRevealVariants}
                    className="text-5xl sm:text-7xl md:text-8xl lg:text-[92px] font-normal text-bone-white tracking-monumental leading-[0.94]"
                  >
                    Your workplace has the answer.
                  </motion.h1>
                </div>
                <div className="overflow-hidden">
                  <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { y: '110%', rotate: 4, opacity: 0 },
                      visible: {
                        y: '0%',
                        rotate: 0,
                        opacity: 1,
                        transition: { duration: 1.1, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const },
                      },
                    }}
                    className="text-5xl sm:text-7xl md:text-8xl lg:text-[92px] font-normal text-silver-mist tracking-monumental leading-[0.94]"
                  >
                    Just ask Zorvik for it.
                  </motion.h1>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                className="text-xl sm:text-2xl text-silver-mist font-extralight max-w-2xl leading-relaxed"
              >
                Distributed intelligence visualized as living knowledge. Autonomous multi-model reasoning, sub-50ms instant streaming, and deep neural memory—crafted on black velvet.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
                className="pt-4 flex flex-wrap items-center gap-6"
              >
                <button
                  onClick={onLaunchApp}
                  className="btn-dala-primary group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Launch Workspace</span>
                    <span className="text-white/60 group-hover:translate-x-0.5 transition-transform">→</span>
                  </span>
                </button>
                <a
                  href="#enterprise"
                  className="btn-dala-ghost text-ash-gray hover:text-bone-white transition-colors flex items-center gap-1.5"
                >
                  <span>Enterprise API</span>
                  <span>→</span>
                </a>
              </motion.div>
            </div>

            {/* Right Column: 3D Volumetric Viewport Container */}
            <div className="hidden lg:flex lg:col-span-5 min-h-[580px] pointer-events-none" />
          </div>
        </section>

        {/* SECTION 1: CORE CAPABILITIES (Stage 2: Human Walks to Left & Points Right) */}
        <section id="features" className="py-32 px-6 sm:px-12 border-t border-white/[0.04] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Column: 3D Viewport space where human has walked and points Right */}
            <div className="hidden lg:flex lg:col-span-5 min-h-[520px] pointer-events-none" />

            {/* Right Column: Capabilities Narrative & Matrix */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-bone-white tracking-monumental leading-[1.02]">
                  Instant response. <br />
                  <span className="text-silver-mist">Zero friction. Infinite depth.</span>
                </h2>
                <p className="text-lg text-silver-mist font-extralight leading-relaxed">
                  Built from the ground up for modern individuals, creators, and developers seeking immediate answers without bloated interfaces.
                </p>
              </div>

              <div className="space-y-6 pt-2">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-electric-iris/30 backdrop-blur-sm transition-all space-y-2">
                  <div className="text-2xl font-normal text-bone-white tracking-heading-2xs">
                    Ultra-Fast Streaming
                  </div>
                  <p className="text-base text-silver-mist font-extralight leading-relaxed">
                    Answers stream instantaneously to your screen with sub-50ms first-token response times, making interactions feel fluid and conversational.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-saffron-spark/30 backdrop-blur-sm transition-all space-y-2">
                  <div className="text-2xl font-normal text-bone-white tracking-heading-2xs">
                    Autonomous Reasoning
                  </div>
                  <p className="text-base text-silver-mist font-extralight leading-relaxed">
                    Intelligently adapts to your prompt's depth—executing quick factual summaries or multi-step logic proofs automatically.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-deep-verdant/30 backdrop-blur-sm transition-all space-y-2">
                  <div className="text-2xl font-normal text-bone-white tracking-heading-2xs">
                    Resilient Architecture
                  </div>
                  <p className="text-base text-silver-mist font-extralight leading-relaxed">
                    High-availability self-healing routing guarantees continuous uptime, so you never encounter downtime or dropped conversations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: DEEP LONG-TERM CONTEXT (Stage 3: 3D Dual-Lobe Neural Memory Core) */}
        <section id="memory" className="py-36 px-6 sm:px-12 border-t border-white/[0.04] max-w-7xl mx-auto">
          <div className="space-y-12 text-center max-w-3xl mx-auto mb-16">
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: '100%', opacity: 0, rotate: 3 }}
                whileInView={{ y: '0%', opacity: 1, rotate: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] as const }}
                className="text-4xl sm:text-6xl font-normal text-bone-white tracking-monumental leading-[1.02]"
              >
                Instant active context <br />
                <span className="text-silver-mist">meets infinite recall.</span>
              </motion.h2>
            </div>
            <p className="text-lg sm:text-xl text-silver-mist font-extralight leading-relaxed">
              Conversations maintain immediate local responsiveness while retaining historical nuance across months of interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-electric-iris/40 backdrop-blur-md transition-all space-y-4 shadow-2xl">
              <div className="text-2xl font-normal text-bone-white tracking-heading-2xs">
                Instant Context Assembly
              </div>
              <p className="text-base text-silver-mist font-extralight leading-relaxed">
                Maintains the immediate flow of your current session with sub-2ms context assembly, remembering every instruction, constraint, and question you've provided during your conversation.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-saffron-spark/40 backdrop-blur-md transition-all space-y-4 shadow-2xl">
              <div className="text-2xl font-normal text-bone-white tracking-heading-2xs">
                High-Dimensional Knowledge
              </div>
              <p className="text-base text-silver-mist font-extralight leading-relaxed">
                Understands semantic meaning across past interactions, allowing Zorvik AI to recall project details, architectural guidelines, and user preferences seamlessly over time.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: DUAL-INTENT ADAPTIVE INTELLIGENCE */}
        <section id="intelligence" className="py-24 border-t border-white/[0.04]">
          <GenZSimulator />
        </section>

        {/* SECTION 4: ENTERPRISE DEVELOPER API (Stage 4: 3D Handshake) */}
        <section id="enterprise" className="py-32 px-6 sm:px-12 border-t border-white/[0.04] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-4xl sm:text-5xl font-normal text-bone-white tracking-monumental leading-[1.02]">
                Supercharge your products with Zorvik AI.
              </h2>
              <p className="text-base text-silver-mist font-extralight leading-relaxed">
                Designed for high-throughput platforms, studios, and businesses. Dedicated capacity, custom fine-tuned workflows, enterprise SLAs, and private deployment options.
              </p>

              <div className="pt-4 flex items-center gap-4">
                <a
                  href="https://zorviktech.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dala-primary inline-flex items-center gap-2 shadow-lg shadow-electric-iris/25"
                >
                  <span>Contact Zorvik Tech</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Right Column: Code Snippet Terminal */}
            <div className="lg:col-span-7">
              <div className="rounded-card border border-white/[0.08] bg-void/90 backdrop-blur-md overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                    <span className="text-xs font-mono text-ash-gray uppercase tracking-wider">
                      POST /api/v1/chat
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {(['curl', 'js', 'python'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveCodeTab(tab)}
                          className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                            activeCodeTab === tab
                              ? 'text-bone-white border-b-2 border-electric-iris font-semibold'
                              : 'text-ash-gray hover:text-bone-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 text-ash-gray hover:text-bone-white transition-colors cursor-pointer"
                      title="Copy code"
                    >
                      {copied ? <Check size={14} className="text-electric-iris" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="p-6 font-mono text-xs text-silver-mist overflow-x-auto leading-relaxed whitespace-pre bg-void/90">
                  {codeSnippets[activeCodeTab]}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: TELEMETRY & PERFORMANCE MATRIX */}
        <section className="py-28 border-t border-white/[0.04] max-w-7xl mx-auto px-6 sm:px-12">
          <div className="mb-14 text-center">
            <h2 className="text-3xl sm:text-5xl font-normal text-bone-white tracking-heading-sm">
              Engineered for production reliability.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-saffron-spark/30 backdrop-blur-sm transition-all text-center">
              <div className="text-4xl sm:text-5xl font-normal text-bone-white tracking-monumental">$0.00</div>
              <div className="text-xs font-mono uppercase tracking-wider text-saffron-spark font-medium">PUBLIC ACCESS</div>
              <div className="text-sm text-ash-gray font-extralight">Instant zero-friction guest chat</div>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-electric-iris/30 backdrop-blur-sm transition-all text-center">
              <div className="text-4xl sm:text-5xl font-normal text-bone-white tracking-monumental">&lt; 50ms</div>
              <div className="text-xs font-mono uppercase tracking-wider text-electric-iris font-medium">STREAMING LATENCY</div>
              <div className="text-sm text-ash-gray font-extralight">Ultra-fast first token turnaround</div>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan/30 backdrop-blur-sm transition-all text-center">
              <div className="text-4xl sm:text-5xl font-normal text-bone-white tracking-monumental">768</div>
              <div className="text-xs font-mono uppercase tracking-wider text-cyan font-medium">VECTOR DIMENSIONS</div>
              <div className="text-sm text-ash-gray font-extralight">High-precision semantic recall</div>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-deep-verdant/30 backdrop-blur-sm transition-all text-center">
              <div className="text-4xl sm:text-5xl font-normal text-bone-white tracking-monumental">99.99%</div>
              <div className="text-xs font-mono uppercase tracking-wider text-deep-verdant font-medium">UPTIME RESILIENCE</div>
              <div className="text-sm text-ash-gray font-extralight">Self-healing autonomous failover</div>
            </div>
          </div>
        </section>

        {/* SECTION 6: THE CATHEDRAL VELVET CTA (Stage 5: Exact 3D Circuit-Traced Zorvik AI Logo) */}
        <section className="py-36 border-t border-white/[0.04] px-6 sm:px-12 text-center max-w-4xl mx-auto relative">
          {/* Top-Right & Bottom-Left Decorative Circuit SVG Lines matching the Logo Card */}
          <div className="absolute top-8 right-8 w-28 h-28 pointer-events-none opacity-20 hidden md:block">
            <svg viewBox="0 0 100 100" fill="none" stroke="#22d3ee" strokeWidth="1.5">
              <path d="M100,10 L70,10 L50,30 L50,70 L30,90 L0,90" />
              <circle cx="70" cy="10" r="3" fill="#22d3ee" />
              <circle cx="30" cy="90" r="3" fill="#22d3ee" />
            </svg>
          </div>

          {/* Sculptural Logo Typography Lockup matching the Reference Card */}
          <div className="space-y-4 mb-8">
            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-normal tracking-[0.22em] text-bone-white leading-none uppercase select-none">
              ZORVIK <span className="text-saffron-spark font-light">ΛI</span>
            </h2>
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-silver-mist/80">
              <span className="w-8 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-saffron-spark/60 inline-block" />
              <span>Answers on Demand.</span>
              <span className="w-8 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-saffron-spark/60 inline-block" />
            </div>
          </div>

          <p className="text-lg sm:text-xl text-silver-mist font-extralight leading-relaxed max-w-xl mx-auto mb-10">
            Zero sign-up required. Jump straight into an instant guest session or connect with Zorvik Tech for enterprise integration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunchApp}
              className="btn-dala-primary text-sm px-10 py-4 shadow-xl shadow-electric-iris/30 hover:shadow-electric-iris/50"
            >
              Launch Workspace Now
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-16 px-6 sm:px-12 border-t border-white/[0.04] text-xs font-mono text-ash-gray bg-void/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-bone-white text-sm">ZORVIK ΛI</span>
              <span>·</span>
              <span className="text-saffron-spark">Answers on Demand.</span>
            </div>
            <p className="text-silver-mist/60 font-extralight max-w-md">
              Autonomous intelligence platform and enterprise solution. Built by Team Zorvik for speed, depth, and reliability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-ash-gray">
            <a href="https://zorviktech.com" target="_blank" rel="noopener noreferrer" className="hover:text-bone-white transition-colors">
              Zorvik Tech Home
            </a>
            <a href="https://zorviktech.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-bone-white transition-colors">
              Contact Enterprise Team
            </a>
            <a href="https://zorviktech.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-bone-white transition-colors">
              Privacy
            </a>
            <a href="https://zorviktech.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-bone-white transition-colors">
              Terms
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/[0.04] text-silver-mist/40">
          © 2026 Zorvik Tech. All rights reserved.
        </div>
      </footer>
    </div>
  );
};


