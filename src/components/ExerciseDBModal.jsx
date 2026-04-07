import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, X } from 'lucide-react';

const DATA_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const MUSCLE_TRANSLATIONS = {
  abdominals: 'Пресс',
  abductors: 'Отводящие',
  adductors: 'Приводящие',
  biceps: 'Бицепс',
  calves: 'Икры',
  chest: 'Грудь',
  forearms: 'Предплечья',
  glutes: 'Ягодицы',
  hamstrings: 'Бицепс бедра',
  lats: 'Широчайшие',
  'lower back': 'Поясница',
  'middle back': 'Средняя часть спины',
  neck: 'Шея',
  quadriceps: 'Квадрицепс',
  shoulders: 'Плечи',
  traps: 'Трапеции',
  triceps: 'Трицепс'
};

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

export default function ExerciseDBModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Все');
  const [visibleCount, setVisibleCount] = useState(40);

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
          setAllExercises(data);
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="bg-white pt-6 pb-3 px-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            autoFocus
            placeholder="Поиск (на англ.)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 rounded-xl py-3 pl-10 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={24} /></button>
      </div>

      {categoriesList.length > 1 && (
        <div className="bg-white border-b border-slate-200">
          <div className="flex overflow-x-auto hide-scrollbar p-3 gap-2">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
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
              className="w-full bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:bg-blue-50 transition-colors group text-left"
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
                  <p className="font-bold text-slate-800 group-active:text-blue-600 truncate leading-tight">{ex.name}</p>
                  <p className="text-xs text-slate-400 mt-1 truncate">{catName}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-active:bg-blue-100 flex items-center justify-center shrink-0 ml-2">
                <Plus className="text-slate-400 group-active:text-blue-600" size={18} />
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
