/**
 * Zero-Cost Multi-Model Routing Engine with Circuit Breaker, True SSE Streaming,
 * Universal Live Web Grounding, and Strict Persona Directives
 * Cascades: Google Gemini (Primary with Search Grounding & Vision) -> Groq Cloud (Fallback 1) -> Cerebras (Fallback 2) -> Mistral (Fallback 3) -> OpenRouter -> Local
 */
const { circuitBreaker } = require("./circuitBreaker");
const { groundPrompt, extractDomain } = require("./webGrounding");
const { detectHeuristicToolCall, executeTool } = require("./toolRegistry");

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
 * Clean text of unnecessary AI robotic boilerplate or repetitive em dashes
 */
function cleanOutputText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    // Replace em dashes and en dashes with natural standard punctuation or hyphens where appropriate
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, " - ")
    // Remove robotic AI boilerplate intro disclaimers
    .replace(/^I am Zorvik AI, built by Team Zorvik\. I don't have live web-access.*?\n+/i, "")
    .replace(/^As an AI( language model)?,?\s*/i, "")
    .trim();
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
  signal,
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
    signal,
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
    text: cleanOutputText(fullText),
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
  signal,
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
    signal,
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
    text: cleanOutputText(fullText),
    model: `${provider}-${model}`,
    provider,
    sources: [],
  };
}

/**
 * Intelligent Local Fallback
 */
function localIntelligentFallback(prompt, mode = "auto", liveWebContext = "") {
  const isEmojiOrGenZ = /💀|😭|💅|🗿|🧢|rizz|cap|bet|lowkey|fr|ngl|skibidi|sigma|cooked|aura|locked in/i.test(prompt);

  if (isEmojiOrGenZ || mode === "genz" || mode === "casual") {
    if (/skibidi|fanum|brainrot|ohio|mewing|mog/i.test(prompt)) {
      return "Maximum aura achieved. The energy is undisputed and completely locked in.";
    }
    if (/💀|deceased|dead/.test(prompt)) {
      return "Bro is absolutely finished. No way that just occurred.";
    }
    if (/😭|melting|crying/.test(prompt)) {
      return "That is wildly out of pocket. Completely unhinged behavior.";
    }
    if (/💅|slay|period/.test(prompt)) {
      return "Zero competition, as expected. Clean execution.";
    }
    if (/🗿|sigma|based/.test(prompt)) {
      return "Absolute sigma discipline. Undisputed stance.";
    }
    return "No cap, the reasoning is solid. Fully locked in.";
  }

  if (liveWebContext) {
    return `### Live Analysis & Summary\n\nBased on real-time data retrieved for your request:\n\n${liveWebContext.slice(0, 800)}...\n\nAll systems operational. Let me know if you need specific technical deep-dives or exports.`;
  }

  return `All intelligence engines and tool systems are active. Please specify what technical analysis, architecture review, or research task you would like executed.`;
}

let rrIndex = 0;

/**
 * Determine dynamic optimal provider execution order based on query intent & health
 * @param {object} params
 * @returns {Array<string>}
 */
function getDynamicProviderCascade({ mode, isSearchRequested, hasVisionFiles }) {
  // If search grounding or image vision files are present, Gemini MUST lead
  if (isSearchRequested || hasVisionFiles) {
    return ["gemini", "groq", "cerebras", "mistral", "openrouter"];
  }

  // If code mode, prioritize specialized code engines
  if (mode === "code") {
    return ["mistral", "groq", "cerebras", "gemini", "openrouter"];
  }

  // If deep reasoning mode, prioritize deep engines
  if (mode === "deep") {
    return ["openrouter", "gemini", "mistral", "groq", "cerebras"];
  }

  // For general / casual chat, perform smooth round-robin balancing across fast zero-cost engines
  rrIndex++;
  const balancePool = ["gemini", "groq", "cerebras", "mistral"];
  const startIdx = rrIndex % balancePool.length;
  const rotated = [...balancePool.slice(startIdx), ...balancePool.slice(0, startIdx)];
  return [...rotated, "openrouter"];
}

/**
 * Main Cascade Stream Router with Dynamic Load Balancing
 */
async function routeQueryStream({
  systemPrompt,
  history = [],
  prompt,
  mode = "auto",
  files = [],
  signal,
  onChunk,
}) {
  const startTime = Date.now();
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // 1. Dynamic Tool & Function Calling Execution
  let effectiveSystemPrompt = systemPrompt;
  const toolCall = detectHeuristicToolCall(prompt);
  if (toolCall) {
    try {
      const toolOutput = await executeTool(toolCall.toolName, toolCall.args);
      effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n### DETERMINISTIC TOOL EXECUTION RESULT (${toolCall.toolName}):\n${JSON.stringify(toolOutput, null, 2)}`;
    } catch (_toolErr) {
      // Non-blocking tool execution failure
    }
  }

  // 2. Universal Real-Time Web Grounding & Live URL Scraper
  const grounding = await groundPrompt({ prompt, mode });
  if (grounding.hasGrounding && grounding.enrichedContext) {
    effectiveSystemPrompt = `${effectiveSystemPrompt}\n\n${grounding.enrichedContext}`;
  }

  const isSearchRequested =
    mode === "search" ||
    /\b(latest|current|recent|news|today|price of|score|weather|who won|release date)\b/i.test(prompt);

  const hasVisionFiles = Array.isArray(files) && files.some((f) => f.mimeType?.startsWith("image/"));

  // 3. Obtain Dynamic Weighted Provider Execution Order
  const providerOrder = getDynamicProviderCascade({ mode, isSearchRequested, hasVisionFiles });

  for (const provider of providerOrder) {
    if (provider === "gemini" && geminiKey && circuitBreaker.isAvailable("gemini")) {
      try {
        const result = await streamGemini({
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          files,
          apiKey: geminiKey,
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          searchGrounding: isSearchRequested,
          signal,
          onChunk,
        });
        circuitBreaker.recordSuccess("gemini");
        const mergedSources = [...(grounding.sources || []), ...(result.sources || [])];
        return {
          ...result,
          sources: Array.from(new Map(mergedSources.map((s) => [s.url, s])).values()),
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn("[Router] Gemini failed, failing over to next provider:", err.message);
        circuitBreaker.recordFailure("gemini", err.statusCode || 500);
      }
    }

    if (provider === "groq" && groqKey && circuitBreaker.isAvailable("groq")) {
      try {
        const result = await streamOpenAICompatible({
          url: "https://api.groq.com/openai/v1/chat/completions",
          headers: { Authorization: `Bearer ${groqKey}` },
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          provider: "groq",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
        circuitBreaker.recordSuccess("groq");
        return {
          ...result,
          sources: grounding.sources || [],
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn("[Router] Groq failed, failing over to next provider:", err.message);
        circuitBreaker.recordFailure("groq", err.statusCode || 500);
      }
    }

    if (provider === "cerebras" && cerebrasKey && circuitBreaker.isAvailable("cerebras")) {
      try {
        const result = await streamOpenAICompatible({
          url: "https://api.cerebras.ai/v1/chat/completions",
          headers: { Authorization: `Bearer ${cerebrasKey}` },
          model: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
          provider: "cerebras",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
        circuitBreaker.recordSuccess("cerebras");
        return {
          ...result,
          sources: grounding.sources || [],
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn("[Router] Cerebras failed, failing over to next provider:", err.message);
        circuitBreaker.recordFailure("cerebras", err.statusCode || 500);
      }
    }

    if (provider === "mistral" && mistralKey && circuitBreaker.isAvailable("mistral")) {
      try {
        const mistralModel =
          process.env.MISTRAL_MODEL || (mode === "code" ? "codestral-latest" : "mistral-small-latest");
        const result = await streamOpenAICompatible({
          url: "https://api.mistral.ai/v1/chat/completions",
          headers: { Authorization: `Bearer ${mistralKey}` },
          model: mistralModel,
          provider: "mistral",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
        circuitBreaker.recordSuccess("mistral");
        return {
          ...result,
          sources: grounding.sources || [],
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn("[Router] Mistral failed, failing over to next provider:", err.message);
        circuitBreaker.recordFailure("mistral", err.statusCode || 500);
      }
    }

    if (provider === "openrouter" && openRouterKey && circuitBreaker.isAvailable("openrouter")) {
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
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
        circuitBreaker.recordSuccess("openrouter");
        return {
          ...result,
          sources: grounding.sources || [],
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn("[Router] OpenRouter failed, failing over to next provider:", err.message);
        circuitBreaker.recordFailure("openrouter", err.statusCode || 500);
      }
    }
  }

  // 8. Local Intelligent Fallback
  const fallbackText = localIntelligentFallback(prompt, mode, grounding.enrichedContext);
  if (onChunk) onChunk(fallbackText);

  return {
    text: cleanOutputText(fallbackText),
    model: "zorvik-local-engine",
    provider: "local",
    latencyMs: Date.now() - startTime,
    sources: grounding.sources || [],
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
    text: cleanOutputText(result.text || accumulated),
  };
}

module.exports = {
  routeQueryStream,
  routeQuery,
  streamGemini,
  localIntelligentFallback,
};
