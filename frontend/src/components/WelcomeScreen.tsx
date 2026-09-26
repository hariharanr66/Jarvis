import React from 'react';
import { motion } from 'framer-motion';
import { JarvisOrb } from './JarvisOrb';
import { Sparkles, Terminal, Code2, Cpu } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  isThinking: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt, isThinking }) => {
  const suggestions = [
    {
      icon: Terminal,
      title: "System Capability Diagnostic",
      prompt: "What capabilities do you currently have in V0.1, and what is planned for future versions?"
    },
    {
      icon: Code2,
      title: "Architectural Guidance",
      prompt: "Explain how to structure a full-stack AI application with FastAPI, SQLite, and React."
    },
    {
      icon: Cpu,
      title: "Task Automation Planning",
      prompt: "Help me design a step-by-step roadmap for personal AI assistant features."
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none my-auto max-w-3xl mx-auto">
      {/* Central Interactive Orb */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-6 sm:mb-8"
      >
        <JarvisOrb size="lg" state={isThinking ? 'thinking' : 'idle'} />
      </motion.div>

      {/* Title & Tagline */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-2 mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>JARVIS PERSONAL AI SYSTEM v0.1</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
          How can I assist you today?
        </h1>

        <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
          I am JARVIS, your intelligent personal assistant. Built with clean provider abstractions and stateful conversation memory.
        </p>
      </motion.div>

      {/* Suggestion Chips */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
      >
        {suggestions.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              className="glass-panel glass-panel-hover p-4 rounded-2xl text-left border border-white/10 flex flex-col justify-between gap-3 group transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-200 mb-1 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  "{item.prompt}"
                </p>
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
