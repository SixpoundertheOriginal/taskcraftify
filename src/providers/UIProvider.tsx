
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
  // New helper methods
  toggleCompactMode: () => void;
  toggleSidebar: () => void;
  setFontScale: (scale: number) => void;
  setDefaultView: (view: 'list' | 'kanban' | 'groups') => void;
};

const defaultPreferences: UIPreferences = {
  defaultView: 'list',
  compactMode: false,
  fontScale: 100,
  sidebarCollapsed: false,
};

const STORAGE_KEY = 'taskcraft-ui-preferences';

const UIContext = createContext<UIProviderState | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences);
  const [initialized, setInitialized] = useState(false);
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const storedPrefs = localStorage.getItem(STORAGE_KEY);
        
        if (storedPrefs) {
          const parsedPrefs = JSON.parse(storedPrefs);
          setPreferences({
            ...defaultPreferences,
            ...parsedPrefs,
          });
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
          
          // Migrate old preferences to the new format
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            defaultView: view === 'kanban' || view === 'groups' ? view : 'list',
            compactMode: compact === 'true',
            fontScale: fontSize ? parseInt(fontSize) : 100,
            sidebarCollapsed: sidebar === 'true',
          }));
          
          // Clean up old storage keys after migration
          localStorage.removeItem('taskcraft-default-view');
          localStorage.removeItem('taskcraft-compact-view');
          localStorage.removeItem('taskcraft-font-scale');
          localStorage.removeItem('taskcraft-sidebar-collapsed');
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Failed to load UI preferences', error);
        setInitialized(true);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Apply preferences whenever they change
  useEffect(() => {
    if (initialized) {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      
      // Apply font scale to root element
      document.documentElement.style.fontSize = `${preferences.fontScale}%`;
      
      // Apply compact mode class
      if (preferences.compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }
      
      // Apply sidebar collapsed class
      if (preferences.sidebarCollapsed) {
        document.documentElement.classList.add('sidebar-collapsed');
      } else {
        document.documentElement.classList.remove('sidebar-collapsed');
      }
    }
  }, [preferences, initialized]);
  
  // Update specific preferences
  const updatePreferences = (updates: Partial<UIPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  };
  
  // Reset all preferences to defaults
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  };
  
  // Helper methods for common actions
  const toggleCompactMode = () => {
    setPreferences(prev => ({
      ...prev,
      compactMode: !prev.compactMode
    }));
  };
  
  const toggleSidebar = () => {
    setPreferences(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  };
  
  const setFontScale = (scale: number) => {
    setPreferences(prev => ({
      ...prev,
      fontScale: scale
    }));
  };
  
  const setDefaultView = (view: 'list' | 'kanban' | 'groups') => {
    setPreferences(prev => ({
      ...prev,
      defaultView: view
    }));
  };
  
  const value = {
    preferences,
    updatePreferences,
    resetPreferences,
    toggleCompactMode,
    toggleSidebar,
    setFontScale,
    setDefaultView
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
