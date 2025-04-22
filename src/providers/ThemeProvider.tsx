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
  theme: 'dark', // Set initial state to dark
  setTheme: () => null,
  resolvedTheme: 'dark', // Set default resolved theme to dark
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'dark', // Change default to dark
  storageKey = 'taskcraft-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => 'dark' // Always initialize as dark
  );
  
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(
    () => 'dark' // Always initialize as dark
  );

  // Apply the theme to the document - always apply dark
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light');
    
    // Always add dark class
    root.classList.add('dark');
    
    // Update the resolved theme state
    setResolvedTheme('dark');
    
    // Apply a data attribute for components that need to reference the theme
    root.setAttribute('data-theme', 'dark');
    
    // Log for debugging
    console.log(`Theme enforced: dark`);
    console.log(`HTML classes: ${root.className}`);
  }, []);

  // Override system theme changes - always keep dark
  useEffect(() => {
    // Force dark theme when system theme changes    
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    setResolvedTheme('dark');
  }, []);

  // Always persist dark theme to local storage
  useEffect(() => {
    localStorage.setItem(storageKey, 'dark');
  }, [storageKey]);

  const value = {
    theme: 'dark' as Theme,
    setTheme: (theme: Theme) => {
      console.log(`Setting theme to: dark (ignoring ${theme})`);
      setTheme('dark');
    },
    resolvedTheme: 'dark',
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
