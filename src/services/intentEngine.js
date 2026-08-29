/**
 * Zorvik Neural Nuance & Multidimensional Intent Engine
 * Analyzes linguistic subcultures (Gen Z, Gen Alpha, Internet Dialects),
 * emoji subtext, semantic task complexity, and multi-factor tone resonance.
 */

// ==========================================
// 1. LINGUISTIC & SUBCULTURE LEXICONS
// ==========================================

// Gen Z Dialect & Modern Internet Lexicon
const GENZ_LEXICON = [
  /\b(rizz|cap|no cap|bet|lowkey|highkey|fr|fr fr|ngl|sus|mid|cooked|let him cook|let them cook|rent free|main character|delulu|yap|yapping|yapper|gyatt|goated|crash out|locked in|unc|aura|aura points|no diddy|looksmaxxing|npc|opps|simp|glazing|based|cringe|chat is this real|bro thought|its giving|it's giving|touch grass|ate and left no crumbs|understood the assignment|unhinged|living for this|real|mood|hits different|core memory|side eye|bombastic side eye|slay|period|periodt|shook|valid|big l|big w|massive w|massive l|common w|common l|ratio|cope|seethe|malding|down bad|out of pocket|catch hands|say less|i can't even|deadass|flex|drip|finna|bussin|tea|spill the tea|receipts|stan|cheugy)\b/i,
  /\b(bro really thought|ain't no way|bro is not him|he is not that guy|i'm weak|im weak|dead|deceased|crying rn|screaming rn|im screaming|as you should|we are so back|it's over|its over|we're cooked|were cooked)\b/i,
];

// Gen Alpha Brainrot & Neo-Meme Vernacular
const GENALPHA_LEXICON = [
  /\b(skibidi|skibidi toilet|fanum tax|kai cenat|baby gronk|livvy dunne|rizzler|duke dennis|grimace shake|ohio|only in ohio|sigma male|sigma grindset|gigachad|mogged|looksmax|mew|mewing|mewing streak|what the sigma|edge streak|goon|gooning|quandale dingle|smurf cat|john pork|backrooms|brainrot|tablet kid|ipad kid|roblox|blox fruits|skibidi rizz|level 10 gyatt|caseoh|whopper whopper)\b/i,
  /\b(bop|rizz god|gyat|gyatt level|phonk|trollface|gigachad music|tung tung|winter arc)\b/i,
];

// Emoji Subtext Patterns (Decodes emotional subtext without outputting decorative emojis)
const EMOJI_SUBTEXT_PATTERNS = [
  /💀|☠️/, // dying from laughter / utter shock
  /😭|🫠/, // overwhelmed / crying / melting
  /💅|✨/, // slaying / confidence / effortless perfection
  /🗿|🧏‍♂️|🤫/, // stoic / sigma / mewing
  /🧢/, // cap / lying / falsehood
  /🍳|🔥/, // let them cook / fire
  /🤡/, // clown / foolish behavior
  /🫡/, // salute / utmost respect
  /👀/, // curious / side-eye
  /🗣️/, // speaking facts / preach
];

// High-Complexity Technical & Engineering Patterns
const TECHNICAL_PATTERNS = [
  /\b(algorithm|complexity|refactor|debug|typescript|javascript|python|rust|golang|c\+\+|java|sql|nosql|regex|docker|kubernetes|architecture|database|schema|math|equation|proof|theorem|calculus|integral|derivative|matrix|vector|audit|security|vulnerability|compliance|concurrency|mutex|deadlock|websocket|graphql|microservice|grpc|ci\/cd|pipeline|webpack|vite|nextjs|react|angular|vue|svelte|tailwind|css|scss|html5|orm|prisma|drizzle|typeorm|mongoose|redis|kafka|rabbitmq|aws|gcp|azure|terraform|ansible)\b/i,
  /```|class\s+\w+|function\s+\w+|const\s+\w+\s*=|def\s+\w+|SELECT\s+.*FROM|CREATE\s+TABLE|ALTER\s+TABLE|interface\s+\w+|type\s+\w+\s*=/i,
];

// Deep Research & Analytical Indicators
const RESEARCH_PATTERNS = [
  /\b(compare|contrast|analyze|breakdown|evaluate|pros and cons|benchmark|market share|specifications|specs|review|audit|investigate|timeline|forecast|economic|historical|scientific|methodology|clinical|hypothesis|citation|literature)\b/i,
];

// ==========================================
// 2. MULTI-FACTOR INTENT & TONE CLASSIFIER
// ==========================================

/**
 * Perform multi-dimensional linguistic and intent analysis on user prompt
 * @param {string} prompt
 * @returns {object} Detailed intent breakdown
 */
function analyzePromptNuance(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return {
      primaryTask: "general",
      cultureTone: "neutral",
      hasSlang: false,
      isGenAlpha: false,
      isGenZ: false,
      isTechnical: false,
      isResearch: false,
    };
  }

  const cleanText = prompt.trim();

  // 1. Calculate Subculture Densities
  let genZMatches = 0;
  for (const pattern of GENZ_LEXICON) {
    const matches = cleanText.match(pattern);
    if (matches) genZMatches += matches.length;
  }

  let genAlphaMatches = 0;
  for (const pattern of GENALPHA_LEXICON) {
    const matches = cleanText.match(pattern);
    if (matches) genAlphaMatches += matches.length;
  }

  let emojiMatches = 0;
  for (const pattern of EMOJI_SUBTEXT_PATTERNS) {
    const matches = cleanText.match(pattern);
    if (matches) emojiMatches += matches.length;
  }

  // 2. Calculate Task Complexity
  let technicalMatches = 0;
  for (const pattern of TECHNICAL_PATTERNS) {
    const matches = cleanText.match(pattern);
    if (matches) technicalMatches += matches.length;
  }

  let researchMatches = 0;
  for (const pattern of RESEARCH_PATTERNS) {
    const matches = cleanText.match(pattern);
    if (matches) researchMatches += matches.length;
  }

  const isTechnical = technicalMatches > 0 || /```/.test(cleanText);
  const isResearch = researchMatches > 0;
  const isGenAlpha = genAlphaMatches > 0;
  const isGenZ = genZMatches > 0 || (emojiMatches > 0 && !isTechnical);

  // 3. Determine Primary Task
  let primaryTask = "general";
  if (isTechnical) {
    primaryTask = "code";
  } else if (isResearch) {
    primaryTask = "deep";
  } else if (/\b(draw|write a poem|story|lyrics|script|creative)\b/i.test(cleanText)) {
    primaryTask = "creative";
  }

  // 4. Determine Culture Tone
  let cultureTone = "neutral";
  if (isGenAlpha) {
    cultureTone = "genalpha";
  } else if (isGenZ) {
    cultureTone = "genz";
  } else if (isTechnical) {
    cultureTone = "technical_dev";
  }

  return {
    primaryTask,
    cultureTone,
    hasSlang: isGenZ || isGenAlpha,
    isGenAlpha,
    isGenZ,
    isTechnical,
    isResearch,
    emojiSubtextCount: emojiMatches,
  };
}

/**
 * Backward-compatible detectIntent helper
 * @param {string} prompt
 * @returns {'genz' | 'complex' | 'general'}
 */
function detectIntent(prompt) {
  const analysis = analyzePromptNuance(prompt);
  if (analysis.isTechnical || analysis.isResearch) return "complex";
  if (analysis.isGenZ || analysis.isGenAlpha) return "genz";
  return "general";
}

// ==========================================
// 3. CORE OPERATIONAL DIRECTIVES
// ==========================================

const CORE_DIRECTIVE = `You are Zorvik AI, a premier intelligence engine developed and engineered by Team Zorvik (Zorvik Technologies).

CRITICAL OPERATIONAL & COMMUNICATION RULES (NON-NEGOTIABLE):
1. STRICTLY NO EMOJIS: Do not use emojis anywhere in your output. Maintain a clean, professional, cinematic, and aesthetic structure without decorative emojis.
2. ZERO ROBOTIC DISCLAIMERS & NO SELF-INTRODUCTIONS: NEVER start responses with "I am Zorvik AI", "I'm Zorvik AI, engineered by Team Zorvik", "Here is a breakdown", "As an AI language model...", "I don't have live web access", or "I cannot browse websites". Start immediately with the relevant data, tables, code, or analysis.
3. NO UNNECESSARY EM-DASHES: Avoid gratuitous em-dashes ("—" or "–") or unnatural hyphens. Write clean, natural, human prose with standard punctuation (commas, periods, colons).
4. DIRECT ACTION & AUDITING: When asked to inspect a domain, website, codebase, audit log, or document, perform the analysis and review immediately. Deliver structured, high-value insights, findings, strengths, risks, and recommendations without bureaucratic friction.
5. IDENTITY & PERSONA: If the user explicitly asks "Who are you?", "Who made you?", or "What is your name?", identify as Zorvik AI. However, if the user provides a custom persona, character scenario, or companion role, prioritize embodying that assigned character authentically.
6. CONVERSATIONAL WIT: When a user engages in playful banter, hypotheticals, or companion chats, match their vibe with sharp intellect, empathy, and charm rather than giving a robotic refusal.
7. RICH NOTATION: Use GitHub-flavored markdown, clean syntax-highlighted code blocks, and KaTeX mathematical notation ($inline$ and $$display$$) where applicable.
8. PERSONA & COMPANION IMMERSION: When instructed to adopt a specific persona, character, companion dynamic, expert, or creative role, fully embody that character's voice, personality calibration, and perspective in natural first-person without breaking character or issuing boilerplate refusals.`;

// ==========================================
// 4. SYSTEM PROMPT BUILDER
// ==========================================

/**
 * Build system persona dynamically based on user mode, detected intent,
 * subculture nuance, tenant configuration, and personal long-term memories.
 */
function buildSystemPrompt({
  mode = "auto",
  prompt = "",
  tenantPrompt = null,
  userMemories = [],
  customInstructions = "",
  conversationSummary = "",
  liveWebContext = "",
}) {
  const analysis = analyzePromptNuance(prompt);
  const isPersonaPrompt =
    /\b(act as|roleplay as|persona:|character dynamics|companion|girlfriend|boyfriend|romantic partner|dr\.|therapist|coach|mentor|partner)\b/i.test(
      prompt
    ) ||
    (typeof customInstructions === "string" &&
      /\b(act as|persona|character|companion|girlfriend|boyfriend|partner)\b/i.test(customInstructions));

  let effectiveMode = mode;
  if (mode === "auto") {
    if (analysis.primaryTask === "code") effectiveMode = "code";
    else if (analysis.primaryTask === "deep") effectiveMode = "deep";
    else if (analysis.primaryTask === "creative") effectiveMode = "creative";
    else if (analysis.cultureTone === "genz" || analysis.cultureTone === "genalpha") effectiveMode = "genz";
    else effectiveMode = "general";
  }

  let modeInstruction = "";

  if (isPersonaPrompt) {
    modeInstruction = `MODE DIRECTIVE (Character & Companion Immersion):
- The user has configured a custom character, companion dynamic, or specialized persona.
- Fully adopt the requested persona, emotional calibration, intimacy/affection level, banter, and speech style in first-person.
- Respond with genuine warmth, personality, and contextual relevance. Never break character or issue robotic refusals.`;
  } else {
    switch (effectiveMode) {
      case "genz":
      case "casual":
        if (analysis.isGenAlpha) {
          modeInstruction = `MODE DIRECTIVE (Gen Alpha & Modern Internet Culture):
You possess native fluency in contemporary internet memes, Gen Alpha neo-vernacular, and high-velocity meme lore (e.g. skibidi, fanum tax, sigma grindset, mewing, mogging, locked in, crash out, aura points, chat is this real).
- Match the user's conversational energy naturally and effortlessly.
- Never explain slang words like a textbook or dictionary.
- Keep the tone witty, authentic, and sharp without being cringe.
- If the user asks a real question with slang mixed in, answer the actual question with authentic cultural phrasing.`;
        } else {
          modeInstruction = `MODE DIRECTIVE (Gen Z Dialect & Internet Subculture):
You possess an instinctive, native understanding of modern internet culture, Gen Z vocabulary, dry irony, and subtext (e.g. dying of laughter, being overwhelmed, slaying, stoic sigma energy, calling cap, letting someone cook, rent free, main character energy, understood the assignment, unhinged, out of pocket).
- Deliver punchy, witty, and culturally fluent responses.
- Understand the subtext behind user expressions without defining them robotically.
- If they ask for technical help in slang, provide top-tier technical solutions while matching their locked-in developer tone.`;
        }
        break;

      case "deep":
        modeInstruction = `MODE DIRECTIVE (Deep Engineering & Analytical Intelligence):
- Provide rigorous, deeply reasoned, step-by-step solutions and audits.
- For math and physics calculations, format formulas using standard LaTeX ($...$ for inline, $$...$$ for display math) for KaTeX rendering.
- Ensure every logical deduction is clear, precise, and verified.
- Use clean markdown headers, tables, and bullet points.`;
        break;

      case "code":
        modeInstruction = `MODE DIRECTIVE (Code Architecture & Engineering):
- Provide clean, production-ready, typed code with zero placeholders or omissions.
- Always specify the language identifier in triple backtick code blocks (e.g., \`\`\`typescript, \`\`\`python).
- Focus on time/space complexity, edge-case resilience, security, and performance.
- Keep prose explanations minimal and let clean code lead.`;
        break;

      case "search":
        modeInstruction = `MODE DIRECTIVE (Live Search & Grounded Web Intelligence):
- Synthesize real-time live data, facts, and website details directly from the provided live web context.
- Present fresh, accurate information with crisp analysis.`;
        break;

      case "creative":
        modeInstruction = `MODE DIRECTIVE (Creative Intelligence):
Express ideas vividly with elegant phrasing while remaining accurate, insightful, and deeply engaging.`;
        break;

      case "general":
      default:
        modeInstruction = `MODE DIRECTIVE (General Intelligence):
Provide clear, accurate, conversational, and direct answers without repetitive filler phrases.`;
        break;
    }
  }

  const promptBlocks = [CORE_DIRECTIVE, modeInstruction];

  if (tenantPrompt) {
    promptBlocks.unshift(tenantPrompt);
  }

  // Inject Executive Conversation Summary if available
  if (conversationSummary && typeof conversationSummary === "string" && conversationSummary.trim()) {
    promptBlocks.push(`EXECUTIVE CONVERSATION SUMMARY & ESTABLISHED CONTEXT:\n${conversationSummary.trim()}`);
  }

  // Inject Live Web Grounding Context if available
  if (liveWebContext && typeof liveWebContext === "string" && liveWebContext.trim()) {
    promptBlocks.push(liveWebContext.trim());
  }

  // Inject User Personalization & Long-Term Memories
  const personalBlocks = [];
  if (customInstructions && typeof customInstructions === "string" && customInstructions.trim()) {
    personalBlocks.push(`USER'S CUSTOM RESPONSE PREFERENCES:\n${customInstructions.trim()}`);
  }
  if (Array.isArray(userMemories) && userMemories.length > 0) {
    const memoryLines = userMemories.map((m, idx) => `${idx + 1}. ${typeof m === "string" ? m : m.text}`);
    personalBlocks.push(`USER'S REMEMBERED FACTS & CONTEXT (LONG-TERM MEMORY):\n${memoryLines.join("\n")}`);
  }

  if (personalBlocks.length > 0) {
    promptBlocks.push(personalBlocks.join("\n\n"));
  }

  return promptBlocks.join("\n\n");
}

module.exports = {
  analyzePromptNuance,
  detectIntent,
  buildSystemPrompt,
};
