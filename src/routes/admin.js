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

// Apply admin authentication across all admin endpoints
router.use(adminAuthMiddleware);

// In-memory tenant store fallback for local / non-DB environments
let localTenants = [
  {
    id: "zorvik-studio-prod",
    name: "Zorvik Studio Production",
    plan_id: "enterprise",
    tier: "enterprise",
    rate_limit_per_minute: 600,
    monthly_token_quota: 50000000,
    tokens_used_this_month: 1245000,
    custom_system_prompt: "You are integrated into Zorvik Studio.",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "zorviktech-main",
    name: "Zorvik-Tech Primary Platform",
    plan_id: "enterprise",
    tier: "enterprise",
    rate_limit_per_minute: 600,
    monthly_token_quota: 50000000,
    tokens_used_this_month: 3412000,
    custom_system_prompt: "You are integrated into Zorvik-Tech.",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "zconnect-service",
    name: "ZConnect Messaging Platform",
    plan_id: "pro",
    tier: "pro",
    rate_limit_per_minute: 300,
    monthly_token_quota: 20000000,
    tokens_used_this_month: 850000,
    custom_system_prompt: "You are integrated into ZConnect.",
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
    features: ["Gemini 2.5 Flash", "Groq Llama 3.3 70B", "Standard Latency", "Community Support"],
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
    features: ["All Cascade Engines", "Codestral & Cerebras LPU", "Web Search Grounding", "Custom System Prompts", "Priority SLA"],
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
    features: ["Unlimited Model Access", "Dedicated Circuit Breaker", "Unlimited Web Grounding", "24/7 Dedicated Support", "Custom Fine-Tuning"],
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
 * GET /api/v1/admin/plans
 * List pricing plans
 */
router.get("/plans", (_req, res) => {
  return res.json({ plans: localPlans });
});

/**
 * PUT /api/v1/admin/plans/:id
 * Update pricing plan terms
 */
router.put("/plans/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

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
 * GET /api/v1/admin/audit-logs
 * Retrieve mandatory immutable audit logs
 */
router.get("/audit-logs", async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = await getRecentAuditLogs(limit);
  return res.json({ logs });
});

module.exports = router;
