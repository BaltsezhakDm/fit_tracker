import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, X } from 'lucide-react';

const FALLBACK_CATEGORIES = {
  1: 'Chest',
  2: 'Legs',
  3: 'Back',
  4: 'Arms',
  5: 'Abs',
  6: 'Shoulders'
};

const FALLBACK_EXERCISES = [
  { id: 'f1', name: 'Bench Press', category: 1 },
  { id: 'f2', name: 'Squat', category: 2 },
  { id: 'f3', name: 'Deadlift', category: 3 },
  { id: 'f4', name: 'Pull-up', category: 3 },
  { id: 'f5', name: 'Dumbbell Curl', category: 4 },
  { id: 'f6', name: 'Crunch', category: 5 },
  { id: 'f7', name: 'Shoulder Press', category: 6 },
  { id: 'f8', name: 'Leg Press', category: 2 }
];

export default function ExerciseDBModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Все');

  const [categoryMap, setCategoryMap] = useState(FALLBACK_CATEGORIES);
  const [imageMap, setImageMap] = useState({});
  const [nextUrl, setNextUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      setLoading(true);
      setError(null);

      const pCat = fetch('https://wger.de/api/v2/exercisecategory/', { headers: { 'Accept': 'application/json' } })
        .then(res => res.json())
        .catch(e => { console.error('Ошибка категорий:', e); return null; });

      const pImg = fetch('https://wger.de/api/v2/exerciseimage/?is_main=True&limit=300', { headers: { 'Accept': 'application/json' } })
        .then(res => res.json())
        .catch(e => { console.error('Ошибка картинок:', e); return null; });

      const pExc = fetch('https://wger.de/api/v2/exercise/?language=2&limit=40', { headers: { 'Accept': 'application/json' } })
        .then(res => {
          if (!res.ok) throw new Error('Bad network response');
          return res.json();
        })
        .catch(e => { console.error('Ошибка упражнений:', e); return null; });

      const [catData, imgData, excData] = await Promise.all([pCat, pImg, pExc]);

      if (!isMounted) return;

      if (catData && catData.results) {
        const map = { ...FALLBACK_CATEGORIES };
        catData.results.forEach(c => map[c.id] = c.name);
        setCategoryMap(map);
      }

      if (imgData && imgData.results) {
        const map = {};
        imgData.results.forEach(img => {
          if (img.exercise) map[img.exercise] = img.image;
          if (img.exercise_base) map[img.exercise_base] = img.image;
        });
        setImageMap(map);
      }

      if (excData && excData.results && excData.results.length > 0) {
        setExercises(excData.results.filter(ex => ex.name));
        setNextUrl(excData.next ? excData.next.replace('http://', 'https://') : null);
      } else {
        setExercises(FALLBACK_EXERCISES);
        setError("Не удалось загрузить базу. Включен офлайн-режим (тестовые данные).");
      }

      setLoading(false);
    };

    initData();

    return () => { isMounted = false; };
  }, []);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const res = await fetch(nextUrl, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data && data.results) {
        setExercises(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newEx = data.results.filter(ex => !existingIds.has(ex.id) && ex.name);
          return [...prev, ...newEx];
        });
        setNextUrl(data.next ? data.next.replace('http://', 'https://') : null);
      }
    } catch (err) {
      console.error("Ошибка загрузки следующей страницы:", err);
    }
    setLoading(false);
  };

  const categoriesList = ['Все', ...Array.from(new Set(exercises.map(ex => categoryMap[ex.category] || 'Other'))).filter(Boolean)];

  const filteredExercises = exercises.filter(ex => {
    const catName = categoryMap[ex.category] || 'Other';
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Все' || catName === activeCategory;
    return matchSearch && matchCat;
  });

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

        {filteredExercises.map(ex => {
          const catName = categoryMap[ex.category] || 'Other';
          const imageUrl = imageMap[ex.id] || imageMap[ex.exercise_base] || imageMap[ex.exercise];

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

        {!loading && nextUrl && filteredExercises.length > 0 && (
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