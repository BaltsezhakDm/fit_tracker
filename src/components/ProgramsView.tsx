import React from 'react';
import { Play, Plus, FolderOpen, Info } from 'lucide-react';
import { usePrograms, useDeleteProgram } from '../hooks/usePrograms';
import SwipeToDelete from './SwipeToDelete';
import { logger } from '../lib/logger';
import WebApp from '../lib/telegram';

interface ProgramsViewProps {
  onStart: (program: any) => void;
  onCreateNew: () => void;
}

export default function ProgramsView({ onStart, onCreateNew }: ProgramsViewProps) {
  const { data: programs, isLoading } = usePrograms();
  const deleteProgramMutation = useDeleteProgram();

  if (isLoading) {
    return <div className="text-center py-10 text-tg-hint">Загрузка программ...</div>;
  }

  const handleDelete = (id: number) => {
    logger.action('Deleting program', { id });
    deleteProgramMutation.mutate(id, {
      onSuccess: () => {
        WebApp?.HapticFeedback?.notificationOccurred('success');
      },
      onError: () => {
        WebApp?.HapticFeedback?.notificationOccurred('error');
        alert('Ошибка при удалении программы');
      }
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-tg-text">Мои программы</h2>
        <button
          onClick={onCreateNew}
          className="bg-tg-link text-white p-2 rounded-xl shadow-lg shadow-blue-200 active:scale-90 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {!programs || programs.length === 0 ? (
        <div className="bg-tg-secondaryBg p-6 rounded-2xl text-center border border-slate-100">
          <FolderOpen className="mx-auto mb-4 text-tg-hint opacity-20" size={48} />
          <h3 className="text-base font-bold mb-2 text-tg-text">Нет созданных программ</h3>
          <p className="text-xs text-tg-hint mb-6 px-4">Создайте шаблон тренировки, чтобы не добавлять упражнения каждый раз вручную</p>
          <button
            onClick={onCreateNew}
            className="w-full py-3 bg-tg-link text-white rounded-xl font-bold shadow-lg shadow-blue-100"
          >
            Создать программу
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {programs.map((program) => (
            <SwipeToDelete key={program.id} onDelete={() => handleDelete(program.id)}>
              <div className="bg-tg-secondaryBg p-4 rounded-2xl shadow-sm border border-slate-50 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-tg-text mb-0.5">{program.name}</h3>
                      <p className="text-xs text-tg-hint line-clamp-1">{program.description || 'Без описания'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        logger.action('Starting workout from program', program);
                        onStart(program);
                      }}
                      className="flex-1 bg-tg-link text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
                    >
                      <Play size={16} fill="currentColor" /> Начать
                    </button>
                    <button className="bg-tg-bg text-tg-hint p-2.5 rounded-xl hover:text-tg-text transition-colors">
                      <Info size={18} />
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
