
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
  resolvedTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'taskcraft-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(
    () => getSystemTheme()
  );

  // Helper to get system theme
  function getSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  
  // Apply the theme to the document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Determine which theme to apply
    let appliedTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      appliedTheme = getSystemTheme();
    } else {
      appliedTheme = theme as 'light' | 'dark';
    }
    
    // Apply the theme class
    root.classList.add(appliedTheme);
    
    // Update the resolved theme state
    setResolvedTheme(appliedTheme);
    
    // Force re-render of styled components by applying a data attribute
    root.setAttribute('data-theme', appliedTheme);
    
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newResolvedTheme = getSystemTheme();
      const root = window.document.documentElement;
      
      root.classList.remove('light', 'dark');
      root.classList.add(newResolvedTheme);
      root.setAttribute('data-theme', newResolvedTheme);
      setResolvedTheme(newResolvedTheme);
    };
    
    // Initial call to set correct class
    handleChange();
    
    // Add listener for theme changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Persist theme to local storage
  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
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
