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

module.exports = {
  getSessionHistory,
  appendSessionTurn,
  clearSessionMemory,
  searchSemanticMemory,
};
