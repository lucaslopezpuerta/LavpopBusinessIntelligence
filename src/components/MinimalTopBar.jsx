// MinimalTopBar.jsx v1.2
// Compact top bar with location, weather, and widgets
//
// CHANGELOG:
// v1.2 (2025-12-01): Header layout reorganization
//   - Moved Google & Social widgets to left (next to Weather)
//   - Added Settings and Export icons to right controls
//   - QuickActionsCard functionality now in header
// v1.1 (2025-11-30): Mobile improvements
//   - Header height matches sidebar icon box (h-[60px] on lg, h-14 on mobile)
//   - Dark mode toggle visible on mobile
//   - Refresh button visible on mobile
//   - Added active tab breadcrumb for mobile context
//   - Added focus-visible states for accessibility
// v1.0 (2025-11-27): Initial implementation
//   - Compact 50px height (vs previous 64px header)
//   - Left: Location + Weather widget
//   - Right: Google Business + Social Media + Refresh + Theme Toggle
//   - Mobile menu button opens sidebar drawer
//   - Dark mode support
//   - Glassmorphism backdrop blur

import React from 'react';
import { MapPin, RefreshCw, Menu, BarChart3, Users, TrendingUp, Settings, FileDown, MessageSquare, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherWidget from './WeatherWidget_API';
import GoogleBusinessWidget from './GoogleBusinessWidget';
import SocialMediaWidget from './SocialMediaWidget';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from '../contexts/SidebarContext';

// Tab labels for mobile breadcrumb
const TAB_CONFIG = {
  dashboard: { label: 'Dashboard', icon: BarChart3 },
  customers: { label: 'Clientes', icon: Users },
  campaigns: { label: 'Campanhas', icon: MessageSquare },
  intelligence: { label: 'Inteligência', icon: TrendingUp },
  operations: { label: 'Operações', icon: Settings },
  upload: { label: 'Upload', icon: Upload }
};

const MinimalTopBar = ({ refreshing, onRefresh, activeTab = 'dashboard' }) => {
  const { toggleMobileSidebar } = useSidebar();
  const currentTab = TAB_CONFIG[activeTab] || TAB_CONFIG.dashboard;
  const TabIcon = currentTab.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
      {/* Height matches sidebar: 60px on desktop (lg:h-[60px]), 56px on mobile (h-14) */}
      <div className="h-14 lg:h-[60px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

        {/* Left: Mobile breadcrumb OR Location + Weather + Widgets */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile: Active tab breadcrumb */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-lavpop-blue/10 dark:bg-lavpop-blue/20 flex items-center justify-center">
              <TabIcon className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {currentTab.label}
            </span>
          </div>

          {/* Desktop: Location + Weather + Widgets */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="hidden lg:flex items-center gap-1.5"
          >
            <MapPin className="w-3 h-3 text-lavpop-blue dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Caxias do Sul
            </span>
          </motion.div>
          <div className="hidden lg:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="hidden lg:block">
            <WeatherWidget compact />
          </div>
          <div className="hidden lg:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
          {/* Widgets moved to left - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
            <GoogleBusinessWidget compact />
            <SocialMediaWidget compact />
          </div>
        </div>

        {/* Right: Controls (Refresh, Export, Settings, Theme, Mobile Menu) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Export Report Button (hidden on mobile) */}
          <button
            onClick={() => window.print()}
            className="hidden sm:flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Exportar Relatório"
            aria-label="Exportar relatório"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Settings Button (hidden on mobile) */}
          <button
            onClick={() => {/* TODO: Open settings modal */}}
            className="hidden sm:flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Configurações"
            aria-label="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Reload Button - Visible on mobile */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-lavpop-blue dark:hover:text-lavpop-blue transition-all disabled:opacity-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Atualizar Dados"
            aria-label="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme Toggle - Visible on mobile */}
          <ThemeToggle className="no-print" />

          <div className="lg:hidden h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Mobile Menu Button - Opens Sidebar Drawer */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MinimalTopBar;
