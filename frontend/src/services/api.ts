import type { Conversation, ChatResponsePayload, HealthStatus, Memory, MemoryCreatePayload } from '../types/jarvis';

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/conversations`);
  if (!response.ok) {
    throw new Error('Failed to fetch conversation history');
  }
  return response.json();
}

export async function createConversation(title?: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title || 'New Conversation' })
  });
  if (!response.ok) {
    throw new Error('Failed to create new conversation');
  }
  return response.json();
}

export async function fetchConversationDetails(conversationId: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`);
  if (!response.ok) {
    throw new Error(`Failed to load conversation ${conversationId}`);
  }
  return response.json();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete conversation ${conversationId}`);
  }
}

export async function sendMessage(message: string, conversationId?: string | null): Promise<ChatResponsePayload> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId || null,
        message: message
      })
    });
  } catch (netErr: any) {
    throw new Error("Network connection error. Unable to reach JARVIS backend.");
  }
  
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let detailMsg = '';
    if (typeof data.detail === 'object' && data.detail?.error?.message) {
      detailMsg = data.detail.error.message;
    } else if (typeof data.detail === 'string') {
      detailMsg = data.detail;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(detailMsg || "Authentication failed. Please verify your GEMINI_API_KEY in backend/.env.");
    } else if (response.status === 429) {
      throw new Error(detailMsg || "JARVIS rate limit reached. Please try again in a moment.");
    } else if (response.status === 503) {
      throw new Error(detailMsg || "AI service temporarily unavailable. Please try again.");
    } else if (response.status >= 500) {
      throw new Error(detailMsg || "JARVIS backend internal server error.");
    }
    throw new Error(detailMsg || `Server responded with status ${response.status}`);
  }

  if (data.success === false && data.error?.message) {
    throw new Error(data.error.message);
  }
  
  return data;
}

// Memory API Methods
export async function fetchMemories(category?: string, search?: string): Promise<Memory[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/memory?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load user memories');
  }
  return response.json();
}

export async function createMemory(payload: MemoryCreatePayload): Promise<Memory> {
  const response = await fetch(`${API_BASE_URL}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create memory record');
  }
  return response.json();
}

export async function updateMemory(memoryId: string, payload: Partial<MemoryCreatePayload>): Promise<Memory> {
  const response = await fetch(`${API_BASE_URL}/memory/${memoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Failed to update memory record');
  }
  return response.json();
}

export async function deleteMemory(memoryId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/memory/${memoryId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete memory record');
  }
}
