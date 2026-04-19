import React from 'react';
import { Play, Plus, FolderOpen, Info } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import SwipeToDelete from './SwipeToDelete';
import { logger } from '../lib/logger';

interface ProgramsViewProps {
  onStart: (program: any) => void;
  onCreateNew: () => void;
}

export default function ProgramsView({ onStart, onCreateNew }: ProgramsViewProps) {
  const { data: programs, isLoading } = usePrograms();

  if (isLoading) {
    return <div className="text-center py-20 text-tg-hint">Загрузка программ...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-tg-text">Мои программы</h2>
        <button
          onClick={onCreateNew}
          className="bg-tg-link text-white p-2 rounded-2xl shadow-lg shadow-blue-200 active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {!programs || programs.length === 0 ? (
        <div className="bg-tg-secondaryBg p-8 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
          <FolderOpen className="mx-auto mb-4 text-tg-hint opacity-20" size={64} />
          <h3 className="text-lg font-bold mb-2 text-tg-text">Нет созданных программ</h3>
          <p className="text-sm text-tg-hint mb-6">Создайте шаблон тренировки, чтобы не добавлять упражнения каждый раз вручную</p>
          <button
            onClick={onCreateNew}
            className="w-full py-4 bg-tg-link text-white rounded-2xl font-bold shadow-xl shadow-blue-100"
          >
            Создать программу
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <SwipeToDelete key={program.id} onDelete={() => logger.action('Deleting program', program)}>
              <div className="bg-tg-secondaryBg p-6 rounded-[2rem] shadow-sm border border-slate-50 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-tg-text mb-1">{program.name}</h3>
                      <p className="text-sm text-tg-hint">{program.description || 'Без описания'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        logger.action('Starting workout from program', program);
                        onStart(program);
                      }}
                      className="flex-1 bg-tg-link text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                    >
                      <Play size={18} fill="currentColor" /> Начать
                    </button>
                    <button className="bg-tg-bg text-tg-hint p-3 rounded-2xl hover:text-tg-text transition-colors">
                      <Info size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </SwipeToDelete>
          ))}
        </div>
      )}
    </div>
  );
}
