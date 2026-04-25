import React, { useEffect } from 'react';
import { Coffee, X, Bell } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import WebApp from '../lib/telegram';

export default function RestTimer() {
  const seconds = useUIStore(s => s.restTimerSeconds);
  const setSeconds = useUIStore(s => s.setRestTimerSeconds);
  const isActive = useUIStore(s => s.isRestTimerActive);
  const stopTimer = useUIStore(s => s.stopRestTimer);

  useEffect(() => {
    let intervalId: number;
    if (isActive && seconds > 0) {
      intervalId = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            WebApp?.HapticFeedback?.notificationOccurred('success');
            // Suggest playing a sound or more vibration if possible
            return 0;
          }
          return s - 1;
        });
      }, 1000) as unknown as number;
    } else if (seconds === 0 && isActive) {
      // Auto-stop when reaches 0
      setTimeout(() => stopTimer(), 2000);
    }
    return () => clearInterval(intervalId);
  }, [isActive, seconds, setSeconds, stopTimer]);

  if (!isActive) return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-x-0 bottom-24 flex justify-center z-[60] px-4 animate-in slide-in-from-bottom duration-300">
      <div className={`w-full max-w-sm p-4 rounded-2xl shadow-xl flex items-center justify-between transition-colors ${seconds === 0 ? 'bg-green-500 text-white' : 'bg-tg-link text-white'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            {seconds === 0 ? <Bell size={20} className="animate-bounce" /> : <Coffee size={20} />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-80">
              {seconds === 0 ? 'Отдых окончен!' : 'Отдых'}
            </p>
            <p className="text-2xl font-black tabular-nums leading-none">
              {formatTime(seconds)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={() => setSeconds(s => s + 30)}
             className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold"
           >
             +30с
           </button>
           <button 
             onClick={stopTimer}
             className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
           >
             <X size={20} />
           </button>
        </div>
      </div>
    </div>
  );
}
