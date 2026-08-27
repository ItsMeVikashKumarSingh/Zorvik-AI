import { ModelMode } from '../types';

const API_BASE = '/api/v1';

export interface StreamChatOptions {
  message: string;
  sessionId: string;
  mode?: ModelMode;
  onChunk: (chunk: string) => void;
  onDone: (fullText: string, metadata?: { model?: string; intent?: string }) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Stream a chat response from the Zorvik AI microservice API
 */
export async function streamChat({
  message,
  sessionId,
  mode = 'auto',
  onChunk,
  onDone,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        mode,
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
          if (parsed.content) {
            accumulatedText += parsed.content;
            onChunk(parsed.content);
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
