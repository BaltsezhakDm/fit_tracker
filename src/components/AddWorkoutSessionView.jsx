import React, { useState, useEffect } from 'react';
import { Dumbbell, Trash2, X, Search } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';

export default function AddWorkoutSessionView({ initialTemplate, onSave, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);

  useEffect(() => {
    if (initialTemplate) {
      const mapped = initialTemplate.exercises.map(ex => ({
        name: ex.name,
        sets: Array.from({ length: ex.targetSets }).map(() => ({ reps: ex.targetReps, weight: 0 }))
      }));
      setSessionExercises(mapped);
    } else {
      setSessionExercises([]);
    }
  }, [initialTemplate]);

  const handleAddExerciseFromDB = (exerciseObj) => {
    setSessionExercises([...sessionExercises, {
      name: exerciseObj.name,
      sets: [{ reps: 10, weight: 0 }]
    }]);
    setIsDBModalOpen(false);
  };

  const addSetToExercise = (exIndex) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    updated[exIndex].sets.push({
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0
    });
    setSessionExercises(updated);
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

  const handleSave = () => {
    if (sessionExercises.length === 0) return;
    const cleanedExercises = sessionExercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.reps > 0)
    })).filter(ex => ex.sets.length > 0);

    if (cleanedExercises.length > 0) {
      onSave(cleanedExercises, date);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-8 duration-300 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {initialTemplate ? `Программа: ${initialTemplate.name}` : 'Новая тренировка'}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          {sessionExercises.length === 0 && (
            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Dumbbell className="mx-auto mb-2 text-slate-300" size={32} />
              <p className="text-sm text-slate-500">Добавьте первое упражнение</p>
            </div>
          )}

          {sessionExercises.map((ex, exIdx) => (
            <div key={exIdx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{ex.name}</h3>
                <button onClick={() => removeExercise(exIdx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
              </div>

              <div className="space-y-2 mb-3">
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                    <div className="w-6 text-center text-xs font-bold text-slate-400">{setIdx + 1}</div>
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <input type="number" value={set.weight || ''} placeholder="0" onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-2 pr-6 focus:ring-2 focus:ring-blue-500 text-center font-semibold" />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">кг</span>
                      </div>
                      <div className="flex items-center text-slate-300">×</div>
                      <div className="relative flex-1">
                        <input type="number" value={set.reps || ''} placeholder="0" onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 text-center font-semibold" />
                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">раз</span>
                      </div>
                    </div>
                    <button onClick={() => removeSet(exIdx, setIdx)} className="p-2 text-slate-300 hover:text-red-400"><X size={16} /></button>
                  </div>
                ))}
              </div>

              <button onClick={() => addSetToExercise(exIdx)} className="w-full py-2 bg-slate-50 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors">
                + Добавить подход
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsDBModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Search size={20} /> Выбрать упражнение из базы
        </button>

        <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
          <button onClick={onCancel} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold">Отмена</button>
          <button
            onClick={handleSave}
            disabled={sessionExercises.length === 0}
            className="flex-1 py-3.5 bg-green-600 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-green-200"
          >
            Завершить
          </button>
        </div>
      </div>

      {isDBModalOpen && <ExerciseDBModal onClose={() => setIsDBModalOpen(false)} onSelect={handleAddExerciseFromDB} />}
    </div>
  );
}