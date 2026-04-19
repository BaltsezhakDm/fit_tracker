import React, { useState } from 'react';
import { History, Dumbbell, Calendar, ChevronRight, X, Clock, Scale } from 'lucide-react';
import { useWorkouts, useDeleteWorkout, useWorkoutExercises, useWorkoutSets } from '../hooks/useWorkouts';
import { useExercises } from '../hooks/useExercises';
import SwipeToDelete from './SwipeToDelete';
import { logger } from '../lib/logger';
import WebApp from '../lib/telegram';

export default function DiaryView() {
  const { data: workouts, isLoading } = useWorkouts();
  const deleteWorkoutMutation = useDeleteWorkout();
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);

  if (isLoading) {
    return <div className="text-center py-10 text-tg-hint">Загрузка тренировок...</div>;
  }

  const handleDelete = (id: string) => {
    logger.action('Deleting workout history item', { id });
    deleteWorkoutMutation.mutate(id, {
      onSuccess: () => {
        WebApp?.HapticFeedback?.notificationOccurred('success');
      },
      onError: () => {
        WebApp?.HapticFeedback?.notificationOccurred('error');
        alert('Ошибка при удалении тренировки');
      }
    });
  };

  if (!workouts || workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-10 text-center">
        <div className="w-16 h-16 bg-tg-secondaryBg rounded-full flex items-center justify-center mb-6">
          <History className="text-tg-hint opacity-30" size={32} />
        </div>
        <h3 className="text-lg font-bold mb-2 text-tg-text">Ваш дневник пуст</h3>
        <p className="text-sm text-tg-hint mb-8">Начните свою первую тренировку, чтобы отслеживать прогресс</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-tg-text">История</h2>
        <span className="bg-tg-link/10 text-tg-link px-3 py-1 rounded-full text-[10px] font-bold">
          {workouts.length} тренировок
        </span>
      </div>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <SwipeToDelete key={workout.id} onDelete={() => handleDelete(workout.id)}>
            <div
              className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4 group active:scale-[0.98] transition-all"
              onClick={() => setSelectedWorkout(workout)}
            >
              <div className="w-10 h-10 bg-tg-bg rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
                <Calendar size={16} className="text-tg-link" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="font-bold text-tg-text truncate text-base">
                    {new Date(workout.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </h4>
                  <span className="text-[10px] font-bold text-tg-hint bg-tg-bg px-2 py-0.5 rounded-lg">
                    {new Date(workout.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-tg-hint">
                   <span className="flex items-center gap-1"><Dumbbell size={12} /> Тренировка</span>
                </div>
              </div>

              <ChevronRight className="text-tg-hint opacity-30 group-hover:translate-x-1 transition-transform" size={18} />
            </div>
          </SwipeToDelete>
        ))}
      </div>

      {selectedWorkout && (
        <WorkoutDetailsModal
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
        />
      )}
    </div>
  );
}

function WorkoutDetailsModal({ workout, onClose }: { workout: any, onClose: () => void }) {
  const { data: workoutExercises, isLoading } = useWorkoutExercises(workout.id);
  const { data: exercises } = useExercises();

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end animate-in fade-in duration-200">
      <div className="w-full bg-tg-bg rounded-t-[2rem] max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h3 className="text-xl font-black text-tg-text">
               {new Date(workout.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
             </h3>
             <p className="text-sm text-tg-hint">
               {new Date(workout.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
             </p>
          </div>
          <button onClick={onClose} className="p-2 bg-tg-secondaryBg rounded-full text-tg-hint">
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-tg-hint">Загрузка данных...</div>
        ) : (
          <div className="space-y-6">
            {workoutExercises?.map((we) => {
              const exerciseInfo = exercises?.find(e => e.id === we.exercise_id);
              return (
                <div key={we.id} className="bg-tg-secondaryBg p-4 rounded-2xl border border-slate-50">
                   <h4 className="font-bold text-tg-text mb-3 flex items-center gap-2">
                     <Dumbbell size={16} className="text-tg-link" />
                     {exerciseInfo?.name || 'Упражнение'}
                   </h4>
                   <SetsList workoutExerciseId={we.id} />
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-tg-secondaryBg text-tg-text rounded-2xl font-bold border border-slate-100 mb-safe"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

function SetsList({ workoutExerciseId }: { workoutExerciseId: string }) {
  const { data: sets, isLoading } = useWorkoutSets(workoutExerciseId);

  if (isLoading) return <div className="text-xs text-tg-hint animate-pulse">Загрузка подходов...</div>;

  return (
    <div className="grid grid-cols-1 gap-2">
      {sets?.map((set, idx) => (
        <div key={set.id} className="flex items-center justify-between bg-tg-bg p-2 px-4 rounded-xl text-sm">
           <div className="flex items-center gap-4">
             <span className="w-5 h-5 bg-tg-link/10 text-tg-link text-[10px] font-bold rounded-full flex items-center justify-center">
               {idx + 1}
             </span>
             <span className="font-bold text-tg-text">{set.weight} <span className="text-tg-hint font-normal text-[10px]">кг</span></span>
           </div>
           <div className="flex items-center gap-1">
             <span className="font-black text-tg-text">{set.reps}</span>
             <span className="text-[10px] text-tg-hint">повт.</span>
           </div>
        </div>
      ))}
    </div>
  );
}
