import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ConstellationCanvas } from './ConstellationCanvas';
import { GenZSimulator } from './GenZSimulator';
import { LegalModal, LegalTab } from './LegalModal';
import { Check, Copy, ExternalLink, Github, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { highlightCode } from '../lib/markdown';

interface LandingPageProps {
  onLaunchApp: () => void;
  onNavigateLegal?: (type: 'privacy' | 'terms' | 'security') => void;
  onNavigateAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, onNavigateLegal, onNavigateAdmin }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);

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
            href="#"
            className="flex items-center gap-2.5 w-9 h-9 rounded-xl overflow-hidden border border-white/[0.12] bg-[#0c0c16] p-0.5 group"
          >
            <img
              src="/logo.png"
              alt="Zorvik AI Logo"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
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
        <section className="pt-24 sm:pt-28 pb-20 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto min-h-[85vh] flex items-center" id="hero">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
            {/* Left Column: Monolithic Heading & Narrative */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <div className="overflow-hidden pb-3 sm:pb-4 pt-1">
                  <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={lineRevealVariants}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[54px] 2xl:text-[64px] font-normal text-bone-white tracking-monumental leading-[1.12] pb-1"
                  >
                    The intelligence that speaks your language.
                  </motion.h1>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                className="text-base sm:text-lg md:text-xl text-silver-mist font-extralight max-w-xl leading-relaxed"
              >
                Built for creators. Engineered for enterprise. Direct factual clarity, native cultural fluency, and rigorous verified logic on demand. Sub-50ms streaming with persistent memory.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
                className="pt-2 flex flex-wrap items-center gap-5"
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

            {/* Right Column: 3D Volumetric Viewport Container (5 Columns for generous breathing room) */}
            <div id="hero-anchor" className="hidden lg:flex lg:col-span-5 min-h-[500px] pointer-events-none" />
          </div>
        </section>

        {/* SECTION 1: CORE CAPABILITIES (Stage 2: Human Walks to Left & Points Right) */}
        <section id="features" className="py-32 px-6 sm:px-12 border-t border-white/[0.04] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Column: 3D Viewport space where human has walked and points Right */}
            <div id="features-anchor" className="hidden lg:flex lg:col-span-4 min-h-[520px] pointer-events-none" />

            {/* Right Column: Capabilities Narrative & Matrix */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-bone-white tracking-monumental leading-[1.02]">
                  Instant response. <br />
                  <span className="text-silver-mist">Zero friction. Infinite depth.</span>
                </h2>
                <p className="text-lg text-silver-mist font-extralight leading-relaxed">
                  Built from the ground up for modern creators, builders, and developers seeking immediate answers without bloated interfaces.
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
                    Intelligently adapts to your prompt depth, executing quick factual summaries or multi-step logic proofs automatically.
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

        {/* SECTION 4: ENTERPRISE DEVELOPER API */}
        <section id="enterprise" className="py-28 sm:py-36 px-6 sm:px-10 lg:px-12 border-t border-white/[0.04] max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Heading, Narrative & Value Points */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-bone-white tracking-tight leading-[1.1]">
                  Supercharge your products with Zorvik AI.
                </h2>
                <p className="text-base sm:text-lg text-silver-mist font-light leading-relaxed">
                  Designed for high-throughput platforms and production workloads. Dedicated capacity, custom fine-tuned workflows, enterprise SLAs, and private deployments.
                </p>
              </div>

              {/* Minimal Value Highlights */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-silver-mist">
                  <div className="w-5 h-5 rounded-md bg-electric-iris/10 border border-electric-iris/20 flex items-center justify-center text-electric-iris shrink-0">
                    <Zap size={12} />
                  </div>
                  <span>Sub-50ms Global Edge Streaming Latency</span>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-silver-mist">
                  <div className="w-5 h-5 rounded-md bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan shrink-0">
                    <ShieldCheck size={12} />
                  </div>
                  <span>Strict Zero Data Retention &amp; Dedicated Isolation</span>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-silver-mist">
                  <div className="w-5 h-5 rounded-md bg-saffron-spark/10 border border-saffron-spark/20 flex items-center justify-center text-saffron-spark shrink-0">
                    <Cpu size={12} />
                  </div>
                  <span>Custom Model Endpoints &amp; 99.99% Uptime SLA</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <a
                  href="https://zorviktech.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dala-primary inline-flex items-center gap-2"
                >
                  <span>Contact Zorvik Tech</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Right Column: Code Snippet Terminal with Prism Syntax Highlighting */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-white/[0.09] bg-[#06060f]/90 backdrop-blur-2xl overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
                  {/* Left: Window Controls + Endpoint */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                      <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    </div>
                    <span className="text-[11px] font-mono text-ash-gray uppercase tracking-wider pl-1">
                      POST /api/v1/chat
                    </span>
                  </div>

                  {/* Right: Language Tabs & Copy Button */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      {(['curl', 'js', 'python'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveCodeTab(tab)}
                          className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                            activeCodeTab === tab
                              ? 'bg-white/[0.12] text-bone-white font-medium shadow-sm'
                              : 'text-ash-gray hover:text-bone-white'
                          }`}
                        >
                          {tab === 'js' ? 'Node.js' : tab}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-ash-gray hover:text-bone-white transition-all cursor-pointer"
                      title="Copy code"
                    >
                      {copied ? <Check size={13} className="text-electric-iris" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Terminal Code Viewport */}
                <div className="p-5 sm:p-6 bg-[#030308] overflow-x-auto">
                  <pre className="!bg-transparent !p-0 !m-0 font-mono text-xs sm:text-[13px] leading-relaxed text-silver-mist">
                    <code
                      className={`language-${activeCodeTab === 'curl' ? 'bash' : activeCodeTab === 'js' ? 'javascript' : 'python'}`}
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(
                          codeSnippets[activeCodeTab],
                          activeCodeTab === 'curl' ? 'bash' : activeCodeTab === 'js' ? 'javascript' : 'python'
                        ),
                      }}
                    />
                  </pre>
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

        {/* SECTION 6: THE CATHEDRAL VELVET CTA (3D Volumetric Neural Mind Centerpiece) */}
        <section id="cta" className="pt-52 pb-36 border-t border-white/[0.04] px-6 sm:px-12 text-center max-w-4xl mx-auto relative">
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

      {/* FOOTER (Liquid-Glass Theme) */}
      <footer className="relative z-20 mx-4 md:mx-8 overflow-hidden rounded-t-[40px] border border-white/[0.08] bg-void/80 backdrop-blur-2xl pt-16 pb-10 shadow-2xl">
        {/* Ambient subtle violet & cyan glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[220px] w-[450px] -translate-x-1/2 rounded-full bg-electric-iris/8 blur-[100px]" />
          <div className="absolute top-0 right-1/4 h-[150px] w-[300px] rounded-full bg-cyan/5 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Brand & Socials */}
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-void">
                  <img src="/zorvik-logo.jpg" alt="Zorvik Logo" className="h-full w-full object-cover" />
                </div>
                <span className="font-mono text-base font-bold tracking-tight text-bone-white">
                  ZORVIK <span className="text-saffron-spark font-light">ΛI</span>
                </span>
              </div>
              <p className="text-xs text-silver-mist/70 font-extralight leading-relaxed max-w-xs">
                The intelligence that speaks your language. Autonomous reasoning, cultural fluency, and enterprise speed on demand.
              </p>

              {/* Social Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="https://github.com/zorvik-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.03] text-ash-gray hover:text-bone-white hover:border-electric-iris/40 hover:bg-electric-iris/10 transition-all"
                  aria-label="GitHub"
                >
                  <Github size={13} />
                </a>
                <a
                  href="https://twitter.com/zorviktech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.03] text-ash-gray hover:text-bone-white hover:border-cyan/40 hover:bg-cyan/10 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter size={13} />
                </a>
                <a
                  href="https://linkedin.com/company/zorvik-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.03] text-ash-gray hover:text-bone-white hover:border-electric-iris/40 hover:bg-electric-iris/10 transition-all"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={13} />
                </a>
                <a
                  href="https://instagram.com/zorviktech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.03] text-ash-gray hover:text-bone-white hover:border-saffron-spark/40 hover:bg-saffron-spark/10 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram size={13} />
                </a>
              </div>
            </div>

            {/* 2. Platform Capabilities */}
            <div>
              <h4 className="mb-4 font-mono text-xs font-semibold tracking-wider uppercase text-bone-white">
                Capabilities
              </h4>
              <ul className="space-y-2.5 text-xs text-silver-mist/75 font-extralight">
                <li>
                  <button onClick={onLaunchApp} className="hover:text-bone-white transition-colors cursor-pointer text-left">
                    Launch Workspace
                  </button>
                </li>
                <li>
                  <a href="#features" className="hover:text-bone-white transition-colors">
                    Core Intelligence
                  </a>
                </li>
                <li>
                  <a href="#memory" className="hover:text-bone-white transition-colors">
                    Persistent Memory
                  </a>
                </li>
                <li>
                  <a href="#enterprise" className="hover:text-bone-white transition-colors">
                    Developer API
                  </a>
                </li>
              </ul>
            </div>

            {/* 3. Governance & Legal (Independent Platform Policies) */}
            <div>
              <h4 className="mb-4 font-mono text-xs font-semibold tracking-wider uppercase text-bone-white">
                Governance
              </h4>
              <ul className="space-y-2.5 text-xs text-silver-mist/75 font-extralight">
                <li>
                  <button
                    onClick={() => onNavigateLegal ? onNavigateLegal('privacy') : setLegalModalTab('privacy')}
                    className="hover:text-bone-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateLegal ? onNavigateLegal('terms') : setLegalModalTab('terms')}
                    className="hover:text-bone-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateLegal ? onNavigateLegal('security') : setLegalModalTab('security')}
                    className="hover:text-bone-white transition-colors cursor-pointer text-left"
                  >
                    Security Architecture
                  </button>
                </li>
                <li>
                  <a href="https://zorvik.tech" target="_blank" rel="noopener noreferrer" className="hover:text-bone-white transition-colors inline-flex items-center gap-1">
                    Zorvik Tech <ExternalLink size={10} className="text-ash-gray" />
                  </a>
                </li>
                {onNavigateAdmin && (
                  <li>
                    <button
                      onClick={onNavigateAdmin}
                      className="hover:text-iris transition-colors cursor-pointer text-left text-iris/80 font-mono"
                    >
                      Admin Control Plane →
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* 4. Direct Contact */}
            <div>
              <h4 className="mb-4 font-mono text-xs font-semibold tracking-wider uppercase text-bone-white">
                Direct Contact
              </h4>
              <ul className="space-y-3 text-xs text-silver-mist/75 font-extralight">
                <li className="flex items-center gap-2.5">
                  <Mail size={14} className="text-cyan shrink-0" />
                  <a href="mailto:hello@zorviktech.com" className="hover:text-bone-white transition-colors">
                    hello@zorviktech.com
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone size={14} className="text-cyan shrink-0" />
                  <a href="tel:+918409792083" className="hover:text-bone-white transition-colors">
                    +918409792083
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-cyan shrink-0 mt-0.5" />
                  <span className="leading-snug">Sherpur Bahori, Mahua, Vaishali, Bihar</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-6 font-mono text-[10px] text-ash-gray">
            <p>© {new Date().getFullYear()} ZORVIK TECH. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                SYSTEMS OPERATIONAL
              </span>
              <span className="text-white/20">·</span>
              <span>EST. 2024</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Standalone Independent Legal Modal */}
      <LegalModal
        isOpen={legalModalTab !== null}
        initialTab={legalModalTab || 'privacy'}
        onClose={() => setLegalModalTab(null)}
      />
    </div>
  );
};


