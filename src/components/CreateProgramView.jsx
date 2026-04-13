import React, { useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';

export default function CreateProgramView({ onSave, onCancel, getMergedExercises, saveCustomExercise }) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);

  const handleAddExerciseFromDB = (exerciseObj) => {
    setExercises([...exercises, {
      name: exerciseObj.name,
      images: exerciseObj.images,
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
    <div
      className="rounded-3xl p-5 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-8 duration-300"
      style={{ backgroundColor: 'var(--secondary-bg-color)' }}
    >
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>Новая программа</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--hint-color)' }}>Название программы</label>
          <input
            type="text"
            placeholder="Например: День ног"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--hint-color)' }}>Упражнения</label>
          {exercises.length === 0 ? (
            <p className="text-sm italic mb-3" style={{ color: 'var(--hint-color)' }}>Добавьте упражнения из базы</p>
          ) : (
            <div className="space-y-3 mb-3">
              {exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 flex flex-col gap-3"
                  style={{ backgroundColor: 'var(--bg-color)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: 'var(--text-color)' }}>{idx + 1}. {ex.name}</span>
                    <button onClick={() => removeEx(idx)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs" style={{ color: 'var(--hint-color)' }}>Подходы</label>
                      <input
                        type="number"
                        value={ex.targetSets}
                        onChange={(e) => updateEx(idx, 'targetSets', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-center"
                        style={{ backgroundColor: 'var(--secondary-bg-color)', color: 'var(--text-color)' }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs" style={{ color: 'var(--hint-color)' }}>Повторения</label>
                      <input
                        type="number"
                        value={ex.targetReps}
                        onChange={(e) => updateEx(idx, 'targetReps', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-center"
                        style={{ backgroundColor: 'var(--secondary-bg-color)', color: 'var(--text-color)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsDBModalOpen(true)}
            className="w-full py-3 border-2 border-dashed rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--link-color)', color: 'var(--link-color)', backgroundColor: 'transparent' }}
          >
            <Search size={18} /> Найти в базе API
          </button>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || exercises.length === 0}
            className="flex-1 py-3.5 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg"
            style={{ backgroundColor: 'var(--button-color)', color: 'var(--button-text-color)' }}
          >
            Сохранить
          </button>
        </div>
      </div>

      {isDBModalOpen && (
        <ExerciseDBModal
          onClose={() => setIsDBModalOpen(false)}
          onSelect={handleAddExerciseFromDB}
          getMergedExercises={getMergedExercises}
          saveCustomExercise={saveCustomExercise}
        />
      )}
    </div>
  );
}