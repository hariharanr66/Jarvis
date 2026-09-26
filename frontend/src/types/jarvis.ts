export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Memory {
  id: string;
  user_id?: string | null;
  category: string;
  key: string;
  value: string;
  importance: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryCreatePayload {
  category: string;
  key: string;
  value: string;
  importance?: number;
}

export interface HealthStatus {
  status: string;
  system: string;
  version: string;
  ai_provider: string;
  api_configured: boolean;
  selected_model: string;
  fallback_model: string;
  service_status: string;
  last_error_category?: string | null;
  timestamp: string;
}

export interface ChatRequestPayload {
  conversation_id?: string | null;
  message: string;
}

export interface ChatErrorPayload {
  code: string;
  message: string;
}

export interface ChatResponsePayload {
  success: boolean;
  conversation_id: string;
  message_id?: string;
  message: string;
  timestamp: string;
  error?: ChatErrorPayload;
}
