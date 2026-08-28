/**
 * Dedicated Supabase Client for Zorvik AI Microservice
 * Provides access to PostgreSQL, pgvector semantic search, and Auth.
 */
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.AI_SUPABASE_URL;
const supabaseSecretKey = process.env.AI_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;

let supabase = null;

if (supabaseUrl && supabaseSecretKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseSecretKey, {
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
