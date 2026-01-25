// SidebarContext.jsx v1.3 - MEMOIZED CONTEXT VALUE
// Context for managing sidebar expand/collapse and mobile drawer state
//
// CHANGELOG:
// v1.3 (2026-01-25): Performance optimization
//   - Memoized context value with useMemo (prevents consumer re-renders)
//   - Memoized toggle callbacks with useCallback
// v1.2 (2025-12-22): Debounced localStorage writes
//   - Added 500ms debounce to isPinned localStorage persistence
//   - Prevents multiple writes on rapid pin toggle clicks
// v1.1 (2025-12-17): Pin toggle support
//   - Added isPinned state with localStorage persistence
//   - When pinned, sidebar stays expanded (240px) on desktop
//   - When unpinned, sidebar collapses on mouse leave (60px)
//   - Preference persists across sessions
// v1.0 (2025-11-27): Initial implementation
//   - State management for sidebar hover expansion
//   - Mobile drawer state handling
//   - Provides context for IconSidebar, Backdrop, and MinimalTopBar

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';

const SidebarContext = createContext();

const STORAGE_KEY = 'bilavnova-sidebar-pinned';

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Pin state - persisted to localStorage
  const [isPinned, setIsPinned] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Persist pin state to localStorage with 500ms debounce
  useEffect(() => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save to prevent rapid writes
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, isPinned.toString());
      } catch {
        // Ignore localStorage errors
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isPinned]);

  // Memoized toggle callbacks to prevent recreation
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen(prev => !prev), []);
  const togglePinned = useCallback(() => setIsPinned(prev => !prev), []);

  // Memoized context value - only recreates when state actually changes
  const value = useMemo(() => ({
    isExpanded,
    setIsExpanded,
    isMobileOpen,
    setIsMobileOpen,
    isHovered,
    setIsHovered,
    isPinned,
    setIsPinned,
    toggleExpanded,
    toggleMobileSidebar,
    togglePinned
  }), [
    isExpanded,
    isMobileOpen,
    isHovered,
    isPinned,
    toggleExpanded,
    toggleMobileSidebar,
    togglePinned
  ]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
