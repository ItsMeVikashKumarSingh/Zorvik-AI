import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sample.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sample-key';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseInstance && SUPABASE_URL !== 'https://sample.supabase.co') {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.warn('[Supabase Init Warning]:', err);
    }
  }
  return supabaseInstance;
}

export function getOrCreateGuestId(): string {
  const KEY = 'zorvik_guest_id';
  let guestId = localStorage.getItem(KEY);
  if (!guestId) {
    guestId = 'guest_' + crypto.randomUUID();
    localStorage.setItem(KEY, guestId);
  }
  return guestId;
}
