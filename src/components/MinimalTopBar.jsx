// MinimalTopBar.jsx v4.3 - STELLAR COMMAND CENTER
// Cosmic precision top bar with Horizon Line signature element
// Design System v5.1 compliant - Space station command bridge viewport
//
// CHANGELOG:
// v4.3 (2026-01-23): Settings button moved to sidebar
//   - Removed Settings button (moved to IconSidebar)
//   - Removed IconButton and Settings icon imports
//   - Removed onOpenSettings prop
// v4.2 (2026-01-23): Realtime connection status indicator
//   - Added RealtimeStatusIndicator component to left section
//   - Shows connection status with breathing dot animation
//   - Tooltip displays last update time on hover
//   - Hidden on small screens for space efficiency
// v4.1 (2026-01-20): Weather capsule simplification
//   - Removed orbital ring hover effect from CosmicWeatherCapsule
//   - Changed location text from "Caxias Station" to "Caxias do Sul"
// v4.0 (2026-01-18): Stellar Command Center cosmic redesign
//   - NEW: HorizonLine - Animated breathing gradient border (signature element)
//   - NEW: StellarLocationBadge - Breathing MapPin glow
//   - NEW: CosmicQuickActions - Orbital indicator dot when open
//   - NEW: ThemeOrbit - Rotating radial gradient background
//   - Enhanced glassmorphism with aurora overlay (dark mode)
//   - Reduced motion support for accessibility
//   - Premium spring physics on all interactions
// v3.7 (2026-01-16): Theme-aware colors fix
// v3.6 (2025-12-26): Logout button
// v3.5 (2025-12-22): Theme toggle hidden on mobile
// v3.4 (2025-12-22): Mobile uses click+haptics, desktop uses hover
// v3.3 (2025-12-22): Removed hamburger menu
// v3.2-v1.x: Previous implementations

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
// SIGNATURE ELEMENT: HorizonLine
// A living, breathing animated gradient border that pulses with cosmic energy
// ═══════════════════════════════════════════════════════════════════════════
const HorizonLine = ({ isDark, prefersReducedMotion }) => {
  if (prefersReducedMotion) {
    // Static fallback for reduced motion
    return (
      <div
        className="absolute bottom-0 inset-x-0 h-[2px]"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 10%, rgba(45,56,138,0.5) 30%, rgba(0,174,239,0.8) 50%, rgba(45,56,138,0.5) 70%, transparent 90%)'
            : 'linear-gradient(90deg, transparent 10%, rgba(45,56,138,0.3) 30%, rgba(0,174,239,0.5) 50%, rgba(45,56,138,0.3) 70%, transparent 90%)'
        }}
      />
    );
  }

  return (
    <div className="absolute bottom-0 inset-x-0 h-[2px] overflow-hidden">
      <motion.div
        className="w-full h-full"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(90deg, transparent, #2d388a, #00aeef, #2d388a, transparent)'
            : 'linear-gradient(90deg, transparent, rgba(45,56,138,0.4), rgba(0,174,239,0.6), rgba(45,56,138,0.4), transparent)',
          backgroundSize: '200% 100%',
          backgroundRepeat: 'no-repeat'
        }}
        animate={{
          backgroundPosition: ['100% 0', '-100% 0'],
          opacity: isDark ? [0.6, 1, 0.6] : [0.4, 0.7, 0.4]
        }}
        transition={{
          backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// StellarLocationBadge - Enhanced with breathing MapPin glow
// ═══════════════════════════════════════════════════════════════════════════
const StellarLocationBadge = ({ isDark, prefersReducedMotion }) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors
        ${isDark
          ? 'bg-gradient-to-r from-space-dust to-space-nebula border border-stellar-cyan/20'
          : 'bg-gradient-to-r from-slate-50 to-white border border-stellar-blue/15 shadow-sm'
        }`}
    >
      <motion.div
        className="w-4 h-4 rounded-full flex items-center justify-center"
        animate={prefersReducedMotion ? {} : {
          boxShadow: isDark
            ? ['0 0 4px rgba(0,174,239,0.3)', '0 0 8px rgba(0,174,239,0.5)', '0 0 4px rgba(0,174,239,0.3)']
            : ['0 0 2px rgba(45,56,138,0.2)', '0 0 4px rgba(45,56,138,0.3)', '0 0 2px rgba(45,56,138,0.2)']
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MapPin className="w-3.5 h-3.5 text-stellar-cyan" />
      </motion.div>
      <span className={`text-xs font-medium tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Caxias do Sul
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CosmicWeatherCapsule - Weather widget wrapper with subtle hover effect
// ═══════════════════════════════════════════════════════════════════════════
const CosmicWeatherCapsule = ({ prefersReducedMotion }) => {
  return (
    <motion.div
      className="relative"
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <WeatherWidget compact />
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ActionItem - Enhanced dropdown action with cosmic hover
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
    <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'} ${loading ? 'animate-spin' : ''} group-hover:text-stellar-cyan`} />
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
// CosmicQuickActions - Dropdown with orbital indicator
// ═══════════════════════════════════════════════════════════════════════════
const CosmicQuickActions = ({ onOpenExport, onRefresh, refreshing, prefersReducedMotion }) => {
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
      {/* Orbital indicator dot - circles when open */}
      {isOpen && !prefersReducedMotion && (
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-stellar-cyan z-10 pointer-events-none"
          style={{ top: -4, left: '50%', marginLeft: -4 }}
          animate={{
            x: [0, 16, 0, -16, 0],
            y: [0, 8, 16, 8, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Trigger button */}
      <motion.button
        onClick={handleClick}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
          ${isOpen
            ? isDark
              ? 'bg-stellar-cyan/15 text-stellar-cyan'
              : 'bg-stellar-cyan/10 text-stellar-cyan'
            : isDark
              ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
              : 'text-slate-500 hover:bg-stellar-cyan/5 hover:text-stellar-cyan'
          }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Acoes rapidas"
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

            {/* Cosmic divider */}
            <div className={`my-2 mx-3 h-px ${isDark ? 'divider-cosmic' : 'bg-slate-200'}`} />

            <ActionItem
              icon={Bell}
              label="Alertas"
              onClick={() => setIsOpen(false)}
              isDark={isDark}
            />

            {/* Cosmic divider */}
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
// ThemeOrbit - Enhanced theme toggle with rotating radial gradient
// ═══════════════════════════════════════════════════════════════════════════
const ThemeOrbit = ({ prefersReducedMotion }) => {
  const { isDark } = useTheme();

  return (
    <div className="relative">
      {/* Rotating radial gradient background */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="w-full h-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 30% 30%, rgba(0,174,239,0.2) 0%, transparent 60%)'
                : 'radial-gradient(circle at 30% 30%, rgba(251,191,36,0.25) 0%, transparent 60%)'
            }}
          />
        </motion.div>
      )}
      <ThemeToggle className="no-print relative z-10" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CommandPalette - Subtle Keyboard Hints (desktop only)
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
      {/* Subtle kbd indicator */}
      <div
        className={`px-2.5 py-2 rounded-lg cursor-default min-h-[44px] flex items-center transition-all duration-200
          ${isOpen
            ? isDark
              ? 'bg-stellar-cyan/15 text-stellar-cyan'
              : 'bg-stellar-cyan/10 text-stellar-cyan'
            : isDark
              ? 'text-slate-500 hover:text-stellar-cyan hover:bg-stellar-cyan/10'
              : 'text-slate-400 hover:text-stellar-cyan hover:bg-stellar-cyan/5'
          }`}
      >
        <span className="text-[11px] font-mono font-bold">?</span>
      </div>

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
// MAIN COMPONENT: MinimalTopBar (Stellar Command Center)
// ═══════════════════════════════════════════════════════════════════════════
const MinimalTopBar = ({ refreshing, onRefresh, onOpenExport }) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 safe-area-top relative
        ${isDark
          ? 'bg-space-nebula shadow-stellar'
          : 'bg-white/90 shadow-bilavnova'
        }`}
      style={{
        backdropFilter: isDark ? 'blur(24px)' : 'blur(16px)',
        WebkitBackdropFilter: isDark ? 'blur(24px)' : 'blur(16px)',
      }}
    >
      {/* Aurora overlay - dark mode only */}
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none aurora-overlay opacity-40"
          aria-hidden="true"
        />
      )}

      {/* Main content container */}
      <div className="relative h-14 lg:h-[60px] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Weather + Location + Realtime Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <CosmicWeatherCapsule prefersReducedMotion={prefersReducedMotion} />
          <StellarLocationBadge isDark={isDark} prefersReducedMotion={prefersReducedMotion} />
          {/* Realtime connection status - hidden on small screens */}
          <div className="hidden sm:block">
            <RealtimeStatusIndicator />
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Quick Actions with orbital indicator */}
          <CosmicQuickActions
            onOpenExport={onOpenExport}
            onRefresh={onRefresh}
            refreshing={refreshing}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Theme Toggle with orbital effect - desktop only */}
          <div className="hidden lg:block">
            <ThemeOrbit prefersReducedMotion={prefersReducedMotion} />
          </div>

          {/* Keyboard Hints (desktop only) */}
          <div className="hidden lg:block">
            <CommandPalette prefersReducedMotion={prefersReducedMotion} />
          </div>
        </div>
      </div>

      {/* Signature Element: Horizon Line */}
      <HorizonLine isDark={isDark} prefersReducedMotion={prefersReducedMotion} />
    </header>
  );
};

export default MinimalTopBar;
