import React, { useRef } from 'react';
import { Task } from '../types';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

const MotionDiv = motion.div as any;

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onTaskClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  const unscheduledTasks: Task[] = [];

  tasks.forEach(task => {
    if (task.dueDate) {
        // Extract YYYY-MM-DD
        const dateKey = task.dueDate.split('T')[0];
        if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
        tasksByDate[dateKey].push(task);
    } else {
        unscheduledTasks.push(task);
    }
  });

  // Generate date range (next 14 days + existing task dates)
  const dates = new Set<string>();
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.add(d.toISOString().split('T')[0]);
  }
  Object.keys(tasksByDate).forEach(d => dates.add(d));
  
  const sortedDates = Array.from(dates).sort();

  return (
    <div className="w-full h-[calc(100vh-220px)] flex flex-col cyber-glass rounded-sm border border-white/5 overflow-hidden">
        <div className="p-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <h3 className="text-xs font-mono text-cyber-green uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={14} /> Temporal_Sequence
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">SCROLL_AXIS_X &gt;&gt;</span>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <div className="flex h-full min-w-max">
                {/* Timeline Columns */}
                {sortedDates.map(date => {
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    const isToday = new Date().toISOString().split('T')[0] === date;
                    const columnTasks = tasksByDate[date] || [];

                    return (
                        <div key={date} className={`w-64 h-full border-r border-white/5 flex flex-col ${isToday ? 'bg-cyber-blue/5' : ''}`}>
                            {/* Header */}
                            <div className={`p-2 border-b border-white/5 text-center ${isToday ? 'text-cyber-blue' : 'text-gray-500'}`}>
                                <div className="text-[10px] font-mono uppercase opacity-70">{dayName}</div>
                                <div className="text-xl font-bold font-mono">{dayNum}</div>
                            </div>
                            
                            {/* Lane */}
                            <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                                {columnTasks.map(task => (
                                    <MotionDiv
                                        key={task.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => onTaskClick(task)}
                                        className={`p-3 rounded-sm border cursor-pointer relative overflow-hidden group ${
                                            task.status === 'done' 
                                            ? 'bg-gray-900 border-gray-800 opacity-60' 
                                            : 'bg-cyber-dark border-white/10 hover:border-cyber-blue/50'
                                        }`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                            task.priority === 'High' ? 'bg-cyber-red' : task.priority === 'Medium' ? 'bg-cyber-blue' : 'bg-cyber-green'
                                        }`} />
                                        
                                        <div className="pl-2">
                                            <div className="text-[9px] font-mono text-gray-500 mb-1">{task.dueDate?.split('T')[1]?.substring(0,5) || 'ALL_DAY'}</div>
                                            <div className={`text-xs font-bold leading-tight ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                                                {task.title}
                                            </div>
                                        </div>
                                    </MotionDiv>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Unscheduled Column */}
                <div className="w-64 h-full border-r border-white/5 flex flex-col bg-black/40">
                    <div className="p-2 border-b border-white/5 text-center text-gray-500">
                        <div className="text-[10px] font-mono uppercase opacity-70">Backlog</div>
                        <div className="text-xl font-bold font-mono">--</div>
                    </div>
                    <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                         {unscheduledTasks.map(task => (
                            <div key={task.id} onClick={() => onTaskClick(task)} className="p-2 border border-white/5 bg-white/5 rounded-sm cursor-pointer hover:bg-white/10">
                                <span className="text-xs text-gray-400">{task.title}</span>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};