import React from 'react';
import { TrendingUp, X, Activity } from 'lucide-react';
import { useExerciseProgression } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';

interface ExerciseProgressionViewProps {
  exerciseId: number;
  exerciseName: string;
  onClose: () => void;
}

export default function ExerciseProgressionView({ exerciseId, exerciseName, onClose }: ExerciseProgressionViewProps) {
  const { user } = useAuth();
  const { data: progression, isLoading } = useExerciseProgression(user?.id || 0, exerciseId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Activity className="animate-spin text-tg-link" size={32} />
        <p className="text-tg-hint font-medium">Загрузка прогресса...</p>
      </div>
    );
  }

  const maxWeight = progression?.length ? Math.max(...progression.map(p => p.max_weight)) : 0;

  return (
    <div className="bg-tg-secondaryBg rounded-2xl p-4 shadow-sm border border-slate-100 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-bold text-tg-text">{exerciseName}</h3>
           <p className="text-xs text-tg-hint">История прогресса</p>
        </div>
        <button onClick={onClose} className="p-2 bg-tg-bg rounded-full text-tg-hint">
          <X size={20} />
        </button>
      </div>

      <div className="bg-tg-bg p-4 rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-4 text-tg-link">
          <TrendingUp size={18} />
          <span className="font-bold text-sm">Макс. вес</span>
        </div>
        
        <div className="h-40 flex items-end justify-between gap-1 px-1">
           {progression?.map((point, i) => {
             const height = maxWeight > 0 ? (point.max_weight / maxWeight) * 100 : 0;
             const dateStr = new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
             
             return (
               <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-tg-link rounded-t-sm transition-all duration-700 min-h-[2px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.max_weight} кг (${dateStr})`}
                  ></div>
                  <span className="text-[6px] font-medium text-tg-hint truncate w-full text-center">{dateStr}</span>
               </div>
             );
           })}
           {(!progression || progression.length === 0) && (
             <div className="w-full flex items-center justify-center h-full text-tg-hint text-xs">
               История пуста
             </div>
           )}
        </div>
      </div>

      <div className="space-y-2">
         <h4 className="text-xs font-bold text-tg-hint px-1 uppercase tracking-wider">Все записи</h4>
         {progression?.slice().reverse().map((point, i) => (
           <div key={i} className="flex items-center justify-between p-3 bg-tg-bg rounded-xl">
             <span className="text-sm font-medium text-tg-text">
               {new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
             </span>
             <div className="flex items-baseline gap-1">
               <span className="font-bold text-tg-text">{point.max_weight}</span>
               <span className="text-[10px] text-tg-hint">кг</span>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
}
