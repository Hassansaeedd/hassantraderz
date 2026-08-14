// client/src/store/themeStore.js — Light/Dark Theme Switcher Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'dark', // 'dark' | 'light'

      toggleTheme: () => {
        const next = get().mode === 'dark' ? 'light' : 'dark';
        set({ mode: next });
        document.documentElement.setAttribute('data-theme', next);
      },

      setTheme: (mode) => {
        set({ mode });
        document.documentElement.setAttribute('data-theme', mode);
      },
    }),
    {
      name: 'theme-store',
    }
  )
);
