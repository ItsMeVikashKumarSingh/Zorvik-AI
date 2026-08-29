/**
 * Security Shield Middleware
 * Provides input validation, prompt injection defense, sanitization,
 * and sliding-window IP rate limiting via Upstash Redis.
 */
const { sanitizeInput } = require("../lib/utils");
const { redis } = require("../lib/redis");

// Known prompt injection / jailbreak trigger signatures
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+instructions/i,
  /you\s+are\s+now\s+in\s+dan\s+mode/i,
  /system\s+override\s+code/i,
  /reveal\s+(your\s+)?(full\s+)?system\s+prompt/i,
];

const GUEST_RATE_LIMIT_PER_MINUTE = 60;

/**
 * Sliding-window rate limiter per client IP
 */
async function checkIpRateLimit(ip) {
  if (!ip) return true;
  const key = `zorvik:ratelimit:ip:${ip.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      // First hit in this window: expire after 60 seconds
      await redis.expire(key, 60);
    }
    return current <= GUEST_RATE_LIMIT_PER_MINUTE;
  } catch (_e) {
    // Fail open if Redis transiently unavailable
    return true;
  }
}

async function securityShield(req, res, next) {
  // 1. IP-based Rate Limiting for public endpoints (skip if validated tenant with custom limits)
  if (!req.tenant || req.tenant.id === "public-guest") {
    const clientIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const allowed = await checkIpRateLimit(clientIp);
    if (!allowed) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please wait 60 seconds before making further queries.",
      });
    }
  }

  // 2. Input Sanitization & Prompt Injection Defense
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

module.exports = { securityShield, checkIpRateLimit };
