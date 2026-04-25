import React, { useEffect } from 'react';
import { CalendarDays, BarChart3, Plus, Activity, FolderOpen, TrendingUp, Settings, FileText, LineChart } from 'lucide-react';
import WebApp from './lib/telegram';
import { logger } from './lib/logger';
import { useAuth } from './hooks/useAuth';
import { useUIStore } from './store/useUIStore';
import DiaryView from './components/DiaryView';
import ProgramsView from './components/ProgramsView';
import TemplatesView from './components/TemplatesView';
import AddWorkoutSessionView from './components/AddWorkoutSessionView';
import CreateProgramView from './components/CreateProgramView';
import StatsView from './components/StatsView';
import MuscleHeatmapView from './components/MuscleHeatmapView';
import WorkoutTimer from './components/WorkoutTimer';
import RestTimer from './components/RestTimer';

export default function App() {
  const { user, loading: authLoading, loginAsGuest } = useAuth();
  const activeTab = useUIStore(s => s.activeTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);
  const activeTemplate = useUIStore(s => s.activeTemplate);
  const setActiveTemplate = useUIStore(s => s.setActiveTemplate);
  const setTimerSeconds = useUIStore(s => s.setTimerSeconds);
  const setIsTimerRunning = useUIStore(s => s.setIsTimerRunning);

  useEffect(() => {
    logger.info('Initializing Telegram WebApp SDK...');
    if (WebApp) {
      if (typeof WebApp.expand === 'function') {
        WebApp.expand();
      }
      if (typeof WebApp.ready === 'function') {
        WebApp.ready();
      }
    }
  }, []);

  const startTimer = () => {
    setIsTimerRunning(true);
  };

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
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tg-bg p-8">
        <div className="w-full max-w-sm bg-tg-secondaryBg p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
           <div className="w-20 h-20 bg-tg-link/10 text-tg-link rounded-full flex items-center justify-center mb-6">
              <Activity size={40} />
           </div>
           <h1 className="text-2xl font-bold text-tg-text mb-2">Добро пожаловать</h1>
           <p className="text-sm text-tg-hint mb-8">Для работы приложения в обычном браузере необходимо войти в тестовый режим.</p>
           <button 
             onClick={loginAsGuest}
             className="w-full py-4 bg-tg-link text-white rounded-2xl font-bold mb-3 shadow-lg shadow-blue-100"
           >
             Войти как Тестер
           </button>
           <p className="text-[10px] text-tg-hint">Если вы разработчик, убедитесь что бэкенд запущен локально.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans pb-20 relative pl-safe pr-safe pt-safe bg-tg-bg text-tg-text overflow-hidden"
    >
      <main className="p-2 h-[calc(100vh-80px)] overflow-y-auto hide-scrollbar">
        {activeTab === 'diary' && <DiaryView />}
        {activeTab === 'template' && <TemplatesView />}
        {activeTab === 'progression' && <MuscleHeatmapView />}

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
            onSave={() => setActiveTab('template')}
            onCancel={() => setActiveTab('template')}
          />
        )}

        {activeTab === 'stats' && <StatsView />}
      </main>

      <WorkoutTimer />
      <RestTimer />

      <nav
        className="fixed bottom-0 w-full border-t border-tg-secondaryBg/10 flex justify-around items-stretch h-20 px-2 z-[110] pb-safe bg-[#121212]/90 backdrop-blur-2xl"
      >
        <NavButton icon={<CalendarDays size={22} />} label="Календарь" isActive={activeTab === 'diary'} onClick={() => setActiveTab('diary')} />
        <NavButton icon={<FileText size={22} />} label="Шаблон" isActive={activeTab === 'template'} onClick={() => setActiveTab('template')} />
        <NavButton icon={<BarChart3 size={22} />} label="Программа" isActive={activeTab === 'programs'} onClick={() => setActiveTab('programs')} />
        <NavButton icon={<LineChart size={22} />} label="Аналитика" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
        <NavButton icon={<Settings size={22} />} label="Настройки" isActive={activeTab === 'settings'} onClick={() => {}} />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all pt-1 ${isActive ? 'text-tg-link' : 'text-tg-hint'}`}>
      <div className="flex flex-col items-center justify-center gap-1">
        <div className={`${isActive ? 'scale-110 transition-transform' : 'opacity-70'}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      </div>
    </button>
  );
}


