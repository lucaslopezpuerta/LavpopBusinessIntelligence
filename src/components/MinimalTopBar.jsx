// MinimalTopBar.jsx v3.5 - THEME TOGGLE DESKTOP ONLY
// Modern top bar with discreet hover-expandable actions
//
// CHANGELOG:
// v3.5 (2025-12-22): Theme toggle hidden on mobile
//   - ThemeToggle now desktop-only (lg+)
//   - Mobile uses ThemeToggle in IconSidebar drawer footer
// v3.4 (2025-12-22): Mobile uses click+haptics, desktop uses hover
//   - Desktop (lg+): Hover to expand dropdowns
//   - Mobile: Click/tap with haptic feedback
//   - Uses pointer: coarse media query to detect touch devices
// v3.3 (2025-12-22): Removed hamburger menu
//   - Removed redundant hamburger button (BottomNavBar "Mais" handles sidebar)
//   - Cleaner mobile layout with more space for Weather + Location
//   - Removed unused activeTab prop and useSidebar import
// v3.2 (2025-12-22): Fixed hover menus + reorder controls
//   - FIXED: Menus now properly close when mouse leaves
//   - Keyboard shortcuts moved to last position (less important)
//   - Simplified hover state management
// v3.1 (2025-12-22): Subtle hover controls
// v3.0 (2025-12-22): Complete redesign
// v2.x: Previous implementations

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Settings, FileDown, RefreshCw, Bell, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherWidget from './WeatherWidget_API';
import ThemeToggle from './ThemeToggle';
import IconButton from './ui/IconButton';
import { haptics } from '../utils/haptics';

// Hook to detect touch/mobile device
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for coarse pointer (touch screens)
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouch(mediaQuery.matches);

    const handler = (e) => setIsTouch(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isTouch;
};

// ActionItem component for dropdown menu
const ActionItem = ({ icon: Icon, label, onClick, loading, shortcut }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
  >
    <Icon className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && (
      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded border border-slate-200 dark:border-slate-600">
        {shortcut}
      </kbd>
    )}
  </button>
);

// Subtle QuickActions - hover on desktop, click+haptics on mobile
const QuickActionsDropdown = ({ onOpenExport, onRefresh, refreshing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const isTouch = useIsTouchDevice();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Desktop only: hover handlers
  const handleMouseEnter = () => {
    if (isTouch) return; // Disable hover on touch devices
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isTouch) return; // Disable hover on touch devices
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Click handler with haptic feedback for mobile
  const handleClick = () => {
    if (isTouch) {
      haptics.light();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="relative"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle icon button */}
      <button
        onClick={handleClick}
        className={`
          flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg
          transition-all duration-200
          ${isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
          }
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Acoes rapidas"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50"
          >
            <ActionItem
              icon={FileDown}
              label="Exportar"
              onClick={() => { onOpenExport?.(); setIsOpen(false); }}
              shortcut="E"
            />
            <ActionItem
              icon={RefreshCw}
              label="Sincronizar"
              onClick={() => { onRefresh?.(); setIsOpen(false); }}
              loading={refreshing}
              shortcut="R"
            />
            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
            <ActionItem
              icon={Bell}
              label="Alertas"
              onClick={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Subtle Keyboard Hints - shows on hover
const KeyboardHintsSubtle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const shortcuts = [
    { key: '1-9', desc: 'Navegar' },
    { key: ',', desc: 'Config' },
    { key: 'E', desc: 'Exportar' },
    { key: 'R', desc: 'Sync' },
  ];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      className="relative"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle kbd indicator */}
      <div className={`
        px-2 py-1.5 rounded cursor-default min-h-[44px] flex items-center
        transition-colors duration-200
        ${isOpen
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400'
        }
      `}>
        <span className="text-[11px] font-mono">?</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 px-2 z-50"
          >
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1">
              Atalhos
            </p>
            <div className="space-y-1">
              {shortcuts.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between px-1 py-0.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-600">
                    {key}
                  </kbd>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Location Badge Component
const LocationBadge = () => (
  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
    <MapPin className="w-3.5 h-3.5 text-lavpop-blue dark:text-blue-400" />
    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
      Caxias do Sul
    </span>
  </div>
);

const MinimalTopBar = ({ refreshing, onRefresh, onOpenSettings, onOpenExport }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300 safe-area-top">
      {/* Height: 56px on mobile (h-14), 60px on desktop */}
      <div className="h-14 lg:h-[60px] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3">

        {/* Left Section: Weather + Location */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <WeatherWidget compact />
          <LocationBadge />
        </div>

        {/* Right Section: Subtle controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Quick Actions - subtle dropdown */}
          <QuickActionsDropdown
            onOpenExport={onOpenExport}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />

          {/* Settings Button */}
          <IconButton
            icon={Settings}
            label="Configuracoes"
            onClick={onOpenSettings}
          />

          {/* Theme Toggle - desktop only (mobile uses sidebar footer) */}
          <div className="hidden lg:block">
            <ThemeToggle className="no-print" />
          </div>

          {/* Keyboard Hints (desktop only) - last, less important */}
          <div className="hidden lg:block">
            <KeyboardHintsSubtle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MinimalTopBar;
