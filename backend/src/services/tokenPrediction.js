/**
 * Next-Word & Phrase Autocomplete Service
 * Provides sub-5ms contextual completions for real-time Tab-completion.
 */

// Common completions for programming, greetings, and queries
const COMPLETION_DICTIONARY = [
  "how to build a react application with tailwind css",
  "how to implement authentication with supabase",
  "what is the difference between redis and postgresql",
  "write a typescript interface for user profile",
  "write a python script to parse json files",
  "explain time complexity of merge sort vs quick sort",
  "optimize this database query with indexes",
  "what does this error mean in javascript",
  "bro really said that with a straight face 💀",
  "nah that is actually crazy fr 😭",
  "let him cook right now 🍳",
  "can you explain how pgvector works in postgres",
  "create a dockerfile for nodejs express server",
  "what are the best architectural patterns for microservices",
  "generate a unit test suite using vitest",
];

/**
 * Predict next words/phrase based on current input prompt
 * @param {string} prompt
 * @returns {string[]}
 */
function predictNextWords(prompt) {
  if (!prompt || typeof prompt !== "string") return [];

  const cleanPrompt = prompt.toLowerCase().trim();
  if (cleanPrompt.length < 2) return [];

  const matched = COMPLETION_DICTIONARY.filter((phrase) =>
    phrase.startsWith(cleanPrompt) && phrase !== cleanPrompt
  );

  if (matched.length > 0) {
    // Return the continuation words
    const continuation = matched[0].slice(cleanPrompt.length).trim();
    return continuation.split(/\s+/).slice(0, 5);
  }

  // Word-level heuristics
  const tokens = cleanPrompt.split(/\s+/);
  const lastWord = tokens[tokens.length - 1];

  const wordHeuristics = {
    how: ["to", "do", "does", "can"],
    what: ["is", "are", "causes", "happened"],
    why: ["is", "does", "did", "would"],
    write: ["a", "clean", "function", "unit"],
    create: ["a", "new", "database", "component"],
    explain: ["how", "the", "concept", "difference"],
    debug: ["this", "error", "code", "issue"],
  };

  if (wordHeuristics[lastWord]) {
    return wordHeuristics[lastWord].slice(0, 3);
  }

  return [];
}

module.exports = {
  predictNextWords,
  COMPLETION_DICTIONARY,
};
