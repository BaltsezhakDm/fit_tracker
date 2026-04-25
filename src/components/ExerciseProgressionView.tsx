import React from 'react';
import { TrendingUp, X, Activity, Zap } from 'lucide-react';
import { useExerciseProgression } from '../hooks/useAnalytics';
import { useOneRMHistory } from '../hooks/useProgressionSuggestion';
import { useAuth } from '../hooks/useAuth';

interface ExerciseProgressionViewProps {
  exerciseId: number;
  exerciseName: string;
  onClose: () => void;
}

export default function ExerciseProgressionView({ exerciseId, exerciseName, onClose }: ExerciseProgressionViewProps) {
  const { user } = useAuth();
  const { data: progression, isLoading } = useExerciseProgression(user?.id || 0, exerciseId);
  const { data: oneRMHistory, isLoading: isLoadingRM } = useOneRMHistory(user?.id || null, exerciseId);

  if (isLoading || isLoadingRM) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Activity className="animate-spin text-tg-link" size={32} />
        <p className="text-tg-hint font-medium">Загрузка прогресса...</p>
      </div>
    );
  }

  // Используем 1RM данные из Supabase если есть, иначе макс вес из FastAPI
  const hasOneRMData = oneRMHistory && oneRMHistory.length > 0;
  const chartData = hasOneRMData
    ? oneRMHistory
    : (progression || []).map(p => ({ date: p.date, maxOneRM: p.max_weight, maxWeight: p.max_weight }));

  const maxVal = chartData.length ? Math.max(...chartData.map(p => p.maxOneRM || 0), 1) : 1;
  const latestRM = hasOneRMData ? oneRMHistory[oneRMHistory.length - 1]?.maxOneRM : null;
  const earliestRM = hasOneRMData ? oneRMHistory[0]?.maxOneRM : null;
  const rmGrowth = (latestRM && earliestRM && earliestRM > 0)
    ? Math.round(((latestRM - earliestRM) / earliestRM) * 1000) / 10
    : null;

  return (
    <div className="bg-tg-secondaryBg rounded-2xl p-4 border border-slate-100/10 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-tg-text">{exerciseName}</h3>
          <p className="text-xs text-tg-hint">
            {hasOneRMData ? 'Расчётный 1RM (Бржика)' : 'Макс. вес'}
          </p>
        </div>
        <button onClick={onClose} className="p-2 bg-tg-bg rounded-full text-tg-hint">
          <X size={20} />
        </button>
      </div>

      {/* Статы */}
      {latestRM && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-tg-bg p-3 rounded-xl">
            <p className="text-[10px] text-tg-hint mb-0.5">Текущий 1RM</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-tg-text">{latestRM}</span>
              <span className="text-xs text-tg-hint">кг</span>
            </div>
          </div>
          {rmGrowth !== null && (
            <div className="flex-1 bg-tg-bg p-3 rounded-xl">
              <p className="text-[10px] text-tg-hint mb-0.5">Прогресс</p>
              <div className={`flex items-baseline gap-1 ${rmGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span className="text-xl font-black">{rmGrowth > 0 ? '+' : ''}{rmGrowth}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* График */}
      <div className="bg-tg-bg p-4 rounded-xl mb-4">
        <div className="flex items-center gap-2 mb-3 text-tg-link">
          <Zap size={16} />
          <span className="font-bold text-sm">{hasOneRMData ? 'Динамика 1RM' : 'Динамика веса'}</span>
        </div>

        <div className="h-36 flex items-end justify-between gap-1 px-1">
          {chartData.map((point, i) => {
            const val = point.maxOneRM || 0;
            const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const dateStr = new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            const isLast = i === chartData.length - 1;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full">
                  {isLast && val > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-tg-link whitespace-nowrap">
                      {val}кг
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-700 min-h-[2px] ${isLast ? 'bg-tg-link' : 'bg-tg-link/50'}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${val} кг (${dateStr})`}
                  />
                </div>
                <span className="text-[6px] font-medium text-tg-hint truncate w-full text-center">{dateStr}</span>
              </div>
            );
          })}
          {chartData.length === 0 && (
            <div className="w-full flex items-center justify-center h-full text-tg-hint text-xs">
              История пуста
            </div>
          )}
        </div>
      </div>

      {/* Список записей */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-tg-hint px-1 uppercase tracking-wider">
          {hasOneRMData ? 'История 1RM' : 'Все записи'}
        </h4>
        {chartData.slice().reverse().slice(0, 8).map((point, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-tg-bg rounded-xl">
            <span className="text-sm font-medium text-tg-text">
              {new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </span>
            <div className="flex items-center gap-2">
              {hasOneRMData && (
                <span className="text-[10px] text-tg-hint font-medium">1RM</span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-tg-text">{point.maxOneRM}</span>
                <span className="text-[10px] text-tg-hint">кг</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
