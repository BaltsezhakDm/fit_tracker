import { create } from 'zustand';
import { logger } from '../lib/logger';

interface UIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeTemplate: any | null;
  setActiveTemplate: (template: any | null) => void;
  timerSeconds: number;
  setTimerSeconds: (seconds: number | ((s: number) => number)) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (isRunning: boolean) => void;
  // Rest Timer
  restTimerSeconds: number;
  isRestTimerActive: boolean;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  setRestTimerSeconds: (seconds: number | ((s: number) => number)) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'diary',
  setActiveTab: (tab) => {
    logger.action(`UI: Switch to tab "${tab}"`);
    set({ activeTab: tab });
  },
  activeTemplate: null,
  setActiveTemplate: (template) => {
    logger.action(`UI: Set active template`, template);
    set({ activeTemplate: template });
  },
  timerSeconds: 0,
  setTimerSeconds: (seconds) =>
    set((state) => {
      const newSeconds = typeof seconds === 'function' ? seconds(state.timerSeconds) : seconds;
      return { timerSeconds: newSeconds };
    }),
  isTimerRunning: false,
  setIsTimerRunning: (isRunning) => {
    logger.action(`UI: ${isRunning ? 'Start' : 'Stop'} timer`);
    set({ isTimerRunning: isRunning });
  },
  // Rest Timer
  restTimerSeconds: 0,
  isRestTimerActive: false,
  setRestTimerSeconds: (seconds) =>
    set((state) => {
      const newSeconds = typeof seconds === 'function' ? seconds(state.restTimerSeconds) : seconds;
      return { restTimerSeconds: newSeconds };
    }),
  startRestTimer: (seconds) => {
    logger.action(`UI: Start rest timer for ${seconds}s`);
    set({ restTimerSeconds: seconds, isRestTimerActive: true });
  },
  stopRestTimer: () => {
    logger.action(`UI: Stop rest timer`);
    set({ restTimerSeconds: 0, isRestTimerActive: false });
  },
}));
