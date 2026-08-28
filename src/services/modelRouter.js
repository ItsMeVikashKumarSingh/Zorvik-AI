/**
 * Zero-Cost Multi-Model Routing Engine with Circuit Breaker
 * Cascades: Google Gemini (Primary) -> Groq Cloud (Fallback 1) -> OpenRouter Free (Fallback 2).
 */
const { circuitBreaker } = require("./circuitBreaker");

/**
 * Helper to sanitize and format conversation history for Google Gemini API
 * (Enforces strictly alternating user/model turns starting with user)
 */
function formatGeminiContents(history, prompt) {
  const rawTurns = [];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn && turn.content && typeof turn.content === "string" && turn.content.trim()) {
        const role = turn.role === "assistant" || turn.role === "model" ? "model" : "user";
        rawTurns.push({ role, text: turn.content.trim() });
      }
    }
  }
  rawTurns.push({ role: "user", text: prompt.trim() });

  const formatted = [];
  for (const item of rawTurns) {
    if (formatted.length === 0) {
      if (item.role === "user") {
        formatted.push({ role: "user", parts: [{ text: item.text }] });
      }
    } else {
      const prev = formatted[formatted.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += `\n${item.text}`;
      } else {
        formatted.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  if (formatted.length === 0) {
    formatted.push({ role: "user", parts: [{ text: prompt }] });
  }

  return formatted;
}

/**
 * Helper to sanitize and format conversation history for OpenAI-compatible providers
 */
function formatOpenAIMessages(systemPrompt, history, prompt) {
  const messages = [{ role: "system", content: systemPrompt }];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn && turn.content && typeof turn.content === "string" && turn.content.trim()) {
        messages.push({
          role: turn.role === "assistant" || turn.role === "model" ? "assistant" : "user",
          content: turn.content.trim(),
        });
      }
    }
  }
  messages.push({ role: "user", content: prompt.trim() });
  return messages;
}

/**
 * Call Google Gemini API (Free Tier)
 */
async function callGemini({ systemPrompt, history, prompt, apiKey, model = "gemini-2.5-flash" }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = formatGeminiContents(history, prompt);

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Gemini API Error (${response.status}): ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return {
    text,
    model: `gemini-${model}`,
    provider: "google",
  };
}

/**
 * Call Groq Cloud API (Free Tier - 500+ tok/s)
 */
async function callGroq({ systemPrompt, history, prompt, apiKey, model = "openai/gpt-oss-120b" }) {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const messages = formatOpenAIMessages(systemPrompt, history, prompt);

  const payload = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Groq API Error (${response.status}): ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    model: `groq-${model}`,
    provider: "groq",
  };
}

/**
 * Call Cerebras Cloud API (Ultra-fast LPU - 2,000+ tok/s, 1M free tokens/day)
 */
async function callCerebras({ systemPrompt, history, prompt, apiKey, model = "llama-3.3-70b" }) {
  const url = "https://api.cerebras.ai/v1/chat/completions";

  const messages = formatOpenAIMessages(systemPrompt, history, prompt);

  const payload = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Cerebras API Error (${response.status}): ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    model: `cerebras-${model}`,
    provider: "cerebras",
  };
}

/**
 * Call Mistral AI / Codestral API (High Reasoning & Code Generation)
 */
async function callMistral({ systemPrompt, history, prompt, apiKey, model = "mistral-small-latest" }) {
  const url = "https://api.mistral.ai/v1/chat/completions";

  const messages = formatOpenAIMessages(systemPrompt, history, prompt);

  const payload = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Mistral API Error (${response.status}): ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    model: `mistral-${model}`,
    provider: "mistral",
  };
}

/**
 * Call OpenRouter Free Models (Fallback)
 */
async function callOpenRouter({ systemPrompt, history, prompt, apiKey, model = "deepseek/deepseek-r1:free" }) {
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const messages = formatOpenAIMessages(systemPrompt, history, prompt);

  const payload = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://zorvik.tech",
      "X-Title": "Zorvik AI",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    model: `openrouter-${model}`,
    provider: "openrouter",
  };
}

/**
 * Intelligent Local Fallback
 * Provides instant high-quality response when external keys are unavailable
 */
function localIntelligentFallback(prompt, mode = "auto") {
  const isEmojiOrGenZ = /💀|😭|💅|🗿|🧢|rizz|cap|bet|lowkey|fr|ngl/i.test(prompt);

  if (isEmojiOrGenZ || mode === "genz") {
    if (/💀/.test(prompt)) {
      return "Bro is absolutely deceased. No way that actually just happened fr. 💀";
    }
    if (/😭/.test(prompt)) {
      return "I can't even handle this right now, that's wildly out of pocket 😭";
    }
    if (/💅/.test(prompt)) {
      return "Period. Zero competition, as always. 💅✨";
    }
    if (/🗿/.test(prompt)) {
      return "Absolute sigma energy. Undisputed. 🗿";
    }
    return "No cap, you already know the vibe. 100% facts fr.";
  }

  return `I am Zorvik AI, developed and engineered by Team Zorvik. How can I assist you with your project today?`;
}

/**
 * Main Cascade Router
 * Priority: Mode-Specific Optimization -> Gemini (Primary) -> Groq (Fallback 1) -> Cerebras (Fallback 2) -> Mistral (Fallback 3) -> OpenRouter -> Local
 */
async function routeQuery({ systemPrompt, history = [], prompt, mode = "auto" }) {
  const startTime = Date.now();
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // Mode Specialization: Prioritize Codestral/Mistral for specialized code & deep logic
  if ((mode === "code" || mode === "deep") && mistralKey && circuitBreaker.isAvailable("mistral")) {
    try {
      const mistralModel = process.env.MISTRAL_MODEL || (mode === "code" ? "codestral-latest" : "mistral-small-latest");
      const result = await callMistral({
        systemPrompt,
        history,
        prompt,
        apiKey: mistralKey,
        model: mistralModel,
      });
      circuitBreaker.recordSuccess("mistral");
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn("[Router] Mistral code prioritization failed, continuing cascade:", err.message);
      circuitBreaker.recordFailure("mistral", err.statusCode || 500);
    }
  }

  // 1. Try Gemini (Primary Engine)
  if (geminiKey && circuitBreaker.isAvailable("gemini")) {
    try {
      const result = await callGemini({
        systemPrompt,
        history,
        prompt,
        apiKey: geminiKey,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      });
      circuitBreaker.recordSuccess("gemini");
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn("[Router] Gemini failed, failing over to Groq:", err.message);
      circuitBreaker.recordFailure("gemini", err.statusCode || 500);
    }
  }

  // 2. Try Groq (Fallback 1 - High Speed LPU)
  if (groqKey && circuitBreaker.isAvailable("groq")) {
    try {
      const result = await callGroq({
        systemPrompt,
        history,
        prompt,
        apiKey: groqKey,
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      });
      circuitBreaker.recordSuccess("groq");
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn("[Router] Groq failed, failing over to Cerebras:", err.message);
      circuitBreaker.recordFailure("groq", err.statusCode || 500);
    }
  }

  // 3. Try Cerebras (Fallback 2 - 2,000+ tok/s Ultra-High-Speed LPU)
  if (cerebrasKey && circuitBreaker.isAvailable("cerebras")) {
    try {
      const result = await callCerebras({
        systemPrompt,
        history,
        prompt,
        apiKey: cerebrasKey,
        model: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
      });
      circuitBreaker.recordSuccess("cerebras");
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn("[Router] Cerebras failed, failing over to Mistral:", err.message);
      circuitBreaker.recordFailure("cerebras", err.statusCode || 500);
    }
  }

  // 4. Try Mistral / Codestral (Fallback 3 - Deep Reasoning & Code)
  if (mistralKey && circuitBreaker.isAvailable("mistral")) {
    try {
      const result = await callMistral({
        systemPrompt,
        history,
        prompt,
        apiKey: mistralKey,
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      });
      circuitBreaker.recordSuccess("mistral");
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn("[Router] Mistral failed, failing over to OpenRouter:", err.message);
      circuitBreaker.recordFailure("mistral", err.statusCode || 500);
    }
  }

  // 5. Try OpenRouter (Fallback 4)
  if (openRouterKey && circuitBreaker.isAvailable("openrouter")) {
    try {
      const result = await callOpenRouter({
        systemPrompt,
        history,
        prompt,
        apiKey: openRouterKey,
      });
      circuitBreaker.recordSuccess("openrouter");
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn("[Router] OpenRouter failed, using local fallback:", err.message);
      circuitBreaker.recordFailure("openrouter", err.statusCode || 500);
    }
  }

  // 6. Local Intelligent Fallback
  return {
    text: localIntelligentFallback(prompt, mode),
    model: "zorvik-local-engine",
    provider: "local",
    latencyMs: Date.now() - startTime,
  };
}

module.exports = {
  routeQuery,
  callGemini,
  callGroq,
  callCerebras,
  callMistral,
  callOpenRouter,
  localIntelligentFallback,
};
