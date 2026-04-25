import React, { useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Zap, Award, Loader2 } from 'lucide-react';
import { logger } from '../lib/logger';
import { useAnalyticsSummary, useWorkload, usePersonalRecords } from '../hooks/useAnalytics';
import ExerciseProgressionView from './ExerciseProgressionView';

export default function StatsView() {
  const { data: summary, isLoading: isLoadingSummary } = useAnalyticsSummary();
  const { data: workload, isLoading: isLoadingWorkload } = useWorkload('week');
  const { data: records, isLoading: isLoadingRecords } = usePersonalRecords();
  const [selectedExercise, setSelectedExercise] = React.useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    logger.action('Viewing Statistics/Analytics');
  }, []);

  const isLoading = isLoadingSummary || isLoadingWorkload || isLoadingRecords;

  if (selectedExercise) {
    return (
      <ExerciseProgressionView 
        exerciseId={selectedExercise.id} 
        exerciseName={selectedExercise.name} 
        onClose={() => setSelectedExercise(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-tg-link" size={32} />
        <p className="text-tg-hint font-medium">Загрузка статистики...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-tg-text">Аналитика</h2>
        <Zap className="text-amber-400" fill="currentColor" size={20} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp className="text-green-500" size={18} />}
          label="Общий объем"
          value={summary?.total_volume.toLocaleString() || '0'}
          unit="кг"
          trend={`${summary?.last_week_volume_change_percent.toFixed(1) || 0}%`}
          trendUp={summary ? summary.last_week_volume_change_percent >= 0 : true}
        />
        <StatCard
          icon={<Calendar className="text-blue-500" size={18} />}
          label="Тренировок"
          value={summary?.workouts_count.toString() || '0'}
          unit="шт"
          trend="Всего"
          trendUp={true}
        />
      </div>

      <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-tg-bg rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-tg-link" />
          </div>
          <h3 className="font-bold text-tg-text text-base">Нагрузка (пред. 7 дней)</h3>
        </div>

        <div className="h-32 flex items-end justify-between gap-1.5 px-1">
           {workload?.map((day, i) => {
             const maxVolume = Math.max(...workload.map(d => d.volume), 1);
             const height = (day.volume / maxVolume) * 100;
             const dayName = new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short' });
             
             return (
               <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full bg-tg-link rounded-t-md transition-all duration-1000 min-h-[4px]"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.volume} кг`}
                  ></div>
                  <span className="text-[8px] font-bold text-tg-hint uppercase">{dayName}</span>
               </div>
             );
           })}
           {(!workload || workload.length === 0) && (
             <div className="w-full flex items-center justify-center h-full text-tg-hint text-xs">
               Нет данных за неделю
             </div>
           )}
        </div>
      </div>

      <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50">
         <h3 className="font-bold text-tg-text mb-3 text-base">Личные рекорды</h3>
         <div className="space-y-2">
            {records?.slice(0, 5).map((record, i) => (
              <RecordRow 
                key={i}
                exercise={record.exercise_name} 
                weight={`${record.weight} кг`} 
                date={new Date(record.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} 
                onClick={() => setSelectedExercise({id: record.exercise_id, name: record.exercise_name})}
              />
            ))}
            {(!records || records.length === 0) && (
              <p className="text-center py-4 text-tg-hint text-sm">Рекорды пока не установлены</p>
            )}
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, trend, trendUp }: any) {
  return (
    <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50">
      <div className="flex justify-between items-start mb-2">
        <div className="p-1.5 bg-tg-bg rounded-lg">{icon}</div>
        <span className={`text-[8px] font-bold ${trendUp ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-1.5 py-0.5 rounded-md`}>
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-medium text-tg-hint mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-tg-text">{value}</span>
        <span className="text-[10px] font-bold text-tg-hint">{unit}</span>
      </div>
    </div>
  );
}

function RecordRow({ exercise, weight, date, onClick }: any) {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-tg-bg rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
           <Award size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-tg-text truncate max-w-[120px]">{exercise}</h4>
          <p className="text-[10px] text-tg-hint">{date}</p>
        </div>
      </div>
      <span className="text-sm font-black text-tg-link">{weight}</span>
    </div>
  );
}
