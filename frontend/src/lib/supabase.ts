import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!SUPABASE_URL &&
    !!SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseInstance && isSupabaseAvailable()) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase Init Error]:', err);
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

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  return client.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  return client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
    },
  });
}

export async function sendPasswordResetEmail(email: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  return client.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
  });
}

export async function updateUserPassword(password: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  return client.auth.updateUser({ password });
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  return client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
    },
  });
}

export async function signOutUser() {
  const client = getSupabase();
  if (client) {
    await client.auth.signOut();
  }
}
