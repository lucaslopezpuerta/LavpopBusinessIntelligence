// MinimalTopBar.jsx v1.0
// Compact top bar with location, weather, and widgets
//
// CHANGELOG:
// v1.0 (2025-11-27): Initial implementation
//   - Compact 50px height (vs previous 64px header)
//   - Left: Location + Weather widget
//   - Right: Google Business + Social Media + Refresh + Theme Toggle
//   - Mobile menu button opens sidebar drawer
//   - Dark mode support
//   - Glassmorphism backdrop blur

import React from 'react';
import { MapPin, RefreshCw, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherWidget from './WeatherWidget_API';
import GoogleBusinessWidget from './GoogleBusinessWidget';
import SocialMediaWidget from './SocialMediaWidget';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from '../contexts/SidebarContext';

const MinimalTopBar = ({ refreshing, onRefresh }) => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
      <div className="h-12 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

        {/* Left: Location + Weather */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <MapPin className="w-3 h-3 text-lavpop-blue dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Caxias do Sul
            </span>
          </motion.div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <WeatherWidget compact />
        </div>

        {/* Right: Widgets + Controls */}
        <div className="flex items-center gap-2">
          {/* Widgets - Google & Social */}
          <div className="flex items-center gap-2">
            <GoogleBusinessWidget compact />
            <SocialMediaWidget compact />
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Reload Button - Hidden on mobile */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="hidden sm:flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-lavpop-blue dark:hover:text-lavpop-blue transition-all disabled:opacity-50 active:scale-95"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Theme Toggle - Hidden on mobile */}
          <div className="hidden sm:block">
            <ThemeToggle className="no-print" />
          </div>

          {/* Mobile Menu Button - Opens Sidebar Drawer */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MinimalTopBar;
