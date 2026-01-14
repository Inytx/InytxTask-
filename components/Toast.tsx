
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';

const MotionDiv = motion.div as any;

interface ToastProps {
  message: string;
  onUndo: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000); // Auto close after 5s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-4 bg-cyber-black border border-cyber-amber/30 shadow-[0_0_20px_-5px_rgba(255,184,0,0.15)] p-4 rounded-sm"
        >
          <div className="flex flex-col">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">System Notification</span>
            <span className="text-sm font-bold text-white">{message}</span>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2"></div>

          <button 
            onClick={onUndo}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyber-amber/10 hover:bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/50 rounded-sm text-xs font-mono font-bold uppercase transition-all"
          >
            <RotateCcw size={12} /> Undo
          </button>

          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
