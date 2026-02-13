// MinimalTopBar.jsx v6.1 - STELLAR COMMAND BRIDGE
// Prominent brand presence with full utility
// Design System v5.1 compliant
//
// DESIGN DECISION:
// Logo sizing best practice: 60-80% of topbar height for strong brand presence
// - Desktop: Full horizontal logo (44px / 60px = 73%)
// - Mobile: Saturn icon (40px / 56px = 71%)
//
// CHANGELOG:
// v6.1 (2026-02-13): Declutter mobile topbar
//   - Hid BrazilClockMobile, NotificationBell, ThemeToggle on mobile (< lg)
//   - Added theme toggle action to QuickActions dropdown for mobile access
//   - Mobile topbar reduced from 7 items to 3 (Weather, StaleData, QuickActions)
//   - Fixed text-[11px] → text-xs in BrazilClockMobile
// v6.0 (2026-01-31): Brand-forward redesign
//   - NEW: Prominent BilavnovaFullLogo on desktop (h-11, 44px)
//   - NEW: Large BilavnovaIcon on mobile (h-10, 40px)
//   - NEW: NotificationBell with unread badge
//   - NEW: Compact weather on mobile
//   - NEW: ThemeToggle visible on mobile
//   - REMOVED: MobileOrbitalIcon (replaced with BilavnovaIcon)
// v5.2 (2026-01-29): Visual polish & micro-interactions
//   - Enhanced glassmorphism with saturate filter and inner highlight
//   - Improved dropdown animations with better spring physics
//   - Better shadow depth for floating appearance
//   - Refined VitalsConsole styling
// v5.1 (2026-01-29): Brand consolidation - sidebar owns the logo
// v5.0 (2026-01-29): Stellar Command Bridge redesign
// v4.x-v1.x: Previous implementations

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, FileDown, Bell, MoreHorizontal, LogOut, Clock, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeatherWidget from './WeatherWidget_API';
import ThemeToggle from './ThemeToggle';
import RealtimeStatusIndicator from './ui/RealtimeStatusIndicator';
import { BilavnovaIcon, BilavnovaFullLogo } from './ui/BilavnovaLogo';
import { haptics } from '../utils/haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDataRefresh } from '../contexts/DataFreshnessContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import StaleDataIndicator from './ui/StaleDataIndicator';

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
// BrazilClock - Live Brazilian time (America/Sao_Paulo)
// Desktop: "QUI 13:42" inside VitalsConsole
// Mobile: Compact "13:42" next to brand logo
// ═══════════════════════════════════════════════════════════════════════════
const WEEKDAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const TIME_FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const WEEKDAY_FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short'
});

const useBrazilTime = () => {
  const [time, setTime] = useState(() => ({
    display: TIME_FMT.format(new Date()),
    weekday: WEEKDAY_FMT.format(new Date()).replace('.', '').toUpperCase()
  }));

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        display: TIME_FMT.format(now),
        weekday: WEEKDAY_FMT.format(now).replace('.', '').toUpperCase()
      });
    };

    // Sync to next minute boundary for clean transitions
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
    const initialTimeout = setTimeout(() => {
      update();
      // Then update every 60s
      const interval = setInterval(update, 60_000);
      // Store for cleanup
      intervalRef.current = interval;
    }, msUntilNextMinute);

    const intervalRef = { current: null };

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return time;
};

const BrazilClockDesktop = ({ isDark }) => {
  const { display, weekday } = useBrazilTime();

  return (
    <div className="flex items-center gap-1.5 px-2">
      <Clock className="w-3.5 h-3.5 text-stellar-cyan" />
      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {weekday}
      </span>
      <span className={`text-xs font-bold font-mono tabular-nums tracking-wide ${
        isDark ? 'text-slate-200' : 'text-slate-700'
      }`}>
        {display}
      </span>
    </div>
  );
};

const BrazilClockMobile = ({ isDark }) => {
  const { display } = useBrazilTime();

  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${
      isDark ? 'bg-stellar-cyan/5' : 'bg-slate-100/60'
    }`}>
      <Clock className={`w-3 h-3 ${isDark ? 'text-stellar-cyan/60' : 'text-slate-400'}`} />
      <span className={`text-xs font-bold font-mono tabular-nums tracking-wide ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        {display}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BrandLogo - Prominent brand presence (60-80% of topbar height)
// Mobile: Saturn icon (40px = 71% of 56px topbar)
// Desktop: Full horizontal logo (44px = 73% of 60px topbar)
// ═══════════════════════════════════════════════════════════════════════════
const BrandLogo = ({ isDark, prefersReducedMotion }) => (
  <div className="relative flex items-center flex-shrink-0">
    {/* Subtle glow behind logo */}
    {!prefersReducedMotion && (
      <motion.div
        className={`absolute -inset-2 rounded-xl blur-xl ${
          isDark ? 'bg-stellar-cyan/15' : 'bg-stellar-blue/10'
        }`}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}

    {/* Mobile: Large Saturn icon - 40px (71% of 56px topbar) */}
    <BilavnovaIcon
      className="relative h-10 w-10 lg:hidden"
      variant="gradient"
      gradientId="topbarIconGradient"
    />

    {/* Desktop: Full horizontal logo - 44px (73% of 60px topbar) */}
    <BilavnovaFullLogo
      className="relative hidden lg:block h-11"
      variant="gradient"
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// NotificationBell - Bell icon with unread badge
// ═══════════════════════════════════════════════════════════════════════════
const NotificationBell = ({ unreadCount = 0, onClick, isDark, prefersReducedMotion }) => (
  <motion.button
    onClick={onClick}
    whileHover={prefersReducedMotion ? {} : { y: -2 }}
    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    className={`relative flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
      ${isDark
        ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
        : 'text-slate-500 hover:bg-stellar-blue/5 hover:text-stellar-blue'
      }`}
    aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
    title="Notificações"
  >
    <Bell className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className={`absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ${
        isDark ? 'ring-space-dust' : 'ring-white'
      }`}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    )}
  </motion.button>
);

// ═══════════════════════════════════════════════════════════════════════════
// VitalsConsole - Unified status pill (weather, location, realtime)
// Desktop only (lg+), left-aligned since sidebar owns the brand
// ═══════════════════════════════════════════════════════════════════════════
const VitalsConsole = ({ isDark, prefersReducedMotion }) => (
  <motion.div
    className={`hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-sm ${
      isDark
        ? 'border border-stellar-cyan/15'
        : 'border border-slate-200/60'
    }`}
    style={{
      background: isDark
        ? 'linear-gradient(135deg, rgba(26,31,53,0.7) 0%, rgba(10,15,30,0.8) 100%)'
        : 'linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.85) 100%)',
      boxShadow: isDark
        ? 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)'
        : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.04)'
    }}
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

    {/* Brazil time */}
    <BrazilClockDesktop isDark={isDark} />

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
      <kbd className={`px-1.5 py-0.5 text-xs font-mono rounded border
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
const QuickActions = ({ onOpenExport, prefersReducedMotion }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const isTouch = useIsTouchDevice();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute right-0 mt-2 w-52 rounded-xl border py-2 z-50 backdrop-blur-xl backdrop-saturate-150
              ${isDark
                ? 'border-stellar-cyan/20'
                : 'border-slate-200/60'
              }`}
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(26,31,53,0.95) 0%, rgba(10,15,30,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(0,174,239,0.1)'
                : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <ActionItem
              icon={FileDown}
              label="Exportar"
              onClick={() => { onOpenExport?.(); setIsOpen(false); }}
              shortcut="E"
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
            <ActionItem
              icon={isDark ? Sun : Moon}
              label={isDark ? 'Modo claro' : 'Modo escuro'}
              onClick={() => { toggleTheme(); haptics.medium(); setIsOpen(false); }}
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
        <span className="text-xs font-mono font-bold">?</span>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute right-0 mt-2 w-40 rounded-xl border py-3 px-3 z-50 backdrop-blur-xl backdrop-saturate-150
              ${isDark
                ? 'border-stellar-cyan/20'
                : 'border-slate-200/60'
              }`}
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(26,31,53,0.95) 0%, rgba(10,15,30,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(0,174,239,0.1)'
                : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${isDark ? 'text-stellar-cyan/70' : 'text-stellar-cyan'}`}>
              Atalhos
            </p>
            <div className="space-y-1.5">
              {shortcuts.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className={`px-1.5 py-0.5 text-xs font-mono rounded border
                    ${isDark
                      ? 'bg-space-void/50 text-slate-400 border-stellar-cyan/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {key}
                  </kbd>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</span>
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
const MinimalTopBar = ({ onOpenExport }) => {
  const { isDark } = useTheme();
  const { lastRefreshed, refreshing: contextRefreshing, triggerRefresh } = useDataRefresh();
  const prefersReducedMotion = useReducedMotion();
  const [unreadNotifications] = useState(0); // TODO: Connect to notification system

  return (
    <header
      className="sticky top-0 z-40 safe-area-top relative backdrop-blur-xl backdrop-saturate-150"
      style={{
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        background: isDark
          ? 'linear-gradient(180deg, rgba(10,15,30,0.95) 0%, rgba(10,15,30,0.92) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.95) 100%)',
        boxShadow: isDark
          ? 'inset 0 -1px 0 rgba(0,174,239,0.1), 0 4px 24px rgba(0,0,0,0.3)'
          : 'inset 0 -1px 0 rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06)'
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
      <div className="relative h-14 lg:h-[60px] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 lg:gap-4">
        {/* LEFT: Brand Logo */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <BrandLogo isDark={isDark} prefersReducedMotion={prefersReducedMotion} />
        </div>

        {/* CENTER: VitalsConsole (desktop only) */}
        <VitalsConsole isDark={isDark} prefersReducedMotion={prefersReducedMotion} />

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Compact weather for mobile */}
          <div className="lg:hidden">
            <WeatherWidget compact />
          </div>

          {/* Data Freshness Indicator */}
          <StaleDataIndicator
            lastUpdated={lastRefreshed}
            isRefreshing={contextRefreshing}
            onRefresh={() => triggerRefresh({ reason: 'manual' })}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Notification Bell - desktop only (non-functional on mobile, accessible via QuickActions "Alertas") */}
          <div className="hidden lg:flex">
            <NotificationBell
              unreadCount={unreadNotifications}
              onClick={() => {/* TODO: Open notification panel */}}
              isDark={isDark}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions
            onOpenExport={onOpenExport}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Theme Toggle - desktop only (accessible via QuickActions on mobile) */}
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
