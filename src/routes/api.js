/**
 * Zorvik AI API Routes (/api/v1)
 */
const express = require("express");
const router = express.Router();

const { tenantAuthMiddleware } = require("../middleware/tenantAuth");
const { userAuthMiddleware } = require("../middleware/userAuth");
const { securityShield } = require("../middleware/securityShield");
const { routeQueryStream, routeQuery } = require("../services/modelRouter");
const { buildSystemPrompt } = require("../services/intentEngine");
const {
  getSessionHistory,
  appendSessionTurn,
  clearSessionMemory,
  getUserProfileConfig,
  saveUserProfileConfig,
  getUserMemories,
  addUserMemory,
  deleteUserMemory,
  clearUserMemories,
} = require("../services/memoryEngine");
const { processTurnMemoryAndTone } = require("../services/autoMemoryExtractor");
const { circuitBreaker } = require("../services/circuitBreaker");
const { estimateTokens } = require("../lib/utils");
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");

// Apply core middleware across /api/v1
router.use(tenantAuthMiddleware);
router.use(userAuthMiddleware);
router.use(securityShield);

/**
 * POST /api/v1/chat & POST /api/v1/chat/stream
 * Primary chat endpoint supporting true upstream SSE streaming or standard JSON response
 */
router.post(["/chat", "/chat/stream"], async (req, res) => {
  const { mode = "auto", session_id = null, files = [] } = req.body;
  const prompt = req.body.prompt || req.body.message;
  const stream = req.path.endsWith("/stream") || req.body.stream === true;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Field 'prompt' or 'message' is required and must be a non-empty string.",
    });
  }

  const tenant = req.tenant;
  const sessionId = session_id || req.headers["x-session-id"] || "default-session";

  // 1. Fetch multi-turn history from request body or hot sliding memory
  const clientHistory = Array.isArray(req.body.history) && req.body.history.length > 0 ? req.body.history : null;
  const serverHistory = await getSessionHistory(sessionId);
  const history = clientHistory || serverHistory || [];

  // 2. Fetch logged-in user personalization & long-term memories
  let userMemories = [];
  let customInstructions = "";
  if (req.user && req.user.id) {
    try {
      const [prefs, memories] = await Promise.all([
        getUserProfileConfig(req.user.id),
        getUserMemories(req.user.id),
      ]);
      customInstructions = prefs?.customInstructions || "";
      userMemories = memories || [];
    } catch (_memErr) {
      // Non-blocking memory retrieval error
    }
  }

  // 3. Build system persona based on mode, intent, tenant overrides & user memories
  const systemPrompt = buildSystemPrompt({
    mode,
    prompt,
    tenantPrompt: tenant.custom_system_prompt,
    userMemories,
    customInstructions,
  });

  // 4. Handle Real-Time Streaming Response (True SSE Pipeline)
  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const result = await routeQueryStream({
        systemPrompt,
        history,
        prompt,
        mode,
        files,
        onChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ token: chunk, content: chunk })}\n\n`);
        },
      });

      // Save turn to hot sliding memory
      await appendSessionTurn(sessionId, prompt, result.text);

      // Trigger Autonomous Neural Memory Ingestion & Tone Learning in the background
      if (req.user && req.user.id) {
        processTurnMemoryAndTone({
          userId: req.user.id,
          prompt,
          response: result.text,
        }).catch((err) => console.warn("[Memory Auto-Extraction Non-Blocking]", err.message));
      }

      // Save message to Supabase if configured and user is present
      if (isSupabaseConfigured() && req.user) {
        try {
          await supabase.from("tbl_messages").insert([
            {
              conversation_id: sessionId.length === 36 ? sessionId : null,
              role: "user",
              content: prompt,
              tokens: estimateTokens(prompt),
            },
            {
              conversation_id: sessionId.length === 36 ? sessionId : null,
              role: "assistant",
              content: result.text,
              tokens: estimateTokens(result.text),
              model_routed: result.model,
            },
          ]);
        } catch (_dbErr) {
          // Non-blocking database write error
        }
      }

      let responseType = "Neural Synthesis";
      if (result.sources && result.sources.length > 0) {
        responseType = "Live Web Research";
      } else if (mode === "deep") {
        responseType = "Deep Reasoning";
      } else if (mode === "code") {
        responseType = "Code Intelligence";
      } else if (mode === "genz" || mode === "casual") {
        responseType = "Instant Culture Synthesis";
      }

      res.write(
        `data: ${JSON.stringify({
          done: true,
          model: result.model,
          responseType,
          response_type: responseType,
          provider: result.provider,
          latencyMs: result.latencyMs,
          sources: result.sources || [],
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      return res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      return res.end();
    }
  }

  // 5. Standard Non-Streaming JSON Response
  try {
    const result = await routeQuery({
      systemPrompt,
      history,
      prompt,
      mode,
      files,
    });

    let responseType = "Neural Synthesis";
    if (result.sources && result.sources.length > 0) {
      responseType = "Live Web Research";
    } else if (mode === "deep") {
      responseType = "Deep Reasoning";
    } else if (mode === "code") {
      responseType = "Code Intelligence";
    } else if (mode === "genz" || mode === "casual") {
      responseType = "Instant Culture Synthesis";
    }

    // Save turn to hot sliding memory
    await appendSessionTurn(sessionId, prompt, result.text);

    // Trigger Autonomous Neural Memory Ingestion & Tone Learning in the background
    if (req.user && req.user.id) {
      processTurnMemoryAndTone({
        userId: req.user.id,
        prompt,
        response: result.text,
      }).catch((err) => console.warn("[Memory Auto-Extraction Non-Blocking]", err.message));
    }

    // Save message to Supabase if configured and user is present
    if (isSupabaseConfigured() && req.user) {
      try {
        await supabase.from("tbl_messages").insert([
          {
            conversation_id: sessionId.length === 36 ? sessionId : null,
            role: "user",
            content: prompt,
            tokens: estimateTokens(prompt),
          },
          {
            conversation_id: sessionId.length === 36 ? sessionId : null,
            role: "assistant",
            content: result.text,
            tokens: estimateTokens(result.text),
            model_routed: result.model,
          },
        ]);
      } catch (_dbErr) {
        // Non-blocking database write error
      }
    }

    res.setHeader("X-Model-Routed", result.model);

    return res.json({
      response: result.text,
      response_type: responseType,
      responseType,
      model: result.model,
      provider: result.provider,
      mode,
      session_id: sessionId,
      tokens_estimated: estimateTokens(prompt) + estimateTokens(result.text),
      latency_ms: result.latencyMs,
      sources: result.sources || [],
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    });
  } catch (err) {
    console.error("[Chat API Error]:", err);
    return res.status(500).json({
      error: "Internal Processing Error",
      message: err.message || "An unexpected error occurred while routing your query.",
    });
  }
});

/**
 * GET /api/v1/models
 * List available zero-cost models and circuit breaker status
 */
router.get("/models", (_req, res) => {
  const status = circuitBreaker.getStatus();
  return res.json({
    models: [
      {
        id: "gemini-2.5-flash",
        name: "Google Gemini 2.5 Flash (Vision & Grounding)",
        provider: "Google AI Studio",
        tier: "free",
        status: status.gemini.status,
      },
      {
        id: "llama-3.3-70b-versatile",
        name: "Meta Llama 3.3 70B",
        provider: "Groq Cloud (500+ tok/s)",
        tier: "free",
        status: status.groq.status,
      },
      {
        id: "llama-3.3-70b",
        name: "Cerebras Llama 3.3 70B (2,000+ tok/s)",
        provider: "Cerebras Cloud LPU",
        tier: "free",
        status: status.cerebras?.status || "online",
      },
      {
        id: "codestral-latest",
        name: "Mistral Codestral",
        provider: "Mistral AI",
        tier: "free",
        status: status.mistral?.status || "online",
      },
      {
        id: "deepseek-r1:free",
        name: "DeepSeek R1 Reasoning Free",
        provider: "OpenRouter",
        tier: "free",
        status: status.openrouter.status,
      },
    ],
    circuit_breaker: status,
  });
});

/**
 * GET /api/v1/health
 * Microservice health & telemetry
 */
router.get("/health", (req, res) => {
  return res.json({
    status: "healthy",
    service: "zorvik-ai-microservice",
    version: "0.8.1",
    uptime_seconds: Math.floor(process.uptime()),
    tenant: req.tenant ? req.tenant.id : "none",
    providers: circuitBreaker.getStatus(),
  });
});

/**
 * POST /api/v1/tenants/verify
 * Validate tenant credentials and view quota status
 */
router.post("/tenants/verify", (req, res) => {
  return res.json({
    valid: true,
    tenant: req.tenant,
  });
});

/**
 * GET /api/v1/user/memories
 * Retrieve long-term memories and response preferences for the logged-in user
 */
router.get("/user/memories", async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required to access personalized memories.",
    });
  }

  try {
    const [preferences, memories] = await Promise.all([
      getUserProfileConfig(req.user.id),
      getUserMemories(req.user.id),
    ]);

    return res.json({
      success: true,
      preferences,
      memories,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

/**
 * POST /api/v1/user/memories
 * Add a memory item or update personalization preferences
 */
router.post("/user/memories", async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required to update memories.",
    });
  }

  const { text, preferences } = req.body;

  try {
    if (preferences) {
      await saveUserProfileConfig(req.user.id, preferences);
    }

    let newMemory = null;
    if (text && typeof text === "string" && text.trim()) {
      newMemory = await addUserMemory(req.user.id, text.trim());
    }

    const [updatedPrefs, memories] = await Promise.all([
      getUserProfileConfig(req.user.id),
      getUserMemories(req.user.id),
    ]);

    return res.json({
      success: true,
      memory: newMemory,
      preferences: updatedPrefs,
      memories,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

/**
 * DELETE /api/v1/user/memories/:id
 * Delete a specific memory item or all memories (if id === 'all')
 */
router.delete("/user/memories/:id", async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required to delete memories.",
    });
  }

  const { id } = req.params;

  try {
    if (id === "all") {
      await clearUserMemories(req.user.id);
    } else {
      await deleteUserMemory(req.user.id, id);
    }

    const memories = await getUserMemories(req.user.id);
    return res.json({
      success: true,
      memories,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

/**
 * DELETE /api/v1/memory/session/:sessionId
 * Reset sliding context memory for a session
 */
router.delete("/memory/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  await clearSessionMemory(sessionId);
  return res.json({
    status: "cleared",
    session_id: sessionId,
  });
});

module.exports = router;
