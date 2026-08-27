/**
 * User & Guest Authentication Middleware
 * Validates Supabase JWTs for account users or extracts/generates guest UUIDs.
 */
const { supabase, isConfigured: isSupabaseConfigured } = require("../lib/supabase");
const { generateUUID } = require("../lib/utils");

async function userAuthMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  req.user = null;
  req.isGuest = true;
  req.guestUUID = req.headers["x-guest-uuid"] || req.body?.guest_uuid || null;

  if (authHeader && authHeader.startsWith("Bearer ") && isSupabaseConfigured()) {
    const token = authHeader.split(" ")[1];
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        req.user = data.user;
        req.isGuest = false;
      }
    } catch (err) {
      console.warn("Supabase token verification failed:", err.message);
    }
  }

  // Ensure every guest session has a persistent UUID
  if (req.isGuest && !req.guestUUID) {
    req.guestUUID = generateUUID();
  }

  next();
}

module.exports = { userAuthMiddleware };
