// ThemeContext.jsx v1.4 - GRACEFUL FALLBACK FOR PORTALS
// Manages dark/light theme and UI preferences with persistence
//
// FEATURES:
// - Light/Dark mode toggle
// - Dashboard layout preference (compact/expanded)
// - LocalStorage persistence
// - System preference detection
// - Context provider for global access
// - Native status bar style sync
// - Memoized context value (prevents unnecessary re-renders)
//
// CHANGELOG:
// v1.4 (2026-01-25): Graceful fallback for portals
//   - useTheme now returns defaults instead of throwing when outside provider
//   - Fixes crash on Android/Capacitor when portal renders before provider ready
//   - BottomNavBar uses createPortal which can race during initial render
// v1.3 (2026-01-25): Performance optimization
//   - Memoized context value with useMemo (prevents 82 consumers from re-rendering)
//   - Memoized toggleTheme callback with useCallback
// v1.2 (2025-12-26): Native status bar sync
//   - Updates status bar style when theme changes (light icons for dark, dark icons for light)
// v1.1 (2025-12-23): Added dashboardLayout preference for compact/expanded views
// v1.0 (2025-11-20): Initial theme context implementation

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { updateStatusBarForTheme } from '../utils/nativeStatusBar';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback for portals that render before provider is ready
    // This happens on Android/Capacitor when BottomNavBar's createPortal
    // mounts to document.body before ThemeProvider initializes
    return {
      theme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
      isDark: false,
      isLight: true,
      dashboardLayout: 'compact',
      setDashboardLayout: () => {},
    };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('bilavnova-theme');
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
    return localStorage.getItem('bilavnova-dashboard-layout') || 'compact';
  });

  // Persist dashboard layout to localStorage
  useEffect(() => {
    localStorage.setItem('bilavnova-dashboard-layout', dashboardLayout);
  }, [dashboardLayout]);

  // Apply theme to document root and native status bar
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('bilavnova-theme', theme);

    // Update native status bar style (no-op on web)
    // Light theme = dark status bar icons, Dark theme = light status bar icons
    updateStatusBarForTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('bilavnova-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Memoized toggle to prevent callback recreation
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Memoized context value - only recreates when dependencies actually change
  // This prevents all 82 useTheme() consumers from re-rendering unnecessarily
  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    dashboardLayout,
    setDashboardLayout,
  }), [theme, toggleTheme, dashboardLayout]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
