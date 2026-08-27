/**
 * Security Shield Middleware
 * Provides input validation, prompt injection defense, and sanitization.
 */
const { sanitizeInput } = require("../lib/utils");

// Known prompt injection / jailbreak trigger signatures
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+instructions/i,
  /you\s+are\s+now\s+in\s+dan\s+mode/i,
  /system\s+override\s+code/i,
];

function securityShield(req, res, next) {
  if (req.body && typeof req.body.prompt === "string") {
    const original = req.body.prompt;
    req.body.prompt = sanitizeInput(original);

    // Check for prompt injection
    const hasInjection = INJECTION_PATTERNS.some((pattern) => pattern.test(original));
    if (hasInjection) {
      return res.status(400).json({
        error: "Security Violation",
        message: "Prompt contains restricted system manipulation sequences.",
      });
    }
  }

  next();
}

module.exports = { securityShield };
