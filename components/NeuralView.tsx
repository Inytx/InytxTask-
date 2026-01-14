
import React, { useEffect, useRef, useState } from 'react';
import { Task, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface NeuralViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  task: Task;
  radius: number;
}

export const NeuralView: React.FC<NeuralViewProps> = ({ tasks, onTaskClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number | null>(null);

  // Dynamic color generation for categories
  const getCategoryColor = (category: string) => {
    // Standard map
    const standardColors: Record<string, string> = {
      'Work': '#00D4FF',     // Blue
      'Personal': '#FFB800', // Amber
      'Health': '#FF3E3E',   // Red
      'Learning': '#00FF9D', // Green
      'Other': '#A855F7',    // Purple
    };

    if (standardColors[category]) return standardColors[category];

    // Generate hash color for unknown categories
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const resize = () => {
        if (containerRef.current) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize Nodes
    nodesRef.current = tasks.map(task => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        task,
        radius: task.priority === 'High' ? 6 : task.priority === 'Medium' ? 4 : 3
    }));

    // Animation Loop
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Connections
        ctx.lineWidth = 0.5;
        for (let i = 0; i < nodesRef.current.length; i++) {
            const nodeA = nodesRef.current[i];
            
            // Move nodes
            nodeA.x += nodeA.vx;
            nodeA.y += nodeA.vy;

            // Bounce off walls
            if (nodeA.x < 0 || nodeA.x > canvas.width) nodeA.vx *= -1;
            if (nodeA.y < 0 || nodeA.y > canvas.height) nodeA.vy *= -1;

            // Connect similar categories
            for (let j = i + 1; j < nodesRef.current.length; j++) {
                const nodeB = nodesRef.current[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 200 && nodeA.task.category === nodeB.task.category) {
                    ctx.beginPath();
                    ctx.strokeStyle = `${getCategoryColor(nodeA.task.category)}33`; // low opacity
                    ctx.moveTo(nodeA.x, nodeA.y);
                    ctx.lineTo(nodeB.x, nodeB.y);
                    ctx.stroke();
                }
            }
        }

        // Draw Nodes
        nodesRef.current.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = getCategoryColor(node.task.category) || '#ffffff';
            ctx.fill();
            
            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = getCategoryColor(node.task.category);
            
            // Reset shadow for next ops
            ctx.shadowBlur = 0;
            
            // Draw status ring if done
            if (node.task.status === 'done') {
                 ctx.strokeStyle = '#333';
                 ctx.lineWidth = 2;
                 ctx.stroke();
            }
        });

        animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('resize', resize);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [tasks]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = nodesRef.current.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20; // Hit area
    });

    setHoveredTask(hovered ? hovered.task : null);
    
    // Change cursor
    if (containerRef.current) {
        containerRef.current.style.cursor = hovered ? 'pointer' : 'default';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoveredTask) {
        onTaskClick(hoveredTask);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-[600px] relative cyber-glass rounded-sm border border-white/10 overflow-hidden">
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h3 className="text-xs font-mono text-cyber-blue uppercase tracking-widest bg-black/50 px-2 py-1">
                NEURAL_NET_VISUALIZATION // ACTIVE_NODES: {tasks.length}
            </h3>
        </div>
        
        <canvas 
            ref={canvasRef}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        />

        {/* Hover Tooltip */}
        <AnimatePresence>
            {hoveredTask && (
                <MotionDiv 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-sm pointer-events-none"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-cyber-amber uppercase">{hoveredTask.category}</span>
                        <span className="text-[10px] font-mono text-gray-500">{hoveredTask.priority}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm mt-1">{hoveredTask.title}</h4>
                    {hoveredTask.status && (
                        <div className="mt-2 text-[10px] font-mono text-gray-400 uppercase">
                            STATUS: {hoveredTask.status}
                        </div>
                    )}
                </MotionDiv>
            )}
        </AnimatePresence>
    </div>
  );
};
