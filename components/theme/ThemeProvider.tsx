'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'parchment' | 'midnight' | 'forest' | 'rose';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'parchment',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('parchment');

  useEffect(() => {
    const stored = localStorage.getItem('folio-theme') as Theme | null;
    const initial = stored ?? 'parchment';
    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem('folio-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
