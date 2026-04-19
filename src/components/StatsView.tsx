import React, { useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Zap, Award, Loader2 } from 'lucide-react';
import { logger } from '../lib/logger';
import { useWorkouts } from '../hooks/useWorkouts';

export default function StatsView() {
  const { data: workouts, isLoading } = useWorkouts();

  useEffect(() => {
    logger.action('Viewing Statistics/Analytics');
  }, []);

  const stats = useMemo(() => {
    if (!workouts) return { count: 0 };
    return {
      count: workouts.length,
    };
  }, [workouts]);

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
          value="---"
          unit="кг"
          trend="0%"
        />
        <StatCard
          icon={<Calendar className="text-blue-500" size={18} />}
          label="Тренировок"
          value={stats.count.toString()}
          unit="шт"
          trend="Всего"
        />
      </div>

      <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-tg-bg rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-tg-link" />
          </div>
          <h3 className="font-bold text-tg-text text-base">Нагрузка</h3>
        </div>

        <div className="h-32 flex items-end justify-between gap-1.5 px-1">
           {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
             <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full bg-tg-link rounded-t-md transition-all duration-1000"
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[8px] font-bold text-tg-hint">Пн</span>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50">
         <h3 className="font-bold text-tg-text mb-3 text-base">Рекорды</h3>
         <div className="space-y-2">
            <RecordRow exercise="Жим лежа" weight="100 кг" date="3 дня назад" />
            <RecordRow exercise="Приседания" weight="140 кг" date="1 неделю назад" />
            <RecordRow exercise="Становая тяга" weight="160 кг" date="2 недели назад" />
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, trend }: any) {
  return (
    <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50">
      <div className="flex justify-between items-start mb-2">
        <div className="p-1.5 bg-tg-bg rounded-lg">{icon}</div>
        <span className="text-[8px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-md">{trend}</span>
      </div>
      <p className="text-[10px] font-medium text-tg-hint mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-tg-text">{value}</span>
        <span className="text-[10px] font-bold text-tg-hint">{unit}</span>
      </div>
    </div>
  );
}

function RecordRow({ exercise, weight, date }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-tg-bg rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
           <Award size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-tg-text">{exercise}</h4>
          <p className="text-[10px] text-tg-hint">{date}</p>
        </div>
      </div>
      <span className="text-sm font-black text-tg-link">{weight}</span>
    </div>
  );
}
