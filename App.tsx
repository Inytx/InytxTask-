
import React, { useState, useEffect, useCallback } from 'react';
import { Task, Priority, Category, Folder, FolderTheme, TaskStatus, DEFAULT_CATEGORIES, Note } from './types';
import { parseNaturalLanguageTask, generateSmartBreakdown } from './services/geminiService';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { EditTaskModal } from './components/EditTaskModal';
import { Homepage } from './components/Homepage';
import { KanbanBoard } from './components/KanbanBoard';
import { NeuralView } from './components/NeuralView';
import { TimelineView } from './components/TimelineView';
import { NotesView } from './components/NotesView';
import { Toast } from './components/Toast';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Hash, ChevronRight, Edit2, Trash, AlertTriangle, Flag, Archive, Calendar, Clock, AlertCircle, RotateCcw, Layers, LogOut, LayoutGrid, Columns, Network, List, StickyNote } from 'lucide-react';

const MotionDiv = motion.div as any;

// --- CONFIGURATION VISUELLE ---
const APP_CONFIG = {
    logoUrl: "", 
    backgroundImageUrl: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2832&auto=format&fit=crop",
    backgroundOpacity: 0.15 
};

type ViewMode = 'list' | 'kanban' | 'neural' | 'timeline' | 'notes';

// UNDO SYSTEM TYPES
type ActionType = 'DELETE_TASK' | 'DELETE_FOLDER' | 'DELETE_NOTE';

interface HistoryItem {
  type: ActionType;
  data: any; // The object that was deleted
  timestamp: number;
}

const App: React.FC = () => {
  // --- FOLDER STATE MANAGEMENT ---
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('inytx-folders');
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      return [];
    }
  });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // --- CATEGORIES STATE MANAGEMENT ---
  const [categories, setCategories] = useState<Category[]>(() => {
      try {
          const saved = localStorage.getItem('inytx-categories');
          if (saved) return JSON.parse(saved);
          return DEFAULT_CATEGORIES;
      } catch (e) {
          return DEFAULT_CATEGORIES;
      }
  });

  // --- NOTES STATE MANAGEMENT ---
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('inytx-notes');
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
      localStorage.setItem('inytx-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('inytx-notes', JSON.stringify(notes));
  }, [notes]);

  const handleAddCategory = (category: string) => {
      if (!categories.includes(category)) {
          setCategories(prev => [...prev, category]);
      }
  };

  const handleDeleteCategory = (category: string) => {
      setCategories(prev => prev.filter(c => c !== category));
  };

  // --- TASK STATE MANAGEMENT ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('lumina-tasks');
      let loadedTasks = saved ? JSON.parse(saved) : [];
      
      // MIGRATION: Ensure 'status' field exists
      loadedTasks = loadedTasks.map((t: any) => ({
         ...t,
         status: t.status || (t.completed ? 'done' : 'todo')
      }));
      
      const hasUnassignedTasks = loadedTasks.some((t: any) => !t.folderId);
      if (hasUnassignedTasks) {
         // Silent migration logic
      }
      return loadedTasks;
    } catch (e) {
      console.error("Failed to load tasks from local storage", e);
      return [];
    }
  });

  // --- EFFECTS FOR PERSISTENCE & MIGRATION ---
  useEffect(() => {
    localStorage.setItem('inytx-folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('lumina-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const unassignedTasks = tasks.filter(t => !t.folderId);
    if (unassignedTasks.length > 0) {
        let defaultFolder = folders.find(f => f.name === 'MAIN_DATABASE');
        let newFolders = [...folders];

        if (!defaultFolder) {
            defaultFolder = {
                id: uuidv4(),
                name: 'MAIN_DATABASE',
                createdAt: Date.now(),
                theme: 'blue'
            };
            newFolders = [defaultFolder, ...newFolders];
            setFolders(newFolders);
        }
        setTasks(prev => prev.map(t => !t.folderId ? { ...t, folderId: defaultFolder!.id } : t));
    }
  }, []);

  // --- UNDO SYSTEM STATE ---
  const [lastAction, setLastAction] = useState<HistoryItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const registerAction = (type: ActionType, data: any) => {
    setLastAction({ type, data, timestamp: Date.now() });
    
    let msg = '';
    switch(type) {
        case 'DELETE_TASK': msg = 'Task Object Deleted'; break;
        case 'DELETE_NOTE': msg = 'Note Entry Deleted'; break;
        case 'DELETE_FOLDER': msg = 'Directory Deleted'; break;
    }
    setToastMessage(msg);
    setShowToast(true);
  };

  const performUndo = useCallback(() => {
    if (!lastAction) return;
    
    const { type, data } = lastAction;
    
    switch(type) {
        case 'DELETE_TASK':
            setTasks(prev => [...prev, data]);
            break;
        case 'DELETE_NOTE':
            setNotes(prev => [...prev, data]);
            break;
        case 'DELETE_FOLDER':
            setFolders(prev => [...prev, data.folder]);
            setTasks(prev => [...prev, ...data.tasks]);
            setNotes(prev => [...prev, ...data.notes]);
            break;
    }
    
    setLastAction(null);
    setShowToast(false);
  }, [lastAction]);

  // --- DASHBOARD UI STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'overdue' | 'today' | 'tomorrow' | 'upcoming'>('all');
  const [isParsing, setIsParsing] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    status: true,
    priority: true,
    category: false,
    date: false
  });

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- ACTIONS ---
  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = {
        id: uuidv4(),
        name,
        createdAt: Date.now(),
        theme: 'blue',
        isFavorite: false
    };
    setFolders(prev => [newFolder, ...prev]);
  };

  const handleDeleteFolder = (id: string) => {
    const folderToDelete = folders.find(f => f.id === id);
    if (!folderToDelete) return;
    
    const tasksInFolder = tasks.filter(t => t.folderId === id);
    const notesInFolder = notes.filter(n => n.folderId === id);
    
    // Backup for Undo
    registerAction('DELETE_FOLDER', {
        folder: folderToDelete,
        tasks: tasksInFolder,
        notes: notesInFolder
    });

    setFolders(prev => prev.filter(f => f.id !== id));
    setTasks(prev => prev.filter(t => t.folderId !== id));
    setNotes(prev => prev.filter(n => n.folderId !== id));
  };

  const handleUpdateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleReorderFolders = (reordered: Folder[]) => {
    setFolders(reordered);
  };

  const resetFilters = () => {
    setFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = filter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all';

  const addTask = async (rawInput: string, overrides: { priority?: Priority; category?: Category; dueDate?: string }) => {
    if (!activeFolderId) return;

    setIsParsing(true);
    const parsed = await parseNaturalLanguageTask(rawInput);
    
    // Check if category exists, if not, add it (or handle as 'Other')
    // Here we trust the parser or the override.
    
    const newTask: Task = {
      id: uuidv4(),
      folderId: activeFolderId,
      title: parsed.title,
      priority: overrides.priority || parsed.priority,
      category: overrides.category || parsed.category,
      dueDate: overrides.dueDate || parsed.dueDate,
      completed: false,
      status: 'todo',
      createdAt: Date.now(),
      subTasks: [],
      pomodoroSessions: 0,
      timeSpent: 0,
      notes: parsed.notes || ''
    };

    setTasks(prev => [newTask, ...prev]);
    setIsParsing(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id === id) {
            const newCompleted = !t.completed;
            return { 
                ...t, 
                completed: newCompleted,
                status: newCompleted ? 'done' : 'todo'
            };
        }
        return t;
    }));
  };
  
  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
     setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            return {
                ...t,
                status: newStatus,
                completed: newStatus === 'done'
            };
        }
        return t;
     }));
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
        registerAction('DELETE_TASK', taskToDelete);
        setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const clearCompletedTasks = () => {
    if (window.confirm('WARNING: System purge initiated. This will permanently delete all completed tasks in this folder. Confirm execution?')) {
        // Simple purge doesn't support single-undo for bulk actions in this simple implementation
        setTasks(prev => prev.filter(t => t.folderId === activeFolderId ? !t.completed : true));
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
  };

  const updateTaskNotes = (id: string, notes: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes } : t));
  };

  const handleBreakdown = async (task: Task) => {
    setGeneratingId(task.id);
    const steps = await generateSmartBreakdown(task.title);
    setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
            return {
                ...t,
                subTasks: steps.map(s => ({ id: uuidv4(), title: s, completed: false }))
            };
        }
        return t;
    }));
    setGeneratingId(null);
  };

  const handleAddSubTask = (taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            return {
                ...t,
                subTasks: [...t.subTasks, { id: uuidv4(), title, completed: false }]
            };
        }
        return t;
    }));
  };

  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            return {
                ...t,
                subTasks: t.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st)
            };
        }
        return t;
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  const openEditModal = (taskId: string) => {
    const taskToEdit = tasks.find(t => t.id === taskId);
    if (taskToEdit) setEditingTask(taskToEdit);
    setContextMenu(null);
  };

  // --- NOTE ACTIONS ---
  const handleAddNote = (title: string, content: string) => {
    if (!activeFolderId) return;
    const newNote: Note = {
      id: uuidv4(),
      folderId: activeFolderId,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const handleDeleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
        registerAction('DELETE_NOTE', noteToDelete);
        setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  // --- FILTER LOGIC (Scoped to Active Folder) ---
  const currentFolder = folders.find(f => f.id === activeFolderId);
  
  const filteredTasks = tasks
    .filter(t => {
        if (t.folderId !== activeFolderId) return false;
        if (filter === 'active' && t.completed) return false;
        if (filter === 'completed' && !t.completed) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (dateFilter !== 'all') {
            if (!t.dueDate) return false;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            let targetDate: Date;
            if (/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) {
                const [y, m, d] = t.dueDate.split('-').map(Number);
                targetDate = new Date(y, m - 1, d);
            } else {
                targetDate = new Date(t.dueDate);
            }
            targetDate.setHours(0, 0, 0, 0);
            const diffTime = targetDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (dateFilter === 'overdue') return diffDays < 0;
            if (dateFilter === 'today') return diffDays === 0;
            if (dateFilter === 'tomorrow') return diffDays === 1;
            if (dateFilter === 'upcoming') return diffDays > 1;
        }
        return true;
    })
    .sort((a, b) => {
        const priorityWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (weightDiff !== 0) return weightDiff;
        return b.createdAt - a.createdAt;
    });

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);
  const hasCompletedTasksInFolder = tasks.some(t => t.folderId === activeFolderId && t.completed);

  const folderNotes = notes.filter(n => n.folderId === activeFolderId).sort((a, b) => b.updatedAt - a.updatedAt);

  // Helper Component for Sidebar
  const FilterSection = ({ title, icon: Icon, isOpen, onToggle, isActive, children }: any) => (
    <div className="border border-white/5 bg-black/20 backdrop-blur-sm rounded-sm overflow-hidden">
        <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <div className="flex items-center gap-2">
                <Icon size={12} className={isActive ? 'text-cyber-amber' : ''} />
                <span className={isActive ? 'text-white' : ''}>{title}</span>
            </div>
            <div className="flex items-center gap-2">
                {isActive && !isOpen && <span className="w-1.5 h-1.5 rounded-full bg-cyber-amber animate-pulse shadow-[0_0_8px_rgba(255,184,0,0.5)]" />}
                <ChevronRight size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-cyber-blue' : ''}`} />
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-2 border-t border-white/5 space-y-1">{children}</div>
                </MotionDiv>
            )}
        </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-cyber-black text-gray-300 overflow-hidden relative font-sans selection:bg-cyber-amber selection:text-black">
        {/* Background Image Layer */}
        {APP_CONFIG.backgroundImageUrl && (
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none mix-blend-screen saturate-0 contrast-125"
                style={{ 
                    backgroundImage: `url(${APP_CONFIG.backgroundImageUrl})`,
                    opacity: APP_CONFIG.backgroundOpacity
                }}
            />
        )}
        
        {/* Persistent Grid Background */}
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-40 z-0" />
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)] z-0" />

        {/* Global Undo Toast */}
        <Toast 
            message={toastMessage} 
            isVisible={showToast} 
            onUndo={performUndo} 
            onClose={() => setShowToast(false)} 
        />

        <AnimatePresence mode="wait">
            {!activeFolderId ? (
                <Homepage 
                    key="homepage" 
                    folders={folders} 
                    onSelectFolder={setActiveFolderId} 
                    onCreateFolder={handleCreateFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onUpdateFolder={handleUpdateFolder}
                    onReorderFolders={handleReorderFolders}
                    logoUrl={APP_CONFIG.logoUrl}
                />
            ) : (
                <MotionDiv
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative z-10 w-full p-4 md:p-8"
                >
                    {/* Modals & Menus */}
                    <AnimatePresence>
                        {editingTask && (
                            <EditTaskModal 
                                task={editingTask} 
                                isOpen={!!editingTask} 
                                onClose={() => setEditingTask(null)} 
                                onSave={handleUpdateTask} 
                                categories={categories}
                                onAddCategory={handleAddCategory}
                            />
                        )}
                    </AnimatePresence>

                    {contextMenu && (
                        <div className="fixed z-50 cyber-glass-strong w-56 animate-in fade-in zoom-in-95 duration-100 rounded-sm overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
                            <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-cyber-amber"></div>
                            <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-cyber-amber"></div>
                            <div className="p-1">
                                <div className="px-3 py-2 text-[10px] font-mono text-gray-500 border-b border-white/10 mb-1 uppercase tracking-widest">System Action</div>
                                <button onClick={() => openEditModal(contextMenu.taskId)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-mono text-cyber-blue hover:bg-cyber-blue/10 hover:text-white transition-colors text-left group">
                                    <Edit2 size={14} className="group-hover:scale-110 transition-transform" /> MODIFY_PARAMS
                                </button>
                                <button onClick={() => { deleteTask(contextMenu.taskId); setContextMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-mono text-cyber-red hover:bg-cyber-red/10 hover:text-white transition-colors text-left group">
                                    <Trash size={14} className="group-hover:scale-110 transition-transform" /> DELETE_OBJECT
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dashboard Content */}
                    <div className="max-w-6xl mx-auto relative z-10">
                        {/* Header */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-cyber-gray pb-6 gap-6">
                            <div className="flex items-center gap-6">
                                {/* INYTX Logo in Dashboard */}
                                <div className="flex flex-col leading-none select-none mr-2 group/logo cursor-pointer" onClick={() => setActiveFolderId(null)}>
                                    {APP_CONFIG.logoUrl ? (
                                        <img src={APP_CONFIG.logoUrl} className="h-10 w-auto object-contain" alt="Logo" />
                                    ) : (
                                        <>
                                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[#FF3E3E] group-hover/logo:text-[#ff5e5e] transition-colors cursor-default" style={{ fontFamily: 'Impact, sans-serif' }}>
                                                INYTX
                                            </h1>
                                            <span className="text-[8px] md:text-[10px] text-gray-600 font-mono tracking-widest hidden md:block">TASK_OS</span>
                                        </>
                                    )}
                                </div>
                                
                                <div className="h-10 w-px bg-white/10 hidden md:block"></div>

                                <button onClick={() => setActiveFolderId(null)} className="group border border-white/10 p-3 hover:border-cyber-amber/50 hover:bg-white/5 transition-all">
                                    <LayoutGrid size={20} className="text-gray-400 group-hover:text-cyber-amber" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
                                        <span className="text-cyber-amber opacity-50">DIR:</span> {currentFolder?.name}
                                    </h1>
                                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        DATABASE_MOUNTED // ID: {currentFolder?.id.substring(0,6)}
                                    </div>
                                </div>
                            </div>
                            
                            {/* View Switcher & Controls */}
                            <div className="flex items-center gap-4">
                                {/* View Modes */}
                                <div className="flex bg-black/40 border border-white/10 rounded-sm p-1">
                                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-white/10 text-cyber-blue' : 'text-gray-500 hover:text-white'}`} title="List View">
                                        <List size={16} />
                                    </button>
                                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-sm transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-cyber-amber' : 'text-gray-500 hover:text-white'}`} title="Kanban Board">
                                        <Columns size={16} />
                                    </button>
                                    <button onClick={() => setViewMode('neural')} className={`p-2 rounded-sm transition-all ${viewMode === 'neural' ? 'bg-white/10 text-cyber-green' : 'text-gray-500 hover:text-white'}`} title="Neural Network">
                                        <Network size={16} />
                                    </button>
                                    <button onClick={() => setViewMode('timeline')} className={`p-2 rounded-sm transition-all ${viewMode === 'timeline' ? 'bg-white/10 text-cyber-red' : 'text-gray-500 hover:text-white'}`} title="Timeline">
                                        <Calendar size={16} />
                                    </button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onClick={() => setViewMode('notes')} className={`p-2 rounded-sm transition-all ${viewMode === 'notes' ? 'bg-white/10 text-purple-400' : 'text-gray-500 hover:text-white'}`} title="Notes">
                                        <StickyNote size={16} />
                                    </button>
                                </div>

                                <button onClick={() => setActiveFolderId(null)} className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-cyber-red uppercase border border-transparent hover:border-cyber-red/30 px-3 py-2 transition-all">
                                    <LogOut size={12} /> Eject_Directory
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Main Content Area - Dynamic based on ViewMode */}
                            <div className={`${viewMode === 'list' ? 'lg:col-span-9' : 'col-span-12'}`}>
                                
                                {viewMode === 'list' && (
                                    <>
                                        <TaskInput 
                                            onAddTask={addTask} 
                                            isParsing={isParsing} 
                                            categories={categories}
                                            onAddCategory={handleAddCategory}
                                            onDeleteCategory={handleDeleteCategory}
                                        />
                                        <div className="mt-8 border-t border-cyber-gray pt-4">
                                            <div className="flex justify-between items-end mb-4">
                                                <h2 className="text-sm font-mono text-gray-500 uppercase">
                                                    // TASK_QUEUE <span className="text-cyber-amber">[{activeTasks.length}]</span>
                                                </h2>
                                            </div>

                                            <MotionDiv layout className="space-y-3 pb-20">
                                                <AnimatePresence mode="popLayout">
                                                    {filteredTasks.length === 0 && (
                                                        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 border border-dashed border-cyber-gray bg-cyber-dark/30">
                                                            <p className="text-cyber-amber font-mono text-lg mb-2">NO_DATA_FOUND</p>
                                                            <p className="text-xs text-gray-600 font-mono uppercase">Directory empty. Awaiting input.</p>
                                                        </MotionDiv>
                                                    )}

                                                    {activeTasks.map(task => (
                                                        <TaskItem 
                                                            key={task.id} 
                                                            task={task} 
                                                            onToggle={toggleTask} 
                                                            onDelete={deleteTask} 
                                                            onAddSubTasks={() => {}} 
                                                            onAddSubTask={handleAddSubTask}
                                                            onToggleSubTask={handleToggleSubTask}
                                                            isGeneratingBreakdown={generatingId === task.id} 
                                                            onRequestBreakdown={handleBreakdown} 
                                                            onContextMenu={handleContextMenu} 
                                                            onUpdateNotes={updateTaskNotes} 
                                                        />
                                                    ))}

                                                    {completedTasks.length > 0 && (
                                                        <React.Fragment>
                                                            {activeTasks.length > 0 && (
                                                                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 flex items-center gap-4 opacity-50">
                                                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyber-gray to-transparent"></div>
                                                                    <span className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2"><Archive size={12} /> ARCHIVE_LOG // [{completedTasks.length}]</span>
                                                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyber-gray to-transparent"></div>
                                                                </MotionDiv>
                                                            )}
                                                            {completedTasks.map(task => (
                                                                <TaskItem 
                                                                    key={task.id} 
                                                                    task={task} 
                                                                    onToggle={toggleTask} 
                                                                    onDelete={deleteTask} 
                                                                    onAddSubTasks={() => {}} 
                                                                    onAddSubTask={handleAddSubTask}
                                                                    onToggleSubTask={handleToggleSubTask}
                                                                    isGeneratingBreakdown={generatingId === task.id} 
                                                                    onRequestBreakdown={handleBreakdown} 
                                                                    onContextMenu={handleContextMenu} 
                                                                    onUpdateNotes={updateTaskNotes} 
                                                                />
                                                            ))}
                                                        </React.Fragment>
                                                    )}
                                                </AnimatePresence>
                                            </MotionDiv>
                                        </div>
                                    </>
                                )}

                                {viewMode === 'kanban' && (
                                    <KanbanBoard 
                                        tasks={filteredTasks} 
                                        onUpdateTaskStatus={updateTaskStatus}
                                        onTaskClick={(t) => setEditingTask(t)}
                                    />
                                )}

                                {viewMode === 'neural' && (
                                    <NeuralView 
                                        tasks={filteredTasks}
                                        onTaskClick={(t) => setEditingTask(t)}
                                    />
                                )}

                                {viewMode === 'timeline' && (
                                    <TimelineView 
                                        tasks={filteredTasks}
                                        onTaskClick={(t) => setEditingTask(t)}
                                    />
                                )}

                                {viewMode === 'notes' && (
                                    <NotesView 
                                        notes={folderNotes}
                                        onAddNote={handleAddNote}
                                        onUpdateNote={handleUpdateNote}
                                        onDeleteNote={handleDeleteNote}
                                    />
                                )}

                            </div>

                            {/* Sidebar Filters - Only visible in List View to save space */}
                            {viewMode === 'list' && (
                                <div className="lg:col-span-3 lg:order-last sticky top-8 space-y-4">
                                    <div className="flex items-center justify-between h-8">
                                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layers size={12} /> System_Filters</h3>
                                        {hasActiveFilters && (
                                            <button onClick={resetFilters} className="text-[10px] text-cyber-red hover:text-white flex items-center gap-1 uppercase font-mono tracking-wider transition-colors animate-in fade-in"><RotateCcw size={10} /> Reset_All</button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <FilterSection title="Execution_Status" icon={Filter} isOpen={expandedSections.status} onToggle={() => setExpandedSections(p => ({...p, status: !p.status}))} isActive={filter !== 'all'}>
                                            {['all', 'active', 'completed'].map((f) => (
                                                <button key={f} onClick={() => setFilter(f as any)} className={`w-full text-xs px-3 py-2 text-left font-mono transition-all uppercase rounded-sm border ${filter === f ? 'border-cyber-amber/50 bg-cyber-amber/10 text-white pl-4' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{f}</button>
                                            ))}
                                        </FilterSection>

                                        <FilterSection title="Priority_Index" icon={Flag} isOpen={expandedSections.priority} onToggle={() => setExpandedSections(p => ({...p, priority: !p.priority}))} isActive={priorityFilter !== 'all'}>
                                            <button onClick={() => setPriorityFilter('all')} className={`w-full text-xs px-3 py-2 text-left font-mono transition-all uppercase rounded-sm border ${priorityFilter === 'all' ? 'border-gray-600 bg-gray-800 text-white' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>ALL_LEVELS</button>
                                            {Object.values(Priority).map((p) => (
                                                <button key={p} onClick={() => setPriorityFilter(p)} className={`w-full text-xs px-3 py-2 text-left font-mono transition-all uppercase rounded-sm border mt-1 flex justify-between items-center ${priorityFilter === p ? 'border-cyber-blue/50 bg-cyber-blue/10 text-white pl-4' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>{p}</button>
                                            ))}
                                        </FilterSection>

                                        <FilterSection title="Data_Sectors" icon={Hash} isOpen={expandedSections.category} onToggle={() => setExpandedSections(p => ({...p, category: !p.category}))} isActive={categoryFilter !== 'all'}>
                                            <button onClick={() => setCategoryFilter('all')} className={`w-full text-xs px-3 py-2 text-left font-mono transition-all uppercase rounded-sm border ${categoryFilter === 'all' ? 'border-gray-600 bg-gray-800 text-white' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>ALL_DATA</button>
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {categories.map((cat) => (
                                                    <button key={cat} onClick={() => setCategoryFilter(cat)} className={`flex-grow text-[10px] px-2 py-1.5 font-mono transition-all uppercase rounded-sm border ${categoryFilter === cat ? 'border-cyber-green/50 bg-cyber-green/10 text-white' : 'border-transparent bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10'}`}>{cat}</button>
                                                ))}
                                            </div>
                                        </FilterSection>

                                        <FilterSection title="Temporal_Window" icon={Calendar} isOpen={expandedSections.date} onToggle={() => setExpandedSections(p => ({...p, date: !p.date}))} isActive={dateFilter !== 'all'}>
                                            <button onClick={() => setDateFilter('all')} className={`w-full text-xs px-3 py-2 text-left font-mono transition-all uppercase rounded-sm border ${dateFilter === 'all' ? 'border-gray-600 bg-gray-800 text-white' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>ANY_TIME</button>
                                            {[{ id: 'overdue', label: 'PAST_DUE', icon: AlertCircle, color: 'text-cyber-red' }, { id: 'today', label: 'TODAY', icon: Clock, color: 'text-cyber-amber' }, { id: 'tomorrow', label: 'TOMORROW', icon: Calendar, color: 'text-cyber-green' }, { id: 'upcoming', label: 'UPCOMING', icon: Calendar, color: 'text-cyber-blue' }].map((item) => (
                                                <button key={item.id} onClick={() => setDateFilter(item.id as any)} className={`w-full text-xs px-3 py-2 text-left font-mono transition-all uppercase rounded-sm border mt-1 flex items-center gap-2 ${dateFilter === item.id ? 'border-white/20 bg-white/10 text-white pl-4' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                                                    <item.icon size={10} className={dateFilter === item.id ? item.color : ''} /> {item.label}
                                                </button>
                                            ))}
                                        </FilterSection>
                                    </div>

                                    <div className="pt-4 border-t border-cyber-gray/30">
                                        <button onClick={clearCompletedTasks} disabled={!hasCompletedTasksInFolder} className={`w-full flex items-center justify-between px-4 py-3 border transition-all font-mono text-xs uppercase tracking-wider group rounded-sm ${hasCompletedTasksInFolder ? 'border-cyber-red/30 bg-cyber-red/5 text-cyber-red/70 hover:text-white hover:bg-cyber-red hover:border-cyber-red cursor-pointer shadow-[0_0_10px_rgba(255,62,62,0.1)] hover:shadow-[0_0_20px_rgba(255,62,62,0.4)]' : 'border-gray-800 bg-black/20 text-gray-600 cursor-not-allowed opacity-50'}`}>
                                            <span className="flex items-center gap-2"><Trash size={12} /> PURGE_COMPLETED</span>
                                            {hasCompletedTasksInFolder && <AlertTriangle size={10} className="text-cyber-red opacity-0 group-hover:opacity-100 group-hover:text-white transition-opacity" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
    </div>
  );
};

export default App;
