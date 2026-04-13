import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

function getWorkoutWord(count) {
  const remainder = count % 10;
  if (count > 10 && count < 20) return 'раз';
  if (remainder === 1) return 'раз';
  if (remainder >= 2 && remainder <= 4) return 'раза';
  return 'раз';
}

function SimpleChart({ data, valueKey = 'maxWeight', labelSuffix = 'кг' }) {
  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values);
  const range = maxVal - minVal;
  const chartMax = maxVal + (range > 0 ? range * 0.2 : maxVal * 0.1);

  return (
    <div className="flex items-end gap-2 h-32 border-b border-slate-100 pb-1">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const heightPercent = Math.max((val / chartMax) * 100, 5);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
            <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
              {val} {labelSuffix}
            </div>
            <div
              className="w-full rounded-t-md transition-all relative overflow-hidden min-h-[4px]"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: 'var(--link-color)',
                opacity: 0.3 + (heightPercent / 100) * 0.7
              }}
            >
            </div>
            {(i === 0 || i === data.length - 1 || data.length < 10) && (
              <span className="text-[8px] truncate w-full text-center" style={{ color: 'var(--hint-color)' }}>
                {d.date.substring(5).replace('-', '.')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ data, total }) {
  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  const paths = [];
  let cumulative = 0;
  for (let i = 0; i < data.length; i++) {
    const slice = data[i];
    const startPercent = cumulative;
    const percent = slice.volume / total;
    cumulative += percent;
    const endPercent = cumulative;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    const pathData = [
      `M ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'L 0 0',
    ].join(' ');

    paths.push({
      d: pathData,
      fill: `rgba(59, 130, 246, ${1 - (i * 0.2)})`
    });
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.fill} />
          ))}
        </svg>
      </div>
      <div className="space-y-1 flex-1">
        {data.map((m, i) => (
          <div key={m.name} className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-color)' }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgba(59, 130, 246, ${1 - (i * 0.2)})` }}></div>
            <span className="flex-1 truncate" style={{ color: 'var(--text-color)' }}>{m.name}</span>
            <span style={{ color: 'var(--hint-color)' }}>{Math.round((m.volume / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { MUSCLE_TRANSLATIONS } from '../constants';

const calculate1RM = (weight, reps) => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + 0.0333 * reps));
};

export default function StatsView({ workouts }) {
  const stats = useMemo(() => {
    const data = {};
    let totalVolumeAll = 0;
    const muscleVolume = {};
    const dailyTonnage = {};

    workouts.forEach(w => {
      if (!data[w.exercise]) data[w.exercise] = { maxWeight: 0, totalVolume: 0, sessions: 0, history: [] };
      let sessionVolume = 0;
      let sessionMax = 0;

      let sessionMax1RM = 0;
      w.sets.forEach(set => {
        const volume = set.reps * set.weight;
        sessionVolume += volume;
        totalVolumeAll += volume;
        if (set.weight > data[w.exercise].maxWeight) data[w.exercise].maxWeight = set.weight;
        if (set.weight > sessionMax) sessionMax = set.weight;

        const oneRM = calculate1RM(set.weight, set.reps);
        if (oneRM > sessionMax1RM) sessionMax1RM = oneRM;
        if (!data[w.exercise].max1RM || oneRM > data[w.exercise].max1RM) {
          data[w.exercise].max1RM = oneRM;
        }

        // Muscle volume
        const muscles = w.primaryMuscles && w.primaryMuscles.length > 0 ? w.primaryMuscles : ['other'];
        muscles.forEach(m => {
          const translated = MUSCLE_TRANSLATIONS[m] || m;
          muscleVolume[translated] = (muscleVolume[translated] || 0) + volume;
        });
      });

      data[w.exercise].totalVolume += sessionVolume;
      dailyTonnage[w.date] = (dailyTonnage[w.date] || 0) + sessionVolume;
      data[w.exercise].sessions += 1;
      data[w.exercise].history.push({ date: w.date, maxWeight: sessionMax, max1RM: sessionMax1RM });
    });

    const topExercises = Object.entries(data)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .map(([name, stats]) => ({ name, ...stats }));

    const muscleData = Object.entries(muscleVolume)
      .sort((a, b) => b[1] - a[1])
      .map(([name, volume]) => ({ name, volume }));

    return { topExercises, totalVolumeAll, totalSessions: workouts.length, muscleData, dailyTonnage };
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <p>Недостаточно данных для статистики.</p>
      </div>
    );
  }

  const maxTonnage = Math.max(...Object.values(stats.dailyTonnage), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
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

      {stats.muscleData.length > 0 && (
        <div
          className="p-5 rounded-3xl border border-slate-100 shadow-sm"
          style={{ backgroundColor: 'var(--secondary-bg-color)' }}
        >
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Распределение объема</h2>
          {stats.totalVolumeAll > 0 ? (
            <PieChart data={stats.muscleData.slice(0, 5)} total={stats.totalVolumeAll} />
          ) : (
            <p className="text-xs text-slate-400">Нет данных для диаграммы</p>
          )}
        </div>
      )}

      <div
        className="p-5 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto"
        style={{ backgroundColor: 'var(--secondary-bg-color)' }}
      >
        <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Активность (Тоннаж)</h2>
        <div className="flex gap-1 min-w-max pb-2">
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            const dateStr = d.toISOString().split('T')[0];
            const tonnage = stats.dailyTonnage[dateStr] || 0;
            const intensity = tonnage > 0 ? Math.max(0.1, tonnage / maxTonnage) : 0;

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-sm transition-colors"
                  style={{
                    backgroundColor: tonnage > 0 ? `rgba(59, 130, 246, ${intensity})` : '#f1f5f9',
                    border: tonnage > 0 ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                  title={`${dateStr}: ${tonnage} кг`}
                ></div>
                <span className="text-[8px] text-slate-400 font-medium">
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4 ml-1" style={{ color: 'var(--text-color)' }}>Аналитика по упражнениям</h2>
        <div className="space-y-4">
          {stats.topExercises.map(ex => (
            <div
              key={ex.name}
              className="p-5 rounded-2xl border border-slate-100 shadow-sm"
              style={{ backgroundColor: 'var(--secondary-bg-color)' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold leading-tight" style={{ color: 'var(--text-color)' }}>{ex.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium whitespace-nowrap ml-2">
                  {ex.sessions} {getWorkoutWord(ex.sessions)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl border border-slate-100" style={{ backgroundColor: 'var(--bg-color)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--hint-color)' }}>Рекорд (вес)</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>{ex.maxWeight} <span className="text-xs font-normal" style={{ color: 'var(--hint-color)' }}>кг</span></p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100" style={{ backgroundColor: 'var(--bg-color)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--hint-color)' }}>1ПМ (Эпли)</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>{ex.max1RM} <span className="text-xs font-normal" style={{ color: 'var(--hint-color)' }}>кг</span></p>
                </div>
              </div>
              {ex.history.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-6">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-3">Прогресс 1ПМ (Эпли)</p>
                    <SimpleChart data={[...ex.history].sort((a, b) => new Date(a.date) - new Date(b.date))} valueKey="max1RM" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-3">Прогресс максимального веса</p>
                    <SimpleChart data={[...ex.history].sort((a, b) => new Date(a.date) - new Date(b.date))} valueKey="maxWeight" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}