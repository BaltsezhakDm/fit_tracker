import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dumbbell, Trash2, X, Search, Copy, CheckCircle2 } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';

export default function AddWorkoutSessionView({
  initialTemplate,
  onSave,
  onCancel,
  workouts,
  saveCustomExercise,
  getMergedExercises,
  onStartTimer,
  getProgressionAlerts,
  getGapAnalysis
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionExercises, setSessionExercises] = useState(() => {
    if (initialTemplate) {
      return initialTemplate.exercises.map(ex => ({
        name: ex.name,
        sets: Array.from({ length: ex.targetSets }).map(() => ({ reps: ex.targetReps, weight: 0 }))
      }));
    }
    return [];
  });
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const gapSuggestion = useMemo(() => getGapAnalysis ? getGapAnalysis() : null, [getGapAnalysis]);

  const handleSave = useCallback(() => {
    if (sessionExercises.length === 0) return;

    if (getProgressionAlerts) {
      const pAlerts = getProgressionAlerts(sessionExercises);
      if (pAlerts.length > 0 && alerts.length === 0) {
        setAlerts(pAlerts);
        return; // Show alerts first
      }
    }

    const cleanedExercises = sessionExercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.reps > 0)
    })).filter(ex => ex.sets.length > 0);

    if (cleanedExercises.length > 0) {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      onSave(cleanedExercises, date);
    }
  }, [sessionExercises, getProgressionAlerts, alerts.length, onSave, date]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && sessionExercises.length > 0) {
      tg.MainButton.text = "ЗАВЕРШИТЬ ТРЕНИРОВКУ";
      tg.MainButton.show();
      tg.MainButton.onClick(handleSave);
    }
    return () => {
      if (tg) {
        tg.MainButton.hide();
        tg.MainButton.offClick(handleSave);
      }
    };
  }, [sessionExercises.length, handleSave]);


  const getLastPerformance = useCallback((exerciseName) => {
    const lastWorkout = workouts
      .filter(w => w.exercise === exerciseName)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (lastWorkout && lastWorkout.sets.length > 0) {
      return lastWorkout.sets[0]; // Return first set as baseline
    }
    return null;
  }, [workouts]);

  const handleAddExerciseFromDB = (exerciseObj) => {
    const lastPerf = getLastPerformance(exerciseObj.name);
    setSessionExercises([...sessionExercises, {
      name: exerciseObj.name,
      images: exerciseObj.images,
      primaryMuscles: exerciseObj.primaryMuscles,
      sets: [{
        reps: lastPerf ? lastPerf.reps : 10,
        weight: lastPerf ? lastPerf.weight : 0,
        isDone: false
      }]
    }]);
    setIsDBModalOpen(false);
  };

  const addSetToExercise = (exIndex) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    updated[exIndex].sets.push({
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0,
      isDone: false
    });
    setSessionExercises(updated);
  };

  const cloneLastSet = (exIndex) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    if (lastSet) {
      updated[exIndex].sets.push({ ...lastSet, isDone: false });
      setSessionExercises(updated);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    }
  };

  const toggleSetDone = (exIndex, setIndex) => {
    const updated = [...sessionExercises];
    const newState = !updated[exIndex].sets[setIndex].isDone;
    updated[exIndex].sets[setIndex].isDone = newState;
    setSessionExercises(updated);

    if (newState) {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
      // Trigger timer
      if (onStartTimer) onStartTimer();
    }
  };

  const updateSet = (exIndex, setIndex, field, value) => {
    const updated = [...sessionExercises];
    updated[exIndex].sets[setIndex][field] = Number(value);
    setSessionExercises(updated);
  };

  const removeSet = (exIndex, setIndex) => {
    const updated = [...sessionExercises];
    updated[exIndex].sets = updated[exIndex].sets.filter((_, i) => i !== setIndex);
    setSessionExercises(updated);
  };

  const removeExercise = (exIndex) => {
    setSessionExercises(sessionExercises.filter((_, i) => i !== exIndex));
  };


  return (
    <div
      className="rounded-3xl p-5 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-8 duration-300 relative"
      style={{ backgroundColor: 'var(--secondary-bg-color)' }}
    >
      {alerts.length > 0 && (
        <div className="fixed inset-x-4 top-24 z-[60] bg-blue-600 text-white p-4 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold flex items-center gap-2"><CheckCircle2 size={20} /> Прогресс!</h4>
            <button onClick={() => setAlerts([])}><X size={20} /></button>
          </div>
          <ul className="text-sm space-y-1">
            {alerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
          <button
            onClick={() => {
              setAlerts([]);
              handleSave();
            }}
            className="w-full mt-3 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm"
          >
            Понятно, завершить
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
          {initialTemplate ? `Программа: ${initialTemplate.name}` : 'Новая тренировка'}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--hint-color)' }}>Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          />
        </div>

        <div className="space-y-4">
          {gapSuggestion && sessionExercises.length === 0 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 text-sm">
              <p className="font-bold mb-1">Рекомендация:</p>
              <p>{gapSuggestion.message}</p>
            </div>
          )}

          {sessionExercises.length === 0 && (
            <div
              className="text-center py-6 rounded-2xl border border-dashed border-slate-300"
              style={{ backgroundColor: 'var(--bg-color)' }}
            >
              <Dumbbell className="mx-auto mb-2" size={32} style={{ color: 'var(--hint-color)', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: 'var(--hint-color)' }}>Добавьте первое упражнение</p>
            </div>
          )}

          {sessionExercises.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="border border-slate-200 rounded-2xl p-4 shadow-sm"
              style={{ backgroundColor: 'var(--secondary-bg-color)' }}
            >
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-color)' }}>{ex.name}</h3>
                <button onClick={() => removeExercise(exIdx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
              </div>

              <div className="space-y-2 mb-3">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${set.isDone ? 'opacity-60' : ''}`}
                    style={{ backgroundColor: 'var(--bg-color)' }}
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
                          placeholder={getLastPerformance(ex.name)?.weight || '0'}
                          onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg py-2 pl-2 pr-6 focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                          style={{ backgroundColor: 'var(--secondary-bg-color)', color: 'var(--text-color)' }}
                        />
                        <span className="absolute right-2 top-2.5 text-[10px]" style={{ color: 'var(--hint-color)' }}>кг</span>
                      </div>
                      <div className="flex items-center text-slate-300">×</div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={set.reps || ''}
                          placeholder={getLastPerformance(ex.name)?.reps || '0'}
                          onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                          style={{ backgroundColor: 'var(--secondary-bg-color)', color: 'var(--text-color)' }}
                        />
                        <span className="absolute right-2 top-2.5 text-[10px]" style={{ color: 'var(--hint-color)' }}>раз</span>
                      </div>
                    </div>
                    <button onClick={() => removeSet(exIdx, setIdx)} className="p-2 text-slate-300 hover:text-red-400"><X size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => addSetToExercise(exIdx)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--link-color)' }}
                >
                  + Подход
                </button>
                <button
                  onClick={() => cloneLastSet(exIdx)}
                  className="px-4 py-2 rounded-xl transition-colors"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--hint-color)' }}
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
          className="w-full py-4 border-2 border-dashed rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--link-color)', color: 'var(--link-color)', backgroundColor: 'transparent' }}
        >
          <Search size={20} /> Выбрать упражнение из базы
        </button>

        <div
          className="pt-4 flex gap-3 sticky bottom-0 pb-2"
          style={{ backgroundColor: 'var(--secondary-bg-color)' }}
        >
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={sessionExercises.length === 0}
            className="flex-1 py-3.5 bg-green-600 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-green-200"
          >
            Завершить
          </button>
        </div>
      </div>

      {isDBModalOpen && (
        <ExerciseDBModal
          onClose={() => setIsDBModalOpen(false)}
          onSelect={handleAddExerciseFromDB}
          saveCustomExercise={saveCustomExercise}
          getMergedExercises={getMergedExercises}
        />
      )}
    </div>
  );
}