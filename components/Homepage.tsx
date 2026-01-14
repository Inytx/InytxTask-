
import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon, Plus, Trash2, HardDrive, ArrowRight, Edit2, Settings, Palette, X, CornerDownLeft, Star } from 'lucide-react';
import { Folder, FolderTheme } from '../types';

const MotionDiv = motion.div as any;
const ReorderItem = Reorder.Item as any;

interface HomepageProps {
  folders: Folder[];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolder: (id: string, updates: Partial<Folder>) => void;
  onReorderFolders: (folders: Folder[]) => void;
  logoUrl?: string;
}

const themeConfig: Record<FolderTheme, { border: string; text: string; bg: string; icon: string }> = {
  blue: { border: 'group-hover:border-cyber-blue/50', text: 'group-hover:text-cyber-blue', bg: 'bg-cyber-blue', icon: 'text-cyber-blue' },
  red: { border: 'group-hover:border-cyber-red/50', text: 'group-hover:text-cyber-red', bg: 'bg-cyber-red', icon: 'text-cyber-red' },
  amber: { border: 'group-hover:border-cyber-amber/50', text: 'group-hover:text-cyber-amber', bg: 'bg-cyber-amber', icon: 'text-cyber-amber' },
  green: { border: 'group-hover:border-cyber-green/50', text: 'group-hover:text-cyber-green', bg: 'bg-cyber-green', icon: 'text-cyber-green' },
  purple: { border: 'group-hover:border-purple-500/50', text: 'group-hover:text-purple-500', bg: 'bg-purple-500', icon: 'text-purple-500' },
};

export const Homepage: React.FC<HomepageProps> = ({ 
  folders, 
  onSelectFolder, 
  onCreateFolder, 
  onDeleteFolder,
  onUpdateFolder, 
  onReorderFolders,
  logoUrl
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  
  // Edit Modal State
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editName, setEditName] = useState('');
  const [editTheme, setEditTheme] = useState<FolderTheme>('blue');

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const openEditModal = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder) {
        setEditingFolder(folder);
        setEditName(folder.name);
        setEditTheme(folder.theme || 'blue');
        setContextMenu(null);
    }
  };

  const handleUpdateSubmit = () => {
    if (editingFolder && editName.trim()) {
        onUpdateFolder(editingFolder.id, { name: editName.trim(), theme: editTheme });
        setEditingFolder(null);
    }
  };

  const toggleFavorite = (e: React.MouseEvent, folder: Folder) => {
      e.stopPropagation();
      onUpdateFolder(folder.id, { isFavorite: !folder.isFavorite });
  };

  const favoriteFolders = folders.filter(f => f.isFavorite);

  return (
    <div className="relative z-20 min-h-screen p-6 md:p-12 flex flex-col items-center">
      
      {/* Context Menu */}
      {contextMenu && (
         <div 
            className="fixed z-50 cyber-glass-strong w-48 animate-in fade-in zoom-in-95 duration-100 rounded-sm overflow-hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
         >
            <div className="p-1">
                <button 
                    onClick={() => openEditModal(contextMenu.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-xs font-mono text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-left border-b border-white/5"
                >
                    <Settings size={14} />
                    CONFIGURE_DIR
                </button>
                <button 
                    onClick={() => {
                        if(window.confirm('WARNING: Deleting this directory will wipe all internal data. Proceed?')) {
                            onDeleteFolder(contextMenu.id);
                            setContextMenu(null);
                        }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-xs font-mono text-cyber-red hover:bg-cyber-red/10 hover:text-white transition-colors text-left"
                >
                    <Trash2 size={14} />
                    DELETE_DIRECTORY
                </button>
            </div>
         </div>
      )}

      {/* Edit Folder Modal */}
      <AnimatePresence>
        {editingFolder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <MotionDiv 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingFolder(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <MotionDiv 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-sm cyber-glass-strong p-6 rounded-sm shadow-2xl border border-white/10"
                >
                    <h2 className="text-lg font-mono text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                        <Edit2 size={16} className="text-cyber-blue" />
                        Modify_Attributes
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Directory Name</label>
                            <input 
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white p-3 font-mono text-sm focus:border-cyber-blue outline-none rounded-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Palette size={10} /> Color_Theme
                            </label>
                            <div className="grid grid-cols-5 gap-3 pt-2">
                                {(['blue', 'red', 'amber', 'green', 'purple'] as FolderTheme[]).map(theme => {
                                    const isActive = editTheme === theme;
                                    const config = themeConfig[theme];
                                    
                                    return (
                                        <button
                                            key={theme}
                                            onClick={() => setEditTheme(theme)}
                                            className={`relative group h-12 rounded-sm border transition-all duration-300 overflow-hidden ${
                                                isActive 
                                                ? 'border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                                : 'border-white/10 hover:border-white/30 hover:scale-105'
                                            }`}
                                        >
                                            {/* Background tint */}
                                            <div className={`absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity ${config.bg}`}></div>
                                            
                                            {/* Active Glow Indicator */}
                                            {isActive && (
                                                <div className={`absolute inset-0 opacity-20 ${config.bg} blur-md`}></div>
                                            )}

                                            {/* Color Bar */}
                                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.bg}`}></div>
                                            
                                            {/* Center Dot/Icon */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className={`w-2.5 h-2.5 rounded-full ${config.bg} shadow-[0_0_8px_currentColor] ${isActive ? 'scale-125 ring-2 ring-white/20' : 'opacity-70'} transition-all`}></div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                            <button 
                                onClick={() => setEditingFolder(null)}
                                className="flex-1 py-2 text-xs font-mono text-gray-400 hover:text-white border border-transparent hover:border-white/20 transition-all uppercase"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateSubmit}
                                className="flex-1 py-2 bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/50 text-xs font-mono font-bold hover:bg-cyber-blue hover:text-black transition-all uppercase"
                            >
                                Apply_Changes
                            </button>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        )}
      </AnimatePresence>

      {/* Logo Section */}
      <MotionDiv 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-16 mt-8 text-center"
      >
        <div className="relative inline-block">
            {logoUrl ? (
                <div className="flex flex-col items-center">
                     <img src={logoUrl} alt="System Logo" className="h-24 md:h-32 w-auto object-contain mb-4" />
                     <div className="w-full border-t border-[#FF3E3E] pt-2 flex justify-between items-center gap-8">
                         <span className="text-xs font-mono text-gray-500 tracking-[0.3em] uppercase">System_V.2.0.4</span>
                         <span className="flex items-center gap-2 text-xs font-mono text-[#FF3E3E]">
                            <span className="w-2 h-2 bg-[#FF3E3E] rounded-full animate-pulse"></span>
                            ONLINE
                         </span>
                     </div>
                </div>
            ) : (
                <>
                    {/* The "INYTX" Red Block Logo */}
                    <h1 className="text-[6rem] md:text-[8rem] font-black leading-none tracking-tighter text-[#FF3E3E] select-none" style={{ fontFamily: 'Impact, sans-serif' }}>
                        INYTX
                    </h1>
                    {/* Subtitle overlay */}
                    <div className="absolute -bottom-4 w-full flex justify-between items-center border-t border-[#FF3E3E] pt-2">
                        <span className="text-xs font-mono text-gray-500 tracking-[0.3em] uppercase">System_V.2.0.4</span>
                        <span className="flex items-center gap-2 text-xs font-mono text-[#FF3E3E]">
                            <span className="w-2 h-2 bg-[#FF3E3E] rounded-full animate-pulse"></span>
                            ONLINE
                        </span>
                    </div>
                </>
            )}
        </div>
      </MotionDiv>

      {/* Main Content Width */}
      <div className="w-full max-w-5xl">

        {/* Favorites Section */}
        {favoriteFolders.length > 0 && (
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-sm font-mono text-cyber-amber uppercase tracking-widest flex items-center gap-2">
                        <Star size={14} className="fill-cyber-amber text-cyber-amber" /> Pinned_Directories
                    </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {favoriteFolders.map((folder) => {
                         const theme = folder.theme || 'blue';
                         const styles = themeConfig[theme];
                         return (
                            <MotionDiv
                                key={folder.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelectFolder(folder.id)}
                                className={`cursor-pointer cyber-glass p-4 rounded-sm border border-white/5 relative overflow-hidden group ${styles.border}`}
                            >
                                <div className="absolute top-2 right-2 z-20">
                                     <Star size={12} className="text-cyber-amber fill-cyber-amber" />
                                </div>
                                <div className={`text-2xl font-bold font-mono uppercase ${styles.text} truncate mb-1`}>{folder.name}</div>
                                <div className="text-[9px] font-mono text-gray-500">ID: {folder.id.substring(0,4)}</div>
                                
                                <div className={`absolute bottom-0 left-0 h-1 w-full ${styles.bg} opacity-20`}></div>
                            </MotionDiv>
                         );
                    })}
                </div>
            </div>
        )}

        {/* Folder Grid */}
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <HardDrive size={14} /> Directory_Listing
            </h2>
            <button 
                onClick={() => setIsCreating(true)}
                className="text-cyber-amber text-xs font-mono uppercase hover:text-white flex items-center gap-2 transition-colors"
            >
                <Plus size={14} /> MKDIR_NEW
            </button>
        </div>

        <Reorder.Group 
            axis="y" 
            values={folders} 
            onReorder={onReorderFolders}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {/* Creation Card */}
            {isCreating && (
                <MotionDiv 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="cyber-glass p-1 border border-cyber-amber/50 rounded-sm relative aspect-[4/3] md:aspect-auto md:h-40"
                >
                    <button 
                        onClick={() => setIsCreating(false)}
                        className="absolute top-2 right-2 text-cyber-amber/50 hover:text-cyber-amber z-20 transition-colors"
                        title="Cancel Creation"
                    >
                        <X size={14} />
                    </button>
                    
                    <form onSubmit={handleCreateSubmit} className="h-full bg-black/40 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                        {/* Technical Corners */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-amber"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-amber"></div>
                        
                        <label className="text-[10px] font-mono text-cyber-amber mb-2 uppercase tracking-widest opacity-80">
                            Initialize_New_Directory
                        </label>
                        
                        <input 
                            autoFocus
                            type="text"
                            placeholder="ENTER_NAME..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                            className="bg-transparent border-b border-cyber-amber/30 text-center text-cyber-amber font-mono text-xl placeholder-cyber-amber/20 focus:outline-none focus:border-cyber-amber w-full mb-6 uppercase transition-all py-1"
                        />
                        
                        <button 
                            type="submit" 
                            className="group flex items-center gap-2 text-[10px] bg-cyber-amber/10 border border-cyber-amber/50 hover:bg-cyber-amber hover:text-black text-cyber-amber px-6 py-2 font-bold font-mono transition-all"
                        >
                            <CornerDownLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
                            CONFIRM_CREATE
                        </button>
                    </form>
                </MotionDiv>
            )}

            {/* Folders */}
            <AnimatePresence>
                {folders.map((folder) => {
                    const theme = folder.theme || 'blue';
                    const styles = themeConfig[theme];

                    return (
                        <ReorderItem 
                            key={folder.id} 
                            value={folder}
                            className="relative cursor-move"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <MotionDiv 
                                onClick={() => onSelectFolder(folder.id)}
                                onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, folder.id)}
                                className={`group cyber-glass h-40 p-6 flex flex-col justify-between relative overflow-hidden rounded-sm border border-white/5 ${styles.border} transition-colors duration-300`}
                            >
                                {/* Decorative Background Elements */}
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                                    <FolderIcon className={`${styles.icon} w-16 h-16 stroke-[1px]`} />
                                </div>
                                
                                {/* Top Bar */}
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:${styles.bg.replace('bg-', 'bg-')} transition-colors`}></span>
                                            DIR_ID: {folder.id.substring(0, 4)}
                                        </div>
                                        <button 
                                            onClick={(e) => toggleFavorite(e, folder)}
                                            className={`transition-all p-1 hover:bg-white/5 rounded-full ${folder.isFavorite ? 'text-cyber-amber' : 'text-gray-600 hover:text-cyber-amber opacity-0 group-hover:opacity-100'}`}
                                            title="Toggle Favorite"
                                        >
                                            <Star size={12} className={folder.isFavorite ? 'fill-cyber-amber' : ''} />
                                        </button>
                                    </div>
                                </div>

                                {/* Main Label */}
                                <div className="relative z-10">
                                    <h3 className={`text-xl font-bold text-white font-mono uppercase tracking-wide ${styles.text} transition-colors truncate`}>
                                        {folder.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                                        CREATED: {new Date(folder.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Action Cue */}
                                <div className="relative z-10 flex justify-between items-end border-t border-white/5 pt-3 mt-2">
                                    <span className={`text-[9px] text-gray-600 font-mono uppercase ${styles.text.replace('text-', 'text-opacity-70 ')}`}>Right-Click to Configure</span>
                                    <div className={`${styles.icon} opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300`}>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>

                                {/* Tech Corners */}
                                <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 ${styles.border.replace('group-hover:', '')} transition-colors`}></div>
                                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 ${styles.border.replace('group-hover:', '')} transition-colors`}></div>
                            </MotionDiv>
                        </ReorderItem>
                    );
                })}
            </AnimatePresence>
        </Reorder.Group>

        {folders.length === 0 && !isCreating && (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-sm">
                <p className="text-gray-500 font-mono mb-4">NO DIRECTORIES FOUND</p>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-white/5 hover:bg-white/10 text-cyber-blue px-6 py-2 font-mono text-sm border border-cyber-blue/30"
                >
                    INITIALIZE FIRST FOLDER
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
