
import React, { useState, useRef } from 'react';
import { Terminal, Plus, Loader2, Flag, Tag, X, CornerDownLeft, Calendar, Trash } from 'lucide-react';
import { Priority, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface TaskInputProps {
  onAddTask: (rawInput: string, overrides: { priority?: Priority; category?: Category; dueDate?: string }) => Promise<void>;
  isParsing: boolean;
  categories: Category[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, isParsing, categories, onAddCategory, onDeleteCategory }) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dueDate, setDueDate] = useState('');
  
  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isParsing) return;
    
    await onAddTask(input, {
        priority: selectedPriority || undefined,
        category: selectedCategory || undefined,
        dueDate: dueDate || undefined
    });
    
    // Reset state
    setInput('');
    setSelectedPriority(null);
    setSelectedCategory(null);
    setDueDate('');
    setIsExpanded(false);
  };

  const handleFocus = () => setIsExpanded(true);

  const handleCreateCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setSelectedCategory(newCategoryName.trim());
          setNewCategoryName('');
          setIsAddingCategory(false);
      }
  };

  const applyDatePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${year}-${month}-${day}`);
  };

  const priorityConfig = {
      [Priority.LOW]: { color: 'text-cyber-green border-cyber-green', label: 'LOW' },
      [Priority.MEDIUM]: { color: 'text-cyber-blue border-cyber-blue', label: 'MED' },
      [Priority.HIGH]: { color: 'text-cyber-red border-cyber-red', label: 'HIGH' },
  };

  return (
    <div ref={containerRef} className="relative z-20">
      <form onSubmit={handleSubmit} className="relative">
        
        <div className={`relative group border transition-all duration-300 cyber-glass-input rounded-sm ${isExpanded ? 'border-cyber-amber shadow-[0_0_15px_rgba(255,184,0,0.1)]' : 'border-white/10 hover:border-white/30'}`}>
            {/* Corner Markers */}
            <div className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l transition-colors ${isExpanded ? 'border-cyber-amber' : 'border-gray-500'}`}></div>
            <div className={`absolute -top-[1px] -right-[1px] w-3 h-3 border-t border-r transition-colors ${isExpanded ? 'border-cyber-amber' : 'border-gray-500'}`}></div>
            <div className={`absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b border-l transition-colors ${isExpanded ? 'border-cyber-amber' : 'border-gray-500'}`}></div>
            <div className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r transition-colors ${isExpanded ? 'border-cyber-amber' : 'border-gray-500'}`}></div>

            <div className="flex items-center">
                <div className="pl-4 pr-2 text-cyber-amber">
                    {isParsing ? <Loader2 className="animate-spin" size={20} /> : <Terminal size={20} />}
                </div>
                
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={handleFocus}
                    placeholder={isExpanded ? "ENTER_COMMAND..." : "INPUT_NEW_TASK >"}
                    className="w-full bg-transparent border-none py-4 px-2 text-white placeholder-gray-600 focus:outline-none focus:ring-0 font-mono text-lg tracking-wide"
                    disabled={isParsing}
                    autoComplete="off"
                />

                {/* Submit Indicator */}
                <button
                    type="submit"
                    disabled={!input.trim() || isParsing}
                    className={`mr-4 text-cyber-amber disabled:opacity-30 disabled:cursor-not-allowed transition-opacity ${isExpanded ? 'hidden' : 'block'}`}
                >
                    <CornerDownLeft size={20} />
                </button>
            </div>
        </div>

        {/* Expanded Controls Panel */}
        <AnimatePresence>
            {isExpanded && (
                <MotionDiv
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden cyber-glass rounded-sm"
                >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Priority Selection */}
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-2">
                                <Flag size={10} /> Priority_Level
                            </div>
                            <div className="flex gap-2">
                                {Object.values(Priority).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setSelectedPriority(selectedPriority === p ? null : p)}
                                        className={`flex-1 px-2 py-1.5 border font-mono text-xs uppercase tracking-wider transition-all ${
                                            selectedPriority === p
                                            ? `${priorityConfig[p].color} bg-white/5`
                                            : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                                        }`}
                                    >
                                        [{p.substring(0,3)}]
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Selection */}
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-2">
                                <Tag size={10} /> Sector_Assignment
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((c) => (
                                    <div key={c} className="relative group/tag">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                                            className={`px-3 py-1.5 border font-mono text-xs uppercase transition-all ${
                                                selectedCategory === c
                                                ? 'border-cyber-blue text-cyber-blue bg-cyber-blue/10'
                                                : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onDeleteCategory(c); }}
                                            className="absolute -top-2 -right-2 bg-cyber-red text-black rounded-full p-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity hover:scale-110"
                                            title="Delete tag"
                                        >
                                            <X size={8} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                                {isAddingCategory ? (
                                    <div className="flex items-center gap-1">
                                        <input 
                                            autoFocus
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateCategory(e);
                                                if (e.key === 'Escape') setIsAddingCategory(false);
                                            }}
                                            placeholder="NEW..."
                                            className="w-20 bg-black/40 border border-cyber-amber/50 text-white text-xs px-2 py-1.5 outline-none font-mono"
                                        />
                                        <button onClick={handleCreateCategory} className="text-cyber-amber hover:text-white"><Plus size={14}/></button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCategory(true)}
                                        className="px-2 py-1.5 border border-dashed border-gray-600 text-gray-500 hover:text-cyber-amber hover:border-cyber-amber transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-2">
                                <Calendar size={10} /> Target_Date
                            </div>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 focus:border-cyber-amber p-1.5 text-xs font-mono text-white placeholder-gray-600 outline-none transition-colors rounded-sm"
                                style={{ colorScheme: 'dark' }}
                            />
                             <div className="flex gap-1 mt-2">
                                <button 
                                    type="button"
                                    onClick={() => applyDatePreset(0)}
                                    className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 hover:text-cyber-amber hover:border-cyber-amber/50 py-1 uppercase transition-all"
                                >
                                    Today
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => applyDatePreset(1)}
                                    className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 hover:text-cyber-green hover:border-cyber-green/50 py-1 uppercase transition-all"
                                >
                                    Tom
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => applyDatePreset(7)}
                                    className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 hover:text-cyber-blue hover:border-cyber-blue/50 py-1 uppercase transition-all"
                                >
                                    Week
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center p-2 border-t border-white/10 bg-black/30">
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-xs font-mono text-gray-500 hover:text-white flex items-center gap-1 px-2 py-1"
                        >
                            <X size={12} /> CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={!input.trim() || isParsing}
                            className="px-6 py-1.5 bg-cyber-amber text-black font-bold font-mono text-sm hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed clip-corner"
                        >
                            {isParsing ? 'PROCESSING...' : 'EXECUTE_CMD'}
                        </button>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
      </form>
    </div>
  );
};
