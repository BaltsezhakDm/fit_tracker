import React from 'react';
import { FolderOpen, Plus, Play, Dumbbell } from 'lucide-react';
import SwipeToDelete from './SwipeToDelete';

const IMG_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function ProgramsView({ programs, onStart, onCreateNew, onDeleteProgram }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>Мои программы</h2>
        <button
          onClick={onCreateNew}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--link-color)' }}
        >
          <Plus size={16} /> Создать
        </button>
      </div>

      {programs.length === 0 ? (
        <div
          className="text-center py-10 rounded-3xl border border-slate-100 shadow-sm"
          style={{ backgroundColor: 'var(--secondary-bg-color)', color: 'var(--hint-color)' }}
        >
          <FolderOpen size={40} className="mx-auto mb-3 opacity-50" />
          <p>У вас еще нет программ.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map(prog => (
            <SwipeToDelete key={prog.id} onDelete={() => onDeleteProgram(prog.id)}>
              <div
                className="p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden"
                style={{ backgroundColor: 'var(--secondary-bg-color)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-color)' }}>{prog.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--hint-color)' }}>{prog.exercises.length} упражнений</p>
                  </div>
                  <div className="flex -space-x-3 overflow-hidden">
                    {prog.exercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden ring-2 ring-white">
                        {ex.images && ex.images.length > 0 ? (
                          <img
                            src={`${IMG_BASE_URL}${ex.images[0]}`}
                            alt={ex.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Dumbbell size={18} className="text-slate-200" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  {prog.exercises.slice(0, 3).map((ex, i) => (
                    <div key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                      <span className="truncate">{ex.name}</span>
                      <span className="text-xs ml-auto whitespace-nowrap" style={{ color: 'var(--hint-color)' }}>{ex.targetSets} × {ex.targetReps}</span>
                    </div>
                  ))}
                  {prog.exercises.length > 3 && (
                    <p className="text-xs italic" style={{ color: 'var(--hint-color)' }}>И еще {prog.exercises.length - 3}...</p>
                  )}
                </div>

                <button
                  onClick={() => onStart(prog)}
                  className="w-full py-3 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                  style={{ backgroundColor: 'var(--button-color)', color: 'var(--button-text-color)' }}
                >
                  <Play size={18} fill="currentColor" /> Начать тренировку
                </button>
              </div>
            </SwipeToDelete>
          ))}
        </div>
      )}
    </div>
  );
}