import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const triggerPlaceholderToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative max-w-4xl mx-auto w-full px-4 pb-4 sm:pb-6 pt-2">
      {/* Interactive Placeholder Notification Toast */}
      {toastMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-medium shadow-[0_0_15px_rgba(0,240,255,0.2)] animate-fade-in flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Input Box Container */}
      <form 
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-2 sm:p-3 border border-white/15 focus-within:border-cyan-500/50 shadow-[0_0_25px_rgba(0,0,0,0.4)] transition-all flex flex-col gap-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask JARVIS anything..."
          disabled={isLoading}
          rows={1}
          className="w-full bg-transparent resize-none px-2 py-1 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none min-h-[42px] max-h-[180px]"
        />

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => triggerPlaceholderToast("Voice input will arrive in V0.2")}
              className="p-2 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
              title="Voice Input (V0.2)"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => triggerPlaceholderToast("File attachments will arrive in V0.4")}
              className="p-2 rounded-xl text-gray-400 hover:text-purple-400 hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
              title="Attach File (V0.4)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <span className="text-[11px] text-gray-500 hidden sm:inline-block ml-2">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-[10px]">Enter</kbd> to send
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`
              px-4 py-2 rounded-xl font-medium text-xs flex items-center gap-2 transition-all
              ${input.trim() && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer active:scale-95'
                : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}
            `}
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
