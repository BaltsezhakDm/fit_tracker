import React, { useMemo } from 'react';
import { Dumbbell, CalendarDays, Timer } from 'lucide-react';
import SwipeToDelete from './SwipeToDelete';

const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function getSetWord(count) {
  const remainder = count % 10;
  if (count > 10 && count < 20) return 'подходов';
  if (remainder === 1) return 'подход';
  if (remainder >= 2 && remainder <= 4) return 'подхода';
  return 'подходов';
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
                <div
                  className="rounded-2xl p-4 shadow-sm border border-slate-100"
                  style={{ backgroundColor: 'var(--secondary-bg-color)' }}
                >
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-color)' }}>{ex.exercise}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                          style={{ backgroundColor: 'var(--bg-color)', color: 'var(--link-color)' }}
                        >
                          {ex.sets.length} {getSetWord(ex.sets.length)}
                        </span>
                        {ex.duration > 0 && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--hint-color)' }}>
                            <Timer size={12} />
                            {formatDuration(ex.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    {ex.images && ex.images.length > 0 && (
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={`${IMG_BASE_URL}${ex.images[0]}`}
                          alt={ex.exercise}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {ex.sets.map((set, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm p-2 rounded-xl"
                        style={{ backgroundColor: 'var(--bg-color)' }}
                      >
                        <span className="font-medium" style={{ color: 'var(--hint-color)' }}>Подход {idx + 1}</span>
                        <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {set.weight} кг <span className="font-normal mx-1" style={{ color: 'var(--hint-color)' }}>×</span> {set.reps} повт.
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