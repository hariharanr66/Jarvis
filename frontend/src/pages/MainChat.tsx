import React, { useState, useRef, useEffect } from 'react';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { SettingsModal } from '../components/SettingsModal';
import { MemoryManagerModal } from '../components/MemoryManagerModal';
import { JarvisOrb } from '../components/JarvisOrb';
import { Sparkles } from 'lucide-react';
import * as api from '../services/api';

export const MainChat: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    activeConversationId,
    activeConversation,
    setActiveConversation,
    selectConversation,
    createNewConversation,
    removeConversation,
    loadConversations
  } = useConversations();

  const loadMemoryCount = async () => {
    try {
      const data = await api.fetchMemories();
      setMemoryCount(data.length);
    } catch {
      setMemoryCount(0);
    }
  };

  useEffect(() => {
    loadMemoryCount();
  }, [memoryOpen]);

  const handleConversationUpdated = () => {
    loadConversations();
    loadMemoryCount();
  };

  const {
    isThinking,
    health,
    sendChatMessage
  } = useChat(activeConversation, setActiveConversation, handleConversationUpdated);

  const messages = activeConversation?.messages || [];

  // Scroll to bottom when messages or thinking state change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isThinking]);

  const handleSelectPrompt = (prompt: string) => {
    sendChatMessage(prompt);
  };

  return (
    <div className="flex flex-col h-screen bg-[#07080c] text-gray-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <TopBar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMemory={() => setMemoryOpen(true)}
        memoryCount={memoryCount}
        health={health}
        isThinking={isThinking}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={() => createNewConversation()}
          onDeleteConversation={removeConversation}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenMemory={() => setMemoryOpen(true)}
          memoryCount={memoryCount}
        />

        {/* Chat Area Container */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#07080c] via-[#090b12] to-[#06070a] relative">
          {/* Subtle Ambient Background Gradient Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* Main View Area */}
          {messages.length === 0 ? (
            <WelcomeScreen
              onSelectPrompt={handleSelectPrompt}
              isThinking={isThinking}
            />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Animated Thinking State Indicator */}
              {isThinking && (
                <div className="flex items-center gap-3 my-4 max-w-4xl mx-auto pl-2 animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                    <JarvisOrb size="sm" state="thinking" />
                  </div>
                  <div className="glass-panel px-4 py-3 rounded-2xl border border-cyan-500/30 flex items-center gap-3 text-xs text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="font-mono tracking-wide">JARVIS is processing & retrieving context...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Chat Input Bar */}
          <ChatInput
            onSendMessage={sendChatMessage}
            isLoading={isThinking}
          />
        </main>
      </div>

      {/* Settings Preferences Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        health={health}
      />

      {/* Persistent Memory Manager Modal */}
      <MemoryManagerModal
        isOpen={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        onMemoriesUpdated={loadMemoryCount}
      />
    </div>
  );
};
