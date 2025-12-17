// SidebarContext.jsx v1.1 - PIN TOGGLE SUPPORT
// Context for managing sidebar expand/collapse and mobile drawer state
//
// CHANGELOG:
// v1.1 (2025-12-17): Pin toggle support
//   - Added isPinned state with localStorage persistence
//   - When pinned, sidebar stays expanded (240px) on desktop
//   - When unpinned, sidebar collapses on mouse leave (60px)
//   - Preference persists across sessions
// v1.0 (2025-11-27): Initial implementation
//   - State management for sidebar hover expansion
//   - Mobile drawer state handling
//   - Provides context for IconSidebar, Backdrop, and MinimalTopBar

import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

const STORAGE_KEY = 'lavpop-sidebar-pinned';

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

  // Pin state - persisted to localStorage
  const [isPinned, setIsPinned] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Persist pin state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isPinned.toString());
    } catch {
      // Ignore localStorage errors
    }
  }, [isPinned]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const togglePinned = () => setIsPinned(!isPinned);

  return (
    <SidebarContext.Provider
      value={{
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
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
