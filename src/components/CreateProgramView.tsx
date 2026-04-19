import React, { useState } from 'react';
import { Plus, Trash2, X, Dumbbell, Save, Loader2 } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';
import { useCreateProgram, useCreatePlan, useAddExerciseToPlan } from '../hooks/usePrograms';
import { useAuth } from '../hooks/useAuth';
import WebApp from '../lib/telegram';
import { logger } from '../lib/logger';

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
  const createPlanMutation = useCreatePlan();
  const addExerciseToPlanMutation = useAddExerciseToPlan();
  const [isSaving, setIsSaving] = useState(false);

  const handleAddExercise = (exercise: any) => {
    logger.action('Adding exercise to program template', exercise);
    setSelectedExercises([...selectedExercises, { ...exercise, targetSets: 3, targetReps: 10 }]);
    setIsDBModalOpen(false);
  };

  const handleSave = async () => {
    if (!name || selectedExercises.length === 0 || isSaving) {
      logger.warn('Cannot save program: validation failed', { name, exercisesCount: selectedExercises.length });
      return;
    }

    setIsSaving(true);
    logger.action('Saving new program template...', { name, exercisesCount: selectedExercises.length });

    try {
      // 1. Create the program
      logger.info('Step 1: Creating program object...');
      const program = await createProgramMutation.mutateAsync({
        name,
        description,
      });
      logger.info('Program created', { id: program.id });

      // 2. Create a default plan for the program
      logger.info('Step 2: Creating default plan...');
      const plan = await createPlanMutation.mutateAsync({
        name: 'Основная тренировка',
        program_id: program.id,
      });
      logger.info('Plan created', { id: plan.id });

      // 3. Add exercises to the plan
      logger.info('Step 3: Adding exercises to plan...');
      for (let i = 0; i < selectedExercises.length; i++) {
        const ex = selectedExercises[i];
        logger.info(`  Adding exercise ${i + 1}/${selectedExercises.length}: ${ex.name}`);
        await addExerciseToPlanMutation.mutateAsync({
          planId: plan.id,
          exercise: {
            exercise_id: ex.id,
            target_sets: ex.targetSets,
            target_reps: ex.targetReps,
          },
        });
      }

      logger.action('Program saved successfully');
      WebApp?.HapticFeedback?.notificationOccurred('success');
      onSave();
    } catch (error) {
      logger.error('Failed to save program', error);
      WebApp?.HapticFeedback?.notificationOccurred('error');
      alert('Ошибка при создании программы. Пожалуйста, проверьте соединение.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-tg-text">Новая программа</h2>
        <button onClick={onCancel} className="text-tg-hint p-2"><X size={20} /></button>
      </div>

      <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50 space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-tg-hint uppercase tracking-wider mb-1 ml-1">Название программы</label>
          <input
            type="text"
            placeholder="Напр: Фуллбоди База"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-tg-bg border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-tg-link text-tg-text font-bold text-base"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-tg-hint uppercase tracking-wider mb-1 ml-1">Описание (опционально)</label>
          <textarea
            placeholder="О чем эта программа..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-tg-bg border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-tg-link text-tg-text min-h-[80px] text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-tg-hint uppercase tracking-wider ml-3">Упражнения ({selectedExercises.length})</h3>

        {selectedExercises.map((ex, idx) => (
          <div key={idx} className="bg-tg-secondaryBg p-3 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-50">
             <div className="w-10 h-10 bg-tg-bg rounded-xl flex items-center justify-center shrink-0">
               <Dumbbell size={18} className="text-tg-link" />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-sm text-tg-text">{ex.name}</h4>
               <p className="text-[10px] text-tg-hint">{ex.targetSets} подх. × {ex.targetReps} повт.</p>
             </div>
             <button
               onClick={() => setSelectedExercises(selectedExercises.filter((_, i) => i !== idx))}
               className="text-red-400 p-2"
             >
               <Trash2 size={18} />
             </button>
          </div>
        ))}

        <button
          onClick={() => setIsDBModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-tg-hint font-bold flex items-center justify-center gap-2 hover:bg-tg-secondaryBg transition-colors text-sm"
        >
          <Plus size={18} /> Добавить упражнение
        </button>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-tg-secondaryBg text-tg-text rounded-xl font-bold border border-slate-100 text-sm"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={!name || selectedExercises.length === 0 || isSaving}
          className="flex-[2] bg-tg-link text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-sm"
        >
          {isSaving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isSaving ? 'Сохранение...' : 'Сохранить программу'}
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
