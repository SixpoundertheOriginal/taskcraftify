
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
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(
    () => 'dark' // Always initialize as dark
  );

  // Force apply the dark theme to the document on mount
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing theme classes first
    root.classList.remove('light', 'dark');
    
    // Add dark class
    root.classList.add('dark');
    
    // Update the data attribute for components that reference the theme
    root.setAttribute('data-theme', 'dark');
    
    // Update our state
    setResolvedTheme('dark');
    setTheme('dark');
    
    // Store the theme preference
    localStorage.setItem(storageKey, 'dark');
    
    console.log(`Theme enforced: dark`);
    console.log(`HTML classes: ${root.className}`);
  }, []);

  // Create a MutationObserver to ensure dark mode stays applied
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Create a MutationObserver to monitor class changes on the HTML element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && !root.classList.contains('dark')) {
          console.log('Dark class was removed, adding it back');
          root.classList.add('dark');
        }
      });
    });
    
    // Start observing the HTML element for class changes
    observer.observe(root, { attributes: true });
    
    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, []);

  // Ensure dark theme is always persisted
  useEffect(() => {
    localStorage.setItem(storageKey, 'dark');
  }, [storageKey]);

  const value: ThemeProviderState = {
    theme: 'dark' as Theme,
    setTheme: (theme: Theme) => {
      console.log(`Setting theme to: dark (ignoring ${theme})`);
      setTheme('dark');
    },
    resolvedTheme: 'dark' as 'dark', // Explicitly typed as 'dark' literal type
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
