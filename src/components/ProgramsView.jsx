import React from 'react';
import { FolderOpen, Plus, Play } from 'lucide-react';
import SwipeToDelete from './SwipeToDelete';

export default function ProgramsView({ programs, onStart, onCreateNew, onDeleteProgram }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Мои программы</h2>
        <button onClick={onCreateNew} className="text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Plus size={16} /> Создать
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="text-center text-slate-400 py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-50" />
          <p>У вас еще нет программ.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map(prog => (
            <SwipeToDelete key={prog.id} onDelete={() => onDeleteProgram(prog.id)}>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <h3 className="font-bold text-lg text-slate-800 mb-1">{prog.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{prog.exercises.length} упражнений</p>

                <div className="space-y-2 mb-5">
                  {prog.exercises.slice(0, 3).map((ex, i) => (
                    <div key={i} className="text-sm text-slate-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                      <span className="truncate">{ex.name}</span>
                      <span className="text-slate-400 text-xs ml-auto whitespace-nowrap">{ex.targetSets} × {ex.targetReps}</span>
                    </div>
                  ))}
                  {prog.exercises.length > 3 && (
                    <p className="text-xs text-slate-400 italic">И еще {prog.exercises.length - 3}...</p>
                  )}
                </div>

                <button
                  onClick={() => onStart(prog)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
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