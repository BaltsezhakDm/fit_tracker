import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Dumbbell, Save, Loader2, AlertCircle } from 'lucide-react';
import ExerciseDBModal from './ExerciseDBModal';
import { 
  useCreateProgram, 
  useCreatePlan, 
  useAddExerciseToPlan, 
  useUpdateProgram, 
  useGetProgramPlans, 
  useGetPlanExercises,
  useDeletePlanExercises
} from '../hooks/usePrograms';
import { useExercises } from '../hooks/useExercises';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/useUIStore';
import WebApp from '../lib/telegram';
import { logger } from '../lib/logger';

interface CreateProgramViewProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function CreateProgramView({ onSave, onCancel }: CreateProgramViewProps) {
  const { user } = useAuth();
  const editingProgram = useUIStore(s => s.editingProgram);
  const setEditingProgram = useUIStore(s => s.setEditingProgram);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: exercisesList } = useExercises();
  const { data: plans } = useGetProgramPlans(editingProgram?.id || null);
  const planId = plans && plans.length > 0 ? plans[0].id : null;
  const { data: planExercises, isLoading: isLoadingExercises } = useGetPlanExercises(planId);

  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const createPlanMutation = useCreatePlan();
  const deletePlanExercisesMutation = useDeletePlanExercises();
  const addExerciseToPlanMutation = useAddExerciseToPlan();

  useEffect(() => {
    if (editingProgram) {
      setName(editingProgram.name);
      setDescription(editingProgram.description || '');
    }
  }, [editingProgram]);

  useEffect(() => {
    if (editingProgram && planExercises && exercisesList && selectedExercises.length === 0) {
      const initialExercises = planExercises.map(pe => {
        const baseEx = exercisesList?.find(e => e.id === pe.exercise_id);
        return {
          ...baseEx,
          id: pe.exercise_id, // Ensure we use the correct ID
          targetSets: pe.target_sets,
          targetReps: pe.target_reps,
        };
      });
      setSelectedExercises(initialExercises);
    }
  }, [planExercises, exercisesList, editingProgram, selectedExercises.length]);

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
    logger.action(editingProgram ? 'Updating program template...' : 'Saving new program template...', { name, exercisesCount: selectedExercises.length });

    try {
      let program;
      let activePlanId = planId;

      if (editingProgram) {
        // 1. Update program metadata
        program = await updateProgramMutation.mutateAsync({
          id: editingProgram.id,
          program: { name, description }
        });
        
        // 2. Clear existing plan exercises (simplest way to update)
        if (activePlanId) {
          await deletePlanExercisesMutation.mutateAsync(activePlanId);
        } else {
          // Fallback: create plan if missing
          const plan = await createPlanMutation.mutateAsync({
            name: 'Основная тренировка',
            program_id: editingProgram.id,
          });
          activePlanId = plan.id;
        }
      } else {
        // 1. Create new program
        program = await createProgramMutation.mutateAsync({ 
          userId: user?.id || '1', 
          program: { name, description } 
        });
        
        // 2. Create default plan (which is the program itself in our schema)
        const plan = await createPlanMutation.mutateAsync({
          name: 'Основная тренировка',
          program_id: program.id,
        });
        activePlanId = plan.id;
      }

      // 3. Add exercises to the plan
      for (let i = 0; i < selectedExercises.length; i++) {
        const ex = selectedExercises[i];
        await addExerciseToPlanMutation.mutateAsync({
          planId: activePlanId!,
          exercise: {
            exercise_id: ex.id,
            target_sets: ex.targetSets,
            target_reps: ex.targetReps,
          },
        });
      }

      logger.action('Program saved successfully');
      WebApp?.HapticFeedback?.notificationOccurred('success');
      setEditingProgram(null);
      onSave();
    } catch (error) {
      logger.error('Failed to save program', error);
      WebApp?.HapticFeedback?.notificationOccurred('error');
      alert('Ошибка при сохранении программы. Пожалуйста, проверьте соединение.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingProgram(null);
    onCancel();
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-tg-text">
          {editingProgram ? 'Редактировать программу' : 'Новая программа'}
        </h2>
        <button onClick={handleCancel} className="text-tg-hint p-2"><X size={20} /></button>
      </div>

      {isLoadingExercises && editingProgram && (
        <div className="flex items-center justify-center py-10 gap-2 text-tg-hint">
          <Loader2 size={20} className="animate-spin" />
          <span>Загрузка данных...</span>
        </div>
      )}

      <div className="bg-tg-secondaryBg p-4 rounded-3xl shadow-sm border border-slate-100/10 space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-tg-hint uppercase tracking-wider mb-1 ml-1">Название программы</label>
          <input
            type="text"
            placeholder="Напр: Фуллбоди База"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-tg-bg border-0 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-tg-link text-tg-text font-bold text-base outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-tg-hint uppercase tracking-wider mb-1 ml-1">Описание (опционально)</label>
          <textarea
            placeholder="О чем эта программа..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-tg-bg border-0 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-tg-link text-tg-text min-h-[80px] text-sm outline-none resize-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-tg-hint uppercase tracking-wider ml-3">Упражнения ({selectedExercises.length})</h3>

        {selectedExercises.map((ex, idx) => (
          <div key={idx} className="bg-tg-secondaryBg p-3 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100/10 transition-all">
             <div className="w-10 h-10 bg-tg-bg rounded-xl flex items-center justify-center shrink-0">
               <Dumbbell size={18} className="text-tg-link" />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-sm text-tg-text">{ex.name}</h4>
               <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-tg-hint">Подх:</span>
                    <input 
                      type="number" 
                      value={ex.targetSets} 
                      onChange={(e) => {
                        const updated = [...selectedExercises];
                        updated[idx].targetSets = parseInt(e.target.value) || 0;
                        setSelectedExercises(updated);
                      }}
                      className="bg-tg-bg w-8 text-center text-xs font-bold text-tg-text rounded p-0.5 border-none outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-tg-hint">Повт:</span>
                    <input 
                      type="number" 
                      value={ex.targetReps} 
                      onChange={(e) => {
                        const updated = [...selectedExercises];
                        updated[idx].targetReps = parseInt(e.target.value) || 0;
                        setSelectedExercises(updated);
                      }}
                      className="bg-tg-bg w-8 text-center text-xs font-bold text-tg-text rounded p-0.5 border-none outline-none"
                    />
                  </div>
               </div>
             </div>
             <button
               onClick={() => setSelectedExercises(selectedExercises.filter((_, i) => i !== idx))}
               className="text-red-400 p-2 active:scale-90 transition-transform"
             >
               <Trash2 size={18} />
             </button>
          </div>
        ))}

        <button
          onClick={() => setIsDBModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-slate-100/20 rounded-2xl text-tg-hint font-bold flex items-center justify-center gap-2 hover:bg-tg-secondaryBg transition-colors text-sm"
        >
          <Plus size={18} /> Добавить упражнение
        </button>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          onClick={handleCancel}
          className="flex-1 py-3 bg-tg-secondaryBg text-tg-text rounded-xl font-bold border border-slate-100/10 text-sm"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={!name || selectedExercises.length === 0 || isSaving}
          className="flex-[2] bg-tg-link text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-all"
        >
          {isSaving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isSaving ? 'Сохранение...' : (editingProgram ? 'Обновить' : 'Сохранить')}
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
