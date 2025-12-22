// MinimalTopBar.jsx v2.1 - KEYBOARD HINTS
// Compact top bar with widgets on all screen sizes
//
// CHANGELOG:
// v2.1 (2025-12-22): Keyboard shortcut hints
//   - Added KeyboardHints component (desktop only)
//   - Shows popover with all keyboard shortcuts (1-9, comma)
//   - Helps users discover navigation shortcuts
// v2.0 (2025-12-18): Mobile widget bar (UX audit)
//   - Removed breadcrumb navigation (bottom nav handles this now)
//   - Added horizontally scrollable widget row for mobile
//   - Compact weather, social, and Google widgets on mobile
//   - Improved touch targets (44px minimum)
// v1.7 (2025-12-17): Export modal integration
//   - Export button now opens modal instead of browser print
//   - Supports CSV and PDF export per view
// v1.6 (2025-12-16): Mobile settings access
//   - Removed redundant hamburger menu (breadcrumb handles navigation)
//   - Settings button now visible on mobile
//   - Cleaner right-side controls: Refresh, Theme, Settings
// v1.5 (2025-12-16): Clickable mobile breadcrumb (UX audit fix)
//   - Mobile breadcrumb now opens navigation drawer on tap
//   - Added visual indicator (chevron icon) to show it's interactive
//   - Better touch target (min 44px height)

import React from 'react';
import { MapPin, RefreshCw, Settings, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherWidget from './WeatherWidget_API';
import GoogleBusinessWidget from './GoogleBusinessWidget';
import SocialMediaWidget from './SocialMediaWidget';
import ThemeToggle from './ThemeToggle';
import KeyboardHints from './KeyboardHints';

const MinimalTopBar = ({ refreshing, onRefresh, activeTab = 'dashboard', onOpenSettings, onOpenExport }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300 safe-area-top">
      {/* Height: 56px on mobile (h-14), 60px on desktop */}
      <div className="h-14 lg:h-[60px] px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">

        {/* Left: Widgets - scrollable on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {/* Location - always visible */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 flex-shrink-0"
          >
            <MapPin className="w-3 h-3 text-lavpop-blue dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden sm:inline">
              Caxias do Sul
            </span>
          </motion.div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

          {/* Weather Widget - compact on mobile */}
          <div className="flex-shrink-0">
            <WeatherWidget compact />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0 hidden sm:block" />

          {/* Social Media Widget */}
          <div className="flex-shrink-0 hidden sm:block">
            <SocialMediaWidget compact />
          </div>

          {/* Google Business Widget */}
          <div className="flex-shrink-0 hidden sm:block">
            <GoogleBusinessWidget compact />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Export Report Button (hidden on small mobile) */}
          <button
            onClick={onOpenExport}
            className="hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Exportar Dados (CSV/PDF)"
            aria-label="Exportar dados"
          >
            <FileDown className="w-5 h-5" />
          </button>

          {/* Keyboard Hints (desktop only) */}
          <KeyboardHints />

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Configurações"
            aria-label="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Reload Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-lavpop-blue dark:hover:text-lavpop-blue transition-all disabled:opacity-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Atualizar Dados"
            aria-label="Atualizar dados"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle className="no-print" />
        </div>
      </div>
    </header>
  );
};

export default MinimalTopBar;
