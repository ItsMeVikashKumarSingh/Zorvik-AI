import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Lock } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'security';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-void/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl border border-white/[0.10] bg-void/95 shadow-2xl overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-electric-iris" />
              <h3 className="font-mono text-sm font-bold tracking-wider uppercase text-bone-white">
                ZORVIK AI · LEGAL &amp; GOVERNANCE
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-white/[0.08] text-ash-gray hover:text-bone-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.06] bg-white/[0.01]">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-electric-iris/15 text-electric-iris border border-electric-iris/30 font-semibold'
                  : 'text-ash-gray hover:text-bone-white'
              }`}
            >
              <Shield size={13} />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-cyan/15 text-cyan border border-cyan/30 font-semibold'
                  : 'text-ash-gray hover:text-bone-white'
              }`}
            >
              <FileText size={13} />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-saffron-spark/15 text-saffron-spark border border-saffron-spark/30 font-semibold'
                  : 'text-ash-gray hover:text-bone-white'
              }`}
            >
              <Lock size={13} />
              <span>Security Architecture</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-silver-mist font-extralight leading-relaxed">
            {activeTab === 'privacy' && (
              <div className="space-y-6 font-mono text-xs">
                <div>
                  <h4 className="text-base font-sans font-normal text-bone-white mb-2">
                    Zorvik AI Privacy Policy
                  </h4>
                  <p className="text-ash-gray font-mono text-[11px]">
                    Effective Date: August 27, 2026 · Standalone Microservice Governance
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">1. Zero-Log Ephemeral Guest Mode</h5>
                  <p>
                    Guest interactions on Zorvik AI are strictly ephemeral. Guest prompts, session context, and synthesized responses exist only in temporary memory during your active browser tab session. We do not persist guest conversations in long-term databases.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">2. No Model Training on User Data</h5>
                  <p>
                    Your prompts, uploaded documents, code snippets, and conversational transcripts are strictly your property. Zorvik AI does NOT use your inputs or model outputs to train or fine-tune public foundation models.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">3. Vector Partitioning &amp; Deep Memory</h5>
                  <p>
                    When authenticated users enable Continuous Deep Memory, semantic embeddings (768 dimensions) are stored inside isolated tenant partitions encrypted with customer-specific access keys.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">4. User Right to Instant Erasure</h5>
                  <p>
                    Users hold the unconditional right to purge all historical conversation vectors with 1 click directly inside the Workspace settings. Upon initiation, embeddings and metadata are permanently destroyed across all clusters.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-6 font-mono text-xs">
                <div>
                  <h4 className="text-base font-sans font-normal text-bone-white mb-2">
                    Zorvik AI Terms of Service
                  </h4>
                  <p className="text-ash-gray font-mono text-[11px]">
                    Effective Date: August 27, 2026 · Independent Platform Agreement
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">1. 100% User Ownership of Outputs</h5>
                  <p>
                    You retain 100% full commercial ownership and intellectual property rights over all prompts submitted and all synthetic responses generated by Zorvik AI. You may freely use, publish, sell, or integrate generated output.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">2. Acceptable Use &amp; API Integrity</h5>
                  <p>
                    Users and enterprise API developers agree not to use Zorvik AI for malicious cyber activities, automated DDoS attacks, or generation of unlawful materials. Public tiers are subject to rate limiting to guarantee sub-50ms latency for all users.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">3. High-Availability SLA</h5>
                  <p>
                    Zorvik AI provides enterprise customers with a 99.99% uptime availability commitment backed by multi-region autonomous model cascade failover.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 font-mono text-xs">
                <div>
                  <h4 className="text-base font-sans font-normal text-bone-white mb-2">
                    Zorvik AI Security Architecture
                  </h4>
                  <p className="text-ash-gray font-mono text-[11px]">
                    Enterprise-Grade Cryptographic &amp; Network Isolation
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">1. Cryptographic Transport Security</h5>
                  <p>
                    All API requests and WebSocket streaming channels enforce strict TLS 1.3 encryption with perfect forward secrecy (PFS) and strict HSTS policy.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">2. Dedicated Tenant Partitioning</h5>
                  <p>
                    Vector storage and conversational memory are physically partitioned by tenant ID, preventing cross-tenant leakage or shared memory index overlap.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h5 className="font-semibold text-bone-white">3. Automated Circuit Breakers</h5>
                  <p>
                    Underlying foundation model providers are monitored through autonomous health probes. In the event of upstream degradation, traffic cascades in &lt;10ms to secondary models without user interruption.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] font-mono text-[11px] text-ash-gray">
            <span>Zorvik AI Independent Governance</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-bone-white hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
