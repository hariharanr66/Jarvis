import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus, Message, Conversation } from '../types/jarvis';
import * as api from '../services/api';

export function useChat(
  activeConversation: Conversation | null,
  setActiveConversation: (conv: Conversation | null) => void,
  onConversationCreatedOrUpdated: () => void
) {
  const [isThinking, setIsThinking] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Poll system health
  const checkSystemHealth = useCallback(async () => {
    try {
      const status = await api.checkHealth();
      setHealth(status);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 15000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  // Send message flow
  const sendChatMessage = async (userText: string) => {
    if (!userText.trim()) return;

    setChatError(null);
    setIsThinking(true);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation?.id || '',
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };

    // Optimistic UI update
    if (activeConversation) {
      setActiveConversation({
        ...activeConversation,
        messages: [...(activeConversation.messages || []), tempUserMsg]
      });
    }

    try {
      const result = await api.sendMessage(userText, activeConversation?.id);
      
      // Refresh full conversation state
      const updatedConv = await api.fetchConversationDetails(result.conversation_id);
      setActiveConversation(updatedConv);
      onConversationCreatedOrUpdated();
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred while communicating with JARVIS.';
      setChatError(errorMsg);

      // Append error message as assistant notice so interface doesn't freeze
      const systemErrorMsg: Message = {
        id: `error-${Date.now()}`,
        conversation_id: activeConversation?.id || '',
        role: 'assistant',
        content: `⚠️ **JARVIS System Notice:** ${errorMsg}`,
        created_at: new Date().toISOString()
      };

      if (activeConversation) {
        setActiveConversation({
          ...activeConversation,
          messages: [...(activeConversation.messages || []), systemErrorMsg]
        });
      }
    } finally {
      setIsThinking(false);
    }
  };

  return {
    isThinking,
    health,
    chatError,
    sendChatMessage,
    refreshHealth: checkSystemHealth
  };
}
