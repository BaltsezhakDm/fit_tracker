import React from 'react';
import { History, Dumbbell, Calendar, ChevronRight } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import SwipeToDelete from './SwipeToDelete';
import { logger } from '../lib/logger';

export default function DiaryView() {
  const { data: workouts, isLoading } = useWorkouts();

  if (isLoading) {
    return <div className="text-center py-20 text-tg-hint">Загрузка тренировок...</div>;
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
        <div className="w-20 h-20 bg-tg-secondaryBg rounded-full flex items-center justify-center mb-6">
          <History className="text-tg-hint opacity-30" size={40} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-tg-text">Ваш дневник пуст</h3>
        <p className="text-tg-hint mb-8">Начните свою первую тренировку, чтобы отслеживать прогресс</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-tg-text">История</h2>
        <span className="bg-tg-link/10 text-tg-link px-3 py-1 rounded-full text-xs font-bold">
          {workouts.length} тренировок
        </span>
      </div>

      <div className="space-y-4">
        {workouts.map((workout) => (
          <SwipeToDelete key={workout.id} onDelete={() => logger.action('Deleting workout history item', workout)}>
            <div
              className="bg-tg-secondaryBg p-5 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 group active:scale-[0.98] transition-all"
              onClick={() => logger.action('Viewing workout details', workout)}
            >
              <div className="w-12 h-12 bg-tg-bg rounded-2xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
                <Calendar size={18} className="text-tg-link" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-tg-text truncate text-lg">
                    {new Date(workout.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </h4>
                  <span className="text-[10px] font-bold text-tg-hint bg-tg-bg px-2 py-0.5 rounded-lg">
                    {new Date(workout.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-tg-hint">
                   <span className="flex items-center gap-1"><Dumbbell size={14} /> Базовая тренировка</span>
                </div>
              </div>

              <ChevronRight className="text-tg-hint opacity-30 group-hover:translate-x-1 transition-transform" size={20} />
            </div>
          </SwipeToDelete>
        ))}
      </div>
    </div>
  );
}
