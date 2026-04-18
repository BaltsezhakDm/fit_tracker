import React, { useState } from 'react';
import { Search, Plus, Trash2, X, MoveUp, MoveDown, Dumbbell, Save } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';
import { useCreateProgram } from '../hooks/usePrograms';
import { useAuth } from '../hooks/useAuth';

interface CreateProgramViewProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function CreateProgramView({ onSave, onCancel }: CreateProgramViewProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);

  const createProgramMutation = useCreateProgram();

  const handleAddExercise = (exercise: any) => {
    setSelectedExercises([...selectedExercises, { ...exercise, targetSets: 3, targetReps: 10 }]);
    setIsDBModalOpen(false);
  };

  const handleSave = async () => {
    if (!name || selectedExercises.length === 0) return;

    await createProgramMutation.mutateAsync({
      name,
      description,
      user_id: user?.id || 0,
    });

    onSave();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-tg-text">Новая программа</h2>
        <button onClick={onCancel} className="text-tg-hint p-2"><X size={24} /></button>
      </div>

      <div className="bg-tg-secondaryBg p-6 rounded-[2rem] shadow-sm border border-slate-50 space-y-4">
        <div>
          <label className="block text-xs font-bold text-tg-hint uppercase tracking-wider mb-2 ml-1">Название программы</label>
          <input
            type="text"
            placeholder="Напр: Фуллбоди База"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-tg-bg border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-tg-link text-tg-text font-bold text-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-tg-hint uppercase tracking-wider mb-2 ml-1">Описание (опционально)</label>
          <textarea
            placeholder="О чем эта программа..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-tg-bg border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-tg-link text-tg-text min-h-[100px]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-tg-hint uppercase tracking-wider ml-3">Упражнения ({selectedExercises.length})</h3>

        {selectedExercises.map((ex, idx) => (
          <div key={idx} className="bg-tg-secondaryBg p-5 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-50">
             <div className="w-12 h-12 bg-tg-bg rounded-2xl flex items-center justify-center shrink-0">
               <Dumbbell size={20} className="text-tg-link" />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-tg-text">{ex.name}</h4>
               <p className="text-xs text-tg-hint">{ex.targetSets} подх. × {ex.targetReps} повт.</p>
             </div>
             <button
               onClick={() => setSelectedExercises(selectedExercises.filter((_, i) => i !== idx))}
               className="text-red-400 p-2"
             >
               <Trash2 size={20} />
             </button>
          </div>
        ))}

        <button
          onClick={() => setIsDBModalOpen(true)}
          className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-tg-hint font-bold flex items-center justify-center gap-2 hover:bg-tg-secondaryBg transition-colors"
        >
          <Plus size={20} /> Добавить упражнение
        </button>
      </div>

      <div className="pt-6 flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 bg-tg-secondaryBg text-tg-text rounded-2xl font-bold border border-slate-100"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={!name || selectedExercises.length === 0}
          className="flex-2 bg-tg-link text-white py-4 px-8 rounded-2xl font-bold shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          <Save size={20} /> Сохранить программу
        </button>
      </div>

      {isDBModalOpen && (
        <ExerciseDBModal
          onClose={() => setIsDBModalOpen(false)}
          onSelect={handleAddExercise}
        />
      )}
    </div>
  );
}
