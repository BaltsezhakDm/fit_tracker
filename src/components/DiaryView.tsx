import React, { useState, useMemo } from 'react';
import { History, Dumbbell, Calendar as CalendarIcon, ChevronRight, X, Plus } from 'lucide-react';
import { useWorkouts, useDeleteWorkout, useWorkoutExercises, useWorkoutSets } from '../hooks/useWorkouts';
import { useExercises } from '../hooks/useExercises';
import { useUIStore } from '../store/useUIStore';
import SwipeToDelete from './SwipeToDelete';
import Calendar from './Calendar';
import { logger } from '../lib/logger';
import WebApp from '../lib/telegram';

export default function DiaryView() {
  const { data: workouts, isLoading } = useWorkouts();
  const deleteWorkoutMutation = useDeleteWorkout();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  
  const setActiveTab = useUIStore(s => s.setActiveTab);
  const setActiveTemplate = useUIStore(s => s.setActiveTemplate);

  const workoutDates = useMemo(() => {
    if (!workouts) return [];
    return workouts.map(w => new Date(w.start_time).toISOString().split('T')[0]);
  }, [workouts]);

  const workoutsForSelectedDate = useMemo(() => {
    if (!workouts) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return workouts.filter(w => new Date(w.start_time).toISOString().split('T')[0] === dateStr);
  }, [workouts, selectedDate]);

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

  const handleStartOption = (option: string) => {
    setIsStartModalOpen(false);
    if (option === 'empty') {
      setActiveTemplate(null);
      setActiveTab('add');
    } else if (option === 'templates') {
      setActiveTab('template');
    } else if (option === 'program') {
      setActiveTab('programs');
    }
    // Handle other options as needed
  };

  if (isLoading) {
    return <div className="text-center py-10 text-tg-hint">Загрузка тренировок...</div>;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] animate-in fade-in duration-500">
      <Calendar 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate} 
        workoutDates={workoutDates} 
      />

      <div className="flex-1 px-2 mt-4 space-y-3 pb-24">
        {workoutsForSelectedDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-10 text-center opacity-50">
            <div className="w-16 h-16 bg-tg-secondaryBg rounded-full flex items-center justify-center mb-4">
              <History className="text-tg-hint" size={32} />
            </div>
            <p className="text-sm text-tg-hint font-medium">Нет тренировок за этот день</p>
          </div>
        ) : (
          workoutsForSelectedDate.map((workout) => (
            <SwipeToDelete key={workout.id} onDelete={() => handleDelete(workout.id)}>
              <div
                className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50/10 flex items-center gap-4 group active:scale-[0.98] transition-all"
                onClick={() => setSelectedWorkout(workout)}
              >
                <div className="w-10 h-10 bg-tg-bg rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100/5">
                  <CalendarIcon size={16} className="text-tg-link" />
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
          ))
        )}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 z-10">
        <button
          onClick={() => setIsStartModalOpen(true)}
          className="w-full bg-tg-link text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-transform"
        >
          <Plus size={20} />
          Начать тренировку
        </button>
      </div>

      <StartWorkoutModal 
        isOpen={isStartModalOpen} 
        onClose={() => setIsStartModalOpen(false)} 
        onSelect={handleStartOption}
      />

      {selectedWorkout && (
        <WorkoutDetailsModal
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
        />
      )}
    </div>
  );
}

import { Pencil, RotateCcw, FileText, BarChart3 as BarChartIcon } from 'lucide-react';

function StartWorkoutModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (opt: string) => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full bg-[#1c1c1e] rounded-t-[2.5rem] p-6 pb-12 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-1 rounded-full bg-tg-hint/30" />
        </div>
        
        <div className="space-y-2">
          <OptionButton 
            icon={<Pencil size={22} />} 
            label="Пустая тренировка" 
            onClick={() => onSelect('empty')} 
          />
          <OptionButton 
            icon={<RotateCcw size={22} />} 
            label="Повторить из истории" 
            onClick={() => onSelect('history')} 
          />
          <OptionButton 
            icon={<FileText size={22} />} 
            label="Использовать шаблон" 
            onClick={() => onSelect('templates')} 
          />
          <OptionButton 
            icon={<BarChartIcon size={22} />} 
            label="Создать программу" 
            onClick={() => onSelect('program')} 
          />
        </div>
      </div>
    </div>
  );
}

function OptionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors text-tg-text"
    >
      <div className="text-tg-hint">{icon}</div>
      <span className="text-lg font-medium">{label}</span>
    </button>
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

