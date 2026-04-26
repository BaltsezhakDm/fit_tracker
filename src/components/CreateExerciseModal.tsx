import React, { useState } from 'react';
import { X, Save, Dumbbell, Tag, AlignLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { MUSCLE_TRANSLATIONS } from '../constants';

interface CreateExerciseModalProps {
  onClose: () => void;
  onCreated: (exercise: any) => void;
}

export default function CreateExerciseModal({ onClose, onCreated }: CreateExerciseModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    primary_muscle_group: 'chest',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises_smart')
        .insert({
          name: formData.name,
          primary_muscle_group: formData.primary_muscle_group,
          description: formData.description,
          muscle_weights: { [formData.primary_muscle_group]: 1.0 },
        })
        .select()
        .single();
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      onCreated(data);
    } catch (error) {
      console.error('Failed to create exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-tg-bg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-tg-secondaryBg">
          <h2 className="text-xl font-black text-tg-text">Новое упражнение</h2>
          <button onClick={onClose} className="p-2 hover:bg-tg-bg rounded-full transition-colors text-tg-hint"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-tg-hint uppercase ml-1 flex items-center gap-1">
              <Dumbbell size={12} /> Название
            </label>
            <input
              autoFocus
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Напр: Жим сидя в тренажере"
              className="w-full bg-tg-secondaryBg border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-tg-link text-tg-text font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-tg-hint uppercase ml-1 flex items-center gap-1">
              <Tag size={12} /> Группа мышц
            </label>
            <select
              value={formData.primary_muscle_group}
              onChange={e => setFormData({ ...formData, primary_muscle_group: e.target.value })}
              className="w-full bg-tg-secondaryBg border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-tg-link text-tg-text font-bold appearance-none"
            >
              {Object.entries(MUSCLE_TRANSLATIONS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-tg-hint uppercase ml-1 flex items-center gap-1">
              <AlignLeft size={12} /> Описание (опционально)
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Как выполнять..."
              rows={3}
              className="w-full bg-tg-secondaryBg border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-tg-link text-tg-text"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.name}
            className="w-full bg-tg-link text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {loading ? 'Создание...' : <><Save size={20} /> Создать и добавить</>}
          </button>
        </form>
      </div>
    </div>
  );
}
