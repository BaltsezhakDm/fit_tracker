import React, { useState } from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';

export default function WorkoutTimer({ time, setTime, isRunning, setIsRunning }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ${isExpanded ? 'w-48' : 'w-12 h-12'}`}>
      <div className={`bg-slate-900 text-white rounded-full shadow-lg shadow-slate-300/50 flex items-center justify-between overflow-hidden transition-all duration-300 ${isExpanded ? 'p-2' : 'p-0 w-12 h-12 justify-center'}`}>

        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center text-blue-400 hover:text-blue-300"
          >
            {time > 0 ? (
              <span className="text-xs font-bold">{formatTime(time)}</span>
            ) : (
              <Timer size={24} />
            )}
          </button>
        ) : (
          <>
            <span className="font-mono font-bold text-lg ml-3 w-16" onClick={() => setIsExpanded(false)}>
              {formatTime(time)}
            </span>
            <div className="flex gap-1 pr-1">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-blue-400"
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-red-400"
              >
                <Square size={18} fill="currentColor" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Timer size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}