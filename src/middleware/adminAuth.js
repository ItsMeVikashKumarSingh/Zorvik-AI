/**
 * Admin Authentication & RBAC Middleware
 * Validates administrative session tokens, enforces expiry, and checks admin role.
 */
const crypto = require("crypto");
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");

function safeSecretCompare(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(String(provided));
  const expectedBuf = Buffer.from(String(expected));
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

async function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const adminSecretHeader = req.headers["x-admin-secret"] || req.headers["x-admin-key"];
  const adminSecretEnv = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_API_KEY;

  // 1. Direct Master Key Authentication (for microservice/system admin tasks)
  if (adminSecretEnv && adminSecretHeader && safeSecretCompare(adminSecretHeader, adminSecretEnv)) {
    req.admin = {
      id: "admin-master-key",
      email: "superadmin@zorvik.tech",
      role: "superadmin",
    };
    return next();
  }

  // 2. Bearer Token Authentication (Supabase Auth JWT)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();

    // Check if token directly matches admin secret
    if (adminSecretEnv && safeSecretCompare(token, adminSecretEnv)) {
      req.admin = {
        id: "admin-master-key",
        email: "superadmin@zorvik.tech",
        role: "superadmin",
      };
      return next();
    }

    if (isSupabaseConfigured()) {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          return res.status(401).json({
            error: "Unauthorized",
            message: "Invalid or expired admin session token.",
          });
        }

        // Verify if user is in tbl_admins or has admin role in app metadata
        const { data: adminRecord } = await supabase
          .from("tbl_admins")
          .select("*")
          .eq("email", user.email)
          .eq("is_active", true)
          .single();

        const hasAdminRole =
          user.app_metadata?.role === "admin" ||
          user.app_metadata?.role === "superadmin" ||
          user.user_metadata?.role === "admin";

        if (!adminRecord && !hasAdminRole) {
          return res.status(403).json({
            error: "Forbidden",
            message: "Access denied. Administrative privileges required.",
          });
        }

        req.admin = {
          id: user.id,
          email: user.email,
          role: adminRecord?.role || "admin",
        };
        return next();
      } catch (err) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication validation failed: " + err.message,
        });
      }
    } else {
      // In local dev without Supabase, accept valid bearer format with mock admin
      req.admin = {
        id: "dev-admin-id",
        email: "admin@zorvik.tech",
        role: "superadmin",
      };
      return next();
    }
  }

  return res.status(401).json({
    error: "Unauthorized",
    message: "Admin authentication token required to access administrative control plane.",
  });
}

module.exports = {
  adminAuthMiddleware,
  safeSecretCompare,
};
