import React, { useState, useMemo } from 'react';
import { Search, X, Dumbbell, Star, ChevronRight, Activity, Image as ImageIcon, Plus } from 'lucide-react';
import { useExercises } from '../hooks/useExercises';
import { MUSCLE_TRANSLATIONS } from '../constants';
import CreateExerciseModal from './CreateExerciseModal';

interface ExerciseDBModalProps {
  onClose: () => void;
  onSelect: (exercise: any) => void;
}

export default function ExerciseDBModal({ onClose, onSelect }: ExerciseDBModalProps) {
  const { data: exercises, isLoading } = useExercises();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredExercises = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    return exercises.filter(ex => {
      const matchesSearch = (ex.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.primary_muscle_group === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchTerm, selectedMuscle]);

  const muscleGroups = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    const muscles = new Set(exercises.map(ex => ex.primary_muscle_group).filter(Boolean));
    return Array.from(muscles).sort();
  }, [exercises]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-tg-bg rounded-t-[2rem] sm:rounded-[2rem] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-tg-secondaryBg">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-bold text-tg-text">База упражнений</h2>
             <button 
               onClick={() => setShowCreateModal(true)}
               className="p-1.5 px-3 bg-tg-link/10 text-tg-link rounded-lg border border-tg-link/20 flex items-center gap-1 hover:bg-tg-link hover:text-white transition-all shadow-sm"
             >
                <Plus size={14} />
                <span className="text-[10px] font-black uppercase">Свое</span>
             </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-tg-bg rounded-full transition-colors text-tg-hint"><X size={24} /></button>
        </div>

        <div className="p-4 bg-tg-secondaryBg space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-tg-hint" size={20} />
            <input
              type="text"
              placeholder="Поиск упражнения..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-tg-bg border-0 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-tg-link text-tg-text"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setSelectedMuscle(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!selectedMuscle ? 'bg-tg-link text-white shadow-lg shadow-blue-100' : 'bg-tg-bg text-tg-hint'}`}
            >
              Все
            </button>
            {muscleGroups.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedMuscle === m ? 'bg-tg-link text-white shadow-lg shadow-blue-100' : 'bg-tg-bg text-tg-hint'}`}
              >
                {(MUSCLE_TRANSLATIONS as any)[m] || m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-tg-bg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Activity className="animate-spin text-tg-link" size={40} />
              <p className="text-tg-hint font-medium">Загрузка базы...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Dumbbell className="mx-auto mb-2 text-tg-hint opacity-10" size={80} />
              <div>
                <p className="text-tg-text font-black text-lg">Не нашли упражнение?</p>
                <p className="text-xs text-tg-hint">Создайте его вручную и оно сохранится в вашей базе</p>
              </div>
              <button 
                 onClick={() => setShowCreateModal(true)}
                 className="px-8 py-4 bg-tg-link text-white rounded-2xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-all"
              >
                 Создать "{searchTerm}"
              </button>
            </div>
          ) : (
            filteredExercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full bg-tg-secondaryBg p-4 rounded-2xl flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all text-left shadow-sm border border-slate-50"
              >
                <div className="w-16 h-16 bg-tg-bg rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                   {ex.media_url ? (
                     <img src={ex.media_url} alt={ex.name} className="w-full h-full object-cover" />
                   ) : (
                     <Dumbbell size={24} className="text-tg-hint opacity-30" />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-tg-text truncate">{ex.name}</h4>
                  <p className="text-xs text-tg-hint">{(MUSCLE_TRANSLATIONS as any)[ex.primary_muscle_group] || ex.primary_muscle_group}</p>
                </div>
                <ChevronRight className="text-tg-hint" size={20} />
              </button>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateExerciseModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={(ex) => {
            setShowCreateModal(false);
            onSelect(ex);
          }}
        />
      )}
    </div>
  );
}
