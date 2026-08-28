/**
 * Dual-Tier Memory Engine
 * Combines Upstash Redis (Hot Sliding-Window) + Supabase (pgvector Semantic Memory).
 */
const { redis } = require("../lib/redis");
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");

const MAX_HOT_TURNS = 12; // Keep last 12 turns in hot sliding memory
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Get hot conversation history for an active session
 * @param {string} sessionId
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
async function getSessionHistory(sessionId) {
  if (!sessionId) return [];
  const key = `zorvik:session:${sessionId}:turns`;
  const data = await redis.get(key);
  if (!data) return [];
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (_e) {
    return [];
  }
}

/**
 * Append message turns to hot sliding memory
 * @param {string} sessionId
 * @param {string} userMessage
 * @param {string} assistantMessage
 */
async function appendSessionTurn(sessionId, userMessage, assistantMessage) {
  if (!sessionId) return;
  const key = `zorvik:session:${sessionId}:turns`;
  const existing = await getSessionHistory(sessionId);

  existing.push({ role: "user", content: userMessage });
  existing.push({ role: "assistant", content: assistantMessage });

  // Keep only the most recent N turns
  const trimmed = existing.slice(-MAX_HOT_TURNS);

  await redis.set(key, JSON.stringify(trimmed), { ex: SESSION_TTL_SECONDS });
}

/**
 * Clear session memory
 * @param {string} sessionId
 */
async function clearSessionMemory(sessionId) {
  if (!sessionId) return;
  const key = `zorvik:session:${sessionId}:turns`;
  await redis.del(key);
}

/**
 * Search semantic long-term memory via pgvector in dedicated Supabase
 * @param {object} options
 * @param {number[]} options.embedding - 768-dim query embedding
 * @param {string} [options.conversationId]
 * @param {string} [options.tenantId]
 * @returns {Promise<Array<{content: string, similarity: number}>>}
 */
async function searchSemanticMemory({ embedding, conversationId = null, tenantId = null }) {
  if (!isSupabaseConfigured() || !embedding) return [];

  try {
    const { data, error } = await supabase.rpc("match_messages", {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 3,
      p_conversation_id: conversationId,
      p_tenant_id: tenantId,
    });

    if (error) {
      console.warn("Semantic memory search RPC error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn("Failed to search semantic memory:", err.message);
    return [];
  }
}

/**
 * Get user profile personalization (custom instructions & tone)
 * @param {string} userId
 * @returns {Promise<{ customInstructions: string, tone: string }>}
 */
async function getUserProfileConfig(userId) {
  if (!userId) return { customInstructions: "", tone: "auto" };
  const key = `zorvik:user:${userId}:preferences`;
  const data = await redis.get(key);
  if (!data) return { customInstructions: "", tone: "auto" };
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return {
      customInstructions: parsed.customInstructions || "",
      tone: parsed.tone || "auto",
    };
  } catch (_e) {
    return { customInstructions: "", tone: "auto" };
  }
}

/**
 * Save user profile personalization
 * @param {string} userId
 * @param {object} config
 */
async function saveUserProfileConfig(userId, { customInstructions = "", tone = "auto" }) {
  if (!userId) return;
  const key = `zorvik:user:${userId}:preferences`;
  await redis.set(
    key,
    JSON.stringify({
      customInstructions: customInstructions.slice(0, 1500),
      tone,
      updatedAt: Date.now(),
    })
  );
}

/**
 * Get long-term memories for a user
 * @param {string} userId
 * @returns {Promise<Array<{ id: string, text: string, createdAt: number }>>}
 */
async function getUserMemories(userId) {
  if (!userId) return [];
  const key = `zorvik:user:${userId}:memories`;
  const data = await redis.get(key);
  if (!data) return [];
  try {
    const list = typeof data === "string" ? JSON.parse(data) : data;
    return Array.isArray(list) ? list : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Add a new long-term memory fact for a user
 * @param {string} userId
 * @param {string} text
 * @returns {Promise<{ id: string, text: string, createdAt: number }>}
 */
async function addUserMemory(userId, text) {
  if (!userId || !text || !text.trim()) return null;
  const key = `zorvik:user:${userId}:memories`;
  const memories = await getUserMemories(userId);

  const newMemory = {
    id: "mem_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
    text: text.trim().slice(0, 500),
    createdAt: Date.now(),
  };

  memories.unshift(newMemory);
  // Keep up to 50 active long-term memories per user
  const trimmed = memories.slice(0, 50);

  await redis.set(key, JSON.stringify(trimmed));
  return newMemory;
}

/**
 * Delete a specific long-term memory
 * @param {string} userId
 * @param {string} memoryId
 */
async function deleteUserMemory(userId, memoryId) {
  if (!userId || !memoryId) return;
  const key = `zorvik:user:${userId}:memories`;
  const memories = await getUserMemories(userId);
  const updated = memories.filter((m) => m.id !== memoryId);
  await redis.set(key, JSON.stringify(updated));
}

/**
 * Clear all memories for a user
 * @param {string} userId
 */
async function clearUserMemories(userId) {
  if (!userId) return;
  const key = `zorvik:user:${userId}:memories`;
  await redis.del(key);
}

module.exports = {
  getSessionHistory,
  appendSessionTurn,
  clearSessionMemory,
  searchSemanticMemory,
  getUserProfileConfig,
  saveUserProfileConfig,
  getUserMemories,
  addUserMemory,
  deleteUserMemory,
  clearUserMemories,
};
