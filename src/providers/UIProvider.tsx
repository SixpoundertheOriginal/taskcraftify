
import React, { createContext, useContext, useState, useEffect } from 'react';

type UIPreferences = {
  defaultView: 'list' | 'kanban' | 'groups';
  compactMode: boolean;
  fontScale: number;
  sidebarCollapsed: boolean;
};

type UIProviderState = {
  preferences: UIPreferences;
  updatePreferences: (updates: Partial<UIPreferences>) => void;
  resetPreferences: () => void;
};

const defaultPreferences: UIPreferences = {
  defaultView: 'list',
  compactMode: false,
  fontScale: 100,
  sidebarCollapsed: false,
};

const UIContext = createContext<UIProviderState | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences);
  const [initialized, setInitialized] = useState(false);
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const storedPrefs = localStorage.getItem('taskcraft-ui-preferences');
    
    if (storedPrefs) {
      try {
        const parsedPrefs = JSON.parse(storedPrefs);
        setPreferences({
          ...defaultPreferences,
          ...parsedPrefs,
        });
      } catch (error) {
        console.error('Failed to parse stored UI preferences', error);
      }
    } else {
      // Handle individual preference items for backward compatibility
      const view = localStorage.getItem('taskcraft-default-view');
      const compact = localStorage.getItem('taskcraft-compact-view');
      const fontSize = localStorage.getItem('taskcraft-font-scale');
      const sidebar = localStorage.getItem('taskcraft-sidebar-collapsed');
      
      setPreferences({
        defaultView: view === 'kanban' || view === 'groups' ? view : 'list',
        compactMode: compact === 'true',
        fontScale: fontSize ? parseInt(fontSize) : 100,
        sidebarCollapsed: sidebar === 'true',
      });
    }
    
    setInitialized(true);
  }, []);
  
  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('taskcraft-ui-preferences', JSON.stringify(preferences));
      
      // Apply font scale to root element
      document.documentElement.style.fontSize = `${preferences.fontScale}%`;
      
      // Apply compact mode class
      if (preferences.compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }
    }
  }, [preferences, initialized]);
  
  const updatePreferences = (updates: Partial<UIPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  };
  
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('taskcraft-ui-preferences');
  };
  
  const value = {
    preferences,
    updatePreferences,
    resetPreferences,
  };
  
  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  
  return context;
};
