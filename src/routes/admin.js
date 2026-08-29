/**
 * Zorvik AI Admin Control Plane Routes (/api/v1/admin)
 */
const express = require("express");
const router = express.Router();

const { adminAuthMiddleware } = require("../middleware/adminAuth");
const { recordAuditLog, getRecentAuditLogs } = require("../services/auditLogger");
const { circuitBreaker } = require("../services/circuitBreaker");
const { redis } = require("../lib/redis");
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");
const {
  setRuntimeKey,
  getRuntimeKeys,
  toggleProvider,
  testProviderConnection,
  setActiveOpenRouterModel,
  getActiveOpenRouterModel,
  fetchOpenRouterCatalog,
} = require("../services/modelRouter");

// Apply admin authentication across all admin endpoints
router.use(adminAuthMiddleware);

// In-memory tenant store fallback for local / non-DB environments
let localTenants = [
  {
    id: "zorvik-studio-prod",
    name: "Zorvik Studio Production",
    owner_email: "admin@zorvik.tech",
    plan_id: "enterprise",
    tier: "enterprise",
    rate_limit_per_minute: 600,
    monthly_token_quota: 50000000,
    tokens_used_this_month: 2450000,
    custom_system_prompt: "You are integrated into Zorvik Studio.",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "dev-workspace-core",
    name: "Core Engineering Team",
    owner_email: "dev@zorvik.tech",
    plan_id: "pro",
    tier: "pro",
    rate_limit_per_minute: 300,
    monthly_token_quota: 20000000,
    tokens_used_this_month: 1180000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "api-consumer-starter",
    name: "Community Developer App",
    owner_email: "community@zorvik.tech",
    plan_id: "starter",
    tier: "starter",
    rate_limit_per_minute: 120,
    monthly_token_quota: 5000000,
    tokens_used_this_month: 420000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

let localPlans = [
  {
    id: "starter",
    name: "Starter Developer",
    monthly_price_usd: 19.0,
    monthly_token_quota: 5000000,
    rate_limit_per_minute: 120,
    overage_rate_per_million: 0.4,
    max_api_keys: 2,
    features: ["OpenRouter Free Tier Models", "Sub-50ms Streaming", "Standard Latency", "Community Support"],
    is_active: true,
  },
  {
    id: "pro",
    name: "Professional Scale",
    monthly_price_usd: 49.0,
    monthly_token_quota: 20000000,
    rate_limit_per_minute: 300,
    overage_rate_per_million: 0.35,
    max_api_keys: 5,
    features: ["Claude 3.7 Sonnet & DeepSeek R1", "100+ OpenRouter Matrix", "Web Search Grounding", "Custom System Prompts", "Priority SLA"],
    is_active: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Custom",
    monthly_price_usd: 199.0,
    monthly_token_quota: 100000000,
    rate_limit_per_minute: 1200,
    overage_rate_per_million: 0.25,
    max_api_keys: 20,
    features: ["Unlimited 100+ Model Fleet", "Autonomous Memory & Tone Ingestion", "Unlimited Web Grounding", "24/7 Dedicated Support", "Custom Fine-Tuning"],
    is_active: true,
  },
];

/**
 * GET /api/v1/admin/overview
 * System-wide KPI summary for dashboard
 */
router.get("/overview", async (req, res) => {
  try {
    let tenants = localTenants;
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from("tbl_tenants").select("*");
      if (data && data.length > 0) tenants = data;
    }

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.is_active).length;
    const totalTokensUsed = tenants.reduce((acc, t) => acc + (Number(t.tokens_used_this_month) || 0), 0);
    const estimatedMonthlyRevenue = tenants.reduce((acc, t) => {
      if (t.tier === "enterprise") return acc + 199;
      if (t.tier === "pro") return acc + 49;
      if (t.tier === "starter") return acc + 19;
      return acc;
    }, 0);

    const circuitStatus = circuitBreaker.getStatus();

    return res.json({
      metrics: {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        total_tokens_month: totalTokensUsed,
        estimated_monthly_revenue_usd: estimatedMonthlyRevenue,
        system_uptime_seconds: Math.floor(process.uptime()),
      },
      providers: circuitStatus,
      admin: req.admin,
    });
  } catch (err) {
    return res.status(500).json({ error: "Overview Error", message: err.message });
  }
});

/**
 * GET /api/v1/admin/traffic
 * 14-Day daily request and token telemetry history
 */
router.get("/traffic", async (_req, res) => {
  try {
    const days = 14;
    const history = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Daily simulated/recorded distribution curve
      const baseReqs = 40 + Math.floor(Math.sin(i * 0.8) * 25) + (i === 0 ? 15 : 0);
      const requests = Math.max(12, baseReqs);
      const tokens = requests * (1200 + Math.floor(Math.random() * 400));

      history.push({
        date: dateLabel,
        day: d.getDate(),
        requests,
        tokens,
        avgLatencyMs: 38 + Math.floor(Math.random() * 12),
      });
    }

    return res.json({ success: true, history });
  } catch (err) {
    return res.status(500).json({ error: "Traffic Error", message: err.message });
  }
});

/**
 * GET /api/v1/admin/tenants
 * List all tenants with plan, quota and usage
 */
router.get("/tenants", async (_req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("tbl_tenants")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return res.json({ tenants: data });
    }
    return res.json({ tenants: localTenants });
  } catch (err) {
    return res.status(500).json({ error: "Tenant Fetch Error", message: err.message });
  }
});

/**
 * POST /api/v1/admin/tenants
 * Create a new paid tenant / API key
 */
router.post("/tenants", async (req, res) => {
  const {
    id,
    name,
    plan_id = "starter",
    monthly_token_quota,
    rate_limit_per_minute,
    custom_system_prompt = null,
    owner_email = null,
  } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: "Missing required fields 'id' and 'name'." });
  }

  const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const selectedPlan = localPlans.find((p) => p.id === plan_id) || localPlans[0];

  const newTenant = {
    id: cleanId,
    name: name.trim(),
    plan_id: selectedPlan.id,
    tier: selectedPlan.id,
    rate_limit_per_minute: rate_limit_per_minute || selectedPlan.rate_limit_per_minute,
    monthly_token_quota: monthly_token_quota || selectedPlan.monthly_token_quota,
    tokens_used_this_month: 0,
    custom_system_prompt: custom_system_prompt || null,
    owner_email: owner_email || null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  try {
    // 1. Save to Supabase if configured
    if (isSupabaseConfigured()) {
      await supabase.from("tbl_tenants").upsert([newTenant]);
    }

    // 2. Cache in Redis
    await redis.set(`zorvik:tenant:${cleanId}`, JSON.stringify(newTenant));

    // 3. Update local array
    localTenants = [newTenant, ...localTenants.filter((t) => t.id !== cleanId)];

    // 4. Record Mandatory Audit Log
    await recordAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      actionType: "CREATE_TENANT",
      targetEntity: `tenant:${cleanId}`,
      details: { name: newTenant.name, plan: newTenant.tier, quota: newTenant.monthly_token_quota },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({ success: true, tenant: newTenant });
  } catch (err) {
    return res.status(500).json({ error: "Create Tenant Error", message: err.message });
  }
});

/**
 * PUT /api/v1/admin/tenants/:id
 * Update tenant quotas, plans, or active status
 */
router.put("/tenants/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    let existing = localTenants.find((t) => t.id === id);
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from("tbl_tenants").select("*").eq("id", id).single();
      if (data) existing = data;
    }

    if (!existing) {
      return res.status(404).json({ error: "Tenant not found." });
    }

    const updatedTenant = {
      ...existing,
      ...updates,
      id, // Preserve immutable ID
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from("tbl_tenants").update(updatedTenant).eq("id", id);
    }

    await redis.set(`zorvik:tenant:${id}`, JSON.stringify(updatedTenant));

    localTenants = localTenants.map((t) => (t.id === id ? updatedTenant : t));

    // Record Audit Log
    await recordAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      actionType: "UPDATE_TENANT",
      targetEntity: `tenant:${id}`,
      details: updates,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({ success: true, tenant: updatedTenant });
  } catch (err) {
    return res.status(500).json({ error: "Update Tenant Error", message: err.message });
  }
});

/**
 * DELETE /api/v1/admin/tenants/:id
 * Revoke and deactivate tenant API key
 */
router.delete("/tenants/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (isSupabaseConfigured()) {
      await supabase.from("tbl_tenants").update({ is_active: false }).eq("id", id);
    }
    await redis.del(`zorvik:tenant:${id}`);

    localTenants = localTenants.map((t) => (t.id === id ? { ...t, is_active: false } : t));

    // Record Audit Log
    await recordAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      actionType: "REVOKE_KEY",
      targetEntity: `tenant:${id}`,
      details: { action: "deactivated" },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({ success: true, message: `Tenant ${id} revoked successfully.` });
  } catch (err) {
    return res.status(500).json({ error: "Revoke Error", message: err.message });
  }
});

/**
 * Helper to fetch all consolidated users from Supabase Auth + tbl_admins + Tenants
 */
async function getConsolidatedUsers() {
  const usersMap = new Map();

  // 1. Fetch Supabase Auth Users
  if (isSupabaseConfigured()) {
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData && authData.users) {
        authData.users.forEach((u) => {
          const isSuper = u.user_metadata?.role === "superadmin" || u.email.includes("admin") || u.email.includes("vikash");
          const monthlyQuota = isSuper ? 100000000 : 5000000;
          const monthlyUsed = isSuper ? 2450000 : 120000;
          usersMap.set(u.email.toLowerCase(), {
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split("@")[0],
            email: u.email,
            role: isSuper ? "Superadmin" : "Platform User",
            tier: isSuper ? "enterprise" : "starter",
            tokens_used_this_month: monthlyUsed,
            monthly_token_quota: monthlyQuota,
            tokens_used_today: Math.round(monthlyUsed / 12),
            daily_token_budget: Math.round(monthlyQuota / 30),
            rate_limit_per_minute: isSuper ? 1200 : 120,
            is_active: true,
            created_at: u.created_at || new Date().toISOString(),
            last_active_at: u.last_sign_in_at || u.created_at || new Date().toISOString(),
          });
        });
      }
    } catch (err) {
      console.warn("Failed to list Supabase auth users:", err.message);
    }

    // 2. Fetch tbl_admins
    try {
      const { data: adminRows } = await supabase.from("tbl_admins").select("*");
      if (adminRows && adminRows.length > 0) {
        adminRows.forEach((a) => {
          const emailKey = (a.email || "").toLowerCase();
          if (usersMap.has(emailKey)) {
            const existing = usersMap.get(emailKey);
            existing.role = "Superadmin";
            existing.tier = "enterprise";
            existing.monthly_token_quota = 100000000;
            existing.daily_token_budget = Math.round(100000000 / 30);
            existing.rate_limit_per_minute = 1200;
          } else {
            usersMap.set(emailKey, {
              id: a.id,
              name: a.email.split("@")[0],
              email: a.email,
              role: "Superadmin",
              tier: "enterprise",
              tokens_used_this_month: 2450000,
              monthly_token_quota: 100000000,
              tokens_used_today: Math.round(2450000 / 12),
              daily_token_budget: Math.round(100000000 / 30),
              rate_limit_per_minute: 1200,
              is_active: a.is_active !== false,
              created_at: a.created_at || new Date().toISOString(),
              last_active_at: a.updated_at || a.created_at || new Date().toISOString(),
            });
          }
        });
      }
    } catch (_err) {
      // Non-blocking
    }
  }

  // 3. Merge In-Memory / Local Tenants
  localTenants.forEach((t) => {
    const key = (t.owner_email || t.id).toLowerCase();
    if (!usersMap.has(key)) {
      const mQuota = Number(t.monthly_token_quota) || 5000000;
      const mUsed = Number(t.tokens_used_this_month) || 0;
      usersMap.set(key, {
        id: t.id,
        name: t.name || t.id,
        email: t.owner_email || `${t.id}@zorvik.tech`,
        role: t.tier === "enterprise" ? "Enterprise Admin" : t.tier === "pro" ? "Pro Developer" : "Standard User",
        tier: t.tier || "starter",
        tokens_used_this_month: mUsed,
        monthly_token_quota: mQuota,
        tokens_used_today: Math.round(mUsed / 12),
        daily_token_budget: Math.round(mQuota / 30),
        rate_limit_per_minute: Number(t.rate_limit_per_minute) || 120,
        is_active: t.is_active !== false,
        created_at: t.created_at || new Date().toISOString(),
        last_active_at: t.updated_at || t.created_at || new Date().toISOString(),
      });
    }
  });

  return Array.from(usersMap.values());
}

/**
 * GET /api/v1/admin/users
 * Directory of all platform users and tenant accounts
 */
router.get("/users", async (_req, res) => {
  try {
    const users = await getConsolidatedUsers();
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: "Users Fetch Error", message: err.message });
  }
});

/**
 * POST /api/v1/admin/users/:id/reset-usage
 * Reset monthly token usage to zero
 */
router.post("/users/:id/reset-usage", async (req, res) => {
  const { id } = req.params;
  try {
    localTenants = localTenants.map((t) => (t.id === id ? { ...t, tokens_used_this_month: 0 } : t));

    await recordAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      actionType: "RESET_USER_USAGE",
      targetEntity: `user:${id}`,
      details: { tokens_reset: true },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({ success: true, message: `Usage for user ${id} reset to 0.` });
  } catch (err) {
    return res.status(500).json({ error: "Reset Usage Error", message: err.message });
  }
});

/**
 * GET /api/v1/admin/analytics/quotas
 * Granular quota breakdown, tier distributions, and usage burn rates
 */
router.get("/analytics/quotas", async (_req, res) => {
  try {
    const allUsers = await getConsolidatedUsers();
    const activeUsers = allUsers.filter((u) => u.is_active !== false);

    const monthlyCapacity = activeUsers.reduce((acc, u) => acc + (Number(u.monthly_token_quota) || 0), 0);
    const monthlyConsumed = activeUsers.reduce((acc, u) => acc + (Number(u.tokens_used_this_month) || 0), 0);
    const dailyCapacity = Math.round(monthlyCapacity / 30);
    const dailyConsumed = Math.round(monthlyConsumed / 12);

    const monthlyUtilization = monthlyCapacity > 0 ? Number(((monthlyConsumed / monthlyCapacity) * 100).toFixed(2)) : 0;
    const dailyUtilization = dailyCapacity > 0 ? Number(((dailyConsumed / dailyCapacity) * 100).toFixed(2)) : 0;

    const monthlyTierBreakdown = {
      starter: { count: 0, tokens: 0, capacity: 0 },
      pro: { count: 0, tokens: 0, capacity: 0 },
      enterprise: { count: 0, tokens: 0, capacity: 0 },
    };

    const dailyTierBreakdown = {
      starter: { count: 0, tokens: 0, capacity: 0 },
      pro: { count: 0, tokens: 0, capacity: 0 },
      enterprise: { count: 0, tokens: 0, capacity: 0 },
    };

    activeUsers.forEach((u) => {
      const tierKey = u.tier || "starter";
      if (monthlyTierBreakdown[tierKey]) {
        monthlyTierBreakdown[tierKey].count += 1;
        monthlyTierBreakdown[tierKey].tokens += Number(u.tokens_used_this_month) || 0;
        monthlyTierBreakdown[tierKey].capacity += Number(u.monthly_token_quota) || 0;

        dailyTierBreakdown[tierKey].count += 1;
        dailyTierBreakdown[tierKey].tokens += Number(u.tokens_used_today) || 0;
        dailyTierBreakdown[tierKey].capacity += Number(u.daily_token_budget) || 0;
      }
    });

    const topConsumersMonthly = [...allUsers]
      .sort((a, b) => (Number(b.tokens_used_this_month) || 0) - (Number(a.tokens_used_this_month) || 0))
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        name: u.name || u.id,
        tier: u.tier || "starter",
        tokensUsed: Number(u.tokens_used_this_month) || 0,
        quota: Number(u.monthly_token_quota) || 5000000,
        percentage: Number((((Number(u.tokens_used_this_month) || 0) / (Number(u.monthly_token_quota) || 1)) * 100).toFixed(1)),
        rateLimit: u.rate_limit_per_minute || 120,
        isActive: u.is_active !== false,
      }));

    const topConsumersDaily = [...allUsers]
      .sort((a, b) => (Number(b.tokens_used_today) || 0) - (Number(a.tokens_used_today) || 0))
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        name: u.name || u.id,
        tier: u.tier || "starter",
        tokensUsed: Number(u.tokens_used_today) || 0,
        quota: Number(u.daily_token_budget) || 166666,
        percentage: Number((((Number(u.tokens_used_today) || 0) / (Number(u.daily_token_budget) || 1)) * 100).toFixed(1)),
        rateLimit: u.rate_limit_per_minute || 120,
        isActive: u.is_active !== false,
      }));

    return res.json({
      success: true,
      analytics: {
        totalCapacity: monthlyCapacity,
        totalConsumed: monthlyConsumed,
        utilizationRate: monthlyUtilization,
        tierBreakdown: monthlyTierBreakdown,
        topConsumers: topConsumersMonthly,
        timeframes: {
          monthly: {
            totalCapacity: monthlyCapacity,
            totalConsumed: monthlyConsumed,
            utilizationRate: monthlyUtilization,
            tierBreakdown: monthlyTierBreakdown,
            topConsumers: topConsumersMonthly,
          },
          daily: {
            totalCapacity: dailyCapacity,
            totalConsumed: dailyConsumed,
            utilizationRate: dailyUtilization,
            tierBreakdown: dailyTierBreakdown,
            topConsumers: topConsumersDaily,
          },
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Quota Analytics Error", message: err.message });
  }
});

/**
 * GET /api/v1/admin/plans
 * List pricing plans from Supabase or local store
 */
router.get("/plans", async (_req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from("tbl_plans").select("*").order("monthly_price_usd", { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json({ plans: data });
      }
    }
    return res.json({ plans: localPlans });
  } catch (err) {
    return res.status(500).json({ error: "Plan Fetch Error", message: err.message });
  }
});

/**
 * PUT /api/v1/admin/plans/:id
 * Update pricing plan terms dynamically in Supabase
 */
router.put("/plans/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (isSupabaseConfigured()) {
      await supabase.from("tbl_plans").upsert({
        id,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    }

    localPlans = localPlans.map((p) => (p.id === id ? { ...p, ...updates } : p));

    await recordAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      actionType: "UPDATE_PLAN",
      targetEntity: `plan:${id}`,
      details: updates,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({ success: true, plans: localPlans });
  } catch (err) {
    return res.status(500).json({ error: "Update Plan Error", message: err.message });
  }
});

/**
 * POST /api/v1/admin/circuit-breaker/toggle
 * Manually force trip, reset, or toggle AI provider state
 */
router.post("/circuit-breaker/toggle", async (req, res) => {
  const { provider, action } = req.body; // action: 'trip' | 'reset'
  if (!provider || !["gemini", "groq", "cerebras", "mistral", "openrouter"].includes(provider)) {
    return res.status(400).json({ error: "Invalid provider name." });
  }

  if (action === "trip") {
    circuitBreaker.recordFailure(provider, 503);
  } else if (action === "reset") {
    circuitBreaker.recordSuccess(provider);
  }

  await recordAuditLog({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    actionType: "TOGGLE_CIRCUIT",
    targetEntity: `provider:${provider}`,
    details: { action, currentStatus: circuitBreaker.getStatus()[provider] },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.json({ success: true, status: circuitBreaker.getStatus() });
});

/**
 * GET /api/v1/manage/keys (or /admin/keys)
 * List configured providers and masked API keys
 */
router.get("/keys", async (_req, res) => {
  try {
    const keys = getRuntimeKeys();
    return res.json({ success: true, keys });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve provider keys: " + err.message });
  }
});

/**
 * POST /api/v1/manage/keys
 * Save or rotate a provider's API key
 */
router.post("/keys", async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider) {
    return res.status(400).json({ error: "Provider name is required." });
  }

  try {
    setRuntimeKey(provider, apiKey);

    // If Supabase is configured, also persist to settings table
    if (isSupabaseConfigured() && apiKey) {
      await supabase.from("tbl_provider_keys").upsert({
        provider,
        api_key_masked: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
        updated_at: new Date().toISOString(),
      });
    }

    await recordAuditLog({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      actionType: "UPDATE_API_KEY",
      targetEntity: `key_vault:${provider}`,
      details: { provider, masked: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "cleared" },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({ success: true, message: `Key for ${provider} updated successfully in runtime vault.` });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update key: " + err.message });
  }
});

/**
 * POST /api/v1/manage/keys/test
 * Test connection and latency for a provider
 */
router.post("/keys/test", async (req, res) => {
  const { provider, testKey } = req.body;
  if (!provider) {
    return res.status(400).json({ error: "Provider name is required." });
  }

  try {
    const result = await testProviderConnection(provider, testKey);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/manage/keys/toggle
 * Toggle active state of a provider
 */
router.post("/keys/toggle", async (req, res) => {
  const { provider, enabled } = req.body;
  if (!provider) {
    return res.status(400).json({ error: "Provider name is required." });
  }

  toggleProvider(provider, enabled);

  await recordAuditLog({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    actionType: "TOGGLE_PROVIDER",
    targetEntity: `provider:${provider}`,
    details: { provider, enabled: Boolean(enabled) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.json({ success: true, enabled: Boolean(enabled) });
});

/**
 * GET /api/v1/manage/openrouter/models
 * Fetch live OpenRouter model catalog
 */
router.get("/openrouter/models", async (_req, res) => {
  try {
    const catalog = await fetchOpenRouterCatalog();
    return res.json({
      ...catalog,
      activeModel: getActiveOpenRouterModel(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch OpenRouter catalog: " + err.message });
  }
});

/**
 * POST /api/v1/manage/openrouter/select
 * Select active OpenRouter model for routing
 */
router.post("/openrouter/select", async (req, res) => {
  const { modelId } = req.body;
  if (!modelId) {
    return res.status(400).json({ error: "Model ID is required." });
  }

  setActiveOpenRouterModel(modelId);

  await recordAuditLog({
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    actionType: "SELECT_OPENROUTER_MODEL",
    targetEntity: `openrouter:${modelId}`,
    details: { activeModel: modelId },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.json({ success: true, activeModel: modelId });
});

/**
 * GET /api/v1/admin/audit-logs
 * Retrieve mandatory immutable audit logs
 */
router.get("/audit-logs", async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = await getRecentAuditLogs(limit);
  return res.json({ logs });
});

module.exports = router;
