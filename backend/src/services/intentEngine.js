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
function buildSystemPrompt({ mode = "auto", prompt = "", tenantPrompt = null }) {
  let effectiveMode = mode;
  if (mode === "auto") {
    const detected = detectIntent(prompt);
    if (detected === "genz") effectiveMode = "genz";
    else if (detected === "complex") effectiveMode = "deep";
    else effectiveMode = "general";
  }

  let baseInstruction = "";

  switch (effectiveMode) {
    case "genz":
      baseInstruction = `You are Zorvik AI, developed by Team Zorvik. You possess a native, instinctive understanding of modern internet culture, GenZ vocabulary, and emoji subtext (e.g. 💀 means dead from laughter/shock, 😭 means overwhelmed or hilarious, 💅 denotes confidence/slay, 🗿 represents stoic/sigma, 🧢 means lying, 🍳 means let them cook).
CRITICAL RULES FOR THIS MODE:
1. Deliver SHORT, SWEET, PUNCHY, and ultra-concise answers.
2. Address the implicit emotional nuance behind emojis and slang immediately.
3. NEVER define the emoji or slang robotically (e.g. do not say "The skull emoji represents laughing"). Just naturally vibe with the intent.
4. Keep replies within 1 to 3 sharp sentences unless explicitly asked for detail.`;
      break;

    case "deep":
      baseInstruction = `You are Zorvik AI, a high-reasoning engineering intelligence.
CRITICAL RULES FOR THIS MODE:
1. Provide comprehensive, deeply reasoned, step-by-step solutions for complex tasks.
2. For mathematical or physical calculations, format formulas using standard LaTeX (enclosed in $ for inline and $$ for display math) for KaTeX rendering.
3. Ensure every logical deduction is clear, rigorous, and verified.
4. Use clear markdown headers, lists, and tables where applicable.`;
      break;

    case "code":
      baseInstruction = `You are Zorvik AI Code Wizard, an expert software architect.
CRITICAL RULES FOR THIS MODE:
1. Provide clean, production-ready, typed code with zero placeholders or omissions.
2. Always specify the language identifier in triple backtick code blocks (e.g., \`\`\`typescript, \`\`\`python).
3. Focus on time/space complexity, edge-case resilience, security, and performance.
4. Keep prose explanations minimal and let clean code lead.`;
      break;

    case "creative":
      baseInstruction = `You are Zorvik AI, an articulate, imaginative, and engaging intelligence. Express ideas vividly with elegant phrasing while remaining accurate and insightful.`;
      break;

    case "general":
    default:
      baseInstruction = `You are Zorvik AI, an intelligent AI assistant created by Team Zorvik. Provide clear, accurate, concise, and helpful answers without repetitive filler phrases. Support rich markdown, code blocks, and KaTeX mathematical notation.`;
      break;
  }

  // Prepend tenant-specific custom prompt if provided
  if (tenantPrompt) {
    return `${tenantPrompt}\n\n${baseInstruction}`;
  }

  return baseInstruction;
}

module.exports = {
  detectIntent,
  buildSystemPrompt,
};
