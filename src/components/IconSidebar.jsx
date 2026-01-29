// IconSidebar.jsx v5.0 - ORBITAL COMMAND CENTER
// Bold, distinctive sidebar with cosmic mission control aesthetics
//
// DESIGN CONCEPT: "Orbital Command Center"
// - Aurora header with animated gradient mesh
// - Orbital active indicator with layoutId animations
// - Constellation dividers between nav groups
// - Gravitational hover effects with glow bloom
// - Cinematic mobile drawer with staggered reveals
// - Noise texture for depth and sophistication
//
// CHANGELOG:
// v5.0 (2026-01-28): Complete redesign with Orbital Command aesthetics
//   - Aurora gradient header with slow color shift
//   - Orbital active indicator with pulse dot
//   - Constellation dot dividers that twinkle
//   - Gravitational scale + glow on hover
//   - Geometric section headers with gradient lines
//   - Mobile drawer with blur-to-sharp entrance
//   - Staggered nav item animations
//   - Noise texture overlay for depth
// v4.0 (2026-01-23): Settings button integration
// v3.9 (2026-01-23): Relocated realtime indicator
// v3.x: Previous implementations

import { useRef, useEffect, useCallback, memo } from 'react';
import { BarChart3, Users, TrendingUp, Settings, MessageSquare, Upload, Search, Pin, PinOff, Share2, CloudSun, X, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollLock } from '../hooks/useScrollLock';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import RealtimeStatusIndicator from './ui/RealtimeStatusIndicator';

// Sidebar logo from public folder
const BilavnovaLogo = '/pwa-192x192.png';

// Navigation grouped by section
const navigationGroups = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
      { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
      { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
      { id: 'social', label: 'Redes Sociais', icon: Share2, path: '/social' },
    ]
  },
  {
    id: 'analysis',
    label: 'Análise',
    items: [
      { id: 'weather', label: 'Clima', icon: CloudSun, path: '/weather' },
      { id: 'intelligence', label: 'Planejamento', icon: TrendingUp, path: '/intelligence' },
      { id: 'operations', label: 'Operações', icon: Wrench, path: '/operations' },
    ]
  }
];

// Utility items (separate from main navigation)
const utilityItem = { id: 'upload', label: 'Importar', icon: Upload, path: '/upload' };
const settingsItem = { id: 'settings', label: 'Configurações', icon: Settings };

// Animation variants
const ORBITAL_SPRING = {
  type: 'spring',
  bounce: 0.25,
  duration: 0.5,
};

const HOVER_SPRING = {
  type: 'spring',
  stiffness: 400,
  damping: 10,
};

// Mobile drawer variants
const drawerVariants = {
  hidden: {
    x: -320,
    opacity: 0.5,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 300,
      staggerChildren: 0.03,
    }
  },
  exit: {
    x: -320,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

/**
 * Constellation divider - twinkling dots between nav groups
 */
const ConstellationDivider = memo(({ isDark, reducedMotion }) => (
  <div className="flex items-center justify-center gap-2 py-3 px-4">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className={`w-1 h-1 rounded-full ${isDark ? 'bg-stellar-cyan/40' : 'bg-stellar-blue/30'}`}
        initial={false}
        animate={reducedMotion ? {} : {
          opacity: [0.3, 0.8, 0.3],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 2.5,
          delay: i * 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
));

ConstellationDivider.displayName = 'ConstellationDivider';

/**
 * Section header with geometric gradient lines
 */
const SectionHeader = memo(({ label, isExpanded, isDark }) => {
  if (!isExpanded) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 px-4 mb-2 mt-1"
    >
      <div className={`h-px flex-1 bg-gradient-to-r ${isDark ? 'from-stellar-cyan/30' : 'from-stellar-blue/20'} to-transparent`} />
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-stellar-cyan/60' : 'text-stellar-blue/70'}`}>
        {label}
      </span>
      <div className={`h-px flex-1 bg-gradient-to-l ${isDark ? 'from-stellar-cyan/30' : 'from-stellar-blue/20'} to-transparent`} />
    </motion.div>
  );
});

SectionHeader.displayName = 'SectionHeader';

/**
 * Orbital indicator - animated active state
 */
const OrbitalIndicator = memo(({ isDark, reducedMotion }) => (
  <motion.div
    layoutId="orbital-indicator"
    className="absolute inset-0 rounded-xl overflow-hidden"
    initial={false}
    transition={reducedMotion ? { duration: 0 } : ORBITAL_SPRING}
  >
    {/* Outer glow ring */}
    <div className={`absolute inset-0 rounded-xl blur-sm ${
      isDark
        ? 'bg-gradient-to-r from-stellar-cyan/25 via-violet-500/15 to-stellar-cyan/25'
        : 'bg-gradient-to-r from-stellar-blue/20 via-violet-500/10 to-stellar-blue/20'
    }`} />
    {/* Inner solid */}
    <div className={`absolute inset-0 rounded-xl ${
      isDark
        ? 'bg-stellar-cyan/10 border border-stellar-cyan/30'
        : 'bg-stellar-blue/8 border border-stellar-blue/20'
    }`} />
    {/* Pulse dot */}
    <motion.div
      className={`absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
        isDark ? 'bg-stellar-cyan' : 'bg-stellar-blue'
      }`}
      animate={reducedMotion ? {} : {
        scale: [1, 1.3, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        boxShadow: isDark
          ? '0 0 8px rgba(0,174,239,0.8), 0 0 16px rgba(0,174,239,0.4)'
          : '0 0 8px rgba(45,56,138,0.6), 0 0 16px rgba(45,56,138,0.3)'
      }}
    />
  </motion.div>
));

OrbitalIndicator.displayName = 'OrbitalIndicator';


const IconSidebar = ({ activeTab, onNavigate, onOpenSettings }) => {
  const { isHovered, setIsHovered, isMobileOpen, setIsMobileOpen, toggleMobileSidebar, isPinned, togglePinned } = useSidebar();
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();
  const collapseTimeoutRef = useRef(null);

  // Lock scroll and hide BottomNavBar when mobile drawer is open
  useScrollLock(isMobileOpen);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Sidebar is expanded when pinned OR hovered
  const isExpanded = isPinned || isHovered;

  // Close sidebar (not toggle) - prevents double-toggle issues with FocusTrap
  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, [setIsMobileOpen]);

  const handleMobileNavigate = () => {
    if (isMobileOpen) {
      closeMobileSidebar();
    }
  };

  // Collapse sidebar after clicking a nav item (unless pinned)
  const handleDesktopNavigate = () => {
    if (!isPinned) {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      collapseTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  };

  // Nav item component with orbital indicator
  const NavItem = ({ item, isMobile = false, onClick }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isButton = !item.path;

    const content = (
      <motion.div
        className={`relative flex items-center gap-3 rounded-xl transition-colors duration-200 group ${
          isMobile ? 'h-12 px-4' : `h-11 ${isExpanded ? 'px-4' : 'justify-center px-2'}`
        }`}
        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        transition={HOVER_SPRING}
      >
        {/* Orbital active indicator */}
        {isActive && <OrbitalIndicator isDark={isDark} reducedMotion={prefersReducedMotion} />}

        {/* Hover glow bloom (non-active) */}
        {!isActive && (
          <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            isDark ? 'bg-stellar-cyan/5' : 'bg-stellar-blue/5'
          }`} />
        )}

        {/* Icon */}
        <Icon className={`relative z-10 w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
          isActive
            ? isDark ? 'text-stellar-cyan' : 'text-stellar-blue'
            : isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'
        }`} />

        {/* Label */}
        {(isExpanded || isMobile) && (
          <span className={`relative z-10 whitespace-nowrap text-sm font-medium transition-colors duration-200 ${
            isActive
              ? isDark ? 'text-white' : 'text-slate-900'
              : isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
          }`}>
            {item.label}
          </span>
        )}
      </motion.div>
    );

    const baseClasses = `
      relative w-full focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
      ${isDark ? 'focus-visible:ring-offset-space-nebula' : 'focus-visible:ring-offset-white'}
    `;

    if (isButton) {
      return (
        <motion.button
          variants={isMobile ? itemVariants : undefined}
          type="button"
          onClick={() => {
            onClick?.();
            if (isMobile) handleMobileNavigate();
          }}
          className={`${baseClasses} appearance-none bg-transparent border-0`}
          title={(!isExpanded && !isMobile) ? item.label : undefined}
          aria-label={item.label}
        >
          {content}
        </motion.button>
      );
    }

    return (
      <motion.div variants={isMobile ? itemVariants : undefined}>
        <Link
          to={item.path}
          onClick={isMobile ? handleMobileNavigate : handleDesktopNavigate}
          aria-current={isActive ? 'page' : undefined}
          className={baseClasses}
          title={(!isExpanded && !isMobile) ? item.label : undefined}
        >
          {content}
        </Link>
      </motion.div>
    );
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.aside
      className={`hidden lg:flex fixed left-0 top-0 h-screen ${
        isDark ? 'bg-space-nebula' : 'bg-white/95'
      } backdrop-blur-xl border-r ${
        isDark ? 'border-stellar-cyan/10' : 'border-slate-200/80'
      } z-50 flex-col overflow-hidden`}
      initial={false}
      animate={{ width: isExpanded ? 240 : 68 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
    >
      {/* Noise texture overlay for entire sidebar */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Header (60px - matches TopBar) */}
      <div className={`relative h-[60px] px-3 flex items-center justify-between border-b ${
        isDark ? 'border-stellar-cyan/10' : 'border-slate-200/50'
      } flex-shrink-0`}>

        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo with enhanced glow */}
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 rounded-full scale-150 blur-xl ${
              isDark ? 'bg-stellar-cyan/30' : 'bg-stellar-blue/20'
            }`} />
            <img
              src={BilavnovaLogo}
              alt="Bilavnova"
              className="relative w-8 h-8 object-contain"
            />
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-display text-lg font-bold leading-tight tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>BILAV</span>
                <span className="text-stellar-cyan">NOVA</span>
              </span>
              <span className={`text-[10px] leading-tight uppercase tracking-widest ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Business Intelligence
              </span>
            </motion.div>
          )}
        </div>

        {/* Pin button in header when expanded */}
        {isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={togglePinned}
            className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan ${
              isPinned
                ? 'text-stellar-cyan bg-stellar-cyan/15 shadow-[0_0_12px_rgba(0,174,239,0.3)]'
                : isDark
                  ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-slate-300'
                  : 'text-slate-400 hover:bg-stellar-blue/5 hover:text-slate-600'
            }`}
            title={isPinned ? 'Desafixar menu' : 'Fixar menu'}
            aria-label={isPinned ? 'Desafixar menu' : 'Fixar menu'}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </motion.button>
        )}
      </div>

      {/* Navigation with Groups */}
      <nav className="relative flex-1 py-4 overflow-y-auto z-10">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.id}>
            {/* Constellation divider between groups */}
            {groupIndex > 0 && (
              isExpanded
                ? <ConstellationDivider isDark={isDark} reducedMotion={prefersReducedMotion} />
                : <div className={`mx-4 my-2 border-t ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}`} />
            )}

            {/* Section header */}
            <SectionHeader label={group.label} isExpanded={isExpanded} isDark={isDark} />

            {/* Navigation items */}
            <div className="space-y-1 px-2">
              {group.items.map(item => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Utility Items (Importar + Settings) */}
      <div className={`relative py-3 px-2 border-t ${
        isDark ? 'border-stellar-cyan/10' : 'border-slate-200/50'
      } flex-shrink-0 space-y-1 z-10`}>
        <NavItem item={utilityItem} />
        <NavItem item={settingsItem} onClick={onOpenSettings} />
      </div>
    </motion.aside>
  );

  // Mobile Drawer with cinematic entrance
  const MobileDrawer = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Dark overlay backdrop */}
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />

          {/* Drawer with cinematic entrance */}
          <FocusTrap
            active={isMobileOpen}
            focusTrapOptions={{
              allowOutsideClick: true,
              escapeDeactivates: true,
              onDeactivate: closeMobileSidebar,
              initialFocus: false,
              returnFocusOnDeactivate: true,
            }}
          >
            <motion.aside
              className={`lg:hidden fixed left-0 top-0 bottom-0 w-[300px] ${
                isDark ? 'bg-space-nebula' : 'bg-white'
              } z-50 rounded-r-3xl shadow-2xl flex flex-col safe-area-top safe-area-bottom safe-area-left overflow-hidden`}
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
            >
              {/* Noise texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                }}
              />

              {/* Header */}
              <div className={`relative h-16 px-4 flex items-center justify-between border-b ${
                isDark ? 'border-stellar-cyan/10' : 'border-slate-200/50'
              } flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full scale-150 blur-lg ${
                      isDark ? 'bg-stellar-cyan/30' : 'bg-stellar-blue/20'
                    }`} />
                    <img
                      src={BilavnovaLogo}
                      alt="Bilavnova"
                      className="relative w-9 h-9 object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-bold tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>BILAV</span>
                      <span className="text-stellar-cyan">NOVA</span>
                    </span>
                  </div>
                  <RealtimeStatusIndicator />
                </div>

                {/* Close button with spin animation */}
                <motion.button
                  onClick={closeMobileSidebar}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:bg-stellar-cyan/10 hover:text-stellar-cyan'
                      : 'text-slate-500 hover:bg-stellar-blue/5 hover:text-stellar-blue'
                  }`}
                  whileTap={prefersReducedMotion ? {} : { rotate: 90 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Navigation with staggered animations */}
              <motion.nav
                className="relative flex-1 py-4 px-3 overflow-y-auto z-10"
                variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {navigationGroups.map((group, groupIndex) => (
                  <motion.div key={group.id} variants={itemVariants}>
                    {/* Constellation divider */}
                    {groupIndex > 0 && (
                      <ConstellationDivider isDark={isDark} reducedMotion={prefersReducedMotion} />
                    )}

                    {/* Section header */}
                    <div className="flex items-center gap-2 px-3 mb-2 mt-1">
                      <div className={`h-px flex-1 bg-gradient-to-r ${isDark ? 'from-stellar-cyan/30' : 'from-stellar-blue/20'} to-transparent`} />
                      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-stellar-cyan/60' : 'text-stellar-blue/70'}`}>
                        {group.label}
                      </span>
                      <div className={`h-px flex-1 bg-gradient-to-l ${isDark ? 'from-stellar-cyan/30' : 'from-stellar-blue/20'} to-transparent`} />
                    </div>

                    {/* Nav items */}
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <NavItem key={item.id} item={item} isMobile />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.nav>

              {/* Utility footer with glow divider */}
              <motion.div
                variants={itemVariants}
                className={`relative p-3 border-t ${
                  isDark ? 'border-stellar-cyan/10' : 'border-slate-200/50'
                } flex-shrink-0 space-y-1 z-10`}
              >
                {/* Glow line at top of footer */}
                <div className={`absolute top-0 left-4 right-4 h-px ${
                  isDark
                    ? 'bg-gradient-to-r from-transparent via-stellar-cyan/40 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-stellar-blue/30 to-transparent'
                }`} />

                <NavItem item={utilityItem} isMobile />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <NavItem item={settingsItem} isMobile onClick={onOpenSettings} />
                  </div>
                  <ThemeToggle />
                </div>
              </motion.div>
            </motion.aside>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileDrawer />
    </>
  );
};

export default IconSidebar;
