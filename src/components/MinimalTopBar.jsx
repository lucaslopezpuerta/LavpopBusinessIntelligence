// MinimalTopBar.jsx v5.1 - FUNCTIONAL COMMAND BRIDGE
// Purely functional top bar - sidebar owns the brand
// Design System v5.1 compliant - UX research-driven layout
//
// DESIGN DECISION:
// Following UX best practices (Nielsen Norman, Cieden, UX Planet):
// - Sidebar = Brand home (full logo when expanded)
// - TopBar = Functional only (no redundant branding)
// - Mobile = Small orbital icon (brand recognition when sidebar hidden)
//
// CHANGELOG:
// v5.1 (2026-01-29): Brand consolidation - sidebar owns the logo
//   - REMOVED: Full logo on desktop (sidebar has it now)
//   - NEW: MobileOrbitalIcon - small icon for mobile only
//   - MOVED: VitalsConsole to left (no longer centered)
//   - Maintains HorizonScanner and cosmic styling
// v5.0 (2026-01-29): Stellar Command Bridge redesign
//   - Brand SVG logos (moved to sidebar in v5.1)
//   - VitalsConsole - unified pill with weather, location, realtime
//   - HorizonScanner - subtle sweep animation
// v4.3 (2026-01-23): Settings button moved to sidebar
// v4.2 (2026-01-23): Realtime connection status indicator
// v4.x-v1.x: Previous implementations

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, FileDown, RefreshCw, Bell, MoreHorizontal, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherWidget from './WeatherWidget_API';
import ThemeToggle from './ThemeToggle';
import RealtimeStatusIndicator from './ui/RealtimeStatusIndicator';
import { haptics } from '../utils/haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Orbital icon for mobile-only branding (sidebar owns full logo on desktop)
const OrbitalIcon = '/pwa-192x192.png';

// Hook to detect touch/mobile device
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouch(mediaQuery.matches);

    const handler = (e) => setIsTouch(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isTouch;
};

// ═══════════════════════════════════════════════════════════════════════════
// MobileOrbitalIcon - Small icon for mobile only (sidebar owns full logo)
// ═══════════════════════════════════════════════════════════════════════════
const MobileOrbitalIcon = ({ isDark, prefersReducedMotion }) => (
  <div className="relative flex items-center lg:hidden">
    {/* Subtle glow behind icon */}
    {!prefersReducedMotion && (
      <motion.div
        className={`absolute -inset-1.5 rounded-full blur-lg ${
          isDark ? 'bg-stellar-cyan/25' : 'bg-stellar-blue/15'
        }`}
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}

    {/* Orbital icon */}
    <img
      src={OrbitalIcon}
      alt="Bilavnova"
      className="relative h-7 w-7 object-contain"
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// VitalsConsole - Unified status pill (weather, location, realtime)
// Desktop only (lg+), left-aligned since sidebar owns the brand
// ═══════════════════════════════════════════════════════════════════════════
const VitalsConsole = ({ isDark, prefersReducedMotion }) => (
  <motion.div
    className={`hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full ${
      isDark
        ? 'bg-space-dust/60 border border-stellar-cyan/10'
        : 'bg-slate-50/80 border border-slate-200/60'
    } backdrop-blur-sm`}
    whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    {/* Weather module */}
    <WeatherWidget compact />

    {/* Vertical divider */}
    <div className={`w-px h-5 ${isDark ? 'bg-stellar-cyan/20' : 'bg-slate-300/60'}`} />

    {/* Location badge */}
    <div className="flex items-center gap-1.5 px-2">
      <MapPin className="w-3.5 h-3.5 text-stellar-cyan" />
      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Caxias
      </span>
    </div>

    {/* Vertical divider */}
    <div className={`w-px h-5 ${isDark ? 'bg-stellar-cyan/20' : 'bg-slate-300/60'}`} />

    {/* Realtime indicator */}
    <RealtimeStatusIndicator />
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// HorizonScanner - Enhanced animated border with sweep effect
// ═══════════════════════════════════════════════════════════════════════════
const HorizonScanner = ({ isDark, prefersReducedMotion }) => {
  if (prefersReducedMotion) {
    return (
      <div
        className="absolute bottom-0 inset-x-0 h-[2px]"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 5%, #2d388a 20%, #00aeef 50%, #2d388a 80%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, rgba(45,56,138,0.4) 20%, rgba(0,174,239,0.6) 50%, rgba(45,56,138,0.4) 80%, transparent 95%)'
        }}
      />
    );
  }

  return (
    <div className="absolute bottom-0 inset-x-0 h-[2px] overflow-hidden">
      {/* Base gradient line */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 5%, rgba(45,56,138,0.3) 20%, rgba(0,174,239,0.5) 50%, rgba(45,56,138,0.3) 80%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, rgba(45,56,138,0.2) 20%, rgba(0,174,239,0.3) 50%, rgba(45,56,138,0.2) 80%, transparent 95%)'
        }}
      />

      {/* Subtle scanner sweep - infrequent to avoid distraction */}
      <motion.div
        className="absolute inset-y-0 w-40"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(0,174,239,0.4), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(0,174,239,0.25), transparent)'
        }}
        animate={{ x: ['-160px', 'calc(100vw + 160px)'] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 12
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ActionItem - Dropdown action with cosmic hover
// ═══════════════════════════════════════════════════════════════════════════
const ActionItem = ({ icon: Icon, label, onClick, loading, shortcut, isDark }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 disabled:opacity-50
      ${isDark
        ? 'text-slate-200 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
        : 'text-slate-700 hover:bg-stellar-cyan/5 hover:text-stellar-cyan'
      }`}
  >
    <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'} ${loading ? 'animate-spin' : ''}`} />
    <span className="flex-1 text-left font-medium">{label}</span>
    {shortcut && (
      <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded border
        ${isDark
          ? 'bg-space-void/50 text-slate-500 border-stellar-cyan/20'
          : 'bg-slate-100 text-slate-400 border-slate-200'
        }`}>
        {shortcut}
      </kbd>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
// QuickActions - Streamlined dropdown
// ═══════════════════════════════════════════════════════════════════════════
const QuickActions = ({ onOpenExport, onRefresh, refreshing, prefersReducedMotion }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const isTouch = useIsTouchDevice();
  const { signOut } = useAuth();
  const { isDark } = useTheme();

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
    if (isTouch) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
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
      {/* Trigger button with hover lift */}
      <motion.button
        onClick={handleClick}
        whileHover={prefersReducedMotion ? {} : { y: -2 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
          ${isOpen
            ? isDark
              ? 'bg-stellar-cyan/15 text-stellar-cyan'
              : 'bg-stellar-cyan/10 text-stellar-cyan'
            : isDark
              ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
              : 'text-slate-500 hover:bg-stellar-blue/5 hover:text-stellar-blue'
          }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Ações rápidas"
      >
        <MoreHorizontal className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border py-2 z-50
              ${isDark
                ? 'bg-space-dust/95 backdrop-blur-xl border-stellar-cyan/20 shadow-stellar'
                : 'bg-white/95 backdrop-blur-xl border-stellar-blue/10 shadow-bilavnova'
              }`}
          >
            <ActionItem
              icon={FileDown}
              label="Exportar"
              onClick={() => { onOpenExport?.(); setIsOpen(false); }}
              shortcut="E"
              isDark={isDark}
            />
            <ActionItem
              icon={RefreshCw}
              label="Sincronizar"
              onClick={() => { onRefresh?.(); setIsOpen(false); }}
              loading={refreshing}
              shortcut="R"
              isDark={isDark}
            />

            {/* Divider */}
            <div className={`my-2 mx-3 h-px ${isDark ? 'divider-cosmic' : 'bg-slate-200'}`} />

            <ActionItem
              icon={Bell}
              label="Alertas"
              onClick={() => setIsOpen(false)}
              isDark={isDark}
            />

            {/* Divider */}
            <div className={`my-2 mx-3 h-px ${isDark ? 'divider-cosmic' : 'bg-slate-200'}`} />

            <ActionItem
              icon={LogOut}
              label="Sair"
              onClick={() => { signOut(); setIsOpen(false); }}
              isDark={isDark}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CommandPalette - Keyboard Hints (desktop only)
// ═══════════════════════════════════════════════════════════════════════════
const CommandPalette = ({ prefersReducedMotion }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const { isDark } = useTheme();

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
      {/* Hover lift kbd indicator */}
      <motion.div
        className={`px-2.5 py-2 rounded-xl cursor-default min-h-[44px] flex items-center transition-all duration-200
          ${isOpen
            ? isDark
              ? 'bg-stellar-cyan/15 text-stellar-cyan'
              : 'bg-stellar-cyan/10 text-stellar-cyan'
            : isDark
              ? 'text-slate-500 hover:text-stellar-cyan hover:bg-stellar-cyan/10'
              : 'text-slate-400 hover:text-stellar-blue hover:bg-stellar-blue/5'
          }`}
        whileHover={prefersReducedMotion ? {} : { y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <span className="text-[11px] font-mono font-bold">?</span>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={`absolute right-0 mt-2 w-40 rounded-xl shadow-xl border py-3 px-3 z-50
              ${isDark
                ? 'bg-space-dust/95 backdrop-blur-xl border-stellar-cyan/20 shadow-stellar'
                : 'bg-white/95 backdrop-blur-xl border-stellar-blue/10 shadow-bilavnova'
              }`}
          >
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${isDark ? 'text-stellar-cyan/70' : 'text-stellar-cyan'}`}>
              Atalhos
            </p>
            <div className="space-y-1.5">
              {shortcuts.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded border
                    ${isDark
                      ? 'bg-space-void/50 text-slate-400 border-stellar-cyan/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {key}
                  </kbd>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: MinimalTopBar (Stellar Command Bridge)
// ═══════════════════════════════════════════════════════════════════════════
const MinimalTopBar = ({ refreshing, onRefresh, onOpenExport }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  return (
    <header
      className={`sticky top-0 z-40 safe-area-top relative ${
        isDark
          ? 'bg-space-nebula/95 shadow-stellar'
          : 'bg-white/95 shadow-bilavnova'
      }`}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Main content */}
      <div className="relative h-14 lg:h-[60px] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile icon OR Desktop Vitals Console */}
        <div className="flex items-center gap-3">
          {/* Mobile only: Small orbital icon (sidebar owns full logo on desktop) */}
          <MobileOrbitalIcon isDark={isDark} prefersReducedMotion={prefersReducedMotion} />

          {/* Desktop only: Vitals Console (left-aligned since sidebar has logo) */}
          <VitalsConsole isDark={isDark} prefersReducedMotion={prefersReducedMotion} />
        </div>

        {/* Right: Command Controls */}
        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          <QuickActions
            onOpenExport={onOpenExport}
            onRefresh={onRefresh}
            refreshing={refreshing}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Theme Toggle - desktop only */}
          <div className="hidden lg:block">
            <ThemeToggle className="no-print" />
          </div>

          {/* Keyboard Hints - desktop only */}
          <div className="hidden lg:block">
            <CommandPalette prefersReducedMotion={prefersReducedMotion} />
          </div>
        </div>
      </div>

      {/* Horizon Scanner */}
      <HorizonScanner isDark={isDark} prefersReducedMotion={prefersReducedMotion} />
    </header>
  );
};

export default MinimalTopBar;
