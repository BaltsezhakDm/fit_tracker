import React from 'react';
import { Search, Plus, Lock, MoreHorizontal, TrendingUp } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { useUIStore } from '../store/useUIStore';

export default function TemplatesView() {
  const { data: programs, isLoading } = usePrograms();
  const setActiveTab = useUIStore(s => s.setActiveTab);

  if (isLoading) {
    return <div className="text-center py-10 text-tg-hint">Загрузка шаблонов...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 animate-in fade-in duration-500 bg-tg-bg px-4">
      <h1 className="text-2xl font-bold text-tg-text mt-4 mb-6">Шаблон</h1>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className="text-tg-hint" />
        </div>
        <input
          type="text"
          placeholder="Изучить шаблоны"
          className="w-full bg-[#1c1c1e] border-none rounded-2xl py-4 pl-12 pr-4 text-tg-text placeholder:text-tg-hint focus:ring-1 focus:ring-tg-link outline-none transition-all"
        />
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-tg-hint px-1 uppercase tracking-wider">Ваши шаблоны</h3>
        
        <div className="space-y-3">
          {programs?.map((program) => (
            <div 
              key={program.id}
              onClick={() => {
                useUIStore.getState().setActiveTemplate(program);
                setActiveTab('add');
              }}
              className="bg-[#1c1c1e] p-5 rounded-2xl active:scale-[0.98] transition-transform border border-white/5 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-tg-text">{program.name}</h4>
              </div>
              <p className="text-sm text-tg-hint line-clamp-2 leading-relaxed">
                {program.description || 'Нажмите, чтобы начать тренировку по этому шаблону'}
              </p>
            </div>
          ))}

          {(!programs || programs.length === 0) && (
            <div className="space-y-3">
               <TemplatePlaceholder title="Тренировка С (акцент на груди)" desc="Жим гантелей на наклонной скамье, Тяга верхнего блока узким хватом" />
               <TemplatePlaceholder title="В (плечи-спина)" desc="Армейский жим в тренажере, Подтягивания с поддержкой, Румынская тяга, Махи в сторон..." />
               <TemplatePlaceholder title="А (спина-грудь-ноги)" desc="Тяга верхнего блока широким хватом, Жим от груди сидя, Жим ногами, Махи на заднюю д..." />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-tg-hint py-4 opacity-50">
        <TrendingUp size={16} />
        <span className="text-sm font-medium">Ваш прогресс не ограничен.</span>
      </div>

      <button
        onClick={() => setActiveTab('createProgram')}
        className="fixed bottom-24 right-4 bg-tg-link text-white pl-4 pr-6 py-3.5 rounded-full font-bold flex items-center gap-2 shadow-2xl shadow-blue-500/40 active:scale-95 transition-all z-10"
      >
        <Plus size={24} />
        Создать
      </button>
    </div>
  );
}

function TemplatePlaceholder({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-white/5 opacity-80">
      <h4 className="text-lg font-bold text-tg-text mb-2">{title}</h4>
      <p className="text-sm text-tg-hint leading-relaxed">{desc}</p>
    </div>
  );
}
