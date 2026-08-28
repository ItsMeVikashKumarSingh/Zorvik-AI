/**
 * Zorvik AI Mandatory Audit Logger
 * Records immutable audit records for every administrative action.
 */
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");
const { redis } = require("../lib/redis");

/**
 * Log an administrative mutation action
 * @param {object} params
 * @param {string} params.adminId
 * @param {string} params.adminEmail
 * @param {string} params.actionType - 'CREATE_TENANT' | 'UPDATE_TENANT' | 'REVOKE_KEY' | 'UPDATE_PLAN' | 'TOGGLE_CIRCUIT'
 * @param {string} params.targetEntity - e.g. 'tenant:xxx', 'plan:pro', 'provider:gemini'
 * @param {object} [params.details]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 */
async function recordAuditLog({
  adminId,
  adminEmail,
  actionType,
  targetEntity,
  details = {},
  ipAddress = "127.0.0.1",
  userAgent = "Internal",
}) {
  const auditEntry = {
    admin_id: String(adminId || "admin-system"),
    admin_email: String(adminEmail || "admin@zorvik.tech"),
    action_type: actionType,
    target_entity: targetEntity,
    details,
    ip_address: ipAddress,
    user_agent: userAgent ? userAgent.slice(0, 500) : null,
    created_at: new Date().toISOString(),
  };

  console.log(`[Audit Log] ${adminEmail} performed ${actionType} on ${targetEntity}`);

  // 1. Save to Redis audit stream/list for sub-millisecond retrieval
  try {
    const listKey = "zorvik:audit_logs:recent";
    await redis.lpush(listKey, JSON.stringify(auditEntry));
    await redis.ltrim(listKey, 0, 500); // Keep last 500 actions in fast cache
  } catch (rErr) {
    console.warn("[Audit Logger] Redis cache warning:", rErr.message);
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("tbl_audit_logs").insert([auditEntry]);
    } catch (dbErr) {
      console.warn("[Audit Logger] DB persistence warning:", dbErr.message);
    }
  }

  return auditEntry;
}

/**
 * Get recent audit logs
 * @param {number} [limit=50]
 * @returns {Promise<Array<object>>}
 */
async function getRecentAuditLogs(limit = 50) {
  // 1. Try DB first for complete records
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("tbl_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (_err) {
      // Fallback to Redis
    }
  }

  // 2. Fallback to Redis cache
  try {
    const listKey = "zorvik:audit_logs:recent";
    const raw = await redis.lrange(listKey, 0, limit - 1);
    if (Array.isArray(raw)) {
      return raw.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
    }
  } catch (_e) {
    return [];
  }

  return [];
}

module.exports = {
  recordAuditLog,
  getRecentAuditLogs,
};
