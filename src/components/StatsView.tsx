import React from 'react';
import { BarChart3, TrendingUp, Calendar, Zap, Award } from 'lucide-react';

export default function StatsView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-tg-text">Аналитика</h2>
        <Zap className="text-amber-400" fill="currentColor" size={24} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<TrendingUp className="text-green-500" />}
          label="Общий объем"
          value="42,500"
          unit="кг"
          trend="+12%"
        />
        <StatCard
          icon={<Calendar className="text-blue-500" />}
          label="Тренировок"
          value="18"
          unit="шт"
          trend="+2"
        />
      </div>

      <div className="bg-tg-secondaryBg p-6 rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-tg-bg rounded-xl flex items-center justify-center">
            <BarChart3 size={20} className="text-tg-link" />
          </div>
          <h3 className="font-bold text-tg-text text-lg">Распределение нагрузки</h3>
        </div>

        <div className="h-48 flex items-end justify-between gap-2 px-2">
           {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
             <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-tg-link rounded-t-lg transition-all duration-1000"
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[10px] font-bold text-tg-hint">Пн</span>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-tg-secondaryBg p-6 rounded-[2rem] shadow-sm border border-slate-50">
         <h3 className="font-bold text-tg-text mb-4">Рекорды</h3>
         <div className="space-y-3">
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
    <div className="bg-tg-secondaryBg p-5 rounded-3xl shadow-sm border border-slate-50">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-tg-bg rounded-xl">{icon}</div>
        <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-lg">{trend}</span>
      </div>
      <p className="text-xs font-medium text-tg-hint mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-tg-text">{value}</span>
        <span className="text-xs font-bold text-tg-hint">{unit}</span>
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
