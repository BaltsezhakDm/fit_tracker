import { create } from 'zustand';

interface UIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeTemplate: any | null;
  setActiveTemplate: (template: any | null) => void;
  timerSeconds: number;
  setTimerSeconds: (seconds: number | ((s: number) => number)) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (isRunning: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'diary',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeTemplate: null,
  setActiveTemplate: (template) => set({ activeTemplate: template }),
  timerSeconds: 0,
  setTimerSeconds: (seconds) =>
    set((state) => ({
      timerSeconds: typeof seconds === 'function' ? seconds(state.timerSeconds) : seconds
    })),
  isTimerRunning: false,
  setIsTimerRunning: (isRunning) => set({ isTimerRunning: isRunning }),
}));
