import { ModelMode, SourceItem } from '../types';
import { getSupabase } from './supabase';

const API_BASE = '/api/v1';

export interface StreamChatOptions {
  message: string;
  sessionId: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  mode?: ModelMode;
  onChunk: (chunk: string) => void;
  onDone: (fullText: string, metadata?: { model?: string; intent?: string; sources?: SourceItem[]; relatedQuestions?: string[] }) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Stream a chat response from the Zorvik AI microservice API
 */
export async function streamChat({
  message,
  sessionId,
  history = [],
  mode = 'auto',
  onChunk,
  onDone,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Attach active Supabase Auth JWT token if present
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      } catch {
        // Fallback for non-session requests
      }
    }

    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        prompt: message,
        session_id: sessionId,
        history,
        mode,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let modelMetadata: string | undefined;
    let intentMetadata: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const chunkText = parsed.content ?? parsed.token ?? parsed.text ?? parsed.response;
          if (chunkText !== undefined && chunkText !== null && chunkText !== '') {
            accumulatedText += chunkText;
            onChunk(chunkText);
          }
          if (parsed.model) {
            modelMetadata = parsed.model;
          }
          if (parsed.intent) {
            intentMetadata = parsed.intent;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (err: unknown) {
          // If not JSON, append as raw text chunk
          if (dataStr && !dataStr.startsWith('{')) {
            accumulatedText += dataStr;
            onChunk(dataStr);
          } else if (err instanceof Error && err.message !== 'Unexpected token') {
            console.warn('[Stream Parse Warning]:', err);
          }
        }
      }
    }

    onDone(accumulatedText, { model: modelMetadata, intent: intentMetadata });
  } catch (error: unknown) {
    if (signal?.aborted) {
      console.log('[Stream Aborted by User]');
      return;
    }
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Fetch predictive next-token autocomplete hint
 */
export async function fetchAutocomplete(prompt: string, signal?: AbortSignal): Promise<string | null> {
  if (!prompt || prompt.length < 3) return null;
  try {
    const response = await fetch(`${API_BASE}/autocomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.suggestion || null;
  } catch {
    return null;
  }
}

export interface UserMemoryItem {
  id: string;
  text: string;
  createdAt: number;
}

export interface UserPreferences {
  customInstructions: string;
  tone: string;
}

/**
 * Fetch user personalization preferences and long-term memories
 */
export async function fetchUserMemories(): Promise<{ preferences: UserPreferences; memories: UserMemoryItem[] }> {
  const supabase = getSupabase();
  const headers: Record<string, string> = {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  const res = await fetch(`${API_BASE}/user/memories`, { headers });
  if (!res.ok) throw new Error('Failed to fetch user memories');
  return res.json();
}

/**
 * Save user custom instructions, tone, or append a new memory fact
 */
export async function saveUserMemory(payload: {
  text?: string;
  preferences?: Partial<UserPreferences>;
}): Promise<{ preferences: UserPreferences; memories: UserMemoryItem[] }> {
  const supabase = getSupabase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  const res = await fetch(`${API_BASE}/user/memories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save memory or preferences');
  return res.json();
}

/**
 * Delete a specific memory fact or all memories (id === 'all')
 */
export async function deleteUserMemory(id: string): Promise<{ memories: UserMemoryItem[] }> {
  const supabase = getSupabase();
  const headers: Record<string, string> = {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  const res = await fetch(`${API_BASE}/user/memories/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete memory');
  return res.json();
}

