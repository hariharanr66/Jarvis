import { useState, useEffect, useCallback } from 'react';
import type { Conversation } from '../types/jarvis';
import * as api from '../services/api';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.fetchConversations();
      setConversations(data);
    } catch (err: any) {
      console.warn("Could not fetch conversations:", err.message);
    }
  }, []);

  // Load active conversation details
  const selectConversation = useCallback(async (id: string | null) => {
    setActiveConversationId(id);
    if (!id) {
      setActiveConversation(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const detail = await api.fetchConversationDetails(id);
      setActiveConversation(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new conversation
  const createNewConversation = useCallback(async (title?: string) => {
    try {
      const newConv = await api.createConversation(title);
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveConversation({ ...newConv, messages: [] });
      return newConv;
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      return null;
    }
  }, []);

  // Delete conversation
  const removeConversation = useCallback(async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setActiveConversation(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  }, [activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    setActiveConversation,
    isLoading,
    error,
    selectConversation,
    createNewConversation,
    removeConversation,
    loadConversations
  };
}
