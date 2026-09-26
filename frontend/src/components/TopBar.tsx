import React from 'react';
import { Menu, Settings, Cpu, User, Wifi, WifiOff, Brain } from 'lucide-react';
import type { HealthStatus } from '../types/jarvis';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  memoryCount: number;
  health: HealthStatus | null;
  isThinking: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenSettings,
  onOpenMemory,
  memoryCount,
  health,
  isThinking
}) => {
  const isOnline = Boolean(health && health.status === 'online');

  return (
    <header className="h-16 border-b border-white/10 glass-panel px-4 sm:px-6 flex items-center justify-between z-20 select-none">
      {/* Left side: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              J
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
              isOnline ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'
            }`} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                JARVIS
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                v0.2
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline-block">
              Personal AI System
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Status Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
        {isThinking ? (
          <>
            <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span className="text-purple-300 font-medium">Processing Request...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-medium">{health?.selected_model || 'System Active'}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-400 font-medium">Connecting to Core...</span>
          </>
        )}
      </div>

      {/* Right side: Memory, Settings & Profile */}
      <div className="flex items-center gap-2">
        {/* Subtle Memory Indicator Button */}
        <button
          onClick={onOpenMemory}
          className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5 text-xs font-medium relative"
          title="JARVIS Persistent Memory"
        >
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline-block">Memory</span>
          {memoryCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-purple-900/90 text-purple-300 border border-purple-500/50 text-[10px] font-mono">
              {memoryCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5 text-xs font-medium"
          title="JARVIS Settings"
        >
          <Settings className="w-4 h-4 text-gray-300" />
          <span className="hidden sm:inline-block">Settings</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/15 flex items-center justify-center text-xs font-semibold text-gray-300">
          <User className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
    </header>
  );
};
