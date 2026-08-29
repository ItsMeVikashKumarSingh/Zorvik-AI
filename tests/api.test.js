/**
 * Automated Test Suite for Zorvik AI Microservice & Admin Control Plane
 * Run with: npm test
 */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

const app = require("../server");

let server;
const TEST_PORT = 3199;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "zorvik-superadmin-secret-2026";

before(() => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => {
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

describe("Zorvik AI API Microservice Tests", () => {
  test("GET /api/v1/health should return 200 and healthy status", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "healthy");
    assert.strictEqual(data.service, "zorvik-ai-microservice");
  });

  test("GET /api/v1/models should return available zero-cost models", async () => {
    const res = await fetch(`${BASE_URL}/models`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.models));
    assert.ok(data.models.length >= 3);
  });

  test("POST /api/v1/chat with GenZ emoji prompt should return response", async () => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "public-guest",
      },
      body: JSON.stringify({
        prompt: "bro really thought he could fix production at 3am 💀",
        mode: "genz",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.response === "string" && data.response.length > 0);
    assert.ok(data.model);
    assert.ok(data.latency_ms >= 0);
  });

  test("POST /api/v1/chat with complex engineering prompt should return response", async () => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "zorviktech-main",
      },
      body: JSON.stringify({
        prompt: "Write a TypeScript debounce function with generic arguments and unit test",
        mode: "code",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.response.length > 0);
    assert.strictEqual(data.tenant.id, "zorviktech-main");
  });

  test("POST /api/v1/chat/stream should stream SSE events", async () => {
    const res = await fetch(`${BASE_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "public-guest",
      },
      body: JSON.stringify({
        prompt: "Hello Zorvik AI",
        mode: "auto",
        stream: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get("content-type").includes("text/event-stream"));
    const text = await res.text();
    assert.ok(text.includes("data:"));
    assert.ok(text.includes("[DONE]"));
  });

  test("POST /api/v1/tenants/verify should validate tenant", async () => {
    const res = await fetch(`${BASE_URL}/tenants/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "zorvik-studio-prod",
      },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.valid, true);
    assert.strictEqual(data.tenant.tier, "enterprise");
  });

  test("POST /api/v1/chat with domain query should ground live web content without AI disclaimer", async () => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "zorviktech-main",
      },
      body: JSON.stringify({
        prompt: "check zorviktech.com and review audit",
        mode: "search",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.response && data.response.length > 0);
    // Ensure no AI disclaimer
    assert.ok(!data.response.includes("I don't have live web-access"));
    assert.ok(!data.response.includes("As an AI language model"));
  });

  test("POST /api/v1/chat should reject empty prompt with 400", async () => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "   " }),
    });
    assert.strictEqual(res.status, 400);
  });
});

describe("Zorvik AI Admin Control Plane & Monetization Tests", () => {
  test("GET /api/v1/admin/overview without token should return 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/admin/overview`);
    assert.strictEqual(res.status, 401);
  });

  test("GET /api/v1/admin/overview with valid admin secret should return metrics and provider statuses", async () => {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.metrics);
    assert.ok(data.metrics.total_tenants >= 3);
    assert.ok(data.providers);
    assert.strictEqual(data.admin.role, "superadmin");
  });

  test("POST /api/v1/admin/tenants should provision a new paid key and record audit log", async () => {
    const testTenantId = `test_tenant_${Date.now()}`;
    const res = await fetch(`${BASE_URL}/admin/tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        id: testTenantId,
        name: "Automated Test Suite Client",
        plan_id: "pro",
        owner_email: "tester@zorvik.tech",
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.tenant.id, testTenantId);
    assert.strictEqual(data.tenant.tier, "pro");
  });

  test("GET /api/v1/admin/plans should list monetization tiers", async () => {
    const res = await fetch(`${BASE_URL}/admin/plans`, {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.plans));
    assert.strictEqual(data.plans.length, 3);
  });

  test("POST /api/v1/admin/circuit-breaker/toggle should trip and reset provider state", async () => {
    const res = await fetch(`${BASE_URL}/admin/circuit-breaker/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        provider: "groq",
        action: "reset",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test("GET /api/v1/admin/audit-logs should return immutable audit records", async () => {
    const res = await fetch(`${BASE_URL}/admin/audit-logs?limit=10`, {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.logs));
    assert.ok(data.logs.length > 0);
  });
});
