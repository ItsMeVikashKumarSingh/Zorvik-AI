/**
 * Zorvik AI API Routes (/api/v1)
 */
const express = require("express");
const router = express.Router();

const { tenantAuthMiddleware, deductTenantTokens } = require("../middleware/tenantAuth");
const { userAuthMiddleware } = require("../middleware/userAuth");
const { securityShield } = require("../middleware/securityShield");
const { routeQueryStream, routeQuery } = require("../services/modelRouter");
const { buildSystemPrompt } = require("../services/intentEngine");
const {
  getSessionHistory,
  appendSessionTurn,
  getSessionSummary,
  updateRollingConversationSummary,
  clearSessionMemory,
  getUserProfileConfig,
  saveUserProfileConfig,
  getUserMemories,
  addUserMemory,
  deleteUserMemory,
  clearUserMemories,
} = require("../services/memoryEngine");
const { processTurnMemoryAndTone } = require("../services/autoMemoryExtractor");
const { retrieveRelevantChunks, formatRAGContext } = require("../services/ragEngine");
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
  const effectiveUserId =
    req.user?.id ||
    req.guestUUID ||
    req.headers["x-user-id"] ||
    req.headers["x-guest-uuid"] ||
    req.body?.user_id ||
    req.body?.guest_uuid ||
    "guest_default";

  // 1. Fetch multi-turn history & rolling executive summary
  const clientHistory = Array.isArray(req.body.history) && req.body.history.length > 0 ? req.body.history : null;
  const [serverHistory, sessionSummary] = await Promise.all([
    getSessionHistory(sessionId),
    getSessionSummary(sessionId),
  ]);
  const history = clientHistory || serverHistory || [];

  // 2. Fetch user personalization & long-term memories
  let userMemories = [];
  let customInstructions = "";
  if (effectiveUserId) {
    try {
      const [prefs, memories] = await Promise.all([
        getUserProfileConfig(effectiveUserId),
        getUserMemories(effectiveUserId),
      ]);
      customInstructions = prefs?.customInstructions || "";
      userMemories = memories || [];
    } catch (_memErr) {
      // Non-blocking memory retrieval error
    }
  }

  // Merge client-sent explicit preferences & memories if present
  if (req.body.custom_instructions && typeof req.body.custom_instructions === "string") {
    customInstructions = (customInstructions ? customInstructions + "\n" : "") + req.body.custom_instructions.trim();
  }
  if (Array.isArray(req.body.memories) && req.body.memories.length > 0) {
    const memoryTexts = userMemories.map((m) => (typeof m === "string" ? m : m.text || "").toLowerCase());
    for (const cm of req.body.memories) {
      const text = typeof cm === "string" ? cm : cm.text || "";
      if (text && !memoryTexts.includes(text.toLowerCase())) {
        userMemories.push(cm);
      }
    }
  }

  // 3. Build system persona based on mode, intent, tenant overrides, summary & user memories
  const systemPrompt = buildSystemPrompt({
    mode,
    prompt,
    tenantPrompt: tenant.custom_system_prompt,
    userMemories,
    customInstructions,
    conversationSummary: sessionSummary,
  });

  // 3.1 Extract document semantic context using RAG engine if document files are attached
  let ragContext = "";
  if (Array.isArray(files) && files.length > 0) {
    let combinedDocText = "";
    for (const f of files) {
      if (f.data && typeof f.data === "string" && !f.mimeType?.startsWith("image/")) {
        try {
          const decoded = Buffer.from(f.data, "base64").toString("utf-8");
          const isBinary = Array.from(decoded.slice(0, 100)).some(
            (c) => c.charCodeAt(0) < 9 || (c.charCodeAt(0) > 13 && c.charCodeAt(0) < 32)
          );
          if (decoded && !isBinary) {
            combinedDocText += `\n\n--- Document: ${f.name || "Attachment"} ---\n${decoded}`;
          }
        } catch (_decodeErr) {
          // Non-blocking binary decoding error
        }
      } else if (f.text && typeof f.text === "string") {
        combinedDocText += `\n\n--- Document: ${f.name || "Attachment"} ---\n${f.text}`;
      }
    }
    if (combinedDocText.trim()) {
      const topChunks = retrieveRelevantChunks({ query: prompt, documentText: combinedDocText, topK: 3 });
      ragContext = formatRAGContext(topChunks);
    }
  }

  const finalSystemPrompt = ragContext ? `${systemPrompt}\n\n${ragContext}` : systemPrompt;

  // 4. Handle Real-Time Streaming Response (True SSE Pipeline)
  if (stream) {
    const abortController = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    };
    req.on("close", onClose);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const result = await routeQueryStream({
        systemPrompt: finalSystemPrompt,
        history,
        prompt,
        mode,
        files,
        signal: abortController.signal,
        onChunk: (chunk) => {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ token: chunk, content: chunk })}\n\n`);
          }
        },
      });

      // Save turn to hot sliding memory & update rolling executive summary
      await appendSessionTurn(sessionId, prompt, result.text);
      updateRollingConversationSummary({ sessionId, prompt, response: result.text }).catch((err) =>
        console.warn("[Rolling Summary Non-Blocking]", err.message)
      );

      // Deduct estimated tokens from tenant monthly quota
      const promptTokens = estimateTokens(prompt);
      const responseTokens = estimateTokens(result.text);
      deductTenantTokens(tenant.id, promptTokens + responseTokens).catch((err) =>
        console.warn("[Quota Deduction Non-Blocking]", err.message)
      );

      // Trigger Autonomous Neural Memory Ingestion & Tone Learning in the background
      if (effectiveUserId) {
        processTurnMemoryAndTone({
          userId: effectiveUserId,
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
      systemPrompt: finalSystemPrompt,
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

    // Save turn to hot sliding memory & update rolling executive summary
    await appendSessionTurn(sessionId, prompt, result.text);
    updateRollingConversationSummary({ sessionId, prompt, response: result.text }).catch((err) =>
      console.warn("[Rolling Summary Non-Blocking]", err.message)
    );

    // Deduct estimated tokens from tenant monthly quota
    const promptTokens = estimateTokens(prompt);
    const responseTokens = estimateTokens(result.text);
    deductTenantTokens(tenant.id, promptTokens + responseTokens).catch((err) =>
      console.warn("[Quota Deduction Non-Blocking]", err.message)
    );

    // Trigger Autonomous Neural Memory Ingestion & Tone Learning in the background
    if (effectiveUserId) {
      processTurnMemoryAndTone({
        userId: effectiveUserId,
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
        id: "zorvik-omni-core",
        name: "Zorvik Omni-Neural Core (Vision & Real-Time Grounding)",
        provider: "Zorvik AI",
        tier: "free",
        status: status.gemini?.status || "online",
      },
      {
        id: "zorvik-fast-stream",
        name: "Zorvik Ultra-Fast Stream Matrix (Sub-50ms)",
        provider: "Zorvik AI",
        tier: "free",
        status: status.groq?.status || status.cerebras?.status || "online",
      },
      {
        id: "zorvik-code-synthesis",
        name: "Zorvik Code & Architecture Synthesis",
        provider: "Zorvik AI",
        tier: "free",
        status: status.mistral?.status || "online",
      },
      {
        id: "zorvik-deep-reasoning",
        name: "Zorvik Deep Mathematical Reasoning Engine",
        provider: "Zorvik AI",
        tier: "free",
        status: status.openrouter?.status || "online",
      },
    ],
    circuit_breaker: {
      status: "operational",
      active_engines: 4,
    },
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
    version: "1.0.12",
    uptime_seconds: Math.floor(process.uptime()),
    tenant: req.tenant ? req.tenant.id : "none",
    neural_matrix: {
      status: "operational",
      active_cores: 4,
    },
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
 * Retrieve long-term memories and response preferences for the user
 */
router.get("/user/memories", async (req, res) => {
  const effectiveUserId =
    req.user?.id ||
    req.guestUUID ||
    req.headers["x-user-id"] ||
    req.headers["x-guest-uuid"] ||
    "guest_default";

  try {
    const [preferences, memories] = await Promise.all([
      getUserProfileConfig(effectiveUserId),
      getUserMemories(effectiveUserId),
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
  const effectiveUserId =
    req.user?.id ||
    req.guestUUID ||
    req.headers["x-user-id"] ||
    req.headers["x-guest-uuid"] ||
    req.body?.user_id ||
    req.body?.guest_uuid ||
    "guest_default";

  const { text, preferences } = req.body;

  try {
    if (preferences) {
      await saveUserProfileConfig(effectiveUserId, preferences);
    }

    let newMemory = null;
    if (text && typeof text === "string" && text.trim()) {
      newMemory = await addUserMemory(effectiveUserId, text.trim());
    }

    const [updatedPrefs, memories] = await Promise.all([
      getUserProfileConfig(effectiveUserId),
      getUserMemories(effectiveUserId),
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
  const effectiveUserId =
    req.user?.id ||
    req.guestUUID ||
    req.headers["x-user-id"] ||
    req.headers["x-guest-uuid"] ||
    "guest_default";

  const { id } = req.params;

  try {
    if (id === "all") {
      await clearUserMemories(effectiveUserId);
    } else {
      await deleteUserMemory(effectiveUserId, id);
    }

    const memories = await getUserMemories(effectiveUserId);
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

/**
 * POST /api/v1/prompt/enhance
 * Micro-polisher that expands short or rough thoughts into structured, high-precision prompts
 */
router.post("/prompt/enhance", async (req, res) => {
  const { prompt, mode = "auto" } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Field 'prompt' is required.",
    });
  }

  const enhancerSystemPrompt = `You are the Zorvik Prompt Optimization Engine.
Your objective: Take the user's raw prompt/idea and rewrite it into an elite, highly structured, crystal-clear prompt.
Rules:
1. Preserve the user's exact original intent.
2. Add necessary precision: specify desired format, edge-case considerations, constraints, tone, and depth.
3. Keep it concise, punchy, and actionable (maximum 2-4 sentences or a structured brief).
4. Output ONLY the refined prompt text with ZERO meta commentary or greetings.`;

  try {
    const result = await routeQuery({
      systemPrompt: enhancerSystemPrompt,
      history: [],
      prompt: `Original prompt: "${prompt.trim()}"\nTarget mode: ${mode}\nRefine and enhance this prompt:`,
      mode: "fast",
    });

    const rawText = result?.text || "";
    const enhanced = rawText
      .replace(/\s*—\s*/g, ", ")
      .replace(/^["']|["']$/g, "")
      .trim();

    return res.json({
      success: true,
      enhancedPrompt: enhanced || prompt.trim(),
    });
  } catch (_err) {
    // Fallback gracefully to original prompt if upstream fails
    return res.json({
      success: true,
      enhancedPrompt: prompt.trim(),
    });
  }
});

module.exports = router;
