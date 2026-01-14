import React from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Clock, CheckCircle2, MoreHorizontal } from 'lucide-react';

const MotionDiv = motion.div as any;

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

interface DraggableCardProps {
  task: Task;
  onClick: () => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ task, onClick }) => {
  // Using 'any' to avoid conflict between React.DragEvent and Framer Motion's gesture event types
  const handleDragStart = (e: any) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const priorityColor = {
    [Priority.HIGH]: 'border-l-cyber-red',
    [Priority.MEDIUM]: 'border-l-cyber-blue',
    [Priority.LOW]: 'border-l-cyber-green',
  };

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`bg-cyber-dark border border-white/10 p-3 rounded-sm cursor-grab active:cursor-grabbing hover:border-white/30 transition-all border-l-2 ${priorityColor[task.priority]} group`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider bg-white/5 px-1 rounded">
            {task.category}
        </span>
        <button className="text-gray-600 hover:text-white transition-colors">
            <MoreHorizontal size={12} />
        </button>
      </div>
      <h4 className="text-sm font-bold text-gray-200 line-clamp-2 leading-tight mb-2 group-hover:text-cyber-blue transition-colors">
        {task.title}
      </h4>
      {task.dueDate && (
         <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            {task.dueDate}
         </div>
      )}
    </MotionDiv>
  );
};

const Column = ({ title, status, tasks, color, onDrop, onTaskClick }: any) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId, status);
    }
  };

  return (
    <div 
      className="flex-1 min-w-[300px] h-full flex flex-col cyber-glass rounded-sm border border-white/5"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-white/5 flex justify-between items-center ${color}`}>
        <h3 className="font-mono text-sm uppercase tracking-widest font-bold flex items-center gap-2">
            {status === 'todo' && <Circle size={14} />}
            {status === 'in_progress' && <Clock size={14} />}
            {status === 'done' && <CheckCircle2 size={14} />}
            {title}
        </h3>
        <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">{tasks.length}</span>
      </div>

      {/* Drop Zone */}
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3 bg-black/20">
        <AnimatePresence>
            {tasks.map((task: Task) => (
            <DraggableCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
        </AnimatePresence>
        {tasks.length === 0 && (
            <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded opacity-30">
                <p className="font-mono text-xs text-center uppercase">Zone Empty</p>
            </div>
        )}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateTaskStatus, onTaskClick }) => {
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto pb-4 items-start">
      <Column 
        title="To Execute" 
        status="todo" 
        tasks={todoTasks} 
        color="text-gray-400 border-t-2 border-t-gray-500" 
        onDrop={onUpdateTaskStatus} 
        onTaskClick={onTaskClick}
      />
      <Column 
        title="In Progress" 
        status="in_progress" 
        tasks={inProgressTasks} 
        color="text-cyber-amber border-t-2 border-t-cyber-amber" 
        onDrop={onUpdateTaskStatus}
        onTaskClick={onTaskClick}
      />
      <Column 
        title="Completed" 
        status="done" 
        tasks={doneTasks} 
        color="text-cyber-green border-t-2 border-t-cyber-green" 
        onDrop={onUpdateTaskStatus}
        onTaskClick={onTaskClick}
      />
    </div>
  );
};