// IconSidebar.jsx v5.8 - ORBITAL COMMAND CENTER (Brand Home)
// Bold, distinctive sidebar with cosmic mission control aesthetics
// SIDEBAR OWNS THE BRAND - full logo when expanded, icon when collapsed
//
// DESIGN CONCEPT: "Orbital Command Center"
// - Full horizontal logo in header (theme-aware SVG)
// - Orbital icon when collapsed for brand recognition
// - Orbital active indicator with layoutId animations
// - Constellation dividers between nav groups
// - Gravitational hover effects with glow bloom
// - Cinematic mobile drawer with staggered reveals
// - Smooth swipe-to-close with velocity-aware animation
// - Noise texture for depth and sophistication
//
// ARCHITECTURE (v5.7):
// - MobileDrawer extracted as standalone component (fixes gesture interruption)
// - DesktopSidebar extracted as standalone component (consistent pattern)
// - NavItem extracted as standalone component (shared by both sidebars)
// - Components have stable references (no remount on parent re-render)
// - Drag enabled only after entry animation completes (fixes DevTools gesture issues)
//
// CHANGELOG:
// v5.8 (2026-01-31): Removed ThemeToggle from mobile drawer
//   - ThemeToggle now lives in MinimalTopBar (visible on all screens)
//   - Cleaner footer layout without flex wrapper
// v5.7 (2026-01-30): Removed pull-down-to-close feature
//   - Removed pullReady state and pull-down gesture handlers
//   - Removed drag handle element (cleaner UI)
//   - Swipe-left-to-close is the standard gesture for side drawers
// v5.6 (2026-01-30): Fixed swipe gesture unresponsiveness
//   - Added isEntryAnimationComplete state to delay drag enable
//   - Removed dragDirectionLock (causes issues in DevTools emulation)
//   - Fixed touchAction CSS (none on drawer, pan-y on nav)
//   - Added pointer event capture for DevTools compatibility
//   - Added performance hints (willChange, backfaceVisibility)
//   - FocusTrap only activates after animation completes
// v5.5 (2026-01-30): Fixed gesture interruption (component extraction)
//   - Root cause: Inner components defined inside IconSidebar caused remounts
//   - Fix: Extracted MobileDrawer, DesktopSidebar, NavItem as standalone components
//   - Result: Hooks and motion values persist across parent re-renders
//   - Gestures no longer break mid-drag
// v5.4.2 (2026-01-30): Fixed motion value conflicts
//   - Fixed: Backdrop now responds to drag (removed conflicting animate prop)
//   - Fixed: Drawer no longer flashes on open (x initialized to -320)
//   - Result: Gestures and visual feedback now work correctly
// v5.4.1 (2026-01-30): Fixed gesture conflicts
//   - Fixed: Swipe-to-close and pull-down-to-close no longer fight each other
//   - Added: onPointerDownCapture to pull handle to stop event propagation
//   - Added: dragDirectionLock to main drawer for faster direction detection
//   - Result: Gestures are now properly isolated
// v5.4 (2026-01-30): Smooth swipe-to-close animation
//   - Fixed: Drawer no longer "starts slowly and stops halfway" during swipe
//   - Root cause: 3-way conflict between animate/exit/dragSnapToOrigin
//   - Solution: useMotionValue for x position (single source of truth)
//   - Added: useTransform for real-time opacity/scale feedback during drag
//   - Added: Velocity-aware close animation (uses swipe momentum)
//   - Added: Visual feedback during swipe (drawer fades + scales)
//   - Removed: animate/exit props and dragSnapToOrigin (handled manually)
//   - Close button now uses imperative animation before state change
// v5.3.1 (2026-01-30): Fixed pull handle snap-back
//   - Fixed: Pull handle now always snaps back when cancelled mid-drag
//   - Removed conditional dragSnapToOrigin (was causing snap-back failure)
//   - Simplified pull handle state (only pullReady for visual feedback)
// v5.3 (2026-01-30): Enhanced gesture feedback
//   - Enhanced haptics: success() for slow close, medium() for fast flick
//   - Pull threshold feedback: handle glows + tick haptic at 40px
//   - Increased dragElastic to 0.2 for bouncier feel
//   - Consistent dragSnapToOrigin pattern for pull handle
//   - Added touch-action: pan-y in style for iOS compatibility
// v5.2.1 (2026-01-30): Fixed swipe gesture conflicts
//   - Fixed: Removed motion value conflicts with animate props
//   - Fixed: Isolated pull-down gesture from horizontal swipe
//   - Added dragSnapToOrigin for proper snap-back behavior
//   - Added touch-action CSS for better gesture isolation
// v5.2 (2026-01-29): Mobile UX improvements
//   - NEW: Swipe-to-close gesture (swipe left to close)
//   - NEW: Pull-down-to-close handle at top of drawer
//   - Enhanced drawer entrance animation with scale
//   - Improved glassmorphism with saturate filter
//   - Uses NAV_MICRO presets from animations.js
// v5.1 (2026-01-29): Brand consolidation - sidebar is now brand home
//   - NEW: Full SVG logos (Color/White based on theme) when expanded
//   - NEW: Orbital icon only when collapsed
//   - REMOVED: "BILAV" + "NOVA" text (logo has wordmark)
//   - REMOVED: "Business Intelligence" subtitle (cleaner look)
//   - Breathing glow animation behind logo
// v5.0 (2026-01-28): Complete redesign with Orbital Command aesthetics
//   - Orbital active indicator with pulse dot
//   - Constellation dot dividers that twinkle
//   - Geometric section headers with gradient lines
//   - Mobile drawer with staggered animations
// v4.0 (2026-01-23): Settings button integration
// v3.x: Previous implementations

import { useRef, useEffect, useCallback, memo, useState } from 'react';
import { BarChart3, Users, TrendingUp, Settings, MessageSquare, Upload, Search, Pin, PinOff, Share2, CloudSun, X, Wrench, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useSidebar } from '../contexts/SidebarContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollLock } from '../hooks/useScrollLock';
import { useTheme } from '../contexts/ThemeContext';
import { NAV_MICRO } from '../constants/animations';
import { haptics } from '../utils/haptics';
import RealtimeStatusIndicator from './ui/RealtimeStatusIndicator';

// Brand logos - Full horizontal SVG for expanded state
import ColorLogo from '../assets/Logo Files/svg/Color logo - no background.svg';
import WhiteLogo from '../assets/Logo Files/svg/White logo - no background.svg';

// Orbital icon for collapsed state (works on any background)
const OrbitalIcon = '/pwa-192x192.png';

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

// Mobile drawer variants - enhanced v5.2 with scale
const drawerVariants = {
  hidden: {
    x: -320,
    opacity: 0.5,
    scale: 0.95,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 250,
      staggerChildren: 0.02,
      delayChildren: 0.05,
    }
  },
  exit: {
    x: -320,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.25, ease: 'easeIn' }
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


/**
 * NavItem - Extracted navigation item component (stable reference)
 * Props-based to avoid closure issues when parent re-renders
 */
const NavItem = memo(({
  item,
  isMobile = false,
  onClick,
  activeTab,
  isExpanded,
  isDark,
  prefersReducedMotion,
  onNavigate, // handleMobileNavigate or handleDesktopNavigate
}) => {
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
          if (isMobile) onNavigate?.();
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
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={baseClasses}
        title={(!isExpanded && !isMobile) ? item.label : undefined}
      >
        {content}
      </Link>
    </motion.div>
  );
});

NavItem.displayName = 'NavItem';


/**
 * MobileDrawer - Extracted mobile drawer component (stable reference)
 * This component MUST be defined outside IconSidebar to prevent gesture interruption.
 * When defined inside, every parent re-render creates a new function reference,
 * causing React to unmount/remount, which resets useMotionValue and breaks gestures.
 */
const MobileDrawer = memo(({
  isMobileOpen,
  closeMobileSidebar,
  isDark,
  prefersReducedMotion,
  activeTab,
  onOpenSettings,
  handleMobileNavigate,
}) => {
  // Track if entry animation is complete (enables drag gestures)
  // This fixes issues where drag wouldn't register in DevTools emulation
  const [isEntryAnimationComplete, setIsEntryAnimationComplete] = useState(false);

  // Motion value for x position - single source of truth (no animate/exit conflicts)
  // Initialize to -320 (offscreen) so drawer doesn't flash on mount
  const x = useMotionValue(-320);

  // Visual feedback transforms - opacity and scale change as user drags
  const drawerOpacity = useTransform(x, [-320, 0], [0.5, 1]);
  const drawerScale = useTransform(x, [-320, 0], [0.95, 1]);
  const backdropOpacity = useTransform(x, [-320, 0], [0, 0.6]);

  // Entry animation - animate x from -320 to 0 when drawer opens
  // Drag is only enabled after animation completes (fixes DevTools gesture issues)
  useEffect(() => {
    if (isMobileOpen) {
      // Reset state when drawer opens
      setIsEntryAnimationComplete(false);
      // x is already at -320 (either from initialization or close animation)
      // Animate to open position with onComplete callback
      animate(x, 0, prefersReducedMotion ? { duration: 0 } : {
        type: 'spring',
        damping: 25,
        stiffness: 250,
        onComplete: () => setIsEntryAnimationComplete(true),
      });
      // For reduced motion, enable drag immediately
      if (prefersReducedMotion) {
        setIsEntryAnimationComplete(true);
      }
    } else {
      // Reset when drawer closes
      setIsEntryAnimationComplete(false);
    }
  }, [isMobileOpen, prefersReducedMotion, x]);

  // Handle horizontal swipe to close
  // AnimatePresence handles exit animation via exit prop
  // Close state immediately so BottomNavBar animates in parallel
  const handleDragEnd = useCallback((_, info) => {
    const { CLOSE_THRESHOLD, VELOCITY_THRESHOLD } = NAV_MICRO.DRAWER_SWIPE;
    const currentX = x.get();

    // Determine if we should close
    const shouldClose =
      info.velocity.x < -VELOCITY_THRESHOLD ||  // Fast flick
      currentX < -CLOSE_THRESHOLD;              // Dragged past threshold

    if (shouldClose) {
      // Haptic feedback
      if (info.velocity.x < -VELOCITY_THRESHOLD) {
        haptics.medium(); // Fast flick = stronger feedback
      } else {
        haptics.success(); // Slow drag = success pattern
      }

      // Close immediately - AnimatePresence handles exit animation
      // BottomNavBar starts animating in parallel (coordinated spring physics)
      closeMobileSidebar();
    } else {
      // Snap back to open position
      animate(x, 0, prefersReducedMotion ? { duration: 0 } : {
        type: 'spring',
        damping: 25,
        stiffness: 400,
      });
    }
  }, [closeMobileSidebar, prefersReducedMotion, x]);

  // Handle close button click - close immediately, AnimatePresence handles exit
  const handleCloseButton = useCallback(() => {
    haptics.light();
    closeMobileSidebar();
  }, [closeMobileSidebar]);

  // Handle backdrop click - close immediately, AnimatePresence handles exit
  const handleBackdropClick = useCallback(() => {
    closeMobileSidebar();
  }, [closeMobileSidebar]);

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Dark overlay backdrop */}
          {/* AnimatePresence handles exit animation for coordinated close with BottomNavBar */}
          <motion.div
            className="lg:hidden fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 250 }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Drawer with cinematic entrance and swipe gestures */}
          {/* FocusTrap only activates after animation to avoid gesture interference */}
          <FocusTrap
            active={isMobileOpen && isEntryAnimationComplete}
            focusTrapOptions={{
              allowOutsideClick: true,
              escapeDeactivates: true,
              onDeactivate: closeMobileSidebar,
              initialFocus: false,
              returnFocusOnDeactivate: true,
            }}
          >
            <motion.aside
              className={`lg:hidden fixed left-0 top-0 bottom-0 w-[300px] z-50 rounded-r-3xl shadow-2xl flex flex-col safe-area-top safe-area-bottom safe-area-left overflow-hidden backdrop-blur-xl backdrop-saturate-150`}
              style={{
                // Motion values control position and visual feedback during drag
                x,
                opacity: drawerOpacity,
                scale: drawerScale,
                transformOrigin: 'left center',
                // touchAction: none lets Framer Motion control all gestures on the drawer
                // Inner scrollable content has touchAction: pan-y for vertical scroll
                touchAction: 'none',
                // Performance hints for smoother animations
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                background: isDark
                  ? 'linear-gradient(180deg, rgba(10,15,30,0.98) 0%, rgba(5,8,22,0.99) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.99) 100%)',
                boxShadow: isDark
                  ? 'inset -1px 0 0 rgba(0,174,239,0.1), 8px 0 32px rgba(0,0,0,0.5)'
                  : 'inset -1px 0 0 rgba(0,0,0,0.05), 8px 0 32px rgba(0,0,0,0.15)',
              }}
              // Exit animation for AnimatePresence - coordinates with BottomNavBar
              exit={{
                x: -320,
                opacity: 0,
                scale: 0.95,
                transition: prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }
              }}
              // Drag only enabled after entry animation completes
              // NO dragSnapToOrigin - handled manually in onDragEnd
              // NO dragDirectionLock - causes issues in DevTools emulation
              drag={isEntryAnimationComplete ? "x" : false}
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={{ left: 0.2, right: 0 }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              // Pointer event capture for DevTools emulation compatibility
              onPointerDown={(e) => {
                if (isEntryAnimationComplete) {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
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

              {/* Header - taller to showcase the brand */}
              <div className={`relative h-[64px] px-4 flex items-center justify-between border-b ${
                isDark ? 'border-stellar-cyan/10' : 'border-slate-200/50'
              } flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  {/* Full horizontal logo with enhanced glow */}
                  <div className="relative py-1">
                    <motion.div
                      className={`absolute -inset-3 rounded-2xl blur-2xl ${
                        isDark ? 'bg-stellar-cyan/30' : 'bg-stellar-blue/20'
                      }`}
                      animate={prefersReducedMotion ? {} : {
                        opacity: [0.4, 0.7, 0.4],
                        scale: [0.92, 1.05, 0.92]
                      }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <img
                      src={isDark ? WhiteLogo : ColorLogo}
                      alt="Bilavnova"
                      className="relative h-9 w-auto max-w-[160px] object-contain"
                    />
                  </div>
                  <RealtimeStatusIndicator />
                </div>

                {/* Close button with spin animation */}
                <motion.button
                  onClick={handleCloseButton}
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
              {/* touchAction: pan-y allows vertical scrolling inside drawer */}
              <motion.nav
                className="relative flex-1 py-4 px-3 overflow-y-auto z-10"
                style={{ touchAction: 'pan-y' }}
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
                        <NavItem
                          key={item.id}
                          item={item}
                          isMobile
                          activeTab={activeTab}
                          isExpanded={true}
                          isDark={isDark}
                          prefersReducedMotion={prefersReducedMotion}
                          onNavigate={handleMobileNavigate}
                        />
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

                <NavItem
                  item={utilityItem}
                  isMobile
                  activeTab={activeTab}
                  isExpanded={true}
                  isDark={isDark}
                  prefersReducedMotion={prefersReducedMotion}
                  onNavigate={handleMobileNavigate}
                />
                <NavItem
                  item={settingsItem}
                  isMobile
                  onClick={onOpenSettings}
                  activeTab={activeTab}
                  isExpanded={true}
                  isDark={isDark}
                  prefersReducedMotion={prefersReducedMotion}
                  onNavigate={handleMobileNavigate}
                />
              </motion.div>
            </motion.aside>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>
  );
});

MobileDrawer.displayName = 'MobileDrawer';


/**
 * DesktopSidebar - Extracted desktop sidebar component (stable reference)
 */
const DesktopSidebar = memo(({
  isDark,
  prefersReducedMotion,
  isExpanded,
  isPinned,
  togglePinned,
  setIsHovered,
  activeTab,
  onOpenSettings,
  handleDesktopNavigate,
}) => (
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
        {/* Brand Logo - Full SVG when expanded, Orbital icon when collapsed */}
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative py-1"
          >
            {/* Enhanced breathing glow behind logo */}
            <motion.div
              className={`absolute -inset-3 rounded-2xl blur-2xl ${
                isDark ? 'bg-stellar-cyan/30' : 'bg-stellar-blue/20'
              }`}
              animate={prefersReducedMotion ? {} : {
                opacity: [0.4, 0.7, 0.4],
                scale: [0.92, 1.05, 0.92]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Full horizontal logo - larger and more prominent */}
            <img
              src={isDark ? WhiteLogo : ColorLogo}
              alt="Bilavnova"
              className="relative h-9 w-auto max-w-[185px] object-contain"
            />
          </motion.div>
        ) : (
          <div className="relative flex-shrink-0">
            {/* Glow behind orbital icon */}
            <div className={`absolute inset-0 rounded-full scale-150 blur-xl ${
              isDark ? 'bg-stellar-cyan/30' : 'bg-stellar-blue/20'
            }`} />
            {/* Orbital icon only */}
            <img
              src={OrbitalIcon}
              alt="Bilavnova"
              className="relative w-8 h-8 object-contain"
            />
          </div>
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
              <NavItem
                key={item.id}
                item={item}
                activeTab={activeTab}
                isExpanded={isExpanded}
                isDark={isDark}
                prefersReducedMotion={prefersReducedMotion}
                onNavigate={handleDesktopNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Utility Items (Importar + Settings) */}
    <div className={`relative py-3 px-2 border-t ${
      isDark ? 'border-stellar-cyan/10' : 'border-slate-200/50'
    } flex-shrink-0 space-y-1 z-10`}>
      <NavItem
        item={utilityItem}
        activeTab={activeTab}
        isExpanded={isExpanded}
        isDark={isDark}
        prefersReducedMotion={prefersReducedMotion}
        onNavigate={handleDesktopNavigate}
      />
      <NavItem
        item={settingsItem}
        onClick={onOpenSettings}
        activeTab={activeTab}
        isExpanded={isExpanded}
        isDark={isDark}
        prefersReducedMotion={prefersReducedMotion}
        onNavigate={handleDesktopNavigate}
      />
    </div>
  </motion.aside>
));

DesktopSidebar.displayName = 'DesktopSidebar';


const IconSidebar = ({ activeTab, onNavigate, onOpenSettings }) => {
  const { isHovered, setIsHovered, isMobileOpen, setIsMobileOpen, toggleMobileSidebar, isPinned, togglePinned } = useSidebar();
  const prefersReducedMotion = useReducedMotion();
  const { isDark } = useTheme();
  const collapseTimeoutRef = useRef(null);

  // Lock scroll and hide BottomNavBar when mobile drawer is open
  // Pass true for isSidebar to add 'sidebar-open' class for Framer Motion coordination
  useScrollLock(isMobileOpen, true);

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
  const handleDesktopNavigate = useCallback(() => {
    if (!isPinned) {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      collapseTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  }, [isPinned, setIsHovered]);

  // Memoize handleMobileNavigate to prevent unnecessary re-renders
  const handleMobileNavigateCallback = useCallback(() => {
    if (isMobileOpen) {
      closeMobileSidebar();
    }
  }, [isMobileOpen, closeMobileSidebar]);

  return (
    <>
      <DesktopSidebar
        isDark={isDark}
        prefersReducedMotion={prefersReducedMotion}
        isExpanded={isExpanded}
        isPinned={isPinned}
        togglePinned={togglePinned}
        setIsHovered={setIsHovered}
        activeTab={activeTab}
        onOpenSettings={onOpenSettings}
        handleDesktopNavigate={handleDesktopNavigate}
      />
      <MobileDrawer
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={closeMobileSidebar}
        isDark={isDark}
        prefersReducedMotion={prefersReducedMotion}
        activeTab={activeTab}
        onOpenSettings={onOpenSettings}
        handleMobileNavigate={handleMobileNavigateCallback}
      />
    </>
  );
};

export default IconSidebar;
