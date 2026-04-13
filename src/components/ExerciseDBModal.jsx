import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, X, Edit2, ChevronLeft, Save } from 'lucide-react';
import { MUSCLE_TRANSLATIONS } from '../constants';

const DATA_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const FALLBACK_EXERCISES = [
  { id: 'f1', name: 'Bench Press', primaryMuscles: ['chest'] },
  { id: 'f2', name: 'Squat', primaryMuscles: ['quadriceps'] },
  { id: 'f3', name: 'Deadlift', primaryMuscles: ['hamstrings'] },
  { id: 'f4', name: 'Pull-up', primaryMuscles: ['lats'] },
  { id: 'f5', name: 'Dumbbell Curl', primaryMuscles: ['biceps'] },
  { id: 'f6', name: 'Crunch', primaryMuscles: ['abdominals'] },
  { id: 'f7', name: 'Shoulder Press', primaryMuscles: ['shoulders'] },
  { id: 'f8', name: 'Leg Press', primaryMuscles: ['quadriceps'] }
];

export default function ExerciseDBModal({ onClose, onSelect, getMergedExercises, saveCustomExercise }) {
  const [search, setSearch] = useState('');
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Все');
  const [visibleCount, setVisibleCount] = useState(40);

  const [editingExercise, setEditingExercise] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', equipment: '', notes: '' });

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error('Bad network response');
        const data = await res.json();

        if (!isMounted) return;

        if (data && data.length > 0) {
          const merged = getMergedExercises ? getMergedExercises(data) : data;
          setAllExercises(merged);
        } else {
          throw new Error('Empty data');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Ошибка загрузки упражнений:', err);
        setAllExercises(FALLBACK_EXERCISES);
        setError("Не удалось загрузить базу. Включен офлайн-режим (тестовые данные).");
      }

      if (isMounted) setLoading(false);
    };

    initData();

    return () => { isMounted = false; };
  }, []);

  const getCategoryName = (ex) => {
    if (!ex.primaryMuscles || ex.primaryMuscles.length === 0) return 'Другое';
    const muscle = ex.primaryMuscles[0];
    return MUSCLE_TRANSLATIONS[muscle] || muscle.charAt(0).toUpperCase() + muscle.slice(1);
  };

  const categoriesSet = new Set(allExercises.map(getCategoryName));
  const categoriesList = ['Все', ...Array.from(categoriesSet).sort()];

  const filteredExercises = allExercises.filter(ex => {
    const catName = getCategoryName(ex);
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Все' || catName === activeCategory;
    return matchSearch && matchCat;
  });

  const displayedExercises = filteredExercises.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount(prev => prev + 40);
  };

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(40);
  }, [search, activeCategory]);

  const handleStartEdit = (e, ex) => {
    e.stopPropagation();
    setEditingExercise(ex);
    setEditForm({
      name: ex.name || '',
      category: getCategoryName(ex) || '',
      equipment: ex.equipment || '',
      notes: ex.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    const muscleKey = Object.keys(MUSCLE_TRANSLATIONS).find(key => MUSCLE_TRANSLATIONS[key] === editForm.category) || 'other';

    const updatedEx = {
      ...editingExercise,
      name: editForm.name,
      primaryMuscles: [muscleKey],
      equipment: editForm.equipment,
      notes: editForm.notes,
      api_id: editingExercise.is_custom ? editingExercise.api_id : editingExercise.id,
      id: editingExercise.is_custom ? editingExercise.id : undefined
    };

    const savedEx = await saveCustomExercise(updatedEx);

    // Refresh list localy
    setAllExercises(prev => {
      const exists = prev.find(ex => (ex.id === savedEx.id || (savedEx.api_id && ex.id === savedEx.api_id)));
      if (exists) {
        return prev.map(ex => (ex.id === savedEx.id || (savedEx.api_id && ex.id === savedEx.api_id)) ? savedEx : ex);
      } else {
        return [savedEx, ...prev];
      }
    });
    setEditingExercise(null);
  };

  const handleCreateCustom = () => {
    setEditingExercise({ is_custom: true });
    setEditForm({ name: '', category: 'Грудь', equipment: '', notes: '' });
  };

  if (editingExercise) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col animate-in slide-in-from-right duration-300"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        <div
          className="pt-12 pb-3 px-4 shadow-sm flex items-center gap-3"
          style={{ backgroundColor: 'var(--secondary-bg-color)' }}
        >
          <button onClick={() => setEditingExercise(null)} className="p-2 rounded-full" style={{ color: 'var(--hint-color)' }}><ChevronLeft size={24} /></button>
          <h2 className="text-lg font-bold flex-1" style={{ color: 'var(--text-color)' }}>
            {editingExercise.id || editingExercise.api_id ? 'Редактировать' : 'Новое упражнение'}
          </h2>
          <button onClick={handleSaveEdit} className="p-2 rounded-full font-bold flex items-center gap-1" style={{ color: 'var(--link-color)' }}>
            <Save size={20} /> <span className="hidden sm:inline">Сохранить</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            className="p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--secondary-bg-color)' }}
          >
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--hint-color)' }}>Название</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder="Напр: Жим гантелей под углом"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--hint-color)' }}>Группа мышц</label>
              <select
                value={editForm.category}
                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                {Object.values(MUSCLE_TRANSLATIONS).sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Другое">Другое</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--hint-color)' }}>Оборудование</label>
              <input
                type="text"
                value={editForm.equipment}
                onChange={e => setEditForm({ ...editForm, equipment: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder="Напр: Гантели"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--hint-color)' }}>Заметки / Описание</label>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder="Техника выполнения, нюансы..."
              />
            </div>
          </div>

          <p className="text-xs px-2 text-center" style={{ color: 'var(--hint-color)' }}>
            {editingExercise.api_id ? 'Вы редактируете базовое упражнение. Будет создана ваша локальная версия.' : 'Это упражнение будет доступно только вам.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-in slide-in-from-bottom duration-300"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      <div
        className="pt-12 pb-3 px-4 shadow-sm flex items-center gap-3"
        style={{ backgroundColor: 'var(--secondary-bg-color)' }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          <input
            type="text"
            autoFocus
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          />
        </div>
        <button onClick={handleCreateCustom} className="p-2 rounded-full" style={{ color: 'var(--link-color)' }}><Plus size={24} /></button>
        <button onClick={onClose} className="p-2 rounded-full" style={{ color: 'var(--hint-color)' }}><X size={24} /></button>
      </div>

      {categoriesList.length > 1 && (
        <div className="border-b" style={{ backgroundColor: 'var(--secondary-bg-color)', borderColor: 'var(--bg-color)' }}>
          <div className="flex overflow-x-auto hide-scrollbar p-3 gap-2">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'text-white' : ''}`}
                style={activeCategory === cat ? { backgroundColor: 'var(--link-color)' } : { backgroundColor: 'var(--bg-color)', color: 'var(--hint-color)' }}
              >
                {String(cat)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {error && (
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl text-sm mb-2 border border-orange-100 text-center">
            {error}
          </div>
        )}

        {displayedExercises.map(ex => {
          const catName = getCategoryName(ex);
          const imageUrl = ex.images && ex.images.length > 0
            ? `${IMG_BASE_URL}${ex.images[0]}`
            : null;

          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full p-3 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:bg-blue-50 transition-colors group text-left"
              style={{ backgroundColor: 'var(--secondary-bg-color)' }}
            >
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={ex.name}
                      className="w-full h-full object-contain mix-blend-multiply p-1"
                      loading="lazy"
                    />
                  ) : (
                    <Dumbbell className="text-slate-300" size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold group-active:text-blue-600 truncate leading-tight flex items-center gap-1" style={{ color: 'var(--text-color)' }}>
                    {ex.name}
                    {ex.is_custom && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                  </p>
                  <p className="text-xs mt-1 truncate" style={{ color: 'var(--hint-color)' }}>{catName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleStartEdit(e, ex)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:text-blue-600"
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--hint-color)' }}
                >
                  <Edit2 size={16} />
                </button>
                <div
                  className="w-8 h-8 rounded-full group-active:bg-blue-100 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--bg-color)' }}
                >
                  <Plus size={18} style={{ color: 'var(--hint-color)' }} />
                </div>
              </div>
            </button>
          );
        })}

        {loading && (
          <div className="text-center py-6 text-slate-400 animate-pulse font-medium">Загрузка данных...</div>
        )}

        {!loading && filteredExercises.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            {search ? 'По вашему запросу ничего не найдено' : 'Список упражнений пуст'}
          </div>
        )}

        {!loading && visibleCount < filteredExercises.length && (
          <button
            onClick={loadMore}
            className="w-full py-4 mt-2 text-blue-600 font-semibold border-2 border-dashed border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Загрузить еще
          </button>
        )}
      </div>
    </div>
  );
}
