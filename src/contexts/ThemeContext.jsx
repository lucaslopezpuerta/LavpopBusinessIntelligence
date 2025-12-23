// ThemeContext.jsx v1.1
// Manages dark/light theme and UI preferences with persistence
//
// FEATURES:
// - Light/Dark mode toggle
// - Dashboard layout preference (compact/expanded)
// - LocalStorage persistence
// - System preference detection
// - Context provider for global access
//
// CHANGELOG:
// v1.1 (2025-12-23): Added dashboardLayout preference for compact/expanded views
// v1.0 (2025-11-20): Initial theme context implementation

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('lavpop-theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  // Dashboard layout preference: 'compact' or 'expanded'
  const [dashboardLayout, setDashboardLayout] = useState(() => {
    return localStorage.getItem('lavpop-dashboard-layout') || 'compact';
  });

  // Persist dashboard layout to localStorage
  useEffect(() => {
    localStorage.setItem('lavpop-dashboard-layout', dashboardLayout);
  }, [dashboardLayout]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('lavpop-theme', theme);
    
    console.log('🎨 Theme changed to:', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('lavpop-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    dashboardLayout,
    setDashboardLayout,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
