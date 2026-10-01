import * as React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'advaisor.theme' },
  ),
);

const systemPrefersDark = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return systemPrefersDark() ? 'dark' : 'light';
  }
  return theme;
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle(
    'dark',
    resolveTheme(theme) === 'dark',
  );
};

if (typeof window.matchMedia === 'function') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      applyTheme(useThemeStore.getState().theme);
    });
}

export const useThemeEffect = () => {
  const theme = useThemeStore((state) => state.theme);
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);
};
