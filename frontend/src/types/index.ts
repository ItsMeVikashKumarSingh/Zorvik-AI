export type Role = 'user' | 'assistant' | 'system';

export type ModelMode = 'auto' | 'search' | 'deep' | 'code' | 'casual' | 'creative';

export interface SourceItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  base64?: string;
  mimeType?: string;
}

export interface ReasoningStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed';
}

export interface MessageVariant {
  content: string;
  timestamp: number;
  model?: string;
  responseType?: string;
  sources?: SourceItem[];
  relatedQuestions?: string[];
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  model?: string;
  responseType?: string;
  intent?: string;
  isStreaming?: boolean;
  error?: boolean;
  sources?: SourceItem[];
  reasoningSteps?: ReasoningStep[];
  thought?: string;
  thoughtDuration?: number;
  relatedQuestions?: string[];
  durationMs?: number;
  attachments?: FileAttachment[];
  variants?: MessageVariant[];
  activeVariantIndex?: number;
  projectId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  projectId?: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  isGuest: boolean;
}

export interface ArtifactContent {
  id: string;
  title: string;
  language: string;
  code: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: number;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  description: string;
  icon?: string;
  systemInstructions?: string;
  documents: ProjectDocument[];
  sessionIds: string[];
  createdAt: number;
  updatedAt: number;
}

