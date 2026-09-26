import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Bot } from 'lucide-react';
import type { Message } from '../types/jarvis';
import { formatTime } from '../utils/formatters';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 sm:gap-4 my-4 max-w-4xl mx-auto ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold shadow-md ${
        isUser
          ? 'bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500/40 text-slate-200'
          : 'bg-gradient-to-tr from-cyan-600 to-purple-600 border border-cyan-400/50 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content Card */}
      <div className={`relative group max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm shadow-lg leading-relaxed ${
        isUser
          ? 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white rounded-tr-none border border-cyan-400/30'
          : 'glass-panel text-gray-100 rounded-tl-none border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
      }`}>
        {/* Role Header & Timestamp */}
        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/10 text-[11px] text-gray-400 select-none">
          <span className="font-semibold tracking-wide text-xs">
            {isUser ? 'You' : 'JARVIS'}
          </span>
          <div className="flex items-center gap-2">
            <span>{formatTime(message.created_at)}</span>
            {!isUser && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity text-gray-400 rounded"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Message Content */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="prose prose-invert max-w-none text-sm space-y-2 font-normal leading-relaxed text-slate-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline && (match || codeString.includes('\n'))) {
                    return (
                      <div className="my-3 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950/80 shadow-inner">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono select-none">
                          <span className="uppercase tracking-wider font-semibold text-cyan-400">
                            {language || 'code'}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(codeString)}
                            className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-200 leading-normal">
                          <code>{codeString}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-mono text-xs border border-slate-700/50" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};
