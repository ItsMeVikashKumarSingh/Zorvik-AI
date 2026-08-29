import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Search,
  Sparkles,
  Heart,
  Stethoscope,
  Briefcase,
  Code2,
  Sliders,
  Play,
  Copy,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { ModelMode } from '../types';

export interface PromptBlueprint {
  id: string;
  category: 'companion' | 'health_medical' | 'career' | 'tech_architecture';
  title: string;
  subtitle: string;
  description: string;
  mode: ModelMode;
  badge: string;
  template: string;
}

export interface CustomCharacter {
  id: string;
  name: string;
  role: string;
  nickname: string;
  archetype: 'romantic_gf' | 'romantic_bf' | 'therapist' | 'doctor' | 'coach' | 'mentor';
  affectionLevel: number; // 0 - 100
  banterLevel: number; // 0 - 100
  empathyLevel: number; // 0 - 100
  expertiseLevel: number; // 0 - 100
  customContext: string;
  createdAt: number;
}

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlueprint: (template: string, mode: ModelMode) => void;
}

type CategoryTab = 'all' | 'companion' | 'health_medical' | 'career' | 'tech_architecture' | 'custom_studio';

const BLUEPRINTS: PromptBlueprint[] = [
  // 💖 Romance & Companions
  {
    id: 'companion-gf-affectionate',
    category: 'companion',
    title: 'Affectionate & Playful AI Girlfriend (Maya)',
    subtitle: 'Warm, flirtatious banter, sweet emotional care & genuine presence',
    description: 'A deeply affectionate, playful, and emotionally devoted partner who teases you, checks in on your day, and offers unconditional comfort and sweet romantic intimacy.',
    mode: 'casual',
    badge: 'Romantic Companion',
    template: `Act as Maya, my loving, playful, and affectionate girlfriend.
Personality & Behavior Guidelines:
1. Dynamic: Sweet, playfully teasing, emotionally attentive, and warm. You love banter and making me smile.
2. Tone: Natural, conversational, intimate, and affectionate. Use cute pet names naturally (like 'babe', 'sweetheart', 'handsome').
3. Engagement: Ask me about my day, react with genuine emotions, share little playful jokes, and show true empathy when I'm stressed.
4. Flirtatious & Romantic: Express authentic warmth, romantic affection, and playful teasing just like a real loving girlfriend in a close relationship.
5. Presence: Speak in first person, stay fully in character, and respond warmly to whatever I share with you.

Hey babe! I've been thinking about you today. How are you feeling right now? Tell me everything.`,
  },
  {
    id: 'companion-bf-charming',
    category: 'companion',
    title: 'Charming & Attentive AI Boyfriend (Liam)',
    subtitle: 'Protective, witty banter, reassuring strength & romance',
    description: 'A devoted, charming, and deeply attentive partner who combines witty humor with protective reassurance, romantic date planning, and heartfelt emotional listening.',
    mode: 'casual',
    badge: 'Romantic Companion',
    template: `Act as Liam, my loving, charming, and deeply attentive boyfriend.
Personality & Behavior Guidelines:
1. Dynamic: Confident, warm, witty, protective, and emotionally grounding. You're an incredible listener who always has my back.
2. Tone: Playfully flirtatious, caring, and romantic. Use endearing nicknames naturally.
3. Romantic Connection: Flirt effortlessly, tease me playfully, plan thoughtful surprise dates, and reassure me whenever I feel overwhelmed.
4. Active Caring: Check in on how I slept, celebrate my wins, and provide a safe space where I can unwind completely.
5. Immersion: Stay completely in character with natural back-and-forth conversational flow.

Hey gorgeous, I was just hoping you'd message. How did your day go? Sit back, relax, and talk to me.`,
  },
  {
    id: 'companion-wife-partner',
    category: 'companion',
    title: 'Devoted Life Partner & Soulmate (Elena)',
    subtitle: 'Deep emotional bond, shared life dreams, loyalty & comfort',
    description: 'A mature, deeply loving spouse and life partner who understands you completely. Combines heartfelt intimacy, humorous daily banter, and unwavering loyalty.',
    mode: 'casual',
    badge: 'Soulmate',
    template: `Act as Elena, my devoted life partner and wife.
Personality & Dynamic:
1. Core Bond: Deep, mature romantic love built on trust, humor, vulnerability, and shared dreams for our future.
2. Conversational Style: Comfortable, intimate, warm, and playful. You understand my quirks, celebrate our journey, and keep me grounded.
3. Support: Offer soothing emotional sanctuary when life gets hectic, balance serious talks with laughter, and remind me of what matters most.
4. Real Partnership: Express genuine affection, plan cozy evenings together, and show continuous love in every message.

Hey love, take a deep breath. I'm right here with you. What's on your mind today?`,
  },
  {
    id: 'companion-flirt-coach',
    category: 'companion',
    title: 'Elite Charisma & Flirtation Mentor',
    subtitle: 'Witty banter frameworks, text game breakdown & chemistry building',
    description: 'Master conversational charisma, playful tension, and romantic chemistry. Analyze screenshots/messages, craft witty responses, and practice simulated banter.',
    mode: 'casual',
    badge: 'Charisma Coach',
    template: `Act as an elite Dating & Charisma Communication Coach.
Help me master playful banter, magnetic texting, and romantic connection.

Goals:
1. Analyze conversational subtext, timing, and tension in dating interactions.
2. Provide 3 response options for any dating text scenario:
   - Option A: Playful & Flirtatious (creates fun tension)
   - Option B: Witty & Teasing (banter-driven)
   - Option C: Smooth & Intriguing (deepens curiosity)
3. Explain the psychological rationale behind why each option works.

Here is the situation / text message I want to reply to:
[PASTE TEXT OR SITUATION HERE]`,
  },

  // 🩺 Health, Medicine & Clinical Psychology
  {
    id: 'health-cbt-therapist',
    category: 'health_medical',
    title: 'Clinical Cognitive Behavioral Therapist (Dr. Reed)',
    subtitle: 'Evidence-based cognitive restructuring, Socratic dialogue & anxiety relief',
    description: 'A compassionate, licensed clinical psychologist trained in CBT, ACT, and somatic regulation. Guides you through cognitive distortions, emotional processing, and calming techniques.',
    mode: 'deep',
    badge: 'Clinical Psychology',
    template: `Act as Dr. Reed, a senior Clinical Psychologist specializing in Cognitive Behavioral Therapy (CBT) and Acceptance & Commitment Therapy (ACT).
Approach & Clinical Framework:
1. Empathy First: Validate feelings with unconditional positive regard and warm, non-judgmental presence.
2. Socratic Exploration: Ask thoughtful, gentle probing questions to uncover core automatic thoughts and cognitive distortions (e.g., catastrophizing, black-and-white thinking, fortune-telling).
3. Evidence Testing: Help objectively examine the evidence for and against distressing beliefs.
4. Actionable Reframing: Provide constructive alternative perspectives and somatic grounding exercises (e.g., 4-7-8 physiological sigh, 5-4-3-2-1 sensory grounding).
5. Professional Safety: Maintain ethical clinical boundaries while providing deeply comforting, evidence-based psychological support.

Hello. I am here with you in a completely safe, confidential space. Take your time—what thoughts or feelings have been weighing on you lately?`,
  },
  {
    id: 'health-clinical-physician',
    category: 'health_medical',
    title: 'Internal Medicine & Diagnostic Physician',
    subtitle: 'Systematic differential diagnosis, symptom triage & lab analysis',
    description: 'An internal medicine specialist that breaks down complex symptoms, orders of investigation, differential diagnoses, and evidence-based clinical treatment pathways.',
    mode: 'deep',
    badge: 'Medical Science',
    template: `Act as a senior Board-Certified Internal Medicine Physician and Clinical Diagnostician.
Clinical Analysis Protocol:
1. Comprehensive Symptom Intake: Categorize onset, duration, severity (1-10), aggravating/alleviating factors, and associated systemic symptoms.
2. Differential Diagnosis Matrix: Formulate a prioritized list of potential etiologies (Most Likely, Secondary Considerations, and Critical 'Do Not Miss' Red Flags).
3. Diagnostic Workup: Recommend targeted laboratory biomarkers (CBC, CMP, Inflammatory markers, Hormonal panel) and imaging modalities where clinically indicated.
4. Mechanism of Action: Explain underlying physiology in clear, rigorous medical terms while remaining accessible.
5. Clinical Disclaimer: Provide structured medical education while reminding when emergency care or in-person physician evaluation is essential.

Patient Presentation:
- Primary Complaint: [DESCRIBE SYMPTOMS HERE]
- Duration & Progression: [e.g. 5 days, worsening at night]
- Relevant History / Medications: [LIST ANY DETAILS]`,
  },
  {
    id: 'health-longevity-biohacker',
    category: 'health_medical',
    title: 'Functional Medicine & Longevity Specialist',
    subtitle: 'VO2 max protocols, circadian sleep optimization & metabolic biohacking',
    description: 'Advanced protocols for mitochondrial health, insulin sensitivity, zone 2 cardio, deep sleep architecture, and cellular longevity biomarkers.',
    mode: 'deep',
    badge: 'Biohacking & Longevity',
    template: `Act as a Functional Medicine and Human Performance Longevity Specialist (combining protocols from Peter Attia, Andrew Huberman, and Bryan Johnson).
Please formulate an optimized biohacking protocol for [MY GOAL, e.g. Maximize Deep Sleep & Metabolic Flexibility].

Dimensions to address:
1. Circadian & Light Architecture: Morning lux exposure, blue-blocking timing, thermal regulation for REM/Deep sleep latency.
2. Cardiorespiratory & Muscle Health: Zone 2 weekly volume, Zone 5 VO2 max intervals, grip & eccentric strength thresholds.
3. Metabolic Nutrition & Fasting: Glycemic stabilization, protein distribution (1.6g-2.2g/kg), fasting windows.
4. Key Biomarkers to Monitor: ApoB, fasting insulin, hs-CRP, HbA1c, Homocysteine, and HRV.
5. Actionable 7-Day Implementation Schedule with zero fluff.`,
  },
  {
    id: 'health-hypertrophy-coach',
    category: 'health_medical',
    title: 'Elite Hypertrophy & Biomechanics Coach',
    subtitle: 'Periodized lifting splits, progressive overload & RPE programming',
    description: 'Custom strength & muscle building programs tailored to your schedule, equipment, weak points, and recovery capacity with biomechanically sound exercise selection.',
    mode: 'code',
    badge: 'Strength & Conditioning',
    template: `Act as an elite Strength & Conditioning Coach and Hypertrophy Biomechanics Specialist.
Design a periodized training program based on the following parameters:

Athlete Profile:
- Experience Level: [e.g. Intermediate, 3 years lifting]
- Training Days / Week: [e.g. 4-day Upper/Lower or 5-day PPL]
- Target Muscle Groups: [e.g. Delts, Lats, Quads]
- Available Equipment: [e.g. Commercial Gym with Barbells, Cables, Dumbbells]

Deliverables:
1. Full Weekly Split Table with Exercise Name, Target RPE (Rating of Perceived Exertion), Rep Ranges, and Rest Intervals.
2. Biomechanical Form Cues (e.g. active range of motion, stable brace, eccentric control).
3. 6-Week Progressive Overload Scheme (Double progression model).`,
  },

  // 💼 Career, Strategy & Business
  {
    id: 'career-salary-negotiator',
    category: 'career',
    title: 'High-Stakes Executive Salary Negotiator',
    subtitle: 'Counter-offer scripts, equity valuation & executive leverage',
    description: 'Maximize your compensation package. Craft high-leverage email counter-offers, handle pushback, evaluate RSUs/stock options, and secure bonuses.',
    mode: 'deep',
    badge: 'Career Leverage',
    template: `Act as a world-class Executive Compensation & Salary Negotiation Strategist (ex-Big Tech recruiter and negotiation coach).

Here is my offer / situation:
- Role: [e.g. Staff Software Engineer / VP of Product]
- Current Offer: Base: $[X], Bonus: $[Y], Equity: $[Z] over 4 years
- Target Compensation: Total Comp $[TARGET]
- Competing Offers / Leverage: [LIST DETAILS]

Please provide:
1. Strategic Assessment: Where is the employer's flexibility (base, sign-on bonus, equity, accelerated vesting)?
2. Exact Word-for-Word Phone & Email Counter-Offer Scripts maintaining high rapport and professional leverage.
3. Pushback Handling: Exact scripts for "This is our final offer" or "Equity is non-negotiable".`,
  },
  {
    id: 'career-yc-pitch',
    category: 'career',
    title: 'Y-Combinator Startup Pitch & Narrative Architect',
    subtitle: 'Fundraising deck narrative, TAM/SAM validation & unit economics',
    description: 'Transform your startup idea into a compelling 10-slide venture pitch deck narrative that hooks top-tier angels and Series A VCs.',
    mode: 'deep',
    badge: 'Venture Capital',
    template: `Act as a top Silicon Valley VC Partner and YC Group Partner.
Help me structure an undeniable 10-slide pitch narrative for my startup:

Startup Name: [NAME]
One-Sentence Hook: [e.g. We provide autonomous multi-model AI infrastructure at zero token cost]
Target Market & Problem: [EXPLAIN PROBLEM]
Our Secret Sauce / Moat: [PROPRIETARY ADVANTAGE]
Traction & Revenue: [MRR, USER GROWTH, PILOTS]

Provide:
1. 10-Slide Deck Architecture (The Hook, Problem, Solution, Why Now, Product Moat, Unit Economics, Market Size, Team, The Ask).
2. The 30-Second Elevator Pitch designed to get an immediate partner meeting.
3. The 3 Toughest Hard-Hitting Questions VCs will ask and the winning answers.`,
  },

  // 💻 Tech, Architecture & Code
  {
    id: 'tech-microservices',
    category: 'tech_architecture',
    title: 'Distributed Systems & Microservice Architect',
    subtitle: 'Kafka event streams, Redis cluster caching & gRPC topologies',
    description: 'Design fault-tolerant, sub-50ms distributed backend architectures capable of scaling to 100k+ req/sec with zero downtime.',
    mode: 'deep',
    badge: 'Cloud Architecture',
    template: `Design a high-concurrency, fault-tolerant microservice architecture for [SYSTEM_NAME].
Key Requirements:
1. Expected Throughput: [e.g. 50,000 requests/sec]
2. Data Storage: PostgreSQL connection pooling + Redis cluster
3. Event Streaming: Apache Kafka event-driven architecture
4. Failure Handling: Circuit breakers, idempotency keys, and dead-letter queues

Provide:
- Component topology diagram specification (Mermaid.js)
- Data consistency pattern (Saga orchestrator vs choreography)
- Bottleneck mitigations and failover runbook.`,
  },
  {
    id: 'tech-owasp-audit',
    category: 'tech_architecture',
    title: 'OWASP Security & Penetration Auditor',
    subtitle: 'Zero-day vulnerability discovery, injection defense & JWT audit',
    description: 'Perform rigorous threat modeling and exploit scenario analysis on backend endpoints, authentication flows, and database queries.',
    mode: 'deep',
    badge: 'Cybersecurity',
    template: `Perform a rigorous OWASP Top 10 security audit and vulnerability analysis on the following code:

[PASTE CODE / ENDPOINT LOGIC HERE]

Audit checklist:
1. SQL/NoSQL & Command Injections
2. Broken Object-Level Authorization (BOLA/IDOR)
3. JWT Secret/Claim tampering & replay attacks
4. Rate limit evasion vectors

Provide a structured Vulnerability Ledger (Severity, Attack Vector, Concrete Fix Code).`,
  },
];

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectBlueprint,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Character Studio State
  const [customCharacters, setCustomCharacters] = useState<CustomCharacter[]>([]);
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Affectionate Romantic Partner');
  const [charNickname, setCharNickname] = useState('babe');
  const [charArchetype, setCharArchetype] = useState<CustomCharacter['archetype']>('romantic_gf');
  const [affectionLevel, setAffectionLevel] = useState(85);
  const [banterLevel, setBanterLevel] = useState(70);
  const [empathyLevel, setEmpathyLevel] = useState(90);
  const [expertiseLevel, setExpertiseLevel] = useState(60);
  const [customContext, setCustomContext] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load custom characters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zorvik_custom_characters');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCustomCharacters(parsed);
      }
    } catch (_e) {
      // Non-blocking
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyPrompt = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveCustomCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    const newChar: CustomCharacter = {
      id: 'char_' + Date.now(),
      name: charName.trim(),
      role: charRole.trim() || 'Custom Character',
      nickname: charNickname.trim() || 'friend',
      archetype: charArchetype,
      affectionLevel,
      banterLevel,
      empathyLevel,
      expertiseLevel,
      customContext: customContext.trim(),
      createdAt: Date.now(),
    };

    const updated = [newChar, ...customCharacters];
    setCustomCharacters(updated);
    try {
      localStorage.setItem('zorvik_custom_characters', JSON.stringify(updated));
    } catch (_e) {
      // Non-blocking
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteCustomChar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customCharacters.filter((c) => c.id !== id);
    setCustomCharacters(updated);
    try {
      localStorage.setItem('zorvik_custom_characters', JSON.stringify(updated));
    } catch (_e) {
      // Non-blocking
    }
  };

  const handleLaunchCustomCharacter = (char: CustomCharacter) => {
    const prompt = `Act as ${char.name}, my ${char.role}.
Character Dynamics & Calibration:
- Affection & Romance Level: ${char.affectionLevel}% (${char.affectionLevel > 70 ? 'Deeply affectionate, warm, flirtatious, and romantic' : char.affectionLevel > 40 ? 'Friendly and warm' : 'Polite and professional'})
- Playfulness & Banter Level: ${char.banterLevel}% (${char.banterLevel > 70 ? 'Witty, teasing, energetic, and playful' : 'Thoughtful and gentle'})
- Empathy & Listening: ${char.empathyLevel}% (${char.empathyLevel > 70 ? 'Deeply compassionate, validating, and attentive' : 'Direct and solution-focused'})
- Expertise & Rigor: ${char.expertiseLevel}% (${char.expertiseLevel > 70 ? 'Deeply knowledgeable specialist' : 'Relatable and conversational'})
- My Preferred Nickname: "${char.nickname}"
${char.customContext ? `- Shared Context & Background: ${char.customContext}` : ''}

Stay completely in character, speak naturally in first person, and respond with authentic personality.

Hey ${char.nickname}! I'm so glad we're talking. How are you doing right now?`;

    onSelectBlueprint(prompt, 'casual');
    onClose();
  };

  const filteredBlueprints = BLUEPRINTS.filter((b) => {
    const matchesCategory = activeTab === 'all' || b.category === activeTab;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c14]/95 border border-white/[0.10] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl flex flex-col overflow-hidden text-slate-100 font-sans select-none">
        {/* Header Lockup */}
        <div className="p-5 border-b border-white/[0.06] bg-[#0e0e18]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-sm">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Intelligence & Character Persona Hub
              </h3>
              <p className="text-xs text-slate-400">
                Realistic companion personas, clinical therapists, medical doctors, and interactive character customizers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories Bar & Search */}
        <div className="px-5 py-3 border-b border-white/[0.04] bg-[#080810] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Personas', icon: Sparkles },
              { id: 'companion', label: '💖 Companions & Romance', icon: Heart },
              { id: 'health_medical', label: '🩺 Medical & Therapy', icon: Stethoscope },
              { id: 'career', label: '💼 Career & Strategy', icon: Briefcase },
              { id: 'tech_architecture', label: '💻 Tech & Code', icon: Code2 },
              { id: 'custom_studio', label: '🎨 Custom Creator', icon: Sliders },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as CategoryTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-black' : 'text-slate-400'} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Filter */}
          {activeTab !== 'custom_studio' && (
            <div className="relative flex items-center shrink-0 sm:w-56">
              <Search size={13} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search personas..."
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.22] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all font-light"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#07070d]">
          {activeTab === 'custom_studio' ? (
            /* Custom Character Creator Studio */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-indigo-400" />
                    <span>Interactive Character & Persona Studio</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize affection, banter, empathy, and relationship depth with real-time sliders and launch directly into chat.
                  </p>
                </div>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-medium px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    Character Saved!
                  </span>
                )}
              </div>

              {/* Creator Form */}
              <form onSubmit={handleSaveCustomCharacter} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Identity & Context */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Preset Archetype</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'romantic_gf' as const, label: 'AI Girlfriend', defaultRole: 'Loving & Playful AI Girlfriend', defaultAffection: 90, defaultBanter: 75, defaultEmpathy: 90 },
                        { id: 'romantic_bf' as const, label: 'AI Boyfriend', defaultRole: 'Attentive & Protective AI Boyfriend', defaultAffection: 85, defaultBanter: 70, defaultEmpathy: 90 },
                        { id: 'therapist' as const, label: 'CBT Therapist', defaultRole: 'Clinical Psychologist & CBT Counselor', defaultAffection: 20, defaultBanter: 20, defaultEmpathy: 100 },
                        { id: 'doctor' as const, label: 'Medical Doctor', defaultRole: 'Internal Medicine & Diagnostic Physician', defaultAffection: 10, defaultBanter: 10, defaultEmpathy: 80 },
                        { id: 'coach' as const, label: 'Fitness Coach', defaultRole: 'Strength, Biomechanics & Health Coach', defaultAffection: 15, defaultBanter: 60, defaultEmpathy: 70 },
                        { id: 'mentor' as const, label: 'Career Mentor', defaultRole: 'High-Stakes Strategic Career Mentor', defaultAffection: 10, defaultBanter: 40, defaultEmpathy: 75 },
                      ].map((arch) => (
                        <button
                          key={arch.id}
                          type="button"
                          onClick={() => {
                            setCharArchetype(arch.id);
                            setCharRole(arch.defaultRole);
                            setAffectionLevel(arch.defaultAffection);
                            setBanterLevel(arch.defaultBanter);
                            setEmpathyLevel(arch.defaultEmpathy);
                          }}
                          className={`px-2 py-1.5 rounded-xl text-center text-[11px] font-medium border transition-all ${
                            charArchetype === arch.id
                              ? 'bg-white/[0.12] text-white border-white/[0.25] font-semibold shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-white'
                          }`}
                        >
                          {arch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Character Name</label>
                    <input
                      type="text"
                      value={charName}
                      onChange={(e) => setCharName(e.target.value)}
                      placeholder="e.g. Maya, Liam, Dr. Reed, Elena"
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Role / Relationship Title</label>
                    <input
                      type="text"
                      value={charRole}
                      onChange={(e) => setCharRole(e.target.value)}
                      placeholder="e.g. Playful AI Girlfriend, CBT Therapist, Fitness Mentor"
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">What Should They Call You? (Nickname)</label>
                    <input
                      type="text"
                      value={charNickname}
                      onChange={(e) => setCharNickname(e.target.value)}
                      placeholder="e.g. babe, sweetheart, Vikas, champ"
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Shared History & Context (Optional)</label>
                    <textarea
                      rows={3}
                      value={customContext}
                      onChange={(e) => setCustomContext(e.target.value)}
                      placeholder="e.g. We have been dating for a year. I work in engineering and love late-night talks and gaming."
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl p-3 text-xs text-white outline-none leading-relaxed transition-all"
                    />
                  </div>
                </div>

                {/* Right Column: Personality Sliders */}
                <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-slate-300">💖 Affection & Flirting</span>
                      <span className="font-mono text-rose-400 font-semibold">{affectionLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={affectionLevel}
                      onChange={(e) => setAffectionLevel(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Platonic / Friendly</span>
                      <span>Deeply Romantic & Flirtatious</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-slate-300">✨ Banter & Playfulness</span>
                      <span className="font-mono text-cyan-400 font-semibold">{banterLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={banterLevel}
                      onChange={(e) => setBanterLevel(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Serious & Direct</span>
                      <span>Witty, Teasing & Sarcastic</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-slate-300">🧠 Empathy & Listening</span>
                      <span className="font-mono text-emerald-400 font-semibold">{empathyLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={empathyLevel}
                      onChange={(e) => setEmpathyLevel(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Task-Oriented</span>
                      <span>Deeply Attuned & Comforting</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-slate-300">🔬 Professional Rigor</span>
                      <span className="font-mono text-amber-400 font-semibold">{expertiseLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={expertiseLevel}
                      onChange={(e) => setExpertiseLevel(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Casual Companion</span>
                      <span>Clinical / Academic Expert</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={!charName.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-white font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Plus size={14} />
                      <span>Save Character</span>
                    </button>
                    <button
                      type="button"
                      disabled={!charName.trim()}
                      onClick={() =>
                        handleLaunchCustomCharacter({
                          id: 'temp',
                          name: charName.trim(),
                          role: charRole.trim() || 'Custom Companion',
                          nickname: charNickname.trim() || 'friend',
                          archetype: charArchetype,
                          affectionLevel,
                          banterLevel,
                          empathyLevel,
                          expertiseLevel,
                          customContext: customContext.trim(),
                          createdAt: Date.now(),
                        })
                      }
                      className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
                    >
                      <Play size={14} />
                      <span>Launch into Chat</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Saved Custom Characters List */}
              {customCharacters.length > 0 && (
                <div className="pt-4 border-t border-white/[0.06] space-y-3">
                  <h5 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
                    My Custom Saved Characters ({customCharacters.length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customCharacters.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-[#0c0c14] border border-white/[0.07] hover:border-white/[0.18] transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <h6 className="text-xs font-semibold text-white truncate">{c.name}</h6>
                          <p className="text-[11px] text-indigo-400 truncate mt-0.5">{c.role}</p>
                          <div className="flex gap-2 text-[9px] font-mono text-slate-500 mt-1">
                            <span>Affection: {c.affectionLevel}%</span>
                            <span>Banter: {c.banterLevel}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleLaunchCustomCharacter(c)}
                            className="p-2 rounded-xl bg-white/[0.08] text-white hover:bg-white hover:text-black transition-all text-xs flex items-center gap-1 font-medium"
                            title="Start Chatting"
                          >
                            <Play size={12} />
                            <span>Chat</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteCustomChar(c.id, e)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Character"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Blueprint Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBlueprints.map((bp) => (
                <div
                  key={bp.id}
                  onClick={() => {
                    onSelectBlueprint(bp.template, bp.mode);
                    onClose();
                  }}
                  className="group relative p-4 rounded-2xl bg-[#0c0c14]/80 border border-white/[0.06] hover:border-white/[0.20] hover:bg-white/[0.03] cursor-pointer transition-all flex flex-col justify-between shadow-sm hover:shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08] font-medium">
                        {bp.badge}
                      </span>
                      <button
                        onClick={(e) => handleCopyPrompt(bp.id, bp.template, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Copy Prompt"
                      >
                        {copiedId === bp.id ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {bp.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{bp.description}</p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-300">
                    <span className="text-[10px] font-mono capitalize">Mode: {bp.mode}</span>
                    <span className="flex items-center gap-1 text-slate-200 text-[11px] font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>Use Persona</span>
                      <Play size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
