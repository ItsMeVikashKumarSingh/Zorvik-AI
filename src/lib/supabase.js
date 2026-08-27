/**
 * Dedicated Supabase Client for Zorvik AI Microservice
 * Provides access to PostgreSQL, pgvector semantic search, and Auth.
 */
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.AI_SUPABASE_URL;
const supabaseServiceKey =
  process.env.AI_SUPABASE_SERVICE_ROLE_KEY || process.env.AI_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn("Failed to initialize dedicated Supabase client:", err.message);
    supabase = null;
  }
}

module.exports = {
  supabase,
  isConfigured: () => Boolean(supabase),
};
