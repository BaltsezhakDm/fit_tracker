import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

function getWorkoutWord(count) {
  const remainder = count % 10;
  if (count > 10 && count < 20) return 'раз';
  if (remainder === 1) return 'раз';
  if (remainder >= 2 && remainder <= 4) return 'раза';
  return 'раз';
}

function SimpleChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.maxWeight));
  const minVal = Math.min(...data.map(d => d.maxWeight));
  const chartMax = maxVal + (maxVal - minVal > 0 ? (maxVal - minVal) * 0.2 : 10);

  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => {
        const heightPercent = Math.max((d.maxWeight / chartMax) * 100, 10);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
              {d.maxWeight} кг
            </div>
            <div className="w-full bg-blue-100 hover:bg-blue-300 rounded-t-md transition-all relative overflow-hidden" style={{ height: `${heightPercent}%` }}>
              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-md opacity-80" style={{ height: '100%' }}></div>
            </div>
            {(i === 0 || i === data.length - 1) && (
              <span className="text-[9px] text-slate-400 truncate w-full text-center">{d.date.substring(5).replace('-', '.')}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StatsView({ workouts }) {
  const stats = useMemo(() => {
    const data = {};
    let totalVolumeAll = 0;

    workouts.forEach(w => {
      if (!data[w.exercise]) data[w.exercise] = { maxWeight: 0, totalVolume: 0, sessions: 0, history: [] };
      let sessionVolume = 0;
      let sessionMax = 0;

      w.sets.forEach(set => {
        const volume = set.reps * set.weight;
        sessionVolume += volume;
        totalVolumeAll += volume;
        if (set.weight > data[w.exercise].maxWeight) data[w.exercise].maxWeight = set.weight;
        if (set.weight > sessionMax) sessionMax = set.weight;
      });

      data[w.exercise].totalVolume += sessionVolume;
      data[w.exercise].sessions += 1;
      data[w.exercise].history.push({ date: w.date, maxWeight: sessionMax });
    });

    const topExercises = Object.entries(data)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .map(([name, stats]) => ({ name, ...stats }));

    return { topExercises, totalVolumeAll, totalSessions: workouts.length };
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <p>Недостаточно данных для статистики.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 text-white shadow-md shadow-blue-200">
          <p className="text-blue-100 text-sm font-medium mb-1">Всего упражнений</p>
          <p className="text-3xl font-bold">{stats.totalSessions}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-5 text-white shadow-md shadow-indigo-200">
          <p className="text-indigo-100 text-sm font-medium mb-1">Общий тоннаж</p>
          <p className="text-2xl font-bold">{stats.totalVolumeAll.toLocaleString()} <span className="text-sm font-normal">кг</span></p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 ml-1">Аналитика по упражнениям</h2>
        <div className="space-y-4">
          {stats.topExercises.map(ex => (
            <div key={ex.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 leading-tight">{ex.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium whitespace-nowrap ml-2">
                  {ex.sessions} {getWorkoutWord(ex.sessions)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-1">Рекорд (вес)</p>
                  <p className="text-lg font-bold text-slate-700">{ex.maxWeight} <span className="text-xs text-slate-400 font-normal">кг</span></p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-1">Тоннаж</p>
                  <p className="text-lg font-bold text-slate-700">{ex.totalVolume.toLocaleString()} <span className="text-xs text-slate-400 font-normal">кг</span></p>
                </div>
              </div>
              {ex.history.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-3">Прогресс максимального веса</p>
                  <SimpleChart data={ex.history.reverse()} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}