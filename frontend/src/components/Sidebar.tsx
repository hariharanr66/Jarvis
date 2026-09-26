import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Settings, X, Sparkles, Brain } from 'lucide-react';
import type { Conversation } from '../types/jarvis';
import { formatDateGroup } from '../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  memoryCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenMemory,
  memoryCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-0 left-0 bottom-0 z-40
        w-72 sm:w-80 h-full glass-panel border-r border-white/10
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          <button 
            onClick={onClose}
            className="lg:hidden ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-600" />
              <span>{searchQuery ? 'No matching conversations' : 'No previous conversations yet'}</span>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const dateGroup = formatDateGroup(conv.updated_at);

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  className={`
                    group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs
                    ${isActive 
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 border border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.15)]' 
                      : 'hover:bg-white/5 text-gray-300 border border-transparent hover:border-white/5'}
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <div className="truncate font-medium flex-1">
                      {conv.title || 'Untitled Conversation'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                      {dateGroup}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-400 transition-opacity rounded"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => {
              onOpenMemory();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Persistent Memory</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono text-[10px]">
              {memoryCount}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs flex items-center justify-start gap-2"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>JARVIS Preferences</span>
          </button>
        </div>
      </aside>
    </>
  );
};
