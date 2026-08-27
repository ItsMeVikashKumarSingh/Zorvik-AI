/**
 * Zero-Cost Multi-Model Routing Engine with Circuit Breaker
 * Cascades: Google Gemini (Primary) -> Groq Cloud (Fallback 1) -> OpenRouter Free (Fallback 2).
 */
const { circuitBreaker } = require("./circuitBreaker");

/**
 * Call Google Gemini API (Free Tier)
 */
async function callGemini({ systemPrompt, history, prompt, apiKey, model = "gemini-2.0-flash" }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [];
  // Add conversation history
  if (history && history.length > 0) {
    for (const turn of history) {
      contents.push({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.content }],
      });
    }
  }
  // Add latest prompt
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

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

  const messages = [{ role: "system", content: systemPrompt }];
  if (history && history.length > 0) {
    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content });
    }
  }
  messages.push({ role: "user", content: prompt });

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
 * Call OpenRouter Free Models (Fallback 2)
 */
async function callOpenRouter({ systemPrompt, history, prompt, apiKey, model = "deepseek/deepseek-r1:free" }) {
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const messages = [{ role: "system", content: systemPrompt }];
  if (history && history.length > 0) {
    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content });
    }
  }
  messages.push({ role: "user", content: prompt });

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

  return `Zorvik AI Intelligence Engine: Received "${prompt}". Your inquiry is being processed through the Zorvik multi-model system.`;
}

/**
 * Main Cascade Router
 * Tries Gemini -> Groq -> OpenRouter -> Local Fallback
 */
async function routeQuery({ systemPrompt, history = [], prompt, mode = "auto" }) {
  const startTime = Date.now();
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // 1. Try Gemini (Primary)
  if (geminiKey && circuitBreaker.isAvailable("gemini")) {
    try {
      const result = await callGemini({
        systemPrompt,
        history,
        prompt,
        apiKey: geminiKey,
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
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

  // 2. Try Groq (Fallback 1)
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
      console.warn("[Router] Groq failed, failing over to OpenRouter:", err.message);
      circuitBreaker.recordFailure("groq", err.statusCode || 500);
    }
  }

  // 3. Try OpenRouter (Fallback 2)
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

  // 4. Local Intelligent Fallback
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
  callOpenRouter,
  localIntelligentFallback,
};
