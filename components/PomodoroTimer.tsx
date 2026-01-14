
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface PomodoroTimerProps {
  onSessionComplete: () => void;
  isOpen: boolean;
}

const POMODORO_TIME = 25 * 60; // 25 minutes

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete, isOpen }) => {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onSessionComplete();
      setTimeLeft(POMODORO_TIME);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, onSessionComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(POMODORO_TIME);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((POMODORO_TIME - timeLeft) / POMODORO_TIME) * 100;

  if (!isOpen) return null;

  return (
    <MotionDiv
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 border-t border-dashed border-cyber-gray pt-3"
    >
      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-sm backdrop-blur-md shadow-inner">
        <div className="flex items-center gap-3">
           <Timer className="w-4 h-4 text-cyber-amber animate-pulse" />
           <span className="text-xl font-mono text-cyber-amber tracking-[0.1em] text-shadow-glow">{formatTime(timeLeft)}</span>
        </div>
        <div className="flex gap-1">
            <button
                onClick={toggleTimer}
                className={`p-1.5 border transition-all rounded-sm ${isActive ? 'border-cyber-amber text-cyber-amber bg-cyber-amber/10' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
            >
                {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
                onClick={resetTimer}
                className="p-1.5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all rounded-sm"
            >
                <RefreshCw className="w-3 h-3" />
            </button>
        </div>
      </div>
      
      {/* Segmented Progress Bar */}
      <div className="flex gap-0.5 mt-1 h-1 w-full opacity-50">
        {Array.from({ length: 20 }).map((_, i) => (
            <div 
                key={i} 
                className={`flex-1 transition-colors duration-300 ${
                    (i / 20) * 100 < progress ? 'bg-cyber-amber shadow-[0_0_5px_#FFB800]' : 'bg-white/10'
                }`} 
            />
        ))}
      </div>
    </MotionDiv>
  );
};
