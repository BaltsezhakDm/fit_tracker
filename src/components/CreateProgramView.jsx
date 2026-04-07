import React, { useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';

export default function CreateProgramView({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);

  const handleAddExerciseFromDB = (exerciseObj) => {
    setExercises([...exercises, {
      name: exerciseObj.name,
      targetSets: 3,
      targetReps: 10
    }]);
    setIsDBModalOpen(false);
  };

  const updateEx = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = Number(value);
    setExercises(updated);
  };

  const removeEx = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    onSave({ name, exercises });
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-8 duration-300">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Новая программа</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Название программы</label>
          <input
            type="text"
            placeholder="Например: День ног"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Упражнения</label>
          {exercises.length === 0 ? (
            <p className="text-sm text-slate-400 italic mb-3">Добавьте упражнения из базы</p>
          ) : (
            <div className="space-y-3 mb-3">
              {exercises.map((ex, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{idx + 1}. {ex.name}</span>
                    <button onClick={() => removeEx(idx)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400">Подходы</label>
                      <input type="number" value={ex.targetSets} onChange={(e) => updateEx(idx, 'targetSets', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-400">Повторения</label>
                      <input type="number" value={ex.targetReps} onChange={(e) => updateEx(idx, 'targetReps', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsDBModalOpen(true)}
            className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Search size={18} /> Найти в базе API
          </button>
        </div>

        <div className="pt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold">Отмена</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || exercises.length === 0}
            className="flex-1 py-3.5 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
          >
            Сохранить
          </button>
        </div>
      </div>

      {isDBModalOpen && <ExerciseDBModal onClose={() => setIsDBModalOpen(false)} onSelect={handleAddExerciseFromDB} />}
    </div>
  );
}