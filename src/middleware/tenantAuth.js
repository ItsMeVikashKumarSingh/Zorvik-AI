/**
 * Multi-Tenant Middleware for Zorvik AI
 * Authenticates x-tenant-id as API key, checks quota, and enforces rate limits.
 */
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");
const { redis } = require("../lib/redis");

// Built-in fallback registry of system tenants
const DEFAULT_TENANTS = {
  "public-guest": {
    id: "public-guest",
    name: "Zorvik AI Public Web Guest",
    tier: "free",
    rate_limit_per_minute: 30,
    monthly_token_quota: 200000,
    custom_system_prompt: null,
    is_active: true,
  },
  "zorvik-studio-prod": {
    id: "zorvik-studio-prod",
    name: "Zorvik Studio Production",
    tier: "enterprise",
    rate_limit_per_minute: 300,
    monthly_token_quota: 10000000,
    custom_system_prompt: "You are integrated into Zorvik Studio. Focus on creative digital media, design, video editing, and project workflows.",
    is_active: true,
  },
  "zorviktech-main": {
    id: "zorviktech-main",
    name: "Zorvik-Tech Primary Platform",
    tier: "enterprise",
    rate_limit_per_minute: 300,
    monthly_token_quota: 10000000,
    custom_system_prompt: "You are integrated into Zorvik-Tech. Assist users with software engineering, cloud systems, and architectural inquiries.",
    is_active: true,
  },
  "zconnect-service": {
    id: "zconnect-service",
    name: "ZConnect Messaging Platform",
    tier: "standard",
    rate_limit_per_minute: 120,
    monthly_token_quota: 5000000,
    custom_system_prompt: "You are integrated into ZConnect. Keep answers helpful and direct for customer support and instant communication.",
    is_active: true,
  },
};

/**
 * Fetch tenant from cache or database
 * @param {string} tenantId
 * @returns {Promise<object|null>}
 */
async function getTenantConfig(tenantId) {
  const cacheKey = `zorvik:tenant:${tenantId}:config`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return typeof cached === "string" ? JSON.parse(cached) : cached;
  }

  // Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("tbl_tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (!error && data) {
        await redis.set(cacheKey, JSON.stringify(data), { ex: 300 }); // Cache for 5 mins
        return data;
      }
    } catch (err) {
      console.warn(`Supabase tenant query failed for ${tenantId}:`, err.message);
    }
  }

  // Check in-memory default tenants
  if (DEFAULT_TENANTS[tenantId]) {
    const tenant = DEFAULT_TENANTS[tenantId];
    await redis.set(cacheKey, JSON.stringify(tenant), { ex: 300 });
    return tenant;
  }

  return null;
}

/**
 * Express Middleware: Validate Tenant ID & Rate Limit
 */
async function tenantAuthMiddleware(req, res, next) {
  const tenantId =
    req.headers["x-tenant-id"] ||
    req.body?.tenant_id ||
    req.query?.tenant_id ||
    "public-guest";

  const tenant = await getTenantConfig(tenantId);

  if (!tenant) {
    return res.status(401).json({
      error: "Unauthorized Tenant",
      message: `Invalid or unregistered x-tenant-id: '${tenantId}'. Please register your tenant in Zorvik AI.`,
    });
  }

  if (!tenant.is_active) {
    return res.status(403).json({
      error: "Tenant Suspended",
      message: `Tenant '${tenantId}' is currently inactive or suspended.`,
    });
  }

  // Rate Limiting Check (Per Minute Window)
  const windowSec = 60;
  const rateLimitKey = `zorvik:ratelimit:${tenantId}:${Math.floor(Date.now() / (windowSec * 1000))}`;
  const currentCount = await redis.incr(rateLimitKey);
  if (currentCount === 1) {
    await redis.expire(rateLimitKey, windowSec);
  }

  const limit = tenant.rate_limit_per_minute || 60;
  const remaining = Math.max(0, limit - currentCount);

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", windowSec - (Math.floor(Date.now() / 1000) % windowSec));

  if (currentCount > limit) {
    return res.status(429).json({
      error: "Rate Limit Exceeded",
      message: `Tenant '${tenantId}' has exceeded its rate limit of ${limit} requests per minute.`,
      retry_after_seconds: windowSec - (Math.floor(Date.now() / 1000) % windowSec),
    });
  }

  req.tenant = tenant;
  next();
}

/**
 * Deduct estimated tokens from tenant's monthly quota and trigger threshold warnings
 * @param {string} tenantId
 * @param {number} tokens
 * @returns {Promise<{ used: number, quota: number, pct: number, warning: string | null }>}
 */
async function deductTenantTokens(tenantId, tokens = 0) {
  if (!tenantId || tokens <= 0) return { used: 0, quota: 0, pct: 0, warning: null };
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  const quotaKey = `zorvik:tenant:${tenantId}:tokens:${currentMonth}`;

  try {
    const totalUsed = await redis.incrby(quotaKey, tokens);
    const tenant = await getTenantConfig(tenantId);
    const quota = tenant?.monthly_token_quota || 5000000;
    const pct = (totalUsed / quota) * 100;

    let warning = null;
    if (pct >= 100) {
      warning = `CRITICAL: Monthly token quota exhausted (${totalUsed.toLocaleString()} / ${quota.toLocaleString()}).`;
      console.warn(`[Quota Alert] Tenant ${tenantId} reached 100% quota limit.`);
    } else if (pct >= 80) {
      warning = `WARNING: Monthly token quota reached ${pct.toFixed(1)}% (${totalUsed.toLocaleString()} / ${quota.toLocaleString()}).`;
      console.warn(`[Quota Alert] Tenant ${tenantId} reached 80% threshold.`);
    }

    return {
      used: totalUsed,
      quota,
      pct: Number(pct.toFixed(2)),
      warning,
    };
  } catch (_err) {
    return { used: 0, quota: 0, pct: 0, warning: null };
  }
}

module.exports = {
  tenantAuthMiddleware,
  getTenantConfig,
  deductTenantTokens,
  DEFAULT_TENANTS,
};
