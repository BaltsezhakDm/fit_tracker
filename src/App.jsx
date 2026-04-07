import React, { useState, useEffect } from 'react';
import { CalendarDays, BarChart3, Plus, Activity, FolderOpen } from 'lucide-react';
import { useAppData } from './hooks/useAppData';
import DiaryView from './components/DiaryView';
import ProgramsView from './components/ProgramsView';
import AddWorkoutSessionView from './components/AddWorkoutSessionView';
import CreateProgramView from './components/CreateProgramView';
import StatsView from './components/StatsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('diary'); // diary, programs, add, stats, createProgram
  const { workouts, programs, isDbLoading, saveWorkoutSession, saveProgram } = useAppData();

  const [activeTemplate, setActiveTemplate] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  const handleSaveWorkoutSession = async (sessionExercises, date) => {
    await saveWorkoutSession(sessionExercises, date);
    setActiveTab('diary');
    setActiveTemplate(null);
  };

  const handleStartProgram = (program) => {
    setActiveTemplate(program);
    setActiveTab('add');
  };

  const handleSaveProgram = async (newProgram) => {
    await saveProgram(newProgram);
    setActiveTab('programs');
  };

  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="text-blue-500 animate-pulse" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">Синхронизация данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 selection:bg-blue-200 relative">
      <header className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-blue-500" />
          FitTracker
        </h1>
      </header>

      <main className="p-4">
        {activeTab === 'diary' && <DiaryView workouts={workouts} />}

        {activeTab === 'programs' && (
          <ProgramsView
            programs={programs}
            onStart={handleStartProgram}
            onCreateNew={() => setActiveTab('createProgram')}
          />
        )}

        {activeTab === 'add' && (
          <AddWorkoutSessionView
            initialTemplate={activeTemplate}
            onSave={handleSaveWorkoutSession}
            onCancel={() => { setActiveTab('diary'); setActiveTemplate(null); }}
          />
        )}

        {activeTab === 'createProgram' && (
          <CreateProgramView
            onSave={handleSaveProgram}
            onCancel={() => setActiveTab('programs')}
          />
        )}

        {activeTab === 'stats' && <StatsView workouts={workouts} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-20 pb-safe">
        <NavButton icon={<CalendarDays size={22} />} label="Дневник" isActive={activeTab === 'diary'} onClick={() => setActiveTab('diary')} />
        <NavButton icon={<FolderOpen size={22} />} label="Программы" isActive={activeTab === 'programs'} onClick={() => setActiveTab('programs')} />
        <NavButton
          icon={<div className="bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-200 transform -translate-y-2"><Plus size={24} /></div>}
          label=""
          isActive={activeTab === 'add' || activeTab === 'createProgram'}
          onClick={() => { setActiveTemplate(null); setActiveTab('add'); }}
        />
        <NavButton icon={<BarChart3 size={22} />} label="Статистика" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-20 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
      {icon}
      {label && <span className="text-[10px] mt-1 font-medium">{label}</span>}
    </button>
  );
}