// BottomNavBar.jsx v4.1 - FLOATING PILL NAVIGATION
// Modern floating bottom nav with animated pill indicator
// Inspired by BuildUI animated tabs pattern
//
// ARCHITECTURE:
// - Controlled component: receives activeTab, fires onMoreClick
// - Framer Motion `layoutId` for smooth pill transitions
// - Spring physics for natural, bouncy animations
// - Accessible: aria-current, focus-visible, screen reader labels
//
// FEATURES:
// - Floating glassmorphic container with rounded corners
// - Animated pill indicator that slides between tabs
// - Icons + labels with color transitions
// - 48x48px touch targets (Material Design standard)
// - Safe area support for notched devices
// - Reduced motion support
// - Dark/light mode via useTheme()
// - Modal-aware: slides out when modals open
// - Landscape mode: compact height
//
// CHANGELOG:
// v4.1 (2026-01-28): Theme-aware floating shadow
//   - Replaced downward shadow with centered glow for floating effect
//   - Light: subtle black glow - shadow-[0_0_20px_rgba(0,0,0,0.12)]
//   - Dark: stellar cyan glow - shadow-[0_0_24px_rgba(0,174,239,0.15)]
// v4.0 (2026-01-28): Floating Pill Navigation redesign
//   - New floating glassmorphic container design
//   - Added animated pill indicator with Framer Motion layoutId
//   - Spring physics for natural transitions
//   - Preserved all v3.x mobile features

import { memo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';
import { BarChart3, Search, Users, MessageSquare, Menu } from 'lucide-react';

// Navigation configuration - single source of truth
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
  { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
  { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
];

// Routes accessible via "More" drawer
const MORE_ROUTES = ['social', 'weather', 'intelligence', 'operations', 'upload'];

// Module-level flag for one-time entrance animation
let hasPlayedEntrance = false;

// Spring transition config for pill animation
const PILL_SPRING = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.6,
};

// Spring transition for tap feedback
const TAP_SPRING = {
  type: 'spring',
  stiffness: 400,
  damping: 17,
};

/**
 * NavItem - Individual navigation button with animated pill
 * Memoized to prevent re-renders during navigation
 */
const NavItem = memo(({
  label,
  icon: Icon,
  path,
  isActive,
  isButton,
  onClick,
  isDark,
  reducedMotion,
}) => {
  const handleClick = useCallback((e) => {
    // Re-tap active tab = scroll to top
    if (isActive && !isButton) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    haptics.light();
    onClick?.(e);
  }, [isActive, isButton, onClick, reducedMotion]);

  const content = (
    <motion.div
      className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl"
      whileTap={reducedMotion ? {} : { scale: 0.92 }}
      transition={TAP_SPRING}
    >
      {/* Animated pill background - only renders on active item */}
      {isActive && (
        <motion.div
          layoutId="navPill"
          className={`absolute inset-0 rounded-xl ${
            isDark
              ? 'bg-stellar-cyan/15 border border-stellar-cyan/20'
              : 'bg-stellar-cyan/10 border border-stellar-cyan/15'
          }`}
          initial={false}
          transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
        />
      )}

      {/* Icon */}
      <Icon
        className={`relative z-10 w-5 h-5 transition-colors duration-200 ${
          isActive
            ? 'text-stellar-cyan'
            : isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
        strokeWidth={isActive ? 2.25 : 2}
      />

      {/* Label */}
      <span className={`relative z-10 text-[10px] font-medium transition-colors duration-200 ${
        isActive
          ? 'text-stellar-cyan'
          : isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {label}
      </span>
    </motion.div>
  );

  // Common wrapper classes
  const baseClasses = `
    relative flex items-center justify-center
    min-w-12 min-h-12
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
    ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'}
  `;

  if (isButton) {
    return (
      <button
        onClick={handleClick}
        className={baseClasses}
        aria-label={label}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={path}
      onClick={handleClick}
      className={baseClasses}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      {content}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

NavItem.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  path: PropTypes.string,
  isActive: PropTypes.bool,
  isButton: PropTypes.bool,
  onClick: PropTypes.func,
  isDark: PropTypes.bool,
  reducedMotion: PropTypes.bool,
};

/**
 * BottomNavBar - Floating pill navigation
 *
 * @param {string} activeTab - Current tab ID from parent
 * @param {function} onMoreClick - Handler for "More" button
 */
const BottomNavBar = ({ activeTab, onMoreClick }) => {
  const { isDark } = useTheme();
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  const reducedMotion = useReducedMotion();

  // Track entrance animation (one-time per session)
  const [showEntrance, setShowEntrance] = useState(!hasPlayedEntrance && !reducedMotion);

  useEffect(() => {
    if (showEntrance) {
      const timer = setTimeout(() => {
        hasPlayedEntrance = true;
        setShowEntrance(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showEntrance]);

  const isMoreActive = MORE_ROUTES.includes(activeTab);

  // Entrance animation variants
  const containerVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 260, damping: 20 },
    },
  };

  return (
    <motion.nav
      className="bottom-nav-container lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-2"
      style={{ paddingBottom: `max(env(safe-area-inset-bottom, 8px), 8px)` }}
      aria-label="Navegação principal"
      initial={showEntrance ? 'hidden' : false}
      animate="visible"
      variants={containerVariants}
    >
      {/* Floating glassmorphic container */}
      <div className={`
        flex items-center justify-around
        ${isLandscape ? 'py-1.5' : 'py-2'}
        rounded-2xl
        ${isDark
          ? 'bg-space-dust/85 border border-white/10 shadow-[0_0_24px_rgba(0,174,239,0.15)]'
          : 'bg-white/90 border border-slate-200/80 shadow-[0_0_20px_rgba(0,0,0,0.12)]'
        }
        backdrop-blur-xl
      `}>
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            {...item}
            isActive={activeTab === item.id}
            isDark={isDark}
            reducedMotion={reducedMotion}
          />
        ))}

        {/* More button */}
        <NavItem
          label="Mais"
          icon={Menu}
          isActive={isMoreActive}
          isButton
          onClick={onMoreClick}
          isDark={isDark}
          reducedMotion={reducedMotion}
        />
      </div>
    </motion.nav>
  );
};

BottomNavBar.propTypes = {
  /** Current active tab ID from App.jsx */
  activeTab: PropTypes.string.isRequired,
  /** Handler to open mobile sidebar (from useSidebar().toggleMobileSidebar) */
  onMoreClick: PropTypes.func.isRequired,
};

export default memo(BottomNavBar);
