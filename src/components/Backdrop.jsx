// Backdrop.jsx v1.0
// Semi-transparent overlay for mobile sidebar drawer
//
// CHANGELOG:
// v1.0 (2025-11-27): Initial implementation
//   - Overlay backdrop for mobile drawer
//   - Dismisses drawer on click
//   - Only visible on mobile (lg:hidden)
//   - z-40 to sit between content and drawer (z-50)

import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
