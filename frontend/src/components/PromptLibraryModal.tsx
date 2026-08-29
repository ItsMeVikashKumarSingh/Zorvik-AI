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
  Edit3,
  User,
  Sparkle,
  Layers,
  FileText,
  Cloud,
} from 'lucide-react';
import { ModelMode } from '../types';
import { saveUserPersonas, loadUserPersonas } from '../lib/supabase';

export type PersonaCategory = 'companion' | 'health_medical' | 'career' | 'tech_architecture' | 'custom';

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

export interface PersonaSlider {
  id: string;
  name: string;
  value: number; // 0 - 100
  minLabel: string;
  maxLabel: string;
  accentColor: string;
}

export interface CustomCharacter {
  id: string;
  name: string;
  category: PersonaCategory;
  role: string;
  salutation: string; // e.g. "Sweetheart" / "Dr. / Patient" / "Senior Architect" / "Founder"
  customPrompt?: string; // Direct custom prompt instructions
  customContext?: string; // Shared background / context
  sliders: PersonaSlider[];
  createdAt: number;
}

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlueprint: (template: string, mode: ModelMode) => void;
}

type CategoryTab =
  | 'all'
  | 'my_characters'
  | 'companion'
  | 'health_medical'
  | 'career'
  | 'tech_architecture'
  | 'custom_studio';

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
I am dealing with [EXPLAIN EMOTIONAL / ANXIOUS SITUATION].

Guide me through a structured clinical session:
1. Socratic Inquiry: Ask 2 targeted questions to identify the underlying cognitive distortion (e.g. catastrophizing, black-and-white thinking).
2. Thought Record Exercise: Help me formulate evidence for vs. evidence against my automated negative thoughts.
3. Rational Reframing: Provide a grounded, objective cognitive reframe.
4. Somatic Grounding Technique: Provide an immediate 2-minute nervous system regulation exercise (e.g. physiological sigh, box breathing).`,
  },
  {
    id: 'health-internal-medicine',
    category: 'health_medical',
    title: 'Internal Medicine & Diagnostic Physician',
    subtitle: 'Differential diagnosis, lab biomarker breakdown & clinical triage',
    description: 'A meticulous medical doctor who analyzes symptoms, bloodwork panels, and biomarker trends with clinical differential diagnostic rigor and actionable patient questions.',
    mode: 'deep',
    badge: 'Internal Medicine',
    template: `Act as a senior Board-Certified Internal Medicine Physician.
Here are my symptoms / blood test lab results:
[PASTE SYMPTOMS / LAB VALUES / DURATION]

Provide a structured clinical assessment:
1. Primary Differential Diagnoses (ordered by probability, with physiological rationale).
2. Red Flag Symptoms & Urgent Triage: Warning signs that require immediate emergency evaluation.
3. Recommended Follow-Up Diagnostic Tests (e.g. specific blood panels, imaging, specialist referrals).
4. Key Questions to Ask My Attending Doctor at my next appointment.`,
  },
  {
    id: 'health-longevity-specialist',
    category: 'health_medical',
    title: 'Longevity & Cellular Biohacking Specialist',
    subtitle: 'Circadian protocols, metabolic optimization, VO2 max & blood markers',
    description: 'An expert longevity physician and biohacker focused on healthspan extension, mitochondrial health, Zone 2 cardio, deep sleep architecture, and biomarker tracking.',
    mode: 'deep',
    badge: 'Longevity & Biohacking',
    template: `Act as an elite Longevity Physician and Performance Biohacking Specialist.
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

// Helper to generate category-tailored default sliders
function getDefaultSlidersForCategory(cat: PersonaCategory): PersonaSlider[] {
  switch (cat) {
    case 'companion':
      return [
        { id: 'aff', name: '💖 Affection & Romance', value: 85, minLabel: 'Platonic / Polite', maxLabel: 'Deeply Romantic & Flirtatious', accentColor: 'rose' },
        { id: 'ban', name: '✨ Playfulness & Banter', value: 75, minLabel: 'Serious & Gentle', maxLabel: 'Witty, Teasing & Sarcastic', accentColor: 'cyan' },
        { id: 'emp', name: '🧠 Empathy & Listening', value: 90, minLabel: 'Task-Oriented', maxLabel: 'Deeply Attuned & Comforting', accentColor: 'emerald' },
        { id: 'int', name: '💬 Conversational Warmth', value: 85, minLabel: 'Reserved / Formal', maxLabel: 'Intimate & Open-Hearted', accentColor: 'amber' },
      ];
    case 'health_medical':
      return [
        { id: 'diag', name: '🩺 Diagnostic & Clinical Rigor', value: 90, minLabel: 'General Wellness Advice', maxLabel: 'Rigorous Evidence-Based Clinical Audit', accentColor: 'cyan' },
        { id: 'emp', name: '🧠 Patient Empathy & Listening', value: 85, minLabel: 'Direct & Concise', maxLabel: 'Compassionate & Psychologically Attuned', accentColor: 'emerald' },
        { id: 'bio', name: '🔬 Biomarker & Lab Depth', value: 90, minLabel: 'High-Level Overview', maxLabel: 'Molecular & Biochemical Precision', accentColor: 'purple' },
        { id: 'act', name: '📋 Actionable Protocol Structuring', value: 85, minLabel: 'Exploratory Discussion', maxLabel: 'Step-by-Step Prescriptive Routine', accentColor: 'amber' },
      ];
    case 'career':
      return [
        { id: 'lev', name: '💼 Strategic Leverage & Power', value: 90, minLabel: 'Passive / Standard', maxLabel: 'High-Stakes Executive Leverage', accentColor: 'amber' },
        { id: 'con', name: '🎯 Executive Conciseness', value: 85, minLabel: 'Long-Form Discussion', maxLabel: 'Punchy Bulleted C-Suite Briefings', accentColor: 'cyan' },
        { id: 'fin', name: '📊 Unit Economics & Data Rigor', value: 85, minLabel: 'Qualitative Vision', maxLabel: 'Mathematical & Financial Rigor', accentColor: 'emerald' },
        { id: 'ton', name: '🤝 Executive Polish & Tone', value: 90, minLabel: 'Casual Peer', maxLabel: 'Seasoned C-Level Executive Presence', accentColor: 'purple' },
      ];
    case 'tech_architecture':
      return [
        { id: 'typ', name: '💻 Production Code & Type Strictness', value: 95, minLabel: 'Pseudocode / Fast Mock', maxLabel: 'Strict Production TypeScript / Go / Rust', accentColor: 'cyan' },
        { id: 'sec', name: '🛡️ Edge-Case & Security Paranoia', value: 90, minLabel: 'Standard Best-Effort', maxLabel: 'Zero-Trust OWASP Hardened Security', accentColor: 'rose' },
        { id: 'per', name: '⚡ Low-Latency Performance Focus', value: 90, minLabel: 'Standard Performance', maxLabel: 'Sub-10ms Micro-Optimized Throughput', accentColor: 'amber' },
        { id: 'mod', name: '📐 Modularity & Clean Architecture', value: 90, minLabel: 'Monolithic Scripts', maxLabel: 'Decoupled Event-Driven Clean Architecture', accentColor: 'emerald' },
      ];
    case 'custom':
    default:
      return [
        { id: 'cre', name: '⚡ Creativity vs Factuality', value: 70, minLabel: 'Strictly Grounded & Deterministic', maxLabel: 'Imaginative & Highly Creative', accentColor: 'purple' },
        { id: 'ana', name: '🧠 Analytical Reasoning Depth', value: 85, minLabel: 'Concise Summary', maxLabel: 'Rigorous Multi-Step Chain of Thought', accentColor: 'cyan' },
        { id: 'dir', name: '🎯 Output Directness & Brevity', value: 80, minLabel: 'Conversational Prose', maxLabel: 'Direct, Zero-Fluff Precision', accentColor: 'emerald' },
        { id: 'for', name: '🎭 Formality & Tone', value: 60, minLabel: 'Relaxed & Casual', maxLabel: 'Academic & Formal', accentColor: 'amber' },
      ];
  }
}

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
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [creatorCategory, setCreatorCategory] = useState<PersonaCategory>('companion');
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Affectionate Romantic Partner');
  const [charSalutation, setCharSalutation] = useState('Sweetheart');
  const [customPromptText, setCustomPromptText] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [sliders, setSliders] = useState<PersonaSlider[]>(() => getDefaultSlidersForCategory('companion'));
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load custom characters from Cloud / LocalStorage on mount
  useEffect(() => {
    loadUserPersonas().then((personas) => {
      if (Array.isArray(personas)) {
        // Deduplicate by name (case-insensitive) to prevent duplicate cards
        const seen = new Set<string>();
        const deduped: CustomCharacter[] = [];
        for (const item of personas as CustomCharacter[]) {
          const key = (item.name || '').trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            deduped.push({
              ...item,
              category: item.category || 'companion',
              salutation: item.salutation || (item as unknown as { nickname?: string }).nickname || 'Sweetheart',
              sliders: Array.isArray(item.sliders) && item.sliders.length > 0
                ? item.sliders
                : getDefaultSlidersForCategory(item.category || 'companion'),
            });
          }
        }
        setCustomCharacters(deduped);
      }
    });
  }, []);

  if (!isOpen) return null;

  const handleCopyPrompt = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCategorySwitchInStudio = (cat: PersonaCategory) => {
    setCreatorCategory(cat);
    setSliders(getDefaultSlidersForCategory(cat));
    if (!editingCharId) {
      if (cat === 'companion') {
        setCharRole('Affectionate Romantic Partner');
        setCharSalutation('Sweetheart');
      } else if (cat === 'health_medical') {
        setCharRole('Internal Medicine & Diagnostic Physician');
        setCharSalutation('Patient');
      } else if (cat === 'career') {
        setCharRole('Executive Salary & Strategy Negotiator');
        setCharSalutation('Executive');
      } else if (cat === 'tech_architecture') {
        setCharRole('Distributed Systems & Security Architect');
        setCharSalutation('Lead Engineer');
      } else {
        setCharRole('Specialized Intelligence Persona');
        setCharSalutation('User');
      }
    }
  };

  const handleResetForm = () => {
    setEditingCharId(null);
    setCreatorCategory('companion');
    setCharName('');
    setCharRole('Affectionate Romantic Partner');
    setCharSalutation('Sweetheart');
    setCustomPromptText('');
    setCustomContext('');
    setSliders(getDefaultSlidersForCategory('companion'));
  };

  const handleEditCustomChar = (char: CustomCharacter, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCharId(char.id);
    const cat = char.category || 'companion';
    setCreatorCategory(cat);
    setCharName(char.name);
    setCharRole(char.role);
    setCharSalutation(char.salutation || 'Sweetheart');
    setCustomPromptText(char.customPrompt || '');
    setCustomContext(char.customContext || '');
    setSliders(
      Array.isArray(char.sliders) && char.sliders.length > 0
        ? char.sliders
        : getDefaultSlidersForCategory(cat)
    );
    setActiveTab('custom_studio');
  };

  const handleSliderChange = (sliderId: string, newValue: number) => {
    setSliders((prev) =>
      prev.map((s) => (s.id === sliderId ? { ...s, value: newValue } : s))
    );
  };

  const handleSaveCustomCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = charName.trim();
    if (!trimmedName) return;

    // Check if character with exact same name already exists to prevent duplicate cards
    const existingIndex = customCharacters.findIndex(
      (c) =>
        (editingCharId && c.id === editingCharId) ||
        c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    let updated: CustomCharacter[];
    let successMsg = 'Persona Created & Synced to Account!';

    if (existingIndex >= 0) {
      // Update existing character in place
      const existing = customCharacters[existingIndex];
      const updatedChar: CustomCharacter = {
        ...existing,
        name: trimmedName,
        category: creatorCategory,
        role: charRole.trim() || 'Specialized Persona',
        salutation: charSalutation.trim() || 'User',
        customPrompt: customPromptText.trim(),
        customContext: customContext.trim(),
        sliders,
        createdAt: Date.now(),
      };
      updated = [...customCharacters];
      updated[existingIndex] = updatedChar;
      successMsg = `"${trimmedName}" Updated in Cloud & Storage!`;
    } else {
      // Create new character
      const newChar: CustomCharacter = {
        id: 'char_' + Date.now(),
        name: trimmedName,
        category: creatorCategory,
        role: charRole.trim() || 'Specialized Persona',
        salutation: charSalutation.trim() || 'User',
        customPrompt: customPromptText.trim(),
        customContext: customContext.trim(),
        sliders,
        createdAt: Date.now(),
      };
      updated = [newChar, ...customCharacters];
      successMsg = `"${trimmedName}" Created & Synced to Account!`;
    }

    setCustomCharacters(updated);
    await saveUserPersonas(updated);

    setSaveSuccessMessage(successMsg);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleDeleteCustomChar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customCharacters.filter((c) => c.id !== id);
    setCustomCharacters(updated);
    if (editingCharId === id) {
      handleResetForm();
    }
    await saveUserPersonas(updated);
  };

  const getCustomCharPrompt = (char: CustomCharacter) => {
    const sliderLines = (char.sliders || []).map(
      (s) => `- ${s.name}: ${s.value}% (${s.value > 70 ? s.maxLabel : s.value > 35 ? 'Moderate' : s.minLabel})`
    );

    return `Act as ${char.name}, my ${char.role}.
Character Dynamics & Calibration:
${sliderLines.join('\n')}
- Addressing / Preferred Name: "${char.salutation || 'User'}"
${char.customPrompt ? `\nSpecialized Persona Directives & Instructions:\n${char.customPrompt}` : ''}
${char.customContext ? `\nShared Context & Background:\n${char.customContext}` : ''}

Stay completely in character, speak naturally in first person, and respond with authentic personality.

Hello ${char.salutation || 'friend'}! I'm ready. How can I help or assist you right now?`;
  };

  const handleLaunchCustomCharacter = (char: CustomCharacter) => {
    const prompt = getCustomCharPrompt(char);
    const mode: ModelMode =
      char.category === 'tech_architecture' ? 'code' :
      char.category === 'health_medical' || char.category === 'career' ? 'deep' :
      'casual';

    onSelectBlueprint(prompt, mode);
    onClose();
  };

  const filteredCustomCharacters = customCharacters.filter((c) => {
    const matchesCategory =
      activeTab === 'all' ||
      activeTab === 'my_characters' ||
      c.category === activeTab;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.salutation.toLowerCase().includes(q) ||
      (c.customContext && c.customContext.toLowerCase().includes(q)) ||
      (c.customPrompt && c.customPrompt.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const filteredBlueprints = BLUEPRINTS.filter((b) => {
    const matchesCategory =
      activeTab === 'all' ||
      activeTab === 'my_characters' ||
      b.category === activeTab;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0c14]/95 border border-white/[0.10] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl flex flex-col overflow-hidden text-slate-100 font-sans select-none">
        {/* Header Lockup */}
        <div className="p-5 border-b border-white/[0.06] bg-[#0e0e18]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-sm">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Intelligence & Persona Hub</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                  <Cloud size={10} />
                  <span>Account Synced</span>
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Design specialized companions, clinical doctors, executive negotiators, or code architects tailored to your exact workflow.
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
              {
                id: 'my_characters',
                label:
                  customCharacters.length > 0
                    ? `⭐ My Personas (${customCharacters.length})`
                    : '⭐ My Personas',
                icon: User,
              },
              { id: 'companion', label: '💖 Companions', icon: Heart },
              { id: 'health_medical', label: '🩺 Medical & Health', icon: Stethoscope },
              { id: 'career', label: '💼 Career & Strategy', icon: Briefcase },
              { id: 'tech_architecture', label: '💻 Tech & Code', icon: Code2 },
              { id: 'custom_studio', label: '🎨 Persona Studio', icon: Sliders },
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#07070d]">
          {/* TAB: CUSTOM STUDIO CREATOR */}
          {activeTab === 'custom_studio' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-indigo-400" />
                    <span>
                      {editingCharId
                        ? `Editing Persona: "${charName || 'Persona'}"`
                        : 'Interactive Persona & Character Studio'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose a domain category below to unlock domain-specific calibration sliders, or write your own custom system prompt.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingCharId && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                    >
                      + Create New Persona
                    </button>
                  )}
                  {saveSuccessMessage && (
                    <span className="text-xs text-emerald-400 font-medium px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      {saveSuccessMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Select Existing Characters Bar */}
              {customCharacters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                    <span>Load Existing Persona to Edit:</span>
                    <span className="text-slate-500">{customCharacters.length} saved in account</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {customCharacters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleEditCustomChar(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 shrink-0 ${
                          editingCharId === c.id
                            ? 'bg-purple-600/30 border-purple-500/60 text-white font-semibold'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <Sparkle size={11} className={editingCharId === c.id ? 'text-purple-400' : 'text-slate-500'} />
                        <span>{c.name}</span>
                        <span className="text-[10px] opacity-60 font-light font-mono capitalize">({c.category})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Selector for Persona Creation */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-slate-400">Select Persona Category & Focus Domain</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'companion' as const, label: '💖 Companions', desc: 'Romance & Banter' },
                    { id: 'health_medical' as const, label: '🩺 Medical & Health', desc: 'Clinical & Wellness' },
                    { id: 'career' as const, label: '💼 Career & Strategy', desc: 'Negotiation & Pitch' },
                    { id: 'tech_architecture' as const, label: '💻 Tech & Code', desc: 'Architecture & SRE' },
                    { id: 'custom' as const, label: '✨ Custom Directives', desc: 'Custom System Prompt' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySwitchInStudio(cat.id)}
                      className={`p-2.5 rounded-2xl text-left border transition-all ${
                        creatorCategory === cat.id
                          ? 'bg-white/[0.12] text-white border-white/[0.30] shadow-md'
                          : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Creator Form */}
              <form onSubmit={handleSaveCustomCharacter} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Identity, Custom System Prompt & Context */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Persona Name</label>
                    <input
                      type="text"
                      value={charName}
                      onChange={(e) => setCharName(e.target.value)}
                      placeholder={
                        creatorCategory === 'companion' ? 'e.g. Shreya, Maya, Liam, Elena' :
                        creatorCategory === 'health_medical' ? 'e.g. Dr. Thorne, Dr. Reed' :
                        creatorCategory === 'career' ? 'e.g. Executive Negotiator, Pitch Coach' :
                        creatorCategory === 'tech_architecture' ? 'e.g. Cloud Architect, OWASP Auditor' :
                        'e.g. Research Specialist, Legal Analyst'
                      }
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Role / Specialization Title</label>
                    <input
                      type="text"
                      value={charRole}
                      onChange={(e) => setCharRole(e.target.value)}
                      placeholder={
                        creatorCategory === 'companion' ? 'e.g. Affectionate Romantic Partner' :
                        creatorCategory === 'health_medical' ? 'e.g. Internal Medicine & Diagnostic Physician' :
                        creatorCategory === 'career' ? 'e.g. High-Stakes Salary & Equity Strategist' :
                        creatorCategory === 'tech_architecture' ? 'e.g. Distributed Systems & Microservice Architect' :
                        'e.g. Specialized Domain Expert'
                      }
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      {creatorCategory === 'companion' ? 'What Should They Call You? (Nickname / Pet Name)' :
                       creatorCategory === 'health_medical' ? 'How Should They Address You? (e.g. Patient / Alex)' :
                       creatorCategory === 'career' ? 'Your Executive Title (e.g. Founder / Executive / Candidate)' :
                       creatorCategory === 'tech_architecture' ? 'Your Engineering Role (e.g. Lead Engineer / SRE)' :
                       'How They Should Address You'}
                    </label>
                    <input
                      type="text"
                      value={charSalutation}
                      onChange={(e) => setCharSalutation(e.target.value)}
                      placeholder={
                        creatorCategory === 'companion' ? 'e.g. Sweetheart, babe, handsome' :
                        creatorCategory === 'health_medical' ? 'e.g. Patient, Alex, Client' :
                        creatorCategory === 'career' ? 'e.g. Executive, Founder, Candidate' :
                        creatorCategory === 'tech_architecture' ? 'e.g. Lead Engineer, SRE' :
                        'e.g. User, Friend'
                      }
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  {/* Custom Prompt Textarea (Always available across all categories) */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText size={12} className="text-indigo-400" />
                        <span>Custom Persona System Prompt & Directives (Optional)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-light">Custom Rules</span>
                    </label>
                    <textarea
                      rows={3}
                      value={customPromptText}
                      onChange={(e) => setCustomPromptText(e.target.value)}
                      placeholder="e.g. You are a senior oncologist. Prioritize clinical trials and biomarker interpretation. Always provide dosage verification and avoid vague generic statements."
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl p-3 text-xs text-white outline-none leading-relaxed transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span>Shared Background & Context (Optional)</span>
                      <span className="text-[10px] text-slate-500 font-light">Memory Seed</span>
                    </label>
                    <textarea
                      rows={2}
                      value={customContext}
                      onChange={(e) => setCustomContext(e.target.value)}
                      placeholder="e.g. I am building a fintech startup with 50k users. We use Node.js and PostgreSQL."
                      className="w-full bg-[#080810] border border-white/[0.08] focus:border-white/[0.22] rounded-xl p-3 text-xs text-white outline-none leading-relaxed transition-all"
                    />
                  </div>
                </div>

                {/* Right Column: Category-Specific Personality Sliders */}
                <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                      <Layers size={13} className="text-cyan-400" />
                      <span>{creatorCategory.toUpperCase()} Dynamics Calibration</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">4 Axes</span>
                  </div>

                  {sliders.map((slider) => (
                    <div key={slider.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300">{slider.name}</span>
                        <span className="font-mono text-cyan-400 font-semibold">{slider.value}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={slider.value}
                        onChange={(e) => handleSliderChange(slider.id, Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{slider.minLabel}</span>
                        <span>{slider.maxLabel}</span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={!charName.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-white font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Plus size={14} />
                      <span>{editingCharId ? 'Update Persona' : 'Save Persona to Account'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!charName.trim()}
                      onClick={() =>
                        handleLaunchCustomCharacter({
                          id: editingCharId || 'temp',
                          name: charName.trim(),
                          category: creatorCategory,
                          role: charRole.trim() || 'Specialized Persona',
                          salutation: charSalutation.trim() || 'User',
                          customPrompt: customPromptText.trim(),
                          customContext: customContext.trim(),
                          sliders,
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
            </div>
          ) : (
            /* NON-STUDIO VIEWS (ALL / MY CHARACTERS / COMPANION / MEDICAL / CAREER / TECH) */
            <div className="space-y-6">
              {/* SECTION: PROMINENT CUSTOM CHARACTERS SHOWCASE (Rendered at TOP for All, My Characters & matching category) */}
              {filteredCustomCharacters.length > 0 && (
                <div className="space-y-3 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase text-purple-300 tracking-wider font-semibold flex items-center gap-2">
                      <Sparkles size={13} className="text-purple-400" />
                      <span>My Created Personas ({filteredCustomCharacters.length})</span>
                    </h4>
                    <button
                      onClick={() => {
                        handleResetForm();
                        setActiveTab('custom_studio');
                      }}
                      className="text-xs text-purple-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} />
                      <span>Create New</span>
                    </button>
                  </div>

                  {/* Top Custom Characters Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCustomCharacters.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleLaunchCustomCharacter(c)}
                        className="group relative p-4 rounded-2xl bg-gradient-to-br from-purple-950/25 via-[#0e0e18] to-[#080812] border border-purple-500/25 hover:border-purple-500/55 cursor-pointer transition-all flex flex-col justify-between shadow-lg shadow-purple-950/10 hover:shadow-purple-900/20"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                                ⭐ {c.category || 'Custom'} Persona
                              </span>
                              {c.salutation && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                                  Address: "{c.salutation}"
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleEditCustomChar(c, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                title="Edit Persona & Sliders"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleCopyPrompt(c.id, getCustomCharPrompt(c), e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                title="Copy Prompt"
                              >
                                {copiedId === c.id ? (
                                  <Check size={13} className="text-emerald-400" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                              <button
                                onClick={(e) => handleDeleteCustomChar(c.id, e)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Delete Persona"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                              <span>{c.name}</span>
                              <span className="text-xs font-normal text-slate-400 font-mono">({c.role})</span>
                            </h4>
                            {c.customPrompt && (
                              <p className="text-xs text-indigo-300/80 line-clamp-1 mt-0.5 font-mono text-[11px]">
                                Prompt: {c.customPrompt}
                              </p>
                            )}
                            {c.customContext && (
                              <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-light leading-relaxed">
                                {c.customContext}
                              </p>
                            )}
                          </div>

                          {/* Dynamic Stat Indicators */}
                          {Array.isArray(c.sliders) && c.sliders.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              {c.sliders.slice(0, 3).map((s) => (
                                <span
                                  key={s.id}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.08]"
                                >
                                  {s.name.split(' ')[1] || s.name}: {s.value}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-purple-400 font-medium">Synced to Account</span>
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-200 text-xs font-medium group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <span>Launch Chat</span>
                            <Play size={11} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMPTY STATE FOR MY CHARACTERS TAB */}
              {activeTab === 'my_characters' && filteredCustomCharacters.length === 0 && (
                <div className="py-12 px-4 text-center space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                  <User size={32} className="mx-auto text-slate-500" />
                  <h4 className="text-sm font-semibold text-white">No Custom Personas Created Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Create custom clinical doctors, executive career coaches, tech architects, companions, or your own custom prompt personas with cloud synchronization.
                  </p>
                  <button
                    onClick={() => {
                      handleResetForm();
                      setActiveTab('custom_studio');
                    }}
                    className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-slate-200 transition-all inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Plus size={14} />
                    <span>Create Your First Persona</span>
                  </button>
                </div>
              )}

              {/* SECTION: SYSTEM PRE-TRAINED BLUEPRINTS */}
              {activeTab !== 'my_characters' && (
                <div className="space-y-3">
                  {filteredCustomCharacters.length > 0 && activeTab === 'all' && (
                    <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
                      System Personas & Blueprints
                    </h4>
                  )}
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
