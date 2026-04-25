import React, { useState } from 'react';
import { Activity, AlertCircle, TrendingUp, BrainCircuit, Flame, ChevronRight } from 'lucide-react';
import { useMuscleDistribution, useMuscleLoadPercent, useDeloadTrigger } from '../hooks/useAnalytics';
import { MUSCLE_TRANSLATIONS } from '../constants';
import { getMRVColor, muscleLabel } from '../lib/engine';
import { useAuth } from '../hooks/useAuth';

const MAIN_MUSCLES = [
  { key: 'chest', icon: '🫁' },
  { key: 'lats', icon: '🏋️' },
  { key: 'middle_back', icon: '🔙' },
  { key: 'lower_back', icon: '🦴' },
  { key: 'quadriceps', icon: '🦵' },
  { key: 'hamstrings', icon: '🦵' },
  { key: 'glutes', icon: '🍑' },
  { key: 'shoulders', icon: '🏔️' },
  { key: 'front_delt', icon: '💫' },
  { key: 'side_delt', icon: '↔️' },
  { key: 'biceps', icon: '💪' },
  { key: 'triceps', icon: '🔱' },
  { key: 'abdominals', icon: '🎯' },
];

export default function MuscleHeatmapView() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [period, setPeriod] = useState<7 | 14>(7);

  // Умная нагрузка через Supabase + engine
  const { data: smartLoad, isLoading: isLoadingSmart } = useMuscleLoadPercent(userId, period);
  // Deload анализ
  const { data: deload } = useDeloadTrigger(userId);
  // Старые данные (FastAPI) как фолбэк
  const { data: legacyDist, isLoading: isLoadingLegacy } = useMuscleDistribution('week');

  const isLoading = isLoadingSmart && isLoadingLegacy;

  // Получаем процент нагрузки: приоритет — умные данные из Supabase
  const getMusclePercent = (key: string): number => {
    if (smartLoad && Object.keys(smartLoad).length > 0) {
      return smartLoad[key]?.percentOfMRV || 0;
    }
    // Фолбэк: старые данные (sets_count → приблизительный %)
    const legacy = legacyDist?.find(d => d.muscle === key);
    return legacy ? Math.min(Math.round((legacy.sets_count / 20) * 100), 120) : 0;
  };

  const hasSmartData = smartLoad && Object.keys(smartLoad).length > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BrainCircuit className="animate-pulse text-tg-link" size={40} />
        <p className="text-tg-hint font-medium text-sm">Анализируем нагрузку...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">

      {/* Deload Alert */}
      {deload?.shouldDeload && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex gap-3">
          <Flame className="text-orange-400 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-orange-400 text-sm mb-1">Рекомендуется Deload</p>
            <p className="text-xs text-orange-300/80">{deload.reason}</p>
          </div>
        </div>
      )}

      {/* Заголовок + период */}
      <div className="bg-tg-secondaryBg p-5 rounded-[2rem] border border-slate-100/10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-black text-tg-text">Карта нагрузки</h2>
            <p className="text-xs text-tg-hint">% от недельного MRV (норма: 20 сетов)</p>
          </div>
          <div className="flex gap-1 bg-tg-bg rounded-xl p-1">
            {([7, 14] as const).map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  period === d ? 'bg-tg-link text-white' : 'text-tg-hint'
                }`}
              >
                {d}д
              </button>
            ))}
          </div>
        </div>

        {!hasSmartData && (
          <div className="flex items-center gap-2 mb-3 px-2 py-2 bg-tg-bg rounded-xl text-xs text-tg-hint">
            <AlertCircle size={14} className="shrink-0" />
            <span>Умная аналитика появится после первой тренировки с подсказками</span>
          </div>
        )}

        {/* Прогрессбары мышц */}
        <div className="space-y-2.5">
          {MAIN_MUSCLES.map(({ key, icon }) => {
            const percent = getMusclePercent(key);
            if (percent === 0 && !hasSmartData) return null;
            const color = getMRVColor(percent);
            const label = muscleLabel(key) || (MUSCLE_TRANSLATIONS as any)[key] || key;

            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{icon}</span>
                    <span className="text-xs font-bold text-tg-text">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${color.text}`}>{color.label}</span>
                    <span className="text-xs font-black text-tg-text w-8 text-right">{percent}%</span>
                  </div>
                </div>
                <div className="h-2 bg-tg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: color.bar,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Если нет данных вообще */}
          {MAIN_MUSCLES.every(({ key }) => getMusclePercent(key) === 0) && (
            <div className="text-center py-6">
              <AlertCircle className="mx-auto mb-2 text-tg-hint opacity-30" size={32} />
              <p className="text-sm text-tg-hint">Нет тренировок за {period} дней</p>
            </div>
          )}
        </div>
      </div>

      {/* Легенда */}
      <div className="bg-tg-secondaryBg p-4 rounded-2xl border border-slate-100/10">
        <h3 className="text-xs font-black text-tg-hint uppercase tracking-wider mb-3">Легенда</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { range: '0–30%', label: 'Недогрузка', color: '#22c55e' },
            { range: '30–60%', label: 'Нормально', color: '#4ade80' },
            { range: '60–80%', label: 'Оптимально', color: '#facc15' },
            { range: '80–100%', label: 'Высокая', color: '#f97316' },
            { range: '>100%', label: 'Перегрузка', color: '#ef4444' },
          ].map(item => (
            <div key={item.range} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-tg-hint">
                <span className="font-bold text-tg-text">{item.range}</span> — {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Рекомендации */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-tg-text flex items-center gap-2 px-1">
          <Activity className="text-tg-link" size={18} />
          Smart Рекомендации
        </h3>

        {hasSmartData ? (
          Object.entries(smartLoad)
            .filter(([, data]) => data.percentOfMRV > 0)
            .sort(([, a], [, b]) => b.percentOfMRV - a.percentOfMRV)
            .slice(0, 5)
            .map(([muscle, data]) => {
              const color = getMRVColor(data.percentOfMRV);
              let tip = '';
              if (data.percentOfMRV < 30) tip = `Мышца "${muscleLabel(muscle)}" почти не нагружена. Добавьте изолирующее упражнение.`;
              else if (data.percentOfMRV < 80) tip = `Хорошая нагрузка на "${muscleLabel(muscle)}": ${data.effectiveSets} эфф. сетов.`;
              else if (data.percentOfMRV < 100) tip = `Высокая нагрузка на "${muscleLabel(muscle)}". Следите за восстановлением.`;
              else tip = `Перегрузка "${muscleLabel(muscle)}"! ${data.percentOfMRV}% от MRV. Рекомендуется снизить объём.`;

              return (
                <div key={muscle} className="bg-tg-secondaryBg p-4 rounded-2xl border border-slate-100/10 flex gap-3">
                  <div className={`p-2 rounded-xl shrink-0 h-fit ${color.bg}`}>
                    <TrendingUp size={14} className={color.text} />
                  </div>
                  <p className="text-sm text-tg-text leading-relaxed">{tip}</p>
                </div>
              );
            })
        ) : (
          legacyDist?.filter(d => d.sets_count > 0).slice(0, 4).map(d => {
            const name = (MUSCLE_TRANSLATIONS as any)[d.muscle] || d.muscle;
            return (
              <div key={d.muscle} className="bg-tg-secondaryBg p-4 rounded-2xl border border-slate-100/10 flex gap-3">
                <div className="p-2 rounded-xl bg-tg-bg shrink-0">
                  <Activity size={14} className="text-tg-link" />
                </div>
                <p className="text-sm text-tg-text">{name}: {d.sets_count} подходов на неделе</p>
              </div>
            );
          }) || (
            <div className="bg-tg-bg border border-slate-100/10 p-4 rounded-2xl flex gap-3">
              <AlertCircle className="text-tg-hint shrink-0" size={20} />
              <p className="text-sm text-tg-hint">На этой неделе ещё не было тренировок</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
