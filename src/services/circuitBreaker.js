/**
 * Provider Circuit Breaker
 * Tracks rate-limits and failures across zero-cost providers with automatic recovery.
 */

class CircuitBreaker {
  constructor() {
    this.providers = {
      gemini: {
        name: "Google Gemini Free",
        status: "CLOSED", // CLOSED (Healthy), OPEN (Tripped), HALF-OPEN
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000, // 60s cooldown on 429 rate limits
      },
      groq: {
        name: "Groq Cloud Free",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
      cerebras: {
        name: "Cerebras Cloud LPU",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
      mistral: {
        name: "Mistral & Codestral AI",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
      openrouter: {
        name: "OpenRouter Free",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
      kilo: {
        name: "Kilo Gateway Free",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
      opencode: {
        name: "OpenCode Zen Free",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
      cline: {
        name: "Cline Free Core",
        status: "CLOSED",
        failureCount: 0,
        lastFailure: null,
        cooldownMs: 60000,
      },
    };
  }

  isAvailable(providerKey) {
    const provider = this.providers[providerKey];
    if (!provider) return false;

    if (provider.status === "CLOSED") return true;

    // Check if cooldown period elapsed
    if (provider.lastFailure && Date.now() - provider.lastFailure > provider.cooldownMs) {
      provider.status = "HALF-OPEN";
      return true;
    }

    return false;
  }

  recordSuccess(providerKey) {
    const provider = this.providers[providerKey];
    if (!provider) return;
    provider.status = "CLOSED";
    provider.failureCount = 0;
    provider.lastFailure = null;
  }

  recordFailure(providerKey, statusCode = 500) {
    const provider = this.providers[providerKey];
    if (!provider) return;

    provider.failureCount += 1;
    provider.lastFailure = Date.now();

    // If rate-limited (429) or repeated failures, trip circuit immediately
    if (statusCode === 429 || provider.failureCount >= 2) {
      provider.status = "OPEN";
      console.warn(
        `[CircuitBreaker] Tripped circuit for ${provider.name} (Code: ${statusCode}). Entering 60s cooldown.`
      );
    }
  }

  getStatus() {
    const report = {};
    for (const [key, val] of Object.entries(this.providers)) {
      report[key] = {
        name: val.name,
        status: val.status,
        failures: val.failureCount,
        available: this.isAvailable(key),
      };
    }
    return report;
  }
}

const circuitBreaker = new CircuitBreaker();

module.exports = { circuitBreaker };
