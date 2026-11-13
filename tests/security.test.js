/**
 * Dedicated Security & Authentication Hardening Test Suite for Zorvik AI
 * Verifies VULN-10 (secret fallback elimination) and VULN-11 (safeSecretCompare constant-time checks)
 */
const { test, describe } = require("node:test");
const assert = require("node:assert");
const { safeSecretCompare, adminAuthMiddleware } = require("../src/middleware/adminAuth");

function createMockReqRes(headers = {}) {
  const req = {
    headers: { ...headers },
    admin: null,
  };
  let code = 200;
  let responseData = null;
  const res = {
    status(c) {
      code = c;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    get statusCode() {
      return code;
    },
    get responseData() {
      return responseData;
    },
  };
  return { req, res };
}

describe("Zorvik AI - Timing-Safe Secret Comparison Suite (VULN-11)", () => {
  test("returns true for identical secret strings", () => {
    const secret = "super-secret-key-prod-987654321";
    assert.strictEqual(safeSecretCompare(secret, secret), true);
  });

  test("returns false for different secret strings of same length", () => {
    const s1 = "super-secret-key-prod-987654321";
    const s2 = "super-secret-key-prod-987654322";
    assert.strictEqual(safeSecretCompare(s1, s2), false);
  });

  test("returns false for secrets of differing lengths without throwing", () => {
    assert.strictEqual(safeSecretCompare("short", "much-longer-secret-key"), false);
    assert.strictEqual(safeSecretCompare("much-longer-secret-key", "short"), false);
  });

  test("returns false for empty, null, or undefined values without crashing", () => {
    assert.strictEqual(safeSecretCompare(null, "expected"), false);
    assert.strictEqual(safeSecretCompare("provided", null), false);
    assert.strictEqual(safeSecretCompare(undefined, "expected"), false);
    assert.strictEqual(safeSecretCompare("provided", undefined), false);
    assert.strictEqual(safeSecretCompare("", "expected"), false);
    assert.strictEqual(safeSecretCompare("provided", ""), false);
    assert.strictEqual(safeSecretCompare(null, null), false);
  });

  test("stress test: 100 rapid constant-time comparisons", () => {
    for (let i = 0; i < 100; i++) {
      const key = `dyn_secret_hash_${i}`;
      assert.strictEqual(safeSecretCompare(key, key), true);
      assert.strictEqual(safeSecretCompare(key, `${key}_bad`), false);
    }
  });
});

describe("Zorvik AI - Admin Secret Fallback Elimination (VULN-10)", () => {
  const originalEnv = process.env.ADMIN_SECRET_KEY;

  test("CRITICAL: Rejects legacy hardcoded secret 'zorvik-superadmin-secret-2026' when env is different", async () => {
    process.env.ADMIN_SECRET_KEY = "genuine-production-key-xyz-789";

    const { req, res } = createMockReqRes({
      "x-admin-secret": "zorvik-superadmin-secret-2026",
    });

    let nextCalled = false;
    await adminAuthMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(req.admin, null);
  });

  test("CRITICAL: When ADMIN_SECRET_KEY is empty/unset, does NOT authenticate with default string", async () => {
    delete process.env.ADMIN_SECRET_KEY;
    delete process.env.ADMIN_API_KEY;

    const { req, res } = createMockReqRes({
      "x-admin-secret": "zorvik-superadmin-secret-2026",
    });

    let nextCalled = false;
    await adminAuthMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(req.admin, null);

    // Restore env
    process.env.ADMIN_SECRET_KEY = originalEnv || "test-admin-secret-2026-suite";
  });

  test("Allows authentic requests with exact matching ADMIN_SECRET_KEY", async () => {
    process.env.ADMIN_SECRET_KEY = "test-verified-secret-key-2026";

    const { req, res } = createMockReqRes({
      "x-admin-secret": "test-verified-secret-key-2026",
    });

    let nextCalled = false;
    await adminAuthMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.ok(req.admin);
    assert.strictEqual(req.admin.role, "superadmin");
    assert.strictEqual(req.admin.email, "superadmin@zorvik.tech");

    // Restore env
    process.env.ADMIN_SECRET_KEY = originalEnv || "test-admin-secret-2026-suite";
  });
});
