
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, SubTask } from '../types';
import { Check, Trash2, Calendar, Zap, Bot, FileText, CornerDownRight, ListPlus, Bold, Italic, List, Eye, EyeOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PomodoroTimer } from './PomodoroTimer';
import confetti from 'canvas-confetti';

const MotionDiv = motion.div as any;

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubTasks: (id: string, steps: string[]) => void;
  onAddSubTask: (id: string, title: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  isGeneratingBreakdown: boolean;
  onRequestBreakdown: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

const priorityConfig = {
  [Priority.LOW]: { 
    color: 'text-cyber-green', 
    border: 'border-cyber-green', 
    bg: 'bg-cyber-green/10',
    gradient: 'from-cyber-green/5',
    hover: 'group-hover:bg-cyber-green group-hover:text-black'
  },
  [Priority.MEDIUM]: { 
    color: 'text-cyber-blue', 
    border: 'border-cyber-blue', 
    bg: 'bg-cyber-blue/10',
    gradient: 'from-cyber-blue/10',
    hover: 'group-hover:bg-cyber-blue group-hover:text-black'
  },
  [Priority.HIGH]: { 
    color: 'text-cyber-red', 
    border: 'border-cyber-red', 
    bg: 'bg-cyber-red/10',
    gradient: 'from-cyber-red/15',
    hover: 'group-hover:bg-cyber-red group-hover:text-black'
  },
};

export const TaskItem: React.FC<TaskItemProps> = ({ 
    task, 
    onToggle, 
    onDelete, 
    isGeneratingBreakdown, 
    onRequestBreakdown,
    onContextMenu,
    onUpdateNotes,
    onAddSubTask,
    onToggleSubTask
}) => {
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(task.notes || '');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskValue, setSubtaskValue] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNoteValue(task.notes || '');
  }, [task.notes]);

  // Auto-resize textarea
  useEffect(() => {
    if (showNotes && !isPreviewMode && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [showNotes, noteValue, isPreviewMode]);

  const handleToggle = () => {
    if (!task.completed) {
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#FFB800', '#00D4FF', '#FFFFFF'],
            shapes: ['square']
        });
    }
    onToggle(task.id);
  };

  const handlePomodoroComplete = () => {
     // Could implement logic to add time spent to task
  };

  const handleNoteBlur = () => {
    if (noteValue !== task.notes) {
        onUpdateNotes(task.id, noteValue);
    }
  };

  const handleSubmitSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskValue.trim()) {
        onAddSubTask(task.id, subtaskValue.trim());
        setSubtaskValue('');
    }
  };

  // MARKDOWN HELPERS
  const insertMarkdown = (e: React.MouseEvent, prefix: string, suffix: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = noteValue;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    setNoteValue(newText);
    
    // Focus back and set cursor
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            if (selection) {
                // If text was selected, keep selection wrapped
                textareaRef.current.setSelectionRange(start, end + prefix.length + suffix.length);
            } else {
                // If no selection, place cursor inside tags
                textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length);
            }
        }
    }, 0);
  };

  const parseInline = (text: string) => {
    // Escape HTML first
    let safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Bold: **text**
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyber-blue font-bold">$1</strong>');
    // Italic: _text_
    safe = safe.replace(/_(.*?)_/g, '<em class="italic text-cyber-amber">$1</em>');
    // Code: `text`
    safe = safe.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-cyber-green font-mono text-[10px]">$1</code>');
    return safe;
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '<span class="text-gray-600 italic text-[10px]">NO_DATA_LOGGED</span>';
    
    const lines = text.split('\n');
    let inList = false;
    let html = '';

    lines.forEach((line) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('- ')) {
            if (!inList) {
                html += '<ul class="list-disc pl-4 space-y-1 my-2">';
                inList = true;
            }
            const content = parseInline(line.substring(line.indexOf('- ') + 2));
            html += `<li>${content}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (trimmed === '') {
                html += '<div class="h-2"></div>';
            } else {
                html += `<p class="my-0.5 leading-relaxed">${parseInline(line)}</p>`;
            }
        }
    });

    if (inList) html += '</ul>';
    return html;
  };

  const getDateDisplay = (dateString: string, isCompleted: boolean) => {
    if (!dateString) return null;

    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let targetDate: Date;
      let isDateOnly = false;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      if (dateOnlyRegex.test(dateString)) {
        isDateOnly = true;
        const [y, m, d] = dateString.split('-').map(Number);
        targetDate = new Date(y, m - 1, d);
      } else {
        targetDate = new Date(dateString);
      }

      if (isNaN(targetDate.getTime())) return null;

      const dd = String(targetDate.getDate()).padStart(2, '0');
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const yyyy = targetDate.getFullYear();
      const formattedDate = `${dd}-${mm}-${yyyy}`;

      const userLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
      const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      const formattedTime = new Intl.DateTimeFormat(userLocale, timeOptions).format(targetDate);

      const displayLabel = isDateOnly ? formattedDate : `${formattedDate} @ ${formattedTime}`;

      if (isCompleted) {
        return { label: displayLabel, color: 'text-gray-500', bold: false };
      }

      const checkDate = new Date(targetDate);
      checkDate.setHours(0, 0, 0, 0);

      const diffTime = checkDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { label: 'PAST DUE', subLabel: displayLabel, color: 'text-cyber-red', bold: true };
      if (diffDays === 0) return { label: `TODAY${!isDateOnly ? ' @ ' + formattedTime : ''}`, color: 'text-cyber-amber', bold: true };
      if (diffDays === 1) return { label: `TOMORROW${!isDateOnly ? ' @ ' + formattedTime : ''}`, color: 'text-cyber-green', bold: true };

      return { label: displayLabel, color: 'text-cyber-blue', bold: false };
    } catch (e) {
      return null;
    }
  };

  const pStyle = priorityConfig[task.priority];
  const dateInfo = task.dueDate ? getDateDisplay(task.dueDate, task.completed) : null;

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={task.completed ? undefined : { scale: showPomodoro ? 1.025 : 1.015, zIndex: 30 }}
      transition={{ duration: 0.2 }}
      onContextMenu={(e: React.MouseEvent) => onContextMenu(e, task.id)}
      className={`group relative transition-all duration-500 font-mono rounded-sm ${
        task.completed 
            ? 'bg-cyber-black border border-cyber-gray opacity-50 grayscale' 
            : showPomodoro
                ? 'cyber-glass-strong border-cyber-amber shadow-[0_0_25px_-5px_rgba(255,184,0,0.2)] z-20'
                : `cyber-glass hover:bg-cyber-gray/60 bg-gradient-to-br ${pStyle.gradient} to-transparent hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.6)] hover:border-cyber-amber/50`
      }`}
    >
      <div className="flex">
        <div className={`w-1 ${task.completed ? 'bg-gray-700' : pStyle.bg.replace('/10', '')}`}></div>

        <div className="flex-1 p-4">
            <div className="flex items-start gap-4">
                <button
                    onClick={handleToggle}
                    className={`mt-1 w-5 h-5 flex items-center justify-center border transition-all flex-shrink-0 ${
                        task.completed 
                        ? 'border-cyber-amber bg-cyber-amber text-black' 
                        : 'border-gray-500 hover:border-cyber-amber text-transparent'
                    }`}
                >
                    <Check size={14} strokeWidth={4} />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-[10px] uppercase border px-1 transition-colors duration-300 flex items-center gap-2 ${pStyle.border} ${pStyle.color} ${pStyle.hover}`}>
                                {task.priority === Priority.HIGH && (
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                                    </span>
                                )}
                                {task.priority}
                            </span>
                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">
                                //{task.category}
                            </span>
                            {task.notes && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
                                    className={`text-[10px] flex items-center gap-1 transition-colors hover:underline ${showNotes ? 'text-cyber-blue' : 'text-gray-500 hover:text-cyber-blue'}`}
                                >
                                    <FileText size={10} />
                                    DATA_LOGGED
                                </button>
                            )}
                            {showPomodoro && (
                                <span className="text-[10px] uppercase text-cyber-amber font-bold animate-pulse tracking-wider border border-cyber-amber/30 px-1 bg-cyber-amber/10">
                                    FOCUS_MODE_ACTIVE
                                </span>
                            )}
                        </div>
                        
                        {dateInfo && (
                            <span className={`text-[10px] flex items-center gap-1 font-mono whitespace-nowrap ml-2 ${dateInfo.color} ${dateInfo.bold ? 'font-bold' : ''}`}>
                                <Calendar size={10} />
                                {dateInfo.label}
                                {dateInfo.subLabel && (
                                    <span className="opacity-70 font-normal ml-1 text-[9px]">[{dateInfo.subLabel}]</span>
                                )}
                            </span>
                        )}
                    </div>

                    <h3 className={`text-base font-bold leading-tight uppercase tracking-tight select-none ${task.completed ? 'line-through text-gray-600' : 'text-white'}`}>
                        {task.title}
                    </h3>

                    {/* Subtasks */}
                    {(task.subTasks.length > 0 || isAddingSubtask) && (
                        <div className="mt-3 pl-2 border-l border-cyber-gray space-y-1">
                            {task.subTasks.map(st => (
                                <button 
                                    key={st.id} 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onToggleSubTask(task.id, st.id); 
                                    }}
                                    className="flex items-center gap-3 text-xs text-gray-400 font-sans hover:text-white transition-colors w-full text-left group/sub py-0.5"
                                >
                                    <div className={`w-3 h-3 flex items-center justify-center border rounded-[2px] transition-all ${st.completed ? 'bg-cyber-amber border-cyber-amber' : 'border-cyber-amber/40 group-hover/sub:border-cyber-amber bg-transparent'}`}>
                                        {st.completed && <Check size={8} className="text-black stroke-[4]" />}
                                    </div>
                                    <span className={`${st.completed ? 'line-through opacity-40 text-gray-500' : 'text-gray-300'}`}>{st.title}</span>
                                </button>
                            ))}
                            {isAddingSubtask && (
                                <form onSubmit={handleSubmitSubtask} className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                                    <CornerDownRight size={10} className="text-cyber-amber" />
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={subtaskValue}
                                        onChange={(e) => setSubtaskValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Escape' && setIsAddingSubtask(false)}
                                        placeholder="INITIALIZE_SUB_ROUTINE..."
                                        className="bg-black/20 border-b border-cyber-amber/50 text-[10px] font-mono text-white placeholder-gray-600 w-full focus:outline-none focus:border-cyber-amber px-1 py-0.5"
                                    />
                                </form>
                            )}
                        </div>
                    )}

                    {/* HUD Controls */}
                    <div className={`flex items-center gap-4 mt-2 transition-opacity duration-200 border-t border-cyber-gray/30 pt-2 ${showPomodoro ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                            onClick={() => setShowPomodoro(!showPomodoro)}
                            className={`text-[10px] uppercase flex items-center gap-1 transition-colors ${showPomodoro ? 'text-cyber-amber' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Zap size={12} /> {showPomodoro ? 'Deactivate' : 'Init_Focus'}
                        </button>
                        
                        <button 
                            onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                            className={`text-[10px] uppercase flex items-center gap-1 transition-colors ${isAddingSubtask ? 'text-cyber-green' : 'text-gray-500 hover:text-white'}`}
                        >
                            <ListPlus size={12} /> ADD_STEP
                        </button>

                        <button 
                            onClick={() => setShowNotes(!showNotes)}
                            className={`text-[10px] uppercase flex items-center gap-1 transition-colors ${showNotes ? 'text-cyber-blue' : 'text-gray-500 hover:text-white'}`}
                        >
                            <FileText size={12} /> {showNotes ? 'CLOSE_LOG' : 'NOTES'}
                        </button>
                        
                        {task.subTasks.length === 0 && !task.completed && (
                            <button 
                                onClick={() => onRequestBreakdown(task)}
                                disabled={isGeneratingBreakdown}
                                className="text-[10px] uppercase flex items-center gap-1 text-gray-500 hover:text-cyber-blue transition-colors disabled:opacity-50"
                            >
                                {isGeneratingBreakdown ? <Activity className="animate-spin" size={12} /> : <Bot size={12} />}
                                {isGeneratingBreakdown ? 'ANALYZING...' : 'AI_BREAKDOWN'}
                            </button>
                        )}

                        <button 
                            onClick={() => onDelete(task.id)}
                            className="text-[10px] uppercase flex items-center gap-1 text-gray-500 hover:text-cyber-red transition-colors ml-auto"
                        >
                            DELETE <Trash2 size={12} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showPomodoro && (
                            <PomodoroTimer 
                                isOpen={showPomodoro}
                                onSessionComplete={handlePomodoroComplete} 
                            />
                        )}
                        {showNotes && (
                             <MotionDiv
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden bg-black/20 border border-white/5 rounded-sm"
                             >
                                {/* Editor Toolbar */}
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <CornerDownRight size={10} className="text-cyber-blue"/> 
                                        <span className="text-[10px] font-mono text-cyber-blue uppercase tracking-wider">DATA_LOG.md</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!isPreviewMode && (
                                            <>
                                                <button onClick={(e) => insertMarkdown(e, '**', '**')} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="Bold">
                                                    <Bold size={10} />
                                                </button>
                                                <button onClick={(e) => insertMarkdown(e, '_', '_')} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="Italic">
                                                    <Italic size={10} />
                                                </button>
                                                <button onClick={(e) => insertMarkdown(e, '- ', '')} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="List">
                                                    <List size={10} />
                                                </button>
                                                <div className="w-px h-3 bg-white/10 mx-1"></div>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => setIsPreviewMode(!isPreviewMode)} 
                                            className={`p-1 rounded transition-colors flex items-center gap-1 text-[10px] font-mono uppercase ${isPreviewMode ? 'bg-cyber-blue/20 text-cyber-blue' : 'hover:bg-white/10 text-gray-400'}`}
                                            title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
                                        >
                                            {isPreviewMode ? <EyeOff size={10} /> : <Eye size={10} />}
                                            {isPreviewMode ? 'EDIT' : 'VIEW'}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative group/notes">
                                    {isPreviewMode ? (
                                        <div 
                                            className="w-full text-xs font-mono text-gray-300 p-3 min-h-[60px] leading-relaxed break-words"
                                            dangerouslySetInnerHTML={{ __html: renderMarkdown(noteValue) }}
                                        />
                                    ) : (
                                        <textarea 
                                            ref={textareaRef}
                                            value={noteValue}
                                            onChange={(e) => setNoteValue(e.target.value)}
                                            onBlur={handleNoteBlur}
                                            placeholder="ENTER_DATA... (Markdown Supported)"
                                            className="w-full bg-transparent border-none text-xs font-mono text-gray-300 p-3 min-h-[80px] focus:outline-none focus:ring-0 resize-none block leading-relaxed"
                                            spellCheck={false}
                                        />
                                    )}
                                </div>
                                
                                {!isPreviewMode && (
                                    <div className="px-2 py-1 text-[9px] text-gray-600 font-mono text-right border-t border-white/5">
                                        BYTES: {noteValue.length}
                                    </div>
                                )}
                             </MotionDiv>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
      </div>
    </MotionDiv>
  );
};
