/**
 * Autonomous Neural Memory & Adaptive Tone Extractor
 * Inspects conversation turns asynchronously to capture long-term facts,
 * project preferences, and user tone calibration.
 */
const { getUserMemories, addUserMemory, getUserProfileConfig, saveUserProfileConfig } = require("./memoryEngine");

// Heuristic patterns for explicit user personal facts & preferences
const FACT_PATTERNS = [
  // Explicit memory instructions
  /(?:remember (?:that|this)?|please remember|store in memory:?)\s+([^\n.!?]{4,100})/i,
  // Name & Identity
  /(?:my name is|call me|myself)\s+([A-Za-z0-9_\s]{2,30})/i,
  // Role & Occupation
  /(?:i work as|i am a|i'm a|my role is)\s+([a-z0-9_\-\s]{3,50}(?:developer|engineer|designer|founder|ceo|cto|student|researcher|architect|manager|writer|creator|consultant|analyst))/i,
  // Tech stack & Project details
  /(?:i am (?:building|developing|working on|creating)|my project is|our project is)\s+([^\n.!?]{4,90})/i,
  /(?:i use|i'm using|we use|our stack is|my stack is|tech stack is)\s+([^\n.!?]{3,90})/i,
  // Preferences
  /(?:i prefer|always (?:give|use|write|format|reply with)|never (?:use|give|do)|keep answers)\s+([^\n.!?]{4,90})/i,
  // Company / Organization / Location
  /(?:my company is|i work at|working at|my startup is|my agency is|i run)\s+([^\n.!?]{3,60})/i,
  /(?:i live in|i am based in|i'm from|located in)\s+([A-Za-z\s,]{2,40})/i,
];

/**
 * Detect conversational tone style from prompt
 * @param {string} prompt
 * @returns {'genz' | 'deep' | 'concise' | 'creative' | 'auto'}
 */
function inferUserTone(prompt) {
  if (!prompt || typeof prompt !== "string") return "auto";
  const lower = prompt.toLowerCase();

  // GenZ internet slang
  if (/💀|😭|💅|🗿|🧢|🍳|rizz|cap|bet|lowkey|fr|ngl|cooked|delulu|yap/.test(prompt)) {
    return "genz";
  }

  // Deep engineering / algorithmic / math
  if (
    /(?:algorithm|complexity|architecture|refactor|benchmark|proof|theorem|calculus|database schema|concurrency|multithreading)/i.test(
      lower
    ) ||
    prompt.includes("```")
  ) {
    return "deep";
  }

  // Explicit conciseness
  if (/(?:tldr|brief|short|concise|bullet points only|in one line|quick summary)/i.test(lower)) {
    return "concise";
  }

  // Creative / narrative
  if (/(?:poem|story|creative|imagine|metaphor|narrative|fantasy|fiction)/i.test(lower)) {
    return "creative";
  }

  return "auto";
}

/**
 * Extract memorable facts from user prompt and assistant response
 * @param {string} prompt
 * @param {string} _response
 * @returns {string[]} List of extracted fact strings
 */
function extractFactsFromTurn(prompt, _response) {
  if (!prompt || typeof prompt !== "string" || prompt.length < 5) return [];
  const facts = [];

  for (const pattern of FACT_PATTERNS) {
    const match = prompt.match(pattern);
    if (match && match[0]) {
      const cleanFact = match[0].trim().replace(/\s+/g, " ");
      if (cleanFact.length >= 6 && cleanFact.length <= 120) {
        facts.push(cleanFact);
      }
    }
  }

  return facts;
}

/**
 * Asynchronously process conversation turn to update user memories and tone
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.prompt
 * @param {string} params.response
 */
async function processTurnMemoryAndTone({ userId, prompt, response }) {
  if (!userId || !prompt) return;

  try {
    // 1. Extract potential facts
    const newFacts = extractFactsFromTurn(prompt, response);
    if (newFacts.length > 0) {
      const existingMemories = await getUserMemories(userId);
      const existingTexts = existingMemories.map((m) =>
        (typeof m === "string" ? m : m.text || "").toLowerCase()
      );

      for (const fact of newFacts) {
        const lowerFact = fact.toLowerCase();
        // Check for duplicates
        const isDuplicate = existingTexts.some(
          (t) => t.includes(lowerFact) || lowerFact.includes(t)
        );
        if (!isDuplicate) {
          await addUserMemory(userId, fact);
        }
      }
    }

    // 2. Calibrate Tone preference if a distinct style is sustained
    const inferredTone = inferUserTone(prompt);
    if (inferredTone !== "auto") {
      const currentConfig = await getUserProfileConfig(userId);
      if (currentConfig.tone === "auto") {
        await saveUserProfileConfig(userId, {
          customInstructions: currentConfig.customInstructions,
          tone: inferredTone,
        });
      }
    }
  } catch (err) {
    console.warn("[AutoMemory] Memory extraction notice:", err.message);
  }
}

module.exports = {
  inferUserTone,
  extractFactsFromTurn,
  processTurnMemoryAndTone,
};
