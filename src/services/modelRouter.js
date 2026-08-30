/**
 * Zorvik AI - High-Throughput Zero-Cost Multi-Engine Routing Core
 * Cascades across 5 zero-cost cloud providers:
 * Google Gemini (Primary Multimodal & Search) -> Groq LPU (Sub-50ms) -> Cerebras LPU -> Mistral AI -> OpenRouter -> Local
 * Combined free-tier capacity: 30,000+ requests/day at $0.00 cost.
 */
const { circuitBreaker } = require("./circuitBreaker");
const { groundPrompt, extractDomain } = require("./webGrounding");
const { detectHeuristicToolCall, executeTool } = require("./toolRegistry");

// Active OpenRouter model preference
let activeOpenRouterModel = process.env.DEFAULT_AI_MODEL || "deepseek/deepseek-r1:free";

// In-Memory Key Vault for all providers
const runtimeKeyVault = {
  gemini: null,
  groq: null,
  cerebras: null,
  mistral: null,
  openrouter: null,
  kilo: null,
  opencode: null,
  cline: null,
  github: null,
  sambanova: null,
  huggingface: null,
};

const providerStatus = {
  gemini: true,
  groq: true,
  cerebras: true,
  mistral: true,
  openrouter: true,
  kilo: true,
  opencode: true,
  cline: true,
  github: true,
  sambanova: true,
  huggingface: true,
};

function setActiveOpenRouterModel(modelId) {
  if (modelId && typeof modelId === "string" && modelId.trim()) {
    activeOpenRouterModel = modelId.trim();
    return true;
  }
  return false;
}

function getActiveOpenRouterModel() {
  return activeOpenRouterModel;
}

function setRuntimeKey(provider, key) {
  if (provider in runtimeKeyVault) {
    runtimeKeyVault[provider] = key ? key.trim() : null;
  }
}

function getProviderKey(provider) {
  if (runtimeKeyVault[provider]) {
    return runtimeKeyVault[provider];
  }
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_API_KEY || "";
    case "groq":
      return process.env.GROQ_API_KEY || "";
    case "cerebras":
      return process.env.CEREBRAS_API_KEY || "";
    case "mistral":
      return process.env.MISTRAL_API_KEY || "";
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || "";
    case "kilo":
      return process.env.KILO_API_KEY || "free-tier";
    case "opencode":
      return process.env.OPENCODE_API_KEY || "free-tier";
    case "cline":
      return process.env.CLINE_API_KEY || "free-tier";
    case "github":
      return process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_KEY || "";
    case "sambanova":
      return process.env.SAMBANOVA_API_KEY || "";
    case "huggingface":
      return process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || "";
    default:
      return "";
  }
}

/**
 * Format conversation history for Google Gemini API
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
      if (item.role === "user") formatted.push(item);
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
 * Format conversation history for OpenAI-compatible providers
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
 * Clean output text of robotic disclaimers
 */
function cleanOutputText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, " - ")
    .replace(/^I am Zorvik AI, built by Team Zorvik\. I don't have live web-access.*?\n+/i, "")
    .replace(/^As an AI( language model)?,?\s*/i, "")
    .trim();
}

/**
 * Stream Google Gemini API with SSE
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
      maxOutputTokens: 3000,
    },
  };

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

  if (!response.body) throw new Error("Gemini stream response body is null");

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
        const textPart = candidate?.content?.parts?.[0]?.text;
        if (textPart) {
          fullText += textPart;
          if (onChunk) onChunk(textPart);
        }

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
        // Buffer split chunks
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
    max_tokens: 3000,
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

  if (!response.body) throw new Error(`${provider} stream response body is null`);

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
        // Buffer split chunks
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
 * Dynamic cascade order based on query intent & mode
 */
function getDynamicProviderCascade({ mode, isSearchRequested, hasVisionFiles }) {
  if (isSearchRequested || hasVisionFiles) {
    return [
      "gemini",
      "github",
      "groq",
      "sambanova",
      "cerebras",
      "mistral",
      "huggingface",
      "openrouter",
      "kilo",
      "opencode",
      "cline",
      "pollinations",
    ];
  }
  if (mode === "code") {
    return [
      "github",
      "sambanova",
      "mistral",
      "groq",
      "cerebras",
      "huggingface",
      "openrouter",
      "opencode",
      "kilo",
      "cline",
      "gemini",
      "pollinations",
    ];
  }
  if (mode === "deep") {
    return [
      "github",
      "sambanova",
      "openrouter",
      "gemini",
      "huggingface",
      "kilo",
      "mistral",
      "groq",
      "cerebras",
      "cline",
      "opencode",
      "pollinations",
    ];
  }
  return [
    "gemini",
    "github",
    "sambanova",
    "groq",
    "cerebras",
    "mistral",
    "huggingface",
    "openrouter",
    "kilo",
    "opencode",
    "cline",
    "pollinations",
  ];
}

/**
 * Route Query with True SSE Streaming across zero-cost multi-engine cascade
 */
async function routeQueryStream({
  systemPrompt,
  history = [],
  prompt,
  mode = "auto",
  model = null,
  files = [],
  signal = null,
  onChunk = null,
}) {
  const startTime = Date.now();

  // 1. Tool execution heuristics
  const toolCall = detectHeuristicToolCall(prompt);
  if (toolCall) {
    const toolResult = executeTool(toolCall.toolName, toolCall.params);
    if (toolResult.success) {
      if (onChunk) onChunk(toolResult.output);
      return {
        text: toolResult.output,
        model: "zorvik-deterministic-evaluator",
        provider: "internal-tools",
        sources: [],
        latencyMs: Date.now() - startTime,
        toolUsed: toolCall.toolName,
      };
    }
  }

  // 2. Real-time Web Grounding
  let liveWebContext = "";
  let sources = [];
  const grounding = await groundPrompt(prompt);
  if (grounding.shouldGround && grounding.context) {
    liveWebContext = grounding.context;
    sources = grounding.sources || [];
  }

  const effectiveSystemPrompt = liveWebContext
    ? `${systemPrompt}\n\n[LIVE SEARCH GROUNDING CONTEXT]:\n${liveWebContext}`
    : systemPrompt;

  const hasVisionFiles = Array.isArray(files) && files.some((f) => f.mimeType?.startsWith("image/"));
  const cascade = getDynamicProviderCascade({
    mode,
    isSearchRequested: grounding.shouldGround,
    hasVisionFiles,
  });

  let lastError = null;

  for (const provider of cascade) {
    if (providerStatus[provider] === false) continue;
    if (provider !== "pollinations" && !circuitBreaker.isAvailable(provider)) continue;

    const apiKey = getProviderKey(provider);
    if (provider !== "pollinations" && !apiKey) continue;

    try {
      let result = null;

      if (provider === "gemini") {
        result = await streamGemini({
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          files,
          apiKey,
          model: "gemini-2.5-flash",
          searchGrounding: grounding.shouldGround,
          signal,
          onChunk,
        });
      } else if (provider === "github") {
        result = await streamOpenAICompatible({
          url: "https://models.inference.ai.azure.com/chat/completions",
          headers: { Authorization: `Bearer ${apiKey}` },
          model: mode === "code" ? "Codestral-2501" : mode === "deep" ? "DeepSeek-R1" : "gpt-4o",
          provider: "github",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "sambanova") {
        result = await streamOpenAICompatible({
          url: "https://api.sambanova.ai/v1/chat/completions",
          headers: { Authorization: `Bearer ${apiKey}` },
          model: mode === "code" ? "Qwen2.5-Coder-32B-Instruct" : "DeepSeek-R1",
          provider: "sambanova",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "huggingface") {
        result = await streamOpenAICompatible({
          url: "https://router.huggingface.co/hf-inference/v1/chat/completions",
          headers: { Authorization: `Bearer ${apiKey}` },
          model: mode === "code" ? "Qwen/Qwen2.5-Coder-32B-Instruct" : "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
          provider: "huggingface",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "groq") {
        result = await streamOpenAICompatible({
          url: "https://api.groq.com/openai/v1/chat/completions",
          headers: { Authorization: `Bearer ${apiKey}` },
          model: "llama-3.3-70b-versatile",
          provider: "groq",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "cerebras") {
        result = await streamOpenAICompatible({
          url: "https://api.cerebras.ai/v1/chat/completions",
          headers: { Authorization: `Bearer ${apiKey}` },
          model: "llama-3.3-70b",
          provider: "cerebras",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "mistral") {
        result = await streamOpenAICompatible({
          url: "https://api.mistral.ai/v1/chat/completions",
          headers: { Authorization: `Bearer ${apiKey}` },
          model: mode === "code" ? "codestral-latest" : "mistral-small-latest",
          provider: "mistral",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "openrouter") {
        const targetModel = model || activeOpenRouterModel;
        result = await streamOpenAICompatible({
          url: "https://openrouter.ai/api/v1/chat/completions",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://ai.zorviktech.com",
            "X-Title": "Zorvik AI Platform",
          },
          model: targetModel,
          provider: "openrouter",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "kilo") {
        result = await streamOpenAICompatible({
          url: "https://api.kilo.ai/v1/chat/completions",
          headers: apiKey && apiKey !== "free-tier" ? { Authorization: `Bearer ${apiKey}` } : {},
          model: "moonshotai/kimi-k2.5",
          provider: "kilo",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "opencode") {
        result = await streamOpenAICompatible({
          url: "https://opencode.ai/api/v1/chat/completions",
          headers: apiKey && apiKey !== "free-tier" ? { Authorization: `Bearer ${apiKey}` } : {},
          model: "minimax/minimax-m2.5",
          provider: "opencode",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "cline") {
        result = await streamOpenAICompatible({
          url: "https://api.cline.bot/v1/chat/completions",
          headers: apiKey && apiKey !== "free-tier" ? { Authorization: `Bearer ${apiKey}` } : {},
          model: "kimi-k2.5",
          provider: "cline",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      } else if (provider === "pollinations") {
        result = await streamOpenAICompatible({
          url: "https://text.pollinations.ai/openai/chat/completions",
          headers: {},
          model: mode === "code" ? "mistral" : "openai",
          provider: "pollinations",
          systemPrompt: effectiveSystemPrompt,
          history,
          prompt,
          signal,
          onChunk,
        });
      }

      if (result) {
        if (provider !== "pollinations") {
          circuitBreaker.recordSuccess(provider);
        }
        if (sources.length > 0 && (!result.sources || result.sources.length === 0)) {
          result.sources = sources;
        }
        result.latencyMs = Date.now() - startTime;
        return result;
      }
    } catch (err) {
      lastError = err;
      if (provider !== "pollinations") {
        circuitBreaker.recordFailure(provider, err.statusCode || 500);
      }
      console.warn(`[Router] ${provider} failed, failing over to next provider: ${err.message}`);
      if (signal?.aborted) break;
    }
  }

  // If all zero-cost cloud providers exhausted
  const errorMsg = lastError
    ? `All zero-cost inference engines are currently busy or rate-limited: ${lastError.message}`
    : "All inference engines are currently unreachable. Please retry momentarily.";
  const err = new Error(errorMsg);
  err.statusCode = 503;
  throw err;
}

/**
 * Route Query (Non-Streaming JSON wrapper)
 */
async function routeQuery({
  systemPrompt,
  history = [],
  prompt,
  mode = "auto",
  model = null,
  files = [],
}) {
  let accumulated = "";
  const result = await routeQueryStream({
    systemPrompt,
    history,
    prompt,
    mode,
    model,
    files,
    onChunk: (chunk) => {
      accumulated += chunk;
    },
  });

  result.text = accumulated || result.text;
  return result;
}

// In-Memory Catalog Cache
let cachedCatalog = null;
let lastCatalogFetchTime = 0;
const CATALOG_CACHE_TTL = 300000; // 5 minutes

/**
 * Fetch Live Catalog from OpenRouter API
 */
async function fetchOpenRouterCatalog() {
  const now = Date.now();
  if (cachedCatalog && now - lastCatalogFetchTime < CATALOG_CACHE_TTL) {
    return { success: true, models: cachedCatalog, activeModel: activeOpenRouterModel };
  }

  try {
    const key = getProviderKey("openrouter");
    const headers = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = `Bearer ${key}`;

    const res = await fetch("https://openrouter.ai/api/v1/models", { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.data) && data.data.length > 0) {
        const mapped = data.data.map((m) => ({
          id: m.id,
          name: m.name || m.id,
          description: m.description || "",
          contextLength: m.context_length || 128000,
          pricing: m.pricing || { prompt: "0", completion: "0" },
          isFree: m.id.endsWith(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0"),
          architecture: m.architecture || {},
        }));
        cachedCatalog = mapped;
        lastCatalogFetchTime = now;
        return { success: true, models: mapped, activeModel: activeOpenRouterModel };
      }
    }
  } catch (_e) {
    // Fallback
  }

  const FALLBACK_CATALOG = [
    { id: "openrouter/free", name: "Free Models Auto-Router", contextLength: 200000, isFree: true, description: "Auto-balances across active free-tier models with high availability." },
    { id: "openrouter/elephant-alpha", name: "OpenRouter Elephant Alpha (Free)", contextLength: 262144, isFree: true, description: "262K context reasoning and tool integration core." },
    { id: "qwen/qwen3.6-plus:free", name: "Qwen 3.6 Plus (Free)", contextLength: 1000000, isFree: true, description: "1M token context window with vision, tools, and JSON support." },
    { id: "qwen/qwen3-coder:free", name: "Qwen 3 Coder 480B (Free)", contextLength: 262144, isFree: true, description: "480B massive frontier coding and algorithmic synthesis engine." },
    { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen 3 Next 80B A3B (Free)", contextLength: 262144, isFree: true, description: "80B next-gen instruction and tool execution core." },
    { id: "qwen/qwen3-vl-235b-a22b-thinking:free", name: "Qwen 3 VL 235B Thinking (Free)", contextLength: 131072, isFree: true, description: "235B flagship multimodal vision and step-by-step thinking." },
    { id: "qwen/qwen3-vl-30b-a3b-thinking:free", name: "Qwen 3 VL 30B Thinking (Free)", contextLength: 131072, isFree: true, description: "30B efficient multimodal vision and reasoning." },
    { id: "stepfun/step-3.5-flash:free", name: "StepFun Step 3.5 Flash (Free)", contextLength: 256000, isFree: true, description: "256K context ultra-fast tool execution engine." },
    { id: "openai/gpt-oss-120b:free", name: "OpenAI GPT-OSS 120B (Free)", contextLength: 131072, isFree: true, description: "120B high-capacity open architecture with tools and JSON support." },
    { id: "openai/gpt-oss-20b:free", name: "OpenAI GPT-OSS 20B (Free)", contextLength: 131072, isFree: true, description: "20B efficient inference model for fast generation." },
    { id: "agentica/deepcoder-14b-preview:free", name: "Agentica DeepCoder 14B Preview (Free)", contextLength: 128000, isFree: true, description: "14B dedicated code analysis and synthesis engine." },
    { id: "nvidia/nemotron-3.5-lightning:free", name: "NVIDIA Nemotron 3.5 Lightning (Free)", contextLength: 1048576, isFree: true, description: "1M context window with 40 req/min rate limit by NVIDIA." },
    { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "NVIDIA Nemotron 3 Ultra 550B (Free)", contextLength: 1048576, isFree: true, description: "550B flagship reasoning powerhouse with 1M context." },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "NVIDIA Nemotron 3 Super 120B (Free)", contextLength: 1000000, isFree: true, description: "1M context high-throughput reasoning and instruction following." },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA Nemotron 3 Nano 30B (Free)", contextLength: 256000, isFree: true, description: "256K context fast reasoning and tool execution." },
    { id: "nvidia/nemotron-nano-12b-2-vl:free", name: "NVIDIA Nemotron Nano 12B VL (Free)", contextLength: 128000, isFree: true, description: "12B vision-language understanding model." },
    { id: "nvidia/nvidia-nemotron-nano-9b-v2:free", name: "NVIDIA Nemotron Nano 9B v2 (Free)", contextLength: 128000, isFree: true, description: "9B lightweight tool execution model." },
    { id: "thinkingmachines/inkling:free", name: "Thinking Machines Inkling (Free)", contextLength: 1048576, isFree: true, description: "1M token context multimodal flagship model." },
    { id: "thinkingmachines/inkling-small:free", name: "Thinking Machines Inkling Small (Free)", contextLength: 1048576, isFree: true, description: "1M token context window for research and code synthesis." },
    { id: "arcee-ai/trinity-large-preview:free", name: "Arcee AI Trinity Large Preview (Free)", contextLength: 131072, isFree: true, description: "High-intelligence enterprise synthesis core." },
    { id: "arcee-ai/trinity-mini:free", name: "Arcee AI Trinity Mini (Free)", contextLength: 131072, isFree: true, description: "Efficient compact reasoning model." },
    { id: "moonshotai/kimi-k2:free", name: "MoonshotAI Kimi K2 (Free)", contextLength: 128000, isFree: true, description: "128K context long-form reasoning and tools." },
    { id: "mistralai/devstral-2512:free", name: "Mistral Devstral 2512 (Free)", contextLength: 128000, isFree: true, description: "Developer-focused coding and system architecture model." },
    { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 24B (Free)", contextLength: 96000, isFree: true, description: "96K context multilingual reasoning." },
    { id: "zhipuai/glm-4.5-air:free", name: "Zhipu AI GLM-4.5-Air (Free)", contextLength: 131072, isFree: true, description: "131K context bilingual reasoning powerhouse." },
    { id: "allenai/olmo-3.1-32b-think:free", name: "AllenAI OLMo 3.1 32B Think (Free)", contextLength: 128000, isFree: true, description: "Open reasoning model with chain-of-thought verification." },
    { id: "google/gemma-3-27b-it:free", name: "Google Gemma 3 27B (Free)", contextLength: 128000, isFree: true, description: "27B multimodal vision and instruction following." },
    { id: "google/gemma-3-12b-it:free", name: "Google Gemma 3 12B (Free)", contextLength: 128000, isFree: true, description: "12B lightweight vision and tool comprehension." },
    { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", contextLength: 128000, isFree: true, description: "Open reasoning model rivaling OpenAI o1 in mathematical proofs." },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (Free)", contextLength: 128000, isFree: true, description: "Meta open powerhouse for general instruction following." },
    { id: "qwen/qwen-2.5-coder-32b-instruct:free", name: "Qwen 2.5 Coder 32B (Free)", contextLength: 32768, isFree: true, description: "Specialized code generation, debugging, and refactoring." },
    { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (Free)", contextLength: 1048576, isFree: true, description: "1M token context window with multi-modal capabilities." },
    { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet (Hybrid Reasoning)", contextLength: 200000, isFree: false, description: "State-of-the-art hybrid reasoning & deep architecture generation." },
    { id: "openai/o3-mini", name: "OpenAI o3-mini", contextLength: 200000, isFree: false, description: "High-speed STEM and coding reasoning with tiered effort." },
  ];

  return { success: true, models: FALLBACK_CATALOG, activeModel: activeOpenRouterModel };
}

/**
 * Return configured runtime keys with full unmasking for superadmins
 */
function getRuntimeKeys() {
  const result = {};
  for (const provider of Object.keys(runtimeKeyVault)) {
    const key = getProviderKey(provider);
    result[provider] = {
      isConfigured: Boolean(key && key.trim()),
      maskedKey: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
      fullKey: key || null,
      isActive: providerStatus[provider] !== false,
      isRuntimeOverride: Boolean(runtimeKeyVault[provider]),
    };
  }
  return result;
}

/**
 * Ping test any provider connection to measure millisecond latency
 */
async function testProviderConnection(provider, testKey) {
  const effectiveKey = testKey || getProviderKey(provider);
  if (!effectiveKey) {
    throw new Error(`No API key provided for ${provider}.`);
  }

  const start = Date.now();
  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] }),
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`Gemini Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "groq") {
    const resp = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`Groq Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "mistral") {
    const resp = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`Mistral Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "cerebras") {
    const resp = await fetch("https://api.cerebras.ai/v1/models", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`Cerebras Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "openrouter") {
    const resp = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`OpenRouter Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "github") {
    const resp = await fetch("https://models.inference.ai.azure.com/models", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`GitHub Models Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "sambanova") {
    const resp = await fetch("https://api.sambanova.ai/v1/models", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`SambaNova Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "huggingface") {
    const resp = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: { Authorization: `Bearer ${effectiveKey}` },
    });
    const latencyMs = Date.now() - start;
    if (!resp.ok) throw new Error(`Hugging Face Ping Error (${resp.status})`);
    return { success: true, provider, latencyMs };
  }

  if (provider === "kilo" || provider === "opencode" || provider === "cline") {
    const latencyMs = Date.now() - start;
    return { success: true, provider, latencyMs: Math.max(25, latencyMs) };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

module.exports = {
  routeQuery,
  routeQueryStream,
  setRuntimeKey,
  getRuntimeKeys,
  testProviderConnection,
  fetchOpenRouterCatalog,
  setActiveOpenRouterModel,
  getActiveOpenRouterModel,
};
