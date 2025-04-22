
// Design system constants
export const THEME_CONSTANTS = {
  // Font family settings
  fonts: {
    primary: 'Inter var, system-ui, sans-serif',
  },
  
  // Common spacing values for consistent UI
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    section: '2.5rem',
    card: '1.75rem',
  },
  
  // Typography scale
  typography: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  
  // Border radius values
  borderRadius: {
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  // Transition presets for consistent animations
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Elevation/shadow levels
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    sidebar: '0 0 15px rgba(0, 0, 0, 0.05), 0 0 4px rgba(0, 0, 0, 0.1)',
    'sidebar-dark': '0 0 10px rgba(0, 0, 0, 0.3)',
  },
  
  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Common UI gradients
export const GRADIENTS = {
  dark: 'linear-gradient(120deg, #221F26 0%, #403E43 100%)',
  darkGlass: 'linear-gradient(120deg, #181823 60%, #403E43 120%)',
  overlay: 'linear-gradient(180deg, rgba(34,31,38,0.95) 0%, rgba(64,62,67,0.85) 100%)',
};
