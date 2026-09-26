import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2, Search, Sparkles, Folder, Target, Award, Tag, User, Clock } from 'lucide-react';
import type { Memory, MemoryCreatePayload } from '../types/jarvis';
import * as api from '../services/api';

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoriesUpdated?: () => void;
}

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  isOpen,
  onClose,
  onMemoriesUpdated
}) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [category, setCategory] = useState('personal');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [importance, setImportance] = useState(3);

  const [formError, setFormError] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All', icon: Brain },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Tag },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'routines', label: 'Routines', icon: Clock },
    { id: 'important_facts', label: 'Facts', icon: Sparkles },
  ];

  const loadMemories = async () => {
    try {
      const data = await api.fetchMemories(activeCategory, searchQuery);
      setMemories(data);
    } catch (err: any) {
      console.warn("Failed to load memories:", err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) {
      setFormError("Key and Value are required.");
      return;
    }
    setFormError(null);
    try {
      const payload: MemoryCreatePayload = {
        category,
        key: key.trim(),
        value: value.trim(),
        importance
      };
      await api.createMemory(payload);
      setKey('');
      setValue('');
      setIsAdding(false);
      await loadMemories();
      if (onMemoriesUpdated) onMemoriesUpdated();
    } catch (err: any) {
      setFormError(err.message || "Failed to save memory.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      if (onMemoriesUpdated) onMemoriesUpdated();
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl border border-white/15 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">JARVIS Persistent Memory</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                  {memories.length} Memories
                </span>
              </div>
              <p className="text-xs text-gray-400">Contextual knowledge remembered across all conversations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Category Filter & Search & Add Button */}
        <div className="py-4 space-y-3 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Cancel' : 'Add Memory'}</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    px-3 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5
                    ${isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-semibold' 
                      : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent hover:border-white/10'}
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Memory Form Panel */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 my-3 animate-fade-in text-xs">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Create New Memory</span>
            </h3>

            {formError && (
              <p className="text-rose-400 text-xs bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">{formError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-gray-200 bg-slate-900 border border-white/10 focus:outline-none"
                >
                  <option value="personal">personal</option>
                  <option value="preferences">preferences</option>
                  <option value="goals">goals</option>
                  <option value="projects">projects</option>
                  <option value="skills">skills</option>
                  <option value="routines">routines</option>
                  <option value="important_facts">important_facts</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Key / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Main Project"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Importance (1-5)</label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-gray-200 bg-slate-900 border border-white/10 focus:outline-none"
                >
                  <option value={5}>5 - Critical</option>
                  <option value={4}>4 - High</option>
                  <option value={3}>3 - Medium</option>
                  <option value={2}>2 - Low</option>
                  <option value={1}>1 - Minor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Value / Fact Content</label>
              <textarea
                placeholder="e.g. Sree Promoters"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={2}
                className="w-full glass-input px-2.5 py-1.5 rounded-lg text-gray-200 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium"
              >
                Save Memory
              </button>
            </div>
          </form>
        )}

        {/* Memory Grid List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {memories.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
              <Brain className="w-8 h-8 text-gray-600" />
              <p className="text-xs">No memories stored in this category yet.</p>
              <p className="text-[11px] text-gray-600">JARVIS will automatically remember important facts mentioned in conversation (like project names, goals, or preferences).</p>
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-start justify-between gap-4 group hover:border-cyan-500/30 transition-all text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] uppercase">
                      {mem.category}
                    </span>
                    <span className="font-bold text-gray-200 text-xs">
                      {mem.key}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center">
                      ★ {mem.importance}/5
                    </span>
                  </div>

                  <p className="text-gray-300 font-mono bg-black/40 p-2 rounded-xl border border-white/5 whitespace-pre-wrap break-words">
                    {mem.value}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>Active context injected automatically into system prompt.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
