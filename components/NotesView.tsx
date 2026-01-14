
import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, X, Save, Maximize2, Minimize2, Trash, Bold, Italic, List, Eye, EyeOff, Calendar } from 'lucide-react';

const MotionDiv = motion.div as any;

interface NotesViewProps {
  notes: Note[];
  onAddNote: (title: string, content: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setIsCreating(false);
  };

  const startCreating = () => {
    setSelectedNote(null);
    setEditorTitle('');
    setEditorContent('');
    setIsCreating(true);
  };

  const closeEditor = () => {
    setSelectedNote(null);
    setIsCreating(false);
    setIsPreviewMode(false);
  };

  const handleSave = () => {
    if (editorTitle.trim() || editorContent.trim()) {
      if (selectedNote) {
        onUpdateNote(selectedNote.id, {
          title: editorTitle,
          content: editorContent
        });
      } else if (isCreating) {
        onAddNote(editorTitle || 'Untitled Note', editorContent);
      }
    }
    closeEditor();
  };

  // Markdown Helpers (Similar to TaskItem)
  const insertMarkdown = (e: React.MouseEvent, prefix: string, suffix: string) => {
    e.preventDefault();
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = editorContent;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    setEditorContent(newText);
    
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            if (selection) {
                textareaRef.current.setSelectionRange(start, end + prefix.length + suffix.length);
            } else {
                textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length);
            }
        }
    }, 0);
  };

  const parseInline = (text: string) => {
    let safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-400 font-bold">$1</strong>');
    safe = safe.replace(/_(.*?)_/g, '<em class="italic text-cyber-amber">$1</em>');
    safe = safe.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-cyber-green font-mono text-[10px]">$1</code>');
    return safe;
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '<span class="text-gray-600 italic text-xs">Empty note...</span>';
    const lines = text.split('\n');
    let inList = false;
    let html = '';
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            if (!inList) { html += '<ul class="list-disc pl-4 space-y-1 my-2">'; inList = true; }
            const content = parseInline(line.substring(line.indexOf('- ') + 2));
            html += `<li>${content}</li>`;
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            if (trimmed.startsWith('# ')) {
                html += `<h1 class="text-xl font-bold text-white mt-4 mb-2 border-b border-white/10 pb-1">${parseInline(line.substring(2))}</h1>`;
            } else if (trimmed.startsWith('## ')) {
                html += `<h2 class="text-lg font-bold text-purple-300 mt-3 mb-1">${parseInline(line.substring(3))}</h2>`;
            } else if (trimmed === '') { 
                html += '<div class="h-2"></div>'; 
            } else { 
                html += `<p class="my-1 leading-relaxed">${parseInline(line)}</p>`; 
            }
        }
    });
    if (inList) html += '</ul>';
    return html;
  };

  return (
    <div className="relative min-h-[500px]">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-mono text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <StickyNote size={14} /> Notes_Repository // [{notes.length}]
        </h2>
        <button 
            onClick={startCreating}
            className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/50 hover:bg-purple-500 hover:text-black text-purple-400 px-4 py-2 text-xs font-mono font-bold uppercase transition-all rounded-sm"
        >
            <Plus size={14} /> New_Entry
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
            {notes.map(note => (
                <MotionDiv
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => openNote(note)}
                    whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(168, 85, 247, 0.3)" }}
                    className="cyber-glass group cursor-pointer rounded-sm border border-white/10 p-4 h-48 flex flex-col relative overflow-hidden hover:border-purple-500/50 transition-colors"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyber-blue opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    
                    <h3 className="text-white font-bold font-mono text-sm mb-2 truncate pr-6">{note.title}</h3>
                    
                    <div className="flex-1 overflow-hidden relative">
                         <div className="text-xs text-gray-400 font-mono leading-relaxed line-clamp-5 opacity-80">
                             {note.content || <span className="italic opacity-50">No content...</span>}
                         </div>
                         <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0f0f11] to-transparent"></div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-600 font-mono">
                         <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(note.updatedAt).toLocaleDateString()}</span>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                            className="text-gray-600 hover:text-cyber-red transition-colors p-1"
                         >
                            <Trash size={12} />
                         </button>
                    </div>
                </MotionDiv>
            ))}
        </AnimatePresence>
        
        {notes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-sm text-gray-500 font-mono">
                <StickyNote size={32} className="mb-4 opacity-50" />
                <p>REPOSITORY_EMPTY</p>
                <button onClick={startCreating} className="mt-4 text-xs text-purple-400 hover:underline">INITIALIZE_FIRST_NOTE</button>
            </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {(selectedNote || isCreating) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <MotionDiv 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={handleSave}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <MotionDiv 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl h-[80vh] cyber-glass-strong border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-sm flex flex-col overflow-hidden"
                >
                    {/* Editor Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                        <input 
                            type="text" 
                            value={editorTitle}
                            onChange={(e) => setEditorTitle(e.target.value)}
                            placeholder="UNTITLED_NOTE..."
                            className="bg-transparent border-none text-xl font-bold font-mono text-white placeholder-gray-600 focus:outline-none w-full"
                        />
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                                className={`p-2 rounded-sm transition-colors ${isPreviewMode ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
                            >
                                {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button onClick={handleSave} className="p-2 text-cyber-green hover:bg-cyber-green/10 rounded-sm transition-colors" title="Save & Close">
                                <Save size={16} />
                            </button>
                            <button onClick={closeEditor} className="p-2 text-cyber-red hover:bg-cyber-red/10 rounded-sm transition-colors" title="Cancel">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar (Edit Mode Only) */}
                    {!isPreviewMode && (
                        <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-black/20">
                            <button onClick={(e) => insertMarkdown(e, '**', '**')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Bold"><Bold size={14}/></button>
                            <button onClick={(e) => insertMarkdown(e, '_', '_')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Italic"><Italic size={14}/></button>
                            <button onClick={(e) => insertMarkdown(e, '- ', '')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="List"><List size={14}/></button>
                            <span className="text-[10px] text-gray-600 font-mono ml-auto mr-2">MARKDOWN_SUPPORT_ENABLED</span>
                        </div>
                    )}

                    {/* Editor Body */}
                    <div className="flex-1 overflow-auto custom-scrollbar relative bg-black/20">
                        {isPreviewMode ? (
                            <div 
                                className="w-full h-full p-8 text-sm font-mono text-gray-300 leading-relaxed prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(editorContent) }}
                            />
                        ) : (
                            <textarea 
                                ref={textareaRef}
                                value={editorContent}
                                onChange={(e) => setEditorContent(e.target.value)}
                                placeholder="Start typing..."
                                className="w-full h-full bg-transparent border-none p-8 text-sm font-mono text-gray-300 focus:outline-none resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        )}
                    </div>
                    
                    {/* Footer Stats */}
                    <div className="p-2 border-t border-white/10 bg-black/40 text-[10px] font-mono text-gray-500 flex justify-between">
                        <span>Ln {editorContent.split('\n').length}, Col {editorContent.length}</span>
                        <span>{selectedNote ? `LAST_EDIT: ${new Date(selectedNote.updatedAt).toLocaleTimeString()}` : 'UNSAVED_DRAFT'}</span>
                    </div>

                </MotionDiv>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};
