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
          flowType: 'pkce',
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

export async function resendVerificationEmail(email: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }
  return client.auth.resend({
    type: 'signup',
    email,
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

/**
 * Sync custom personas to user's Supabase account metadata and localStorage
 */
export async function saveUserPersonas(personas: unknown[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zorvik_custom_characters', JSON.stringify(personas));
    } catch (_e) {
      // Non-blocking
    }
  }

  const client = getSupabase();
  if (!client) return;

  try {
    const { data } = await client.auth.getUser();
    if (data?.user) {
      await client.auth.updateUser({
        data: { custom_personas: personas },
      });
    }
  } catch (err) {
    console.warn('[Persona Cloud Sync Warning]:', err);
  }
}

/**
 * Load custom personas from Supabase account metadata (or fallback to localStorage)
 */
export async function loadUserPersonas(): Promise<unknown[]> {
  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client.auth.getUser();
      const cloudPersonas = data?.user?.user_metadata?.custom_personas;
      if (Array.isArray(cloudPersonas) && cloudPersonas.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('zorvik_custom_characters', JSON.stringify(cloudPersonas));
        }
        return cloudPersonas;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('zorvik_custom_characters');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Return empty array
    }
  }

  return [];
}

/**
 * Sync project workspaces & knowledge folders to user's Supabase account metadata and localStorage
 */
export async function saveUserWorkspaces(workspaces: unknown[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zorvik_project_workspaces', JSON.stringify(workspaces));
    } catch (_e) {
      // Non-blocking
    }
  }

  const client = getSupabase();
  if (!client) return;

  try {
    const { data } = await client.auth.getUser();
    if (data?.user) {
      await client.auth.updateUser({
        data: { project_workspaces: workspaces },
      });
    }
  } catch (err) {
    console.warn('[Workspace Cloud Sync Warning]:', err);
  }
}

/**
 * Load project workspaces from Supabase account metadata (or fallback to localStorage)
 */
export async function loadUserWorkspaces(): Promise<unknown[]> {
  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client.auth.getUser();
      const cloudWorkspaces = data?.user?.user_metadata?.project_workspaces;
      if (Array.isArray(cloudWorkspaces) && cloudWorkspaces.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('zorvik_project_workspaces', JSON.stringify(cloudWorkspaces));
        }
        return cloudWorkspaces;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('zorvik_project_workspaces');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Return empty array
    }
  }

  return [];
}


