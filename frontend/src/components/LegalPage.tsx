import React, { useEffect } from 'react';
import { Shield, FileText, Lock, ArrowLeft, ExternalLink, Github, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export type LegalPageType = 'privacy' | 'terms' | 'security';

interface LegalPageProps {
  type: LegalPageType;
  onNavigateHome: () => void;
  onLaunchApp: () => void;
  onNavigateLegal: (type: LegalPageType) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  type,
  onNavigateHome,
  onLaunchApp,
  onNavigateLegal,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  return (
    <div className="min-h-screen bg-void text-bone-white font-sans antialiased selection:bg-electric-iris/30 selection:text-bone-white flex flex-col justify-between">
      {/* 1. Header (Floating Island Pill) */}
      <header className="sticky top-6 z-40 w-full px-6 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-6 px-6 py-3 rounded-full bg-void/85 border border-white/[0.08] backdrop-blur-xl shadow-2xl max-w-4xl w-full">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left"
          >
            <span className="font-mono text-sm font-bold tracking-tight text-bone-white">
              ZORVIK <span className="text-saffron-spark font-light">ΛI</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono text-ash-gray hover:text-bone-white hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back to Home</span>
            </button>

            <button
              onClick={onLaunchApp}
              className="btn-dala-primary text-xs px-5 py-2 shadow-md shadow-electric-iris/20 cursor-pointer"
            >
              Launch Workspace
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Content */}
      <main className="max-w-4xl mx-auto px-6 py-20 w-full space-y-12">
        {/* Navigation Breadcrumb Tabs */}
        <div className="flex flex-wrap gap-2 pt-4">
          <button
            onClick={() => onNavigateLegal('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              type === 'privacy'
                ? 'bg-electric-iris/15 text-electric-iris border-electric-iris/40 font-semibold shadow-lg shadow-electric-iris/10'
                : 'bg-white/[0.02] border-white/[0.06] text-ash-gray hover:text-bone-white hover:bg-white/[0.05]'
            }`}
          >
            <Shield size={13} />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => onNavigateLegal('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              type === 'terms'
                ? 'bg-cyan/15 text-cyan border-cyan/40 font-semibold shadow-lg shadow-cyan/10'
                : 'bg-white/[0.02] border-white/[0.06] text-ash-gray hover:text-bone-white hover:bg-white/[0.05]'
            }`}
          >
            <FileText size={13} />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => onNavigateLegal('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              type === 'security'
                ? 'bg-saffron-spark/15 text-saffron-spark border-saffron-spark/40 font-semibold shadow-lg shadow-saffron-spark/10'
                : 'bg-white/[0.02] border-white/[0.06] text-ash-gray hover:text-bone-white hover:bg-white/[0.05]'
            }`}
          >
            <Lock size={13} />
            <span>Security Standards</span>
          </button>
        </div>

        {/* Hero Title Area */}
        <div className="space-y-4 border-b border-white/[0.08] pb-8">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ash-gray font-semibold">
            INDEPENDENT PLATFORM GOVERNANCE
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-bone-white tracking-monumental leading-tight">
            {type === 'privacy' && 'Privacy Policy'}
            {type === 'terms' && 'Terms of Service'}
            {type === 'security' && 'Security Architecture'}
          </h1>
          <p className="text-sm font-mono text-silver-mist/70">
            Effective Date: August 27, 2026 · Standalone Microservice Policy
          </p>
        </div>

        {/* 1. Privacy Policy Document */}
        {type === 'privacy' && (
          <div className="space-y-10 text-silver-mist font-extralight text-base leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                1. Zero-Log Ephemeral Guest Mode
              </h2>
              <p>
                Guest interactions on Zorvik AI are strictly ephemeral. Guest prompts, session context, and synthesized responses exist only in temporary memory during your active browser session. We do not persist guest conversations in long-term databases or link them to any persistent tracking identifiers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                2. Strict Non-Training Guarantee
              </h2>
              <p>
                Your prompts, uploaded documents, code snippets, and conversational outputs belong entirely to you. Zorvik AI does NOT use your inputs or model outputs to train or fine-tune public foundation models. Your data remains isolated within your operational runtime.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                3. Continuous Memory &amp; Vector Isolation
              </h2>
              <p>
                When authenticated users enable Deep Continuous Memory, semantic vectors (768 dimensions) are stored inside isolated tenant partitions encrypted with customer-specific access keys. Vectors are queried strictly at runtime to provide contextually accurate responses.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                4. Unconditional Right to Instant Erasure
              </h2>
              <p>
                Users hold the unconditional right to purge all historical conversation vectors with 1 click directly inside the Workspace settings. Upon initiation, embeddings and metadata are permanently destroyed across all clusters with zero forensic residue.
              </p>
            </section>
          </div>
        )}

        {/* 2. Terms of Service Document */}
        {type === 'terms' && (
          <div className="space-y-10 text-silver-mist font-extralight text-base leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                1. 100% Commercial Ownership of Output
              </h2>
              <p>
                You retain 100% full commercial ownership, copyright, and intellectual property rights over all prompts submitted and all synthetic responses generated by Zorvik AI. You may freely use, publish, monetize, commercialize, or integrate generated output.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                2. Acceptable Use &amp; API Integrity
              </h2>
              <p>
                Users and enterprise API developers agree not to use Zorvik AI for malicious cyber activities, automated denial-of-service attacks, or generation of unlawful materials. Public tiers are subject to fair usage rate limiting to guarantee sub-50ms latency for all users.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                3. High-Availability SLA
              </h2>
              <p>
                Zorvik AI provides enterprise customers with a 99.99% uptime availability commitment backed by multi-region autonomous model cascade failover and autonomous health circuit breakers.
              </p>
            </section>
          </div>
        )}

        {/* 3. Security Standards Document */}
        {type === 'security' && (
          <div className="space-y-10 text-silver-mist font-extralight text-base leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                1. Cryptographic Transport Security
              </h2>
              <p>
                All API requests and WebSocket streaming channels enforce strict TLS 1.3 encryption with perfect forward secrecy (PFS) and strict HTTP Strict Transport Security (HSTS) headers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                2. Dedicated Tenant Partitioning
              </h2>
              <p>
                Vector storage and conversational memory are physically partitioned by tenant ID, preventing cross-tenant leakage or shared memory index overlap across all cloud regions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-normal text-bone-white font-sans">
                3. Autonomous Circuit Breakers
              </h2>
              <p>
                Underlying foundation model providers are monitored through autonomous microsecond health probes. In the event of upstream degradation, traffic cascades in &lt;10ms to secondary models without user interruption.
              </p>
            </section>
          </div>
        )}
      </main>

      {/* 3. Footer (Liquid-Glass Theme) */}
      <footer className="relative z-20 mx-4 md:mx-8 overflow-hidden rounded-t-[40px] border border-white/[0.08] bg-void/80 backdrop-blur-2xl pt-16 pb-10 shadow-2xl mt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[220px] w-[450px] -translate-x-1/2 rounded-full bg-electric-iris/8 blur-[100px]" />
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
                  <button onClick={onNavigateHome} className="hover:text-bone-white transition-colors cursor-pointer text-left">
                    Core Intelligence
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateHome} className="hover:text-bone-white transition-colors cursor-pointer text-left">
                    Persistent Memory
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateHome} className="hover:text-bone-white transition-colors cursor-pointer text-left">
                    Developer API
                  </button>
                </li>
              </ul>
            </div>

            {/* 3. Zorvik Governance */}
            <div>
              <h4 className="mb-4 font-mono text-xs font-semibold tracking-wider uppercase text-bone-white">
                Governance
              </h4>
              <ul className="space-y-2.5 text-xs text-silver-mist/75 font-extralight">
                <li>
                  <button
                    onClick={() => onNavigateLegal('privacy')}
                    className={`hover:text-bone-white transition-colors cursor-pointer text-left ${type === 'privacy' ? 'text-electric-iris font-medium' : ''}`}
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateLegal('terms')}
                    className={`hover:text-bone-white transition-colors cursor-pointer text-left ${type === 'terms' ? 'text-cyan font-medium' : ''}`}
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateLegal('security')}
                    className={`hover:text-bone-white transition-colors cursor-pointer text-left ${type === 'security' ? 'text-saffron-spark font-medium' : ''}`}
                  >
                    Security Architecture
                  </button>
                </li>
                <li>
                  <a href="https://zorvik.tech" target="_blank" rel="noopener noreferrer" className="hover:text-bone-white transition-colors inline-flex items-center gap-1">
                    Zorvik Tech <ExternalLink size={10} className="text-ash-gray" />
                  </a>
                </li>
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
    </div>
  );
};
