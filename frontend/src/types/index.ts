export type Role = 'user' | 'assistant' | 'system';

export type ModelMode = 'auto' | 'casual' | 'deep' | 'code';

export interface SourceItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface ReasoningStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed';
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  model?: string;
  intent?: string;
  isStreaming?: boolean;
  error?: boolean;
  sources?: SourceItem[];
  reasoningSteps?: ReasoningStep[];
  relatedQuestions?: string[];
  durationMs?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  email: string | null;
  isGuest: boolean;
}

export interface AutocompleteSuggestion {
  text: string;
  confidence?: number;
}

