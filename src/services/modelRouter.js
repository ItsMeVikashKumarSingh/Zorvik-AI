/**
 * Zero-Cost Multi-Model Routing Engine with Circuit Breaker, True SSE Streaming & Google Search Grounding
 * Cascades: Google Gemini (Primary with Search Grounding & Vision) -> Groq Cloud (Fallback 1) -> Cerebras (Fallback 2) -> Mistral (Fallback 3) -> OpenRouter -> Local
 */
const { circuitBreaker } = require("./circuitBreaker");

/**
 * Helper to sanitize and format conversation history for Google Gemini API
 * Supports multi-modal attachments (base64 images / documents)
 */
function formatGeminiContents(history, prompt, files = []) {
  const rawTurns = [];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn && turn.content && typeof turn.content === "string" && turn.content.trim()) {
        const role = turn.role === "assistant" || turn.role === "model" ? "model" : "user";
        rawTurns.push({ role, parts: [{ text: turn.content.trim() }] });
      }
    }
  }

  // Build current user turn with optional file attachments
  const userParts = [];
  if (Array.isArray(files) && files.length > 0) {
    for (const file of files) {
      if (file.base64 && file.mimeType) {
        userParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64,
          },
        });
      }
    }
  }
  userParts.push({ text: prompt.trim() });
  rawTurns.push({ role: "user", parts: userParts });

  const formatted = [];
  for (const item of rawTurns) {
    if (formatted.length === 0) {
      if (item.role === "user") {
        formatted.push(item);
      }
    } else {
      const prev = formatted[formatted.length - 1];
      if (prev.role === item.role) {
        prev.parts.push(...item.parts);
      } else {
        formatted.push(item);
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
 * Extract clean domain name from URL
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

/**
 * Call Google Gemini with True SSE Streaming & optional Google Search Grounding
 */
async function streamGemini({
  systemPrompt,
  history,
  prompt,
  files = [],
  apiKey,
  model = "gemini-2.5-flash",
  searchGrounding = false,
  onChunk,
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents = formatGeminiContents(history, prompt, files);

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3072,
    },
  };

  // Attach Google Search Grounding if requested
  if (searchGrounding) {
    payload.tools = [{ googleSearch: {} }];
  }

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

  if (!response.body) {
    throw new Error("Gemini stream response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";
  const sources = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, "");
      if (jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const candidate = parsed.candidates?.[0];
        const textChunk = candidate?.content?.parts?.[0]?.text;
        if (textChunk) {
          fullText += textChunk;
          if (onChunk) onChunk(textChunk);
        }

        // Extract Google Search Grounding Sources
        const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks)) {
          for (const chunk of groundingChunks) {
            const web = chunk.web;
            if (web && web.uri) {
              const exists = sources.some((s) => s.url === web.uri);
              if (!exists) {
                sources.push({
                  id: `src_${sources.length + 1}`,
                  title: web.title || extractDomain(web.uri),
                  url: web.uri,
                  domain: extractDomain(web.uri),
                });
              }
            }
          }
        }
      } catch (_parseErr) {
        // Continue buffering if split JSON chunk
      }
    }
  }

  return {
    text: fullText,
    model: `gemini-${model}`,
    provider: "google",
    sources,
  };
}

/**
 * Stream OpenAI-compatible providers (Groq, Cerebras, Mistral, OpenRouter)
 */
async function streamOpenAICompatible({
  url,
  headers,
  model,
  provider,
  systemPrompt,
  history,
  prompt,
  onChunk,
}) {
  const messages = formatOpenAIMessages(systemPrompt, history, prompt);

  const payload = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2500,
    stream: true,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`${provider} API Error (${response.status}): ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  if (!response.body) {
    throw new Error(`${provider} stream response body is null`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, "");
      if (jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const textChunk = parsed.choices?.[0]?.delta?.content;
        if (textChunk) {
          fullText += textChunk;
          if (onChunk) onChunk(textChunk);
        }
      } catch (_parseErr) {
        // Continue buffering if split JSON chunk
      }
    }
  }

  return {
    text: fullText,
    model: `${provider}-${model}`,
    provider,
    sources: [],
  };
}

/**
 * Intelligent Local Fallback
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
 * Main Cascade Stream Router
 */
async function routeQueryStream({
  systemPrompt,
  history = [],
  prompt,
  mode = "auto",
  files = [],
  onChunk,
}) {
  const startTime = Date.now();
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const isSearchRequested =
    mode === "search" ||
    /\b(latest|current|recent|news|today|price of|score|weather|who won|release date)\b/i.test(prompt);

  // 1. Try Gemini (Primary Engine - with Native Google Search Grounding and Vision)
  if (geminiKey && circuitBreaker.isAvailable("gemini")) {
    try {
      const result = await streamGemini({
        systemPrompt,
        history,
        prompt,
        files,
        apiKey: geminiKey,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        searchGrounding: isSearchRequested,
        onChunk,
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

  // 2. Mode Specialization: Prioritize Codestral/Mistral for code mode
  if ((mode === "code" || mode === "deep") && mistralKey && circuitBreaker.isAvailable("mistral")) {
    try {
      const mistralModel =
        process.env.MISTRAL_MODEL || (mode === "code" ? "codestral-latest" : "mistral-small-latest");
      const result = await streamOpenAICompatible({
        url: "https://api.mistral.ai/v1/chat/completions",
        headers: { Authorization: `Bearer ${mistralKey}` },
        model: mistralModel,
        provider: "mistral",
        systemPrompt,
        history,
        prompt,
        onChunk,
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

  // 3. Try Groq (Fallback 1 - High Speed LPU)
  if (groqKey && circuitBreaker.isAvailable("groq")) {
    try {
      const result = await streamOpenAICompatible({
        url: "https://api.groq.com/openai/v1/chat/completions",
        headers: { Authorization: `Bearer ${groqKey}` },
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        provider: "groq",
        systemPrompt,
        history,
        prompt,
        onChunk,
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

  // 4. Try Cerebras (Fallback 2 - 2,000+ tok/s Ultra-High-Speed LPU)
  if (cerebrasKey && circuitBreaker.isAvailable("cerebras")) {
    try {
      const result = await streamOpenAICompatible({
        url: "https://api.cerebras.ai/v1/chat/completions",
        headers: { Authorization: `Bearer ${cerebrasKey}` },
        model: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
        provider: "cerebras",
        systemPrompt,
        history,
        prompt,
        onChunk,
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

  // 5. Try Mistral / Codestral (Fallback 3)
  if (mistralKey && circuitBreaker.isAvailable("mistral")) {
    try {
      const result = await streamOpenAICompatible({
        url: "https://api.mistral.ai/v1/chat/completions",
        headers: { Authorization: `Bearer ${mistralKey}` },
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
        provider: "mistral",
        systemPrompt,
        history,
        prompt,
        onChunk,
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

  // 6. Try OpenRouter (Fallback 4)
  if (openRouterKey && circuitBreaker.isAvailable("openrouter")) {
    try {
      const result = await streamOpenAICompatible({
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://zorvik.tech",
          "X-Title": "Zorvik AI",
        },
        model: "deepseek/deepseek-r1:free",
        provider: "openrouter",
        systemPrompt,
        history,
        prompt,
        onChunk,
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

  // 7. Local Intelligent Fallback
  const fallbackText = localIntelligentFallback(prompt, mode);
  if (onChunk) onChunk(fallbackText);

  return {
    text: fallbackText,
    model: "zorvik-local-engine",
    provider: "local",
    latencyMs: Date.now() - startTime,
    sources: [],
  };
}

/**
 * Standard Non-Streaming query wrapper
 */
async function routeQuery(params) {
  let accumulated = "";
  const result = await routeQueryStream({
    ...params,
    onChunk: (c) => {
      accumulated += c;
    },
  });
  return {
    ...result,
    text: result.text || accumulated,
  };
}

module.exports = {
  routeQueryStream,
  routeQuery,
  streamGemini,
  localIntelligentFallback,
};
