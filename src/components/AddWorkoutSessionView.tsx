import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Trash2, X, Search, Copy, CheckCircle2 } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import ExerciseDBModal from './ExerciseDBModal';
import { useWorkouts, useStartWorkout, useAddExerciseToSession, useAddSet, useCompleteWorkout } from '../hooks/useWorkouts';
import { useAuth } from '../hooks/useAuth';
import { WorkoutSession } from '../types/api';

interface AddWorkoutSessionViewProps {
  initialTemplate?: any;
  onSave: () => void;
  onCancel: () => void;
  onStartTimer: () => void;
}

export default function AddWorkoutSessionView({
  initialTemplate,
  onSave,
  onCancel,
  onStartTimer,
}: AddWorkoutSessionViewProps) {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);

  const startWorkoutMutation = useStartWorkout();
  const addExerciseMutation = useAddExerciseToSession();
  const addSetMutation = useAddSet();
  const completeWorkoutMutation = useCompleteWorkout();

  // Initialize session
  useEffect(() => {
    if (user && !session && !startWorkoutMutation.isPending && !startWorkoutMutation.isError) {
      startWorkoutMutation.mutate({
        planId: initialTemplate?.id
      }, {
        onSuccess: (newSession) => {
          setSession(newSession);
        },
        onError: (err) => {
          console.error("Failed to start workout session", err);
        }
      });
    }
  }, [user, initialTemplate, session]);

  const handleSave = useCallback(async () => {
    if (!session) return;

    try {
      // 1. Save all exercises and sets
      for (const ex of sessionExercises) {
        const workoutEx = await addExerciseMutation.mutateAsync({
          sessionId: session.id,
          exerciseId: ex.exercise_id
        });

        for (const set of ex.sets) {
          if (set.isDone) {
            await addSetMutation.mutateAsync({
              workoutExerciseId: workoutEx.id,
              set: {
                reps: set.reps,
                weight: set.weight,
                time_spent_seconds: null,
                rest_time_seconds: null,
                is_warmup: false,
                rpe: null,
                rir: null
              }
            });
          }
        }
      }

      // 2. Complete workout
      await completeWorkoutMutation.mutateAsync(session.id);

      WebApp.HapticFeedback.notificationOccurred('success');
      onSave();
    } catch (error) {
      console.error("Failed to save workout", error);
      WebApp.HapticFeedback.notificationOccurred('error');
    }
  }, [session, sessionExercises, onSave]);

  useEffect(() => {
    const mainButton = WebApp.MainButton;
    if (sessionExercises.length > 0 && mainButton) {
      mainButton.setText("ЗАВЕРШИТЬ ТРЕНИРОВКУ");
      mainButton.show();
      const handleClick = () => handleSave();
      mainButton.onClick(handleClick);
      return () => {
        mainButton.hide();
        mainButton.offClick(handleClick);
      };
    }
  }, [sessionExercises.length, handleSave]);

  const handleAddExerciseFromDB = (exerciseObj: any) => {
    if (!exerciseObj?.id) return;
    setSessionExercises([...sessionExercises, {
      exercise_id: exerciseObj.id,
      name: exerciseObj.name || 'Упражнение',
      media_url: exerciseObj.media_url,
      primary_muscle_group: exerciseObj.primary_muscle_group,
      sets: [{
        reps: 10,
        weight: 0,
        isDone: false
      }]
    }]);
    setIsDBModalOpen(false);
  };

  const addSetToExercise = (exIndex: number) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    updated[exIndex].sets.push({
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0,
      isDone: false
    });
    setSessionExercises(updated);
  };

  const cloneLastSet = (exIndex: number) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    if (lastSet) {
      updated[exIndex].sets.push({ ...lastSet, isDone: false });
      setSessionExercises(updated);
      WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const toggleSetDone = (exIndex: number, setIndex: number) => {
    const updated = [...sessionExercises];
    const newState = !updated[exIndex].sets[setIndex].isDone;
    updated[exIndex].sets[setIndex].isDone = newState;
    setSessionExercises(updated);

    if (newState) {
      WebApp.HapticFeedback.impactOccurred('medium');
      if (onStartTimer) onStartTimer();
    }
  };

  const updateSet = (exIndex: number, setIndex: number, field: string, value: string) => {
    const updated = [...sessionExercises];
    updated[exIndex].sets[setIndex][field] = Number(value);
    setSessionExercises(updated);
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    const updated = [...sessionExercises];
    updated[exIndex].sets = updated[exIndex].sets.filter((_: any, i: number) => i !== setIndex);
    setSessionExercises(updated);
  };

  const removeExercise = (exIndex: number) => {
    setSessionExercises(sessionExercises.filter((_, i) => i !== exIndex));
  };


  return (
    <div
      className="rounded-3xl p-5 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-8 duration-300 relative bg-tg-secondaryBg"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-tg-text">
          {initialTemplate ? `Программа: ${initialTemplate.name}` : 'Новая тренировка'}
        </h2>
        {startWorkoutMutation.isPending && <span className="text-xs text-tg-hint animate-pulse">Запуск сессии...</span>}
        {startWorkoutMutation.isError && <span className="text-xs text-red-500">Ошибка запуска</span>}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-tg-bg text-tg-text"
          />
        </div>

        <div className="space-y-4">
          {sessionExercises.length === 0 && (
            <div
              className="text-center py-6 rounded-2xl border border-dashed border-slate-300 bg-tg-bg"
            >
              <Dumbbell className="mx-auto mb-2 text-tg-hint opacity-50" size={32} />
              <p className="text-sm text-tg-hint">Добавьте первое упражнение</p>
            </div>
          )}

          {sessionExercises.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="border border-slate-200 rounded-2xl p-4 shadow-sm bg-tg-secondaryBg"
            >
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-lg leading-tight text-tg-text">{ex.name}</h3>
                <button onClick={() => removeExercise(exIdx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
              </div>

              <div className="space-y-2 mb-3">
                {ex.sets.map((set: any, setIdx: number) => (
                  <div
                    key={setIdx}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors bg-tg-bg ${set.isDone ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => toggleSetDone(exIdx, setIdx)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${set.isDone ? 'bg-green-500 text-white' : 'border-2 border-slate-200 text-transparent'}`}
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg py-2 pl-2 pr-6 focus:ring-2 focus:ring-blue-500 text-center font-semibold bg-tg-secondaryBg text-tg-text"
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-tg-hint">кг</span>
                      </div>
                      <div className="flex items-center text-slate-300">×</div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 text-center font-semibold bg-tg-secondaryBg text-tg-text"
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-tg-hint">раз</span>
                      </div>
                    </div>
                    <button onClick={() => removeSet(exIdx, setIdx)} className="p-2 text-slate-300 hover:text-red-400"><X size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => addSetToExercise(exIdx)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors bg-tg-bg text-tg-link"
                >
                  + Подход
                </button>
                <button
                  onClick={() => cloneLastSet(exIdx)}
                  className="px-4 py-2 rounded-xl transition-colors bg-tg-bg text-tg-hint"
                  title="Копировать последний подход"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsDBModalOpen(true)}
          className="w-full py-4 border-2 border-dashed rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 border-tg-link text-tg-link bg-transparent"
        >
          <Search size={20} /> Выбрать упражнение из базы
        </button>

        <div
          className="pt-4 flex gap-3 sticky bottom-0 pb-2 bg-tg-secondaryBg"
        >
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold bg-tg-bg text-tg-text"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={sessionExercises.length === 0 || !session}
            className="flex-1 py-3.5 bg-green-600 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-green-200"
          >
            {completeWorkoutMutation.isPending ? 'Сохранение...' : 'Завершить'}
          </button>
        </div>
      </div>

      {isDBModalOpen && (
        <ExerciseDBModal
          onClose={() => setIsDBModalOpen(false)}
          onSelect={handleAddExerciseFromDB}
        />
      )}
    </div>
  );
}
