import React from 'react';
import { useMuscleDistribution } from '../hooks/useAnalytics';
import { MUSCLE_TRANSLATIONS } from '../constants';
import { Activity, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function MuscleHeatmapView() {
  const { data: distribution, isLoading } = useMuscleDistribution('week');

  const getMuscleColor = (sets: number) => {
    if (sets === 0) return '#f1f5f9'; // slate-100
    if (sets <= 4) return '#4ade80'; // green-400
    if (sets <= 10) return '#facc15'; // yellow-400
    return '#ef4444'; // red-500
  };

  const getStatusInfo = (muscle: string, sets: number) => {
    const name = (MUSCLE_TRANSLATIONS as any)[muscle] || muscle;
    if (sets === 0) return { label: 'Нет нагрузки', color: 'text-slate-400', icon: <AlertCircle size={14} />, tip: `Мышцы ${name} не задействованы на этой неделе.` };
    if (sets <= 4) return { label: 'Легкая', color: 'text-green-500', icon: <CheckCircle2 size={14} />, tip: `Хорошая поддерживающая нагрузка на ${name}.` };
    if (sets <= 10) return { label: 'Оптимальная', color: 'text-yellow-500', icon: <TrendingUp size={14} />, tip: `Отличный объем для гипертрофии ${name}.` };
    return { label: 'Высокая', color: 'text-red-500', icon: <AlertCircle size={14} />, tip: `Внимание: риск перетренированности ${name}. Рекомендуется отдых.` };
  };

  const muscleData = (distribution || []).reduce((acc, curr) => {
    let muscle = curr.muscle;
    // Map specific groups to the main diagram keys
    if (['biceps', 'triceps', 'forearms'].includes(muscle)) muscle = 'arms';
    if (['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'].includes(muscle)) muscle = 'legs';
    if (['lats', 'middle back', 'lower back', 'traps'].includes(muscle)) muscle = 'back';
    if (['abdominals'].includes(muscle)) muscle = 'abs';
    
    acc[muscle] = (acc[muscle] || 0) + curr.sets_count;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-tg-hint">Анализируем ваши тренировки...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-tg-secondaryBg p-6 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden">
        <h2 className="text-xl font-black text-tg-text mb-1">Прогрессия мышц</h2>
        <p className="text-xs text-tg-hint mb-6 font-medium">Обзор нагрузки спереди и сзади</p>
        
        <div className="flex flex-col gap-8 items-center mt-4">
          <div className="flex justify-around w-full gap-4">
             {/* Front View */}
             <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-tg-hint uppercase tracking-tighter opacity-50">Вид спереди</span>
                <div className="relative w-32 h-64 scale-110 origin-top">
                   <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-md">
                      {/* Shoulders Front */}
                      <circle cx="25" cy="50" r="6" fill={getMuscleColor(muscleData['shoulders'] || 0)} />
                      <circle cx="75" cy="50" r="6" fill={getMuscleColor(muscleData['shoulders'] || 0)} />
                      {/* Chest */}
                      <rect x="33" y="55" width="34" height="25" rx="4" fill={getMuscleColor(muscleData['chest'] || 0)} />
                      {/* Abs */}
                      <rect x="38" y="85" width="24" height="30" rx="3" fill={getMuscleColor(muscleData['abs'] || 0)} />
                      {/* Biceps (Arms Front) */}
                      <path d="M22 60 L18 100" strokeWidth="10" strokeLinecap="round" stroke={getMuscleColor(muscleData['arms'] || 0)} />
                      <path d="M78 60 L82 100" strokeWidth="10" strokeLinecap="round" stroke={getMuscleColor(muscleData['arms'] || 0)} />
                      {/* Quads (Legs Front) */}
                      <path d="M40 120 L35 185" strokeWidth="14" strokeLinecap="round" stroke={getMuscleColor(muscleData['legs'] || 0)} />
                      <path d="M60 120 L65 185" strokeWidth="14" strokeLinecap="round" stroke={getMuscleColor(muscleData['legs'] || 0)} />
                      {/* Head */}
                      <circle cx="50" cy="25" r="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                   </svg>
                </div>
             </div>

             {/* Back View */}
             <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-tg-hint uppercase tracking-tighter opacity-50">Вид сзади</span>
                <div className="relative w-32 h-64 scale-110 origin-top">
                   <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-md">
                      {/* Middle/Upper Back */}
                      <path d="M33 50 L67 50 L60 90 L40 90 Z" fill={getMuscleColor(muscleData['back'] || 0)} />
                      {/* Triceps (Arms Back) */}
                      <path d="M22 60 L18 100" strokeWidth="8" strokeLinecap="round" stroke={getMuscleColor(muscleData['arms'] || 0)} opacity="0.6" />
                      <path d="M78 60 L82 100" strokeWidth="8" strokeLinecap="round" stroke={getMuscleColor(muscleData['arms'] || 0)} opacity="0.6" />
                      {/* Glutes/Hamstrings (Legs Back) */}
                      <rect x="36" y="115" width="28" height="20" rx="4" fill={getMuscleColor(muscleData['legs'] || 0)} opacity="0.8" />
                      <path d="M40 135 L38 185" strokeWidth="10" strokeLinecap="round" stroke={getMuscleColor(muscleData['legs'] || 0)} />
                      <path d="M60 135 L62 185" strokeWidth="10" strokeLinecap="round" stroke={getMuscleColor(muscleData['legs'] || 0)} />
                      {/* Head */}
                      <circle cx="50" cy="25" r="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                   </svg>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {['chest', 'back', 'legs', 'shoulders', 'arms', 'abs'].map(m => {
              const sets = muscleData[m] || 0;
              const info = getStatusInfo(m, sets);
              return (
                <div key={m} className="bg-tg-bg/50 p-3 rounded-2xl border border-slate-50 flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-black text-tg-text truncate">{(MUSCLE_TRANSLATIONS as any)[m] || m}</h4>
                    <div className={`flex items-center gap-1 text-[8px] font-bold ${info.color}`}>
                      {info.label}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-tg-text">{sets}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-tg-text flex items-center gap-2 px-2">
           <Activity className="text-tg-link" size={20} />
           Smart Рекомендации
        </h3>
        
        <div className="grid gap-3">
           {distribution?.length === 0 ? (
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
               <AlertCircle className="text-blue-500 shrink-0" size={20} />
               <p className="text-sm text-blue-700">На этой неделе еще не было тренировок. Самое время начать!</p>
             </div>
           ) : (
             distribution?.map(d => {
               const info = getStatusInfo(d.muscle, d.sets_count);
               if (d.sets_count === 0) return null;
               return (
                 <div key={d.muscle} className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50 flex gap-4">
                   <div className={`p-3 rounded-xl shrink-0 h-fit ${d.sets_count > 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {info.icon}
                   </div>
                   <p className="text-sm text-tg-text font-medium leading-relaxed">
                     {info.tip}
                   </p>
                 </div>
               );
             })
           )}
        </div>
      </div>
    </div>
  );
}
