// Backdrop.jsx v1.1 - GLASS MORPHISM
// Semi-transparent overlay for mobile sidebar drawer
//
// CHANGELOG:
// v1.1 (2026-01-07): Glass morphism enhancement
//   - Added backdrop-blur-sm for premium frosted glass effect
//   - Improved visual depth and polish
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
      className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
