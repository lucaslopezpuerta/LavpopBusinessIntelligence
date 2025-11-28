// SidebarContext.jsx v1.0
// Context for managing sidebar expand/collapse and mobile drawer state
//
// CHANGELOG:
// v1.0 (2025-11-27): Initial implementation
//   - State management for sidebar hover expansion
//   - Mobile drawer state handling
//   - Provides context for IconSidebar, Backdrop, and MinimalTopBar

import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

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

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        isMobileOpen,
        setIsMobileOpen,
        isHovered,
        setIsHovered,
        toggleExpanded,
        toggleMobileSidebar
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
