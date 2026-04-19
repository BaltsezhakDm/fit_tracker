import React, { useEffect } from 'react';
import { CalendarDays, BarChart3, Plus, Activity, FolderOpen } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { logger } from './lib/logger';
import { useAuth } from './hooks/useAuth';
import { useUIStore } from './store/useUIStore';
import DiaryView from './components/DiaryView';
import ProgramsView from './components/ProgramsView';
import AddWorkoutSessionView from './components/AddWorkoutSessionView';
import CreateProgramView from './components/CreateProgramView';
import StatsView from './components/StatsView';
import WorkoutTimer from './components/WorkoutTimer';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const {
    activeTab,
    setActiveTab,
    activeTemplate,
    setActiveTemplate,
    timerSeconds,
    setTimerSeconds,
    isTimerRunning,
    setIsTimerRunning
  } = useUIStore();

  useEffect(() => {
    logger.info('Initializing Telegram WebApp SDK...');
    if (typeof WebApp.expand === 'function') {
      WebApp.expand();
    }
    if (typeof WebApp.ready === 'function') {
      WebApp.ready();
    }
  }, []);

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  useEffect(() => {
    let intervalId: number;
    if (isTimerRunning) {
      intervalId = setInterval(() => setTimerSeconds((s) => s + 1), 1000) as unknown as number;
    }
    return () => clearInterval(intervalId);
  }, [isTimerRunning, setTimerSeconds]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tg-bg">
        <div className="flex flex-col items-center gap-3">
          <Activity className="animate-pulse text-tg-link" size={48} />
          <p className="font-medium animate-pulse text-tg-hint">Синхронизация данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans pb-20 relative pl-safe pr-safe pt-safe bg-tg-bg text-tg-text"
    >
      <header
        className="backdrop-blur-md px-4 pt-4 pb-4 shadow-sm sticky top-0 z-10 flex justify-between items-center bg-tg-secondaryBg"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2 text-tg-text">
          <Activity className="text-tg-link" />
          FitTracker
        </h1>
      </header>

      <main className="p-4">
        {activeTab === 'diary' && <DiaryView />}

        {activeTab === 'programs' && (
          <ProgramsView
            onStart={(program) => {
              setActiveTemplate(program);
              setActiveTab('add');
              setTimerSeconds(0);
              setIsTimerRunning(true);
            }}
            onCreateNew={() => setActiveTab('createProgram')}
          />
        )}

        {activeTab === 'add' && (
          <AddWorkoutSessionView
            initialTemplate={activeTemplate}
            onSave={() => {
              setIsTimerRunning(false);
              setTimerSeconds(0);
              setActiveTab('diary');
              setActiveTemplate(null);
            }}
            onStartTimer={startTimer}
            onCancel={() => {
              setActiveTab('diary');
              setActiveTemplate(null);
              setIsTimerRunning(false);
              setTimerSeconds(0);
            }}
          />
        )}

        {activeTab === 'createProgram' && (
          <CreateProgramView
            onSave={() => setActiveTab('programs')}
            onCancel={() => setActiveTab('programs')}
          />
        )}

        {activeTab === 'stats' && <StatsView />}
      </main>

      <WorkoutTimer
        time={timerSeconds}
        setTime={setTimerSeconds}
        isRunning={isTimerRunning}
        setIsRunning={setIsTimerRunning}
      />

      <nav
        className="fixed bottom-0 w-full border-t border-slate-200 flex justify-around items-stretch h-20 px-2 z-20 pb-safe bg-tg-secondaryBg"
      >
        <NavButton icon={<CalendarDays size={22} />} label="Дневник" isActive={activeTab === 'diary'} onClick={() => setActiveTab('diary')} />
        <NavButton icon={<FolderOpen size={22} />} label="Программы" isActive={activeTab === 'programs'} onClick={() => setActiveTab('programs')} />
        <NavButton
          icon={<div className="bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-200 transform -translate-y-4"><Plus size={24} /></div>}
          label=""
          isActive={activeTab === 'add' || activeTab === 'createProgram'}
          onClick={() => { setActiveTemplate(null); setActiveTab('add'); }}
        />
        <NavButton icon={<BarChart3 size={22} />} label="Статистика" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-20 transition-colors pt-2 ${isActive ? 'text-tg-link' : 'text-tg-hint hover:text-tg-text'}`}>
      <div className="flex flex-col items-center justify-center">
        {icon}
        {label && <span className="text-[10px] mt-1 font-medium">{label}</span>}
      </div>
    </button>
  );
}
