
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light'; // Always resolves to actual applied theme
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'dark',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'taskcraft-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if ((localStorage.getItem(storageKey) as Theme) === 'system' || !localStorage.getItem(storageKey)) {
      return getSystemTheme();
    }
    return (localStorage.getItem(storageKey) as Theme) === 'dark' ? 'dark' : 'light';
  });

  // Update theme classes on mount and whenever theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    let appliedTheme: 'dark' | 'light';
    if (theme === 'system') {
      appliedTheme = getSystemTheme();
    } else {
      appliedTheme = theme;
    }

    // Remove both classes first, then add the resolved class
    root.classList.remove('dark', 'light');
    root.classList.add(appliedTheme);

    root.setAttribute('data-theme', appliedTheme);

    setResolvedTheme(appliedTheme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  // Listen to system changes if theme is "system"
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const sysTheme = getSystemTheme();
      const root = window.document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(sysTheme);
      root.setAttribute('data-theme', sysTheme);
      setResolvedTheme(sysTheme);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const value: ThemeProviderState = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
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
