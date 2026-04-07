import React, { useMemo } from 'react';
import { Dumbbell, CalendarDays } from 'lucide-react';
import SwipeToDelete from './SwipeToDelete';

function getSetWord(count) {
  const remainder = count % 10;
  if (count > 10 && count < 20) return 'подходов';
  if (remainder === 1) return 'подход';
  if (remainder >= 2 && remainder <= 4) return 'подхода';
  return 'подходов';
}

export default function DiaryView({ workouts, onDeleteWorkout }) {
  const groupedWorkouts = useMemo(() => {
    const groups = {};
    workouts.forEach(w => {
      if (!groups[w.date]) groups[w.date] = [];
      groups[w.date].push(w);
    });
    return Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
      date, exercises: groups[date]
    }));
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Dumbbell size={48} className="mb-4 opacity-50" />
        <p>Ваш дневник пока пуст.</p>
        <p className="text-sm">Нажмите +, чтобы добавить тренировку.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedWorkouts.map(group => (
        <div key={group.date} className="animate-in fade-in duration-500">
          <h2 className="text-sm font-semibold text-slate-500 mb-3 ml-1 flex items-center gap-2">
            <CalendarDays size={16} />
            {new Date(group.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <div className="space-y-3">
            {group.exercises.map(ex => (
              <SwipeToDelete key={ex.id} onDelete={() => onDeleteWorkout(ex.id)}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{ex.exercise}</h3>
                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ml-2">
                      {ex.sets.length} {getSetWord(ex.sets.length)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {ex.sets.map((set, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-500 font-medium">Подход {idx + 1}</span>
                        <span className="font-semibold text-slate-700">
                          {set.weight} кг <span className="text-slate-400 font-normal mx-1">×</span> {set.reps} повт.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SwipeToDelete>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}