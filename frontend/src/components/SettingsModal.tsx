import React from 'react';
import { X, Cpu, Key, Layers, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import type { HealthStatus } from '../types/jarvis';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthStatus | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, health }) => {
  if (!isOpen) return null;

  const hasApiKey = health?.api_configured ?? false;

  const roadmapSteps = [
    { version: 'V0.1', title: 'Core Text Assistant', status: 'Completed', active: true },
    { version: 'V0.2', title: 'Persistent Memory', status: 'Completed', active: true },
    { version: 'V0.3', title: 'Voice Input / Output', status: 'Planned', active: false },
    { version: 'V0.4', title: 'Web Search & Tools', status: 'Planned', active: false },
    { version: 'V0.5', title: 'Android Phone / PWA Sync', status: 'Planned', active: false },
    { version: 'V0.6', title: 'Laptop Desktop Control', status: 'Planned', active: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-white/15 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">JARVIS System Control Panel</h2>
              <p className="text-xs text-gray-400">Architecture, API Keys & Configuration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs sm:text-sm">
          {/* Section 1: AI Provider Status */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-200">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>LLM Provider Status</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 ${
                hasApiKey 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
              }`}>
                {hasApiKey ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {hasApiKey ? 'Live LLM Active' : 'Fallback Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-gray-400 block mb-0.5">Active Model</span>
                <span className="font-mono text-cyan-300 font-semibold">{health?.selected_model || 'gemini-3.8-flash'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-gray-400 block mb-0.5">Fallback Model</span>
                <span className="font-mono text-purple-300 font-semibold">{health?.fallback_model || 'gemini-2.5-flash'}</span>
              </div>
            </div>

            {!hasApiKey && (
              <p className="text-xs text-amber-300/90 leading-relaxed bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
                <strong>Tip:</strong> Add your <code className="text-amber-200">GEMINI_API_KEY</code> into <code className="text-amber-200">backend/.env</code> to unlock live LLM execution.
              </p>
            )}
          </div>

          {/* Section 2: Core Personality & Rules */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-gray-200">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Configured System Prompt</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              JARVIS operates under strict system guidelines configured in <code className="text-purple-300">backend/app/core/personality.py</code>:
            </p>
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono text-gray-300 leading-relaxed">
              "Calm, concise, intelligent, helpful, professional, natural, and slightly futuristic. Never claim actions were performed unless actually executed."
            </div>
          </div>

          {/* Section 3: Roadmap */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-200">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>JARVIS Development Roadmap</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {roadmapSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    step.active
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : 'bg-black/30 border-white/5 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10">{step.version}</span>
                    <span className="font-medium text-xs">{step.title}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${step.active ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            Close Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
