import React, { useState, useEffect } from 'react';
import { CalendarDays, BarChart3, Plus, Activity, FolderOpen } from 'lucide-react';
import { useAppData } from './hooks/useAppData';
import DiaryView from './components/DiaryView';
import ProgramsView from './components/ProgramsView';
import AddWorkoutSessionView from './components/AddWorkoutSessionView';
import CreateProgramView from './components/CreateProgramView';
import StatsView from './components/StatsView';
import WorkoutTimer from './components/WorkoutTimer';

export default function App() {
  const [activeTab, setActiveTab] = useState('diary'); // diary, programs, add, stats, createProgram
  const {
    workouts,
    programs,
    customExercises,
    isDbLoading,
    saveWorkoutSession,
    saveProgram,
    saveCustomExercise,
    deleteWorkout,
    deleteProgram,
    getMergedExercises,
    getProgressionAlerts,
    getGapAnalysis
  } = useAppData();

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  useEffect(() => {
    let intervalId;
    if (isTimerRunning) {
      intervalId = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(intervalId);
  }, [isTimerRunning]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  const handleSaveWorkoutSession = async (sessionExercises, date) => {
    await saveWorkoutSession(sessionExercises, date, timerSeconds);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setActiveTab('diary');
    setActiveTemplate(null);
  };

  const handleStartProgram = (program) => {
    setActiveTemplate(program);
    setActiveTab('add');
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const handleSaveProgram = async (newProgram) => {
    await saveProgram(newProgram);
    setActiveTab('programs');
  };

  if (isDbLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="flex flex-col items-center gap-3">
          <Activity className="animate-pulse" size={48} style={{ color: 'var(--link-color)' }} />
          <p className="font-medium animate-pulse" style={{ color: 'var(--hint-color)' }}>Синхронизация данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans pb-20 relative pl-safe pr-safe pt-safe"
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
    >
      <header
        className="backdrop-blur-md px-4 pt-4 pb-4 shadow-sm sticky top-0 z-10 flex justify-between items-center"
        style={{ backgroundColor: 'var(--secondary-bg-color)' }}
      >
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
          <Activity style={{ color: 'var(--link-color)' }} />
          FitTracker
        </h1>
      </header>

      <main className="p-4">
        {activeTab === 'diary' && <DiaryView workouts={workouts} onDeleteWorkout={deleteWorkout} />}

        {activeTab === 'programs' && (
          <ProgramsView
            programs={programs}
            onStart={handleStartProgram}
            onCreateNew={() => setActiveTab('createProgram')}
            onDeleteProgram={deleteProgram}
          />
        )}

        {activeTab === 'add' && (
          <AddWorkoutSessionView
            initialTemplate={activeTemplate}
            onSave={handleSaveWorkoutSession}
            workouts={workouts}
            customExercises={customExercises}
            saveCustomExercise={saveCustomExercise}
            getMergedExercises={getMergedExercises}
            onStartTimer={startTimer}
            getProgressionAlerts={getProgressionAlerts}
            getGapAnalysis={getGapAnalysis}
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
            onSave={handleSaveProgram}
            getMergedExercises={getMergedExercises}
            saveCustomExercise={saveCustomExercise}
            onCancel={() => setActiveTab('programs')}
          />
        )}

        {activeTab === 'stats' && <StatsView workouts={workouts} />}
      </main>

      <WorkoutTimer
        time={timerSeconds}
        setTime={setTimerSeconds}
        isRunning={isTimerRunning}
        setIsRunning={setIsTimerRunning}
      />

      <nav
        className="fixed bottom-0 w-full border-t border-slate-200 flex justify-around items-stretch h-20 px-2 z-20 pb-safe"
        style={{ backgroundColor: 'var(--secondary-bg-color)' }}
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

function NavButton({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-20 transition-colors pt-2 ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className="flex flex-col items-center justify-center">
        {icon}
        {label && <span className="text-[10px] mt-1 font-medium">{label}</span>}
      </div>
    </button>
  );
}