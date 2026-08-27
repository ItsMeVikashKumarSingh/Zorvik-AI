/**
 * Automated Test Suite for Zorvik AI Microservice
 * Run with: npm test
 */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

const app = require("../server");

let server;
const TEST_PORT = 3199;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

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

  test("POST /api/v1/predict should return next word suggestions", async () => {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "how to build a react" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.next_words));
    assert.ok(data.next_words.length > 0);
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

  test("POST /api/v1/chat should reject empty prompt with 400", async () => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "   " }),
    });
    assert.strictEqual(res.status, 400);
  });
});
