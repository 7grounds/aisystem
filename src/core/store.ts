import { create } from "zustand";

type ProgressState = {
  totalTasks: number;
  completedTasks: number;
  setTotalTasks: (totalTasks: number) => void;
  setCompletedTasks: (completedTasks: number) => void;
};

export const useProgressStore = create<ProgressState>((set) => ({
  totalTasks: 0,
  completedTasks: 0,
  setTotalTasks: (totalTasks) => set({ totalTasks }),
  setCompletedTasks: (completedTasks) => set({ completedTasks }),
}));
