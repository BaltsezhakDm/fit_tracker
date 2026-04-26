import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dumbbell, Trash2, X, Search, Copy, CheckCircle2, Loader2, Zap, Brain, Target } from 'lucide-react';
import WebApp from '../lib/telegram';
import ExerciseDBModal from './ExerciseDBModal';
import { useStartWorkout, useAddExerciseToSession, useAddSet, useCompleteWorkout, useDeleteWorkout } from '../hooks/useWorkouts';
import { useGetProgramPlans, useGetPlanExercises } from '../hooks/usePrograms';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/useUIStore';
import { WorkoutSession } from '../types/api';
import { logger } from '../lib/logger';
import { useProgressionSuggestion, useUpdateProgressionCache } from '../hooks/useProgressionSuggestion';
import { calcOneRM, DUP_PARAMS, type DayType } from '../lib/engine';

interface AddWorkoutSessionViewProps {
  initialTemplate?: any;
  onSave: () => void;
  onCancel: () => void;
  onStartTimer: () => void;
}

// Chip с подсказкой прогрессии для упражнения
function ProgressionChip({
  userId,
  exerciseId,
  dayType,
  onApply,
}: {
  userId: string | number | null;
  exerciseId: number;
  dayType: DayType;
  onApply: (weight: number, reps: number) => void;
}) {
  const { data, isLoading } = useProgressionSuggestion(userId, exerciseId, dayType);

  if (isLoading) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-tg-bg rounded-xl text-xs text-tg-hint animate-pulse">
      <Brain size={12} /> Анализ...
    </div>
  );

  if (!data || data.basis === 'default') return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-tg-bg rounded-xl text-xs text-tg-hint">
      <Target size={12} /> Нет истории
    </div>
  );

  return (
    <button
      onClick={() => onApply(data.targetWeight, data.targetReps)}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-tg-link/10 border border-tg-link/30 rounded-xl text-xs text-tg-link font-bold active:scale-95 transition-all"
    >
      <Zap size={12} />
      Цель: {data.targetWeight}кг × {data.targetReps}
      {data.lastOneRM && (
        <span className="opacity-60 font-normal">· 1RM {data.lastOneRM}кг</span>
      )}
    </button>
  );
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
  const [dayType, setDayType] = useState<DayType>('hypertrophy');

  const startWorkoutMutation = useStartWorkout();
  const addExerciseMutation = useAddExerciseToSession();
  const addSetMutation = useAddSet();
  const completeWorkoutMutation = useCompleteWorkout();
  const updateProgressionCache = useUpdateProgressionCache();

  const { data: exercisesList } = useExercises();
  const { data: plans, isLoading: isLoadingPlans } = useGetProgramPlans(initialTemplate?.id || null);
  const activePlanId = plans && plans.length > 0 ? plans[0].id : null;
  const { data: planExercises, isLoading: isLoadingPlanExercises, isSuccess: isPlanExercisesLoaded } = useGetPlanExercises(activePlanId);

  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (initialTemplate && !activePlanId && isLoadingPlans) return;
    if (user && !session && !startWorkoutMutation.isPending && !startWorkoutMutation.isError) {
      startWorkoutMutation.mutate({ userId: user.id, planId: activePlanId || undefined }, {
        onSuccess: (newSession) => setSession(newSession),
        onError: (err) => console.error('Failed to start workout session', err),
      });
    }
  }, [user, initialTemplate, session, activePlanId, isLoadingPlans]);

  useEffect(() => {
    const isReady = initialTemplate
      ? (isPlanExercisesLoaded && planExercises && exercisesList)
      : !!exercisesList;

    if (isReady && !initialLoadRef.current) {
      if (initialTemplate) {
        if (planExercises) {
          if (planExercises.length > 0) {
            const exercisesToLoad = planExercises.map(pe => {
              const baseEx = exercisesList?.find(e => e.id === pe.exercise_id);
              return {
                exercise_id: pe.exercise_id,
                name: baseEx?.name || 'Упражнение',
                media_url: baseEx?.media_url,
                primary_muscle_group: baseEx?.primary_muscle_group,
                muscle_weights: baseEx?.muscle_weights || {},
                sets: Array.from({ length: pe.target_sets }).map(() => ({
                  reps: pe.target_reps,
                  weight: 0,
                  rpe: null,
                  isDone: false,
                  one_rm: null,
                })),
              };
            });
            setSessionExercises(exercisesToLoad);
          }
          initialLoadRef.current = true;
        }
      } else {
        // No template, just start empty
        initialLoadRef.current = true;
      }
    }
  }, [planExercises, exercisesList, isPlanExercisesLoaded, initialTemplate]);

  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const startRestTimer = useUIStore(s => s.startRestTimer);
  const deleteWorkoutMutation = useDeleteWorkout();
  const dupParams = DUP_PARAMS[dayType];

  const handleCancel = async () => {
    if (session) {
      try {
        await deleteWorkoutMutation.mutateAsync(session.id);
      } catch (err) {
        console.error("Failed to delete empty session", err);
      }
    }
    onCancel();
  };

  const handleSave = useCallback(async () => {
    if (!session) return;
    const completedExercises = sessionExercises.filter(ex => ex.sets.some((s: any) => s.isDone));
    if (completedExercises.length === 0) {
      WebApp?.HapticFeedback?.notificationOccurred('warning');
      return;
    }

    setSaveProgress({ current: 0, total: completedExercises.length });
    console.log('Starting handleSave with session:', session.id, 'exercises:', completedExercises.length);
    try {
      for (let i = 0; i < completedExercises.length; i++) {
        const ex = completedExercises[i];
        console.log(`Saving exercise ${i+1}/${completedExercises.length}: ${ex.name} (id: ${ex.exercise_id})`);
        const workoutEx = await addExerciseMutation.mutateAsync({
          sessionId: session.id,
          exerciseId: ex.exercise_id,
        });
        console.log('Exercise saved, ID:', workoutEx.id);

        const doneSets = ex.sets.filter((s: any) => s.isDone);
        console.log(`Saving ${doneSets.length} sets for ${ex.name}`);
        for (const set of doneSets) {
          await addSetMutation.mutateAsync({
            workoutExerciseId: workoutEx.id,
            set: {
              reps: set.reps,
              weight: set.weight,
              time_spent_seconds: null,
              rest_time_seconds: null,
              is_warmup: false,
              rpe: set.rpe,
            },
          });

          // Обновляем кеш прогрессии в Supabase
          if (user && set.weight > 0 && set.reps > 0) {
            console.log('Updating progression cache for exercise:', ex.exercise_id);
            updateProgressionCache.mutate({
              userId: user.id,
              exerciseId: ex.exercise_id,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
            });
          }
        }
        setSaveProgress({ current: i + 1, total: completedExercises.length });
      }

      console.log('Completing workout session:', session.id);
      await completeWorkoutMutation.mutateAsync(session.id);
      console.log('Workout completed successfully');
      WebApp?.HapticFeedback?.notificationOccurred('success');
      onSave();
    } catch (error) {
      console.error('Failed to save workout:', error);
      logger.error('Failed to save workout', error);
      WebApp?.HapticFeedback?.notificationOccurred('error');
      alert('Ошибка при сохранении. Попробуйте ещё раз.');
    } finally {
      setSaveProgress(null);
    }
  }, [session, sessionExercises, onSave, addExerciseMutation, addSetMutation, completeWorkoutMutation, user, updateProgressionCache]);

  useEffect(() => {
    const mainButton = WebApp?.MainButton;
    if (sessionExercises.length > 0 && mainButton) {
      mainButton.setText('ЗАВЕРШИТЬ ТРЕНИРОВКУ');
      mainButton.show();
      const handleClick = () => handleSave();
      mainButton.onClick?.(handleClick);
      return () => {
        mainButton?.hide?.();
        mainButton?.offClick?.(handleClick);
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
      muscle_weights: exerciseObj.muscle_weights || {},
      sets: [{ reps: dupParams.repsMin, weight: 0, rpe: null, isDone: false, one_rm: null }],
    }]);
    setIsDBModalOpen(false);
  };

  const applyProgressionToExercise = (exIndex: number, weight: number, reps: number) => {
    const updated = [...sessionExercises];
    updated[exIndex].sets = updated[exIndex].sets.map((s: any) => ({
      ...s,
      weight,
      reps,
    }));
    setSessionExercises(updated);
    WebApp?.HapticFeedback?.impactOccurred('light');
  };

  const addSetToExercise = (exIndex: number) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    updated[exIndex].sets.push({
      reps: lastSet ? lastSet.reps : dupParams.repsMin,
      weight: lastSet ? lastSet.weight : 0,
      rpe: null,
      isDone: false,
      one_rm: null,
    });
    setSessionExercises(updated);
  };

  const cloneLastSet = (exIndex: number) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    if (lastSet) {
      updated[exIndex].sets.push({ ...lastSet, isDone: false, one_rm: null });
      setSessionExercises(updated);
      WebApp?.HapticFeedback?.impactOccurred('light');
    }
  };

  const toggleSetDone = (exIndex: number, setIndex: number) => {
    const ex = sessionExercises[exIndex];
    const set = ex.sets[setIndex];
    const newState = !set.isDone;
    const updated = [...sessionExercises];

    if (newState && set.weight > 0 && set.reps > 0) {
      updated[exIndex].sets[setIndex].one_rm = calcOneRM(set.weight, set.reps);
    }

    updated[exIndex].sets[setIndex].isDone = newState;
    setSessionExercises(updated);

    if (newState) {
      WebApp?.HapticFeedback?.impactOccurred('medium');
      if (onStartTimer) onStartTimer();
      startRestTimer(dupParams.restSeconds);
    }
  };

  const updateSet = (exIndex: number, setIndex: number, field: string, value: string | number | null) => {
    const updated = [...sessionExercises];
    const numVal = value === '' ? null : (typeof value === 'string' ? Number(value) : value);
    updated[exIndex].sets[setIndex][field] = numVal;

    // Пересчитать 1RM "на лету" при изменении веса/повторений
    const s = updated[exIndex].sets[setIndex];
    if (s.weight > 0 && s.reps > 0) {
      updated[exIndex].sets[setIndex].one_rm = calcOneRM(s.weight, s.reps);
    }

    // Если меняется вес — предлагаем тот же вес для следующих сетов
    if (field === 'weight' && numVal && numVal > 0) {
      for (let i = setIndex + 1; i < updated[exIndex].sets.length; i++) {
        if (!updated[exIndex].sets[i].isDone) {
          updated[exIndex].sets[i].weight = numVal;
        }
      }
    }

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

  const DAY_TYPES: { type: DayType; emoji: string; label: string; color: string }[] = [
    { type: 'hypertrophy', emoji: '🏗️', label: 'Гипертрофия', color: 'bg-blue-500' },
    { type: 'strength', emoji: '💪', label: 'Сила', color: 'bg-red-500' },
    { type: 'power', emoji: '⚡', label: 'Мощность', color: 'bg-yellow-500' },
  ];

  return (
    <div className="rounded-2xl p-4 shadow-sm border border-slate-100/10 animate-in slide-in-from-bottom-8 duration-300 relative bg-tg-secondaryBg">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-tg-text">
          {initialTemplate ? initialTemplate.name : 'Новая тренировка'}
        </h2>
        {(startWorkoutMutation.isPending || isLoadingPlans || isLoadingPlanExercises) && (
          <Loader2 className="animate-spin text-tg-link" size={16} />
        )}
      </div>

      {/* Тип дня DUP */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
        {DAY_TYPES.map(dt => (
          <button
            key={dt.type}
            onClick={() => setDayType(dt.type)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dayType === dt.type
                ? `${dt.color} text-white shadow-lg`
                : 'bg-tg-bg text-tg-hint'
            }`}
          >
            <span>{dt.emoji}</span> {dt.label}
            {dayType === dt.type && (
              <span className="opacity-80 font-normal">
                · {DUP_PARAMS[dt.type].repsMin}–{DUP_PARAMS[dt.type].repsMax} повт
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Упражнения */}
        <div className="space-y-3">
          {sessionExercises.length === 0 && (
            <div className="text-center py-6 rounded-2xl border border-dashed border-slate-600 bg-tg-bg">
              <Dumbbell className="mx-auto mb-2 text-tg-hint opacity-50" size={32} />
              <p className="text-sm text-tg-hint">Добавьте первое упражнение</p>
            </div>
          )}

          {sessionExercises.map((ex, exIdx) => (
            <div key={exIdx} className="border border-slate-100/10 rounded-2xl p-3 bg-tg-secondaryBg">
              <div className="flex justify-between items-center mb-2 border-b border-slate-100/10 pb-2">
                <h3 className="font-bold text-base text-tg-text">{ex.name}</h3>
                <button onClick={() => removeExercise(exIdx)} className="text-red-400 p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Chip прогрессии */}
              <div className="mb-2">
                <ProgressionChip
                  userId={user?.id || null}
                  exerciseId={ex.exercise_id}
                  dayType={dayType}
                  onApply={(w, r) => applyProgressionToExercise(exIdx, w, r)}
                />
              </div>

              <div className="space-y-2 mb-2">
                {ex.sets.map((set: any, setIdx: number) => (
                  <div key={setIdx} className={`p-2 rounded-xl bg-tg-bg ${set.isDone ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <button
                        onClick={() => toggleSetDone(exIdx, setIdx)}
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          set.isDone ? 'bg-green-500 text-white' : 'border-2 border-slate-600 text-transparent'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="Вес"
                            value={set.weight || ''}
                            onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                            className="w-full border border-slate-700 rounded-lg py-2 pl-2 pr-6 text-center font-semibold bg-tg-secondaryBg text-tg-text text-sm focus:ring-2 focus:ring-tg-link"
                          />
                          <span className="absolute right-2 top-2.5 text-[10px] text-tg-hint">кг</span>
                        </div>
                        <div className="flex items-center text-slate-500">×</div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="Повт"
                            value={set.reps || ''}
                            onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                            className="w-full border border-slate-700 rounded-lg py-2 pl-2 pr-8 text-center font-semibold bg-tg-secondaryBg text-tg-text text-sm focus:ring-2 focus:ring-tg-link"
                          />
                          <span className="absolute right-2 top-2.5 text-[10px] text-tg-hint">раз</span>
                        </div>
                      </div>
                      <button onClick={() => removeSet(exIdx, setIdx)} className="p-1 text-slate-600 hover:text-red-400">
                        <X size={16} />
                      </button>
                    </div>

                    {/* 1RM и RPE */}
                    <div className="flex gap-2 px-1">
                      {set.one_rm && (
                        <span className="text-[9px] text-tg-link font-bold bg-tg-link/10 px-2 py-0.5 rounded-lg">
                          1RM ~{set.one_rm}кг
                        </span>
                      )}
                      <div className="flex-1 flex items-center gap-1.5 justify-end">
                        <span className="text-[9px] font-bold text-tg-hint">RPE:</span>
                        <div className="flex gap-1">
                          {[7, 8, 9, 10].map(val => (
                            <button
                              key={val}
                              onClick={() => updateSet(exIdx, setIdx, 'rpe', set.rpe === val ? null : val)}
                              className={`w-7 text-[10px] font-bold py-1 rounded-md transition-colors ${
                                set.rpe === val ? 'bg-tg-link text-white' : 'bg-tg-secondaryBg text-tg-hint border border-slate-700'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => addSetToExercise(exIdx)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-tg-bg text-tg-link">
                  + Подход
                </button>
                <button onClick={() => cloneLastSet(exIdx)} className="px-4 py-2 rounded-xl bg-tg-bg text-tg-hint" title="Копировать">
                  <Copy size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsDBModalOpen(true)}
          className="w-full py-3 border-2 border-dashed rounded-xl font-bold flex items-center justify-center gap-2 border-tg-link text-tg-link text-sm"
        >
          <Search size={18} /> Из базы
        </button>

        <div className="fixed bottom-24 left-4 right-4 z-[200] flex gap-3">
          <button 
            onClick={() => {
              console.log('Cancel clicked');
              handleCancel();
            }} 
            className="flex-1 py-4 rounded-2xl font-bold bg-tg-secondaryBg/90 backdrop-blur-md text-tg-text border border-slate-100/10 shadow-xl active:scale-95 transition-all"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              console.log('Finish clicked');
              handleSave();
            }}
            disabled={sessionExercises.length === 0 || !session || completeWorkoutMutation.isPending}
            className="flex-[2] py-4 bg-green-600 disabled:bg-slate-600 text-white rounded-2xl font-black shadow-2xl shadow-green-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {completeWorkoutMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            {completeWorkoutMutation.isPending ? 'СОХРАНЕНИЕ...' : 'ЗАВЕРШИТЬ ТРЕНИРОВКУ'}
          </button>
        </div>
      </div>

      {saveProgress && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-tg-secondaryBg p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 max-w-[80%] text-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-tg-bg" />
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-tg-link"
                  strokeDasharray={226.2} strokeDashoffset={226.2 * (1 - saveProgress.current / saveProgress.total)}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-tg-text">
                {Math.round((saveProgress.current / saveProgress.total) * 100)}%
              </div>
            </div>
            <div>
              <h3 className="font-bold text-tg-text mb-1 text-xl">Сохранение...</h3>
              <p className="text-sm text-tg-hint">Упражнение {saveProgress.current} из {saveProgress.total}</p>
            </div>
          </div>
        </div>
      )}

      {isDBModalOpen && (
        <ExerciseDBModal onClose={() => setIsDBModalOpen(false)} onSelect={handleAddExerciseFromDB} />
      )}
    </div>
  );
}
