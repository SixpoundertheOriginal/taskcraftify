
import React, { createContext, useContext } from 'react';

type Theme = 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light';
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  resolvedTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Only allows light mode, ignores all dynamic changes
export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  // Enforce light on html
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    localStorage.setItem('taskcraft-theme', 'light');
  }

  const setTheme = () => {
    // noop, always light
  };

  const value: ThemeProviderState = {
    theme: 'light',
    setTheme,
    resolvedTheme: 'light',
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
