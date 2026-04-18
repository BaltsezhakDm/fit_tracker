import React from 'react';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';

interface WorkoutTimerProps {
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
}

export default function WorkoutTimer({ time, setTime, isRunning, setIsRunning }: WorkoutTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (time === 0 && !isRunning) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-tg-secondaryBg shadow-2xl border border-slate-100 rounded-full px-6 py-3 flex items-center gap-4 animate-in zoom-in slide-in-from-bottom-10 duration-500">
        <div className={`p-2 rounded-full ${isRunning ? 'bg-tg-link text-white animate-pulse' : 'bg-tg-bg text-tg-hint'}`}>
          <Timer size={18} />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-lg font-black tabular-nums text-tg-text">{formatTime(time)}</span>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 hover:text-tg-link transition-colors text-tg-hint"
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTime(0);
            }}
            className="p-1 hover:text-red-500 transition-colors text-tg-hint"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
