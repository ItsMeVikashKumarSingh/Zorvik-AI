import { ModelMode, SourceItem, FileAttachment } from '../types';
import { getSupabase } from './supabase';

const API_BASE = '/api/v1';

export interface StreamChatOptions {
  message: string;
  sessionId: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  mode?: ModelMode;
  files?: FileAttachment[];
  onChunk: (chunk: string) => void;
  onDone: (
    fullText: string,
    metadata?: { model?: string; responseType?: string; intent?: string; sources?: SourceItem[]; relatedQuestions?: string[] }
  ) => void;
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
  files = [],
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

    // Format file attachments for backend
    const formattedFiles = files.map((f) => ({
      name: f.name,
      mimeType: f.mimeType || f.type,
      base64: f.base64 || (f.dataUrl.includes(',') ? f.dataUrl.split(',')[1] : f.dataUrl),
    }));

    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        prompt: message,
        session_id: sessionId,
        history,
        mode,
        files: formattedFiles,
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
    let responseTypeMetadata: string | undefined;
    let intentMetadata: string | undefined;
    let sourcesMetadata: SourceItem[] = [];

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
          if (parsed.responseType || parsed.response_type) {
            responseTypeMetadata = parsed.responseType || parsed.response_type;
          }
          if (parsed.intent) {
            intentMetadata = parsed.intent;
          }
          if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
            sourcesMetadata = parsed.sources;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (err: unknown) {
          if (dataStr && !dataStr.startsWith('{')) {
            accumulatedText += dataStr;
            onChunk(dataStr);
          } else if (err instanceof Error && err.message !== 'Unexpected token') {
            console.warn('[Stream Parse Warning]:', err);
          }
        }
      }
    }

    onDone(accumulatedText, {
      model: modelMetadata,
      responseType: responseTypeMetadata,
      intent: intentMetadata,
      sources: sourcesMetadata,
    });
  } catch (error: unknown) {
    if (signal?.aborted) {
      console.log('[Stream Aborted by User]');
      return;
    }
    onError(error instanceof Error ? error : new Error(String(error)));
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
  persona?: string;
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
