import { create } from 'zustand';

interface LoadingState {
  activeRequests: number;
  startLoading: () => void;
  stopLoading: () => void;
  resetLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  activeRequests: 0,
  startLoading: () =>
    set((state) => ({ activeRequests: state.activeRequests + 1 })),
  stopLoading: () =>
    set((state) => ({
      activeRequests: Math.max(0, state.activeRequests - 1),
    })),
  resetLoading: () => set({ activeRequests: 0 }),
}));

