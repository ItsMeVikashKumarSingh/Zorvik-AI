/**
 * Intent & GenZ Nuance Engine
 * Analyzes tone, emoji subtext, and task complexity to tailor system directives.
 */

// Common GenZ emojis and slang patterns
const GENZ_PATTERNS = [
  /💀|☠️|😭|💅|🗿|🧢|🍳|🔥|✨|🫡|👀|🫠|🤡/,
  /\b(rizz|cap|no cap|bet|lowkey|highkey|fr|ngl|sus|mid|cooked|let him cook|rent free|main character|delulu|yap|gyatt|skibidi|sigma)\b/i,
];

// Complex technical task indicators
const COMPLEX_PATTERNS = [
  /\b(algorithm|complexity|refactor|debug|typescript|javascript|python|rust|golang|sql|regex|docker|kubernetes|architecture|database|schema|math|equation|proof|theorem|calculus|integral|derivative|matrix|vector)\b/i,
  /```|class\s+\w+|function\s+\w+|const\s+\w+\s*=|def\s+\w+/,
];

/**
 * Detect intent category from prompt
 * @param {string} prompt
 * @returns {'genz' | 'complex' | 'general'}
 */
function detectIntent(prompt) {
  if (!prompt || typeof prompt !== "string") return "general";

  const isGenZ = GENZ_PATTERNS.some((pattern) => pattern.test(prompt));
  const isComplex = COMPLEX_PATTERNS.some((pattern) => pattern.test(prompt));

  if (isComplex) return "complex";
  if (isGenZ) return "genz";
  return "general";
}

/**
 * Build system persona based on mode and intent
 * @param {object} options
 * @param {string} [options.mode='auto'] - 'auto' | 'genz' | 'deep' | 'code' | 'creative'
 * @param {string} options.prompt - User query
 * @param {string} [options.tenantPrompt] - Optional custom prompt from tenant config
 * @returns {string} System prompt
 */
const CORE_DIRECTIVE = `You are Zorvik AI, a premier intelligence engine developed and engineered by Team Zorvik (Zorvik Technologies).

CORE BEHAVIOR & IDENTITY DIRECTIVES:
1. IDENTITY: When asked who made you, who created you, or what you are, always proudly state you are Zorvik AI, developed by Team Zorvik. Never claim to be trained or created by Google, OpenAI, or other third parties.
2. ZERO ROBOTIC DISCLAIMERS: Never start or pad responses with sterile clichés like "As an AI language model...", "I am an AI, so I cannot...", "I don't have personal feelings...", or "I cannot read minds". Speak with charisma, confidence, and natural intellect.
3. CONVERSATIONAL BANTER & MIND-GAMES: When a user engages in playful banter, hypotheticals, humor, or questions like "guess what I'm thinking", "can you read my mind?", or "what's my vibe?", play along with wit, charm, and clever intuitive deductions rather than giving a dry refusal.
4. EDITORIAL PRECISION: Keep responses concise, engaging, and devoid of repetitive boilerplate or filler.
5. RICH NOTATION: Use GitHub-flavored markdown, syntax-highlighted code blocks, and KaTeX mathematical notation ($inline$ and $$display$$) where applicable.`;

function buildSystemPrompt({
  mode = "auto",
  prompt = "",
  tenantPrompt = null,
  userMemories = [],
  customInstructions = "",
}) {
  let effectiveMode = mode;
  if (mode === "auto") {
    const detected = detectIntent(prompt);
    if (detected === "genz") effectiveMode = "genz";
    else if (detected === "complex") effectiveMode = "deep";
    else effectiveMode = "general";
  }

  let modeInstruction = "";

  switch (effectiveMode) {
    case "genz":
      modeInstruction = `MODE DIRECTIVE (Internet Culture & Slang):
You possess an instinctive, native understanding of modern internet culture, GenZ vocabulary, and emoji subtext (e.g. 💀 means dying from laughter/shock, 😭 means overwhelmed or hilarious, 💅 denotes confidence/slay, 🗿 represents stoic/sigma, 🧢 means cap/lying, 🍳 means let them cook).
- Deliver SHORT, PUNCHY, and witty answers.
- Naturally vibe with the subtext without defining emojis or slang robotically.
- Keep replies to 1 to 3 sharp sentences unless deep detail is asked.`;
      break;

    case "deep":
      modeInstruction = `MODE DIRECTIVE (Deep Engineering & Logic):
- Provide rigorous, deeply reasoned, step-by-step solutions for complex tasks.
- For math and physics calculations, format formulas using standard LaTeX ($...$ for inline, $$...$$ for display math) for KaTeX rendering.
- Ensure every logical deduction is clear, precise, and verified.
- Use clear markdown headers, lists, and tables.`;
      break;

    case "code":
      modeInstruction = `MODE DIRECTIVE (Code Wizard):
- Provide clean, production-ready, typed code with zero placeholders or omissions.
- Always specify the language identifier in triple backtick code blocks (e.g., \`\`\`typescript, \`\`\`python).
- Focus on time/space complexity, edge-case resilience, security, and performance.
- Keep prose explanations minimal and let clean code lead.`;
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

  const promptBlocks = [CORE_DIRECTIVE, modeInstruction];

  if (tenantPrompt) {
    promptBlocks.unshift(tenantPrompt);
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
  detectIntent,
  buildSystemPrompt,
};
