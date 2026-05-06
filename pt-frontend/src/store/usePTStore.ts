// PT Zustand Store — placeholder
// TODO: Implement full store in Day 5

import { create } from 'zustand';

interface PTState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const usePTStore = create<PTState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
