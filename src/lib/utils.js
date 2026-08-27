/**
 * Zorvik AI Utilities
 */
const crypto = require("crypto");

/**
 * Estimate token count using average ~4 characters per token heuristic
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Generate a cryptographically secure UUID
 * @returns {string}
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Sanitize text to remove dangerous script injection / XSS payloads
 * @param {string} text
 * @returns {string}
 */
function sanitizeInput(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim();
}

/**
 * Hash IP address for privacy-safe telemetry
 * @param {string} ip
 * @returns {string}
 */
function hashIP(ip) {
  if (!ip) return "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
}

module.exports = {
  estimateTokens,
  generateUUID,
  sanitizeInput,
  hashIP,
};
