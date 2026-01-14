
import React, { useState } from 'react';
import { Task, Priority, Category } from '../types';
import { X, Save, Edit3, Calendar, Tag, Flag, FileText, Type, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  categories: Category[];
  onAddCategory: (category: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave, categories, onAddCategory }) => {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [category, setCategory] = useState<Category>(task.category);
  const [dueDate, setDueDate] = useState<string>(task.dueDate || '');
  
  // Category creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSave = () => {
    onSave({
      ...task,
      title,
      notes,
      priority,
      category,
      dueDate: dueDate || null
    });
    onClose();
  };
  
  const handleCreateCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setCategory(newCategoryName.trim());
          setNewCategoryName('');
          setIsAddingCategory(false);
      }
  };

  const getSafeDateValue = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
  };

  if (!isOpen) return null;

  const priorityColors = {
    [Priority.LOW]: 'text-cyber-green border-cyber-green',
    [Priority.MEDIUM]: 'text-cyber-blue border-cyber-blue',
    [Priority.HIGH]: 'text-cyber-red border-cyber-red',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <MotionDiv 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg cyber-glass-strong shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-white/10 bg-white/5">
            <Edit3 className="text-cyber-blue" size={20} />
            <h2 className="text-xl font-mono text-white tracking-wider uppercase">MODIFY_OBJECT</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Title Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-cyber-blue uppercase tracking-widest">
                    <Type size={12} /> Object_Identifier
                </label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full cyber-glass-input p-3 text-white font-mono placeholder-gray-600 outline-none transition-colors rounded-sm focus:border-cyber-blue/50"
                    placeholder="ENTER_TASK_NAME"
                />
            </div>

            {/* Grid for Priority & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                        <Flag size={12} /> Priority_Level
                    </label>
                    <div className="flex flex-col gap-2">
                        {Object.values(Priority).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`px-3 py-2 border text-xs font-mono uppercase transition-all text-left ${
                                    priority === p 
                                    ? `${priorityColors[p]} bg-white/5` 
                                    : 'border-white/10 text-gray-500 hover:border-white/30'
                                }`}
                            >
                                {`[${p}]`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                        <Tag size={12} /> Sector_Assignment
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-2 py-1.5 border text-[10px] font-mono uppercase transition-all ${
                                    category === c 
                                    ? 'border-cyber-blue text-cyber-blue bg-cyber-blue/10' 
                                    : 'border-white/10 text-gray-500 hover:border-white/30'
                                }`}
                            >
                                {c}
                            </button>
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
                                    className="w-16 bg-black/40 border border-cyber-amber/50 text-white text-[10px] px-1 py-1 outline-none font-mono"
                                />
                                <button onClick={handleCreateCategory} className="text-cyber-amber hover:text-white"><Plus size={12}/></button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAddingCategory(true)}
                                className="px-2 py-1.5 border border-dashed border-gray-600 text-gray-500 hover:text-cyber-amber hover:border-cyber-amber transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Date Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <Calendar size={12} /> Target_Date
                </label>
                <input 
                    type="date" 
                    value={getSafeDateValue(dueDate)}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full cyber-glass-input p-3 text-white font-mono outline-none appearance-none rounded-sm focus:border-cyber-blue/50"
                    style={{ colorScheme: 'dark' }}
                />
            </div>

            {/* Notes Textarea */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <FileText size={12} /> Data_Log
                </label>
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full cyber-glass-input p-3 text-sm font-mono text-gray-300 min-h-[100px] outline-none resize-y rounded-sm focus:border-cyber-blue/50"
                    placeholder="ADDITIONAL_CONTEXT..."
                />
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-4">
            <button 
                onClick={onClose}
                className="flex-1 py-3 border border-white/10 text-gray-400 font-mono text-sm uppercase hover:text-white hover:border-white/30 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-cyber-blue/10 border border-cyber-blue text-cyber-blue font-bold font-mono text-sm uppercase hover:bg-cyber-blue hover:text-black transition-all"
            >
                Confirm
            </button>
        </div>
      </MotionDiv>
    </div>
  );
};
