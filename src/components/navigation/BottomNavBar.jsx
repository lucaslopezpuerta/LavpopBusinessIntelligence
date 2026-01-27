// BottomNavBar.jsx v3.0 - MINIMALIST STELLAR NAVIGATION
// Clean implementation following React Navigation best practices
// https://reactnavigation.org/docs/bottom-tab-navigator/
//
// ARCHITECTURE:
// - Controlled component: receives activeTab, fires onMoreClick
// - Pure presentational: no internal routing logic
// - CSS-only animations: no Framer Motion dependencies
// - Accessible: aria-current, focus-visible, screen reader labels
//
// FEATURES:
// - Icons only with label on active item
// - Subtle glow effect on active state
// - 48x48px touch targets (Material Design standard)
// - Safe area support for notched devices
// - Reduced motion support
// - Dark/light mode via useTheme()
//
// CHANGELOG:
// v3.0 (2026-01-27): Clean start - Minimalist Stellar design
//   - Built from scratch following industry best practices
//   - Removed all legacy code and workarounds
//   - CSS-only animations for reliability

import { memo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

/**
 * NavItem - Individual navigation button
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
  reducedMotion
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
    <div className="flex flex-col items-center justify-center gap-0.5">
      {/* Icon with glow when active */}
      <div className={`
        transition-all duration-200
        ${isActive ? 'stellar-glow scale-110' : 'scale-100'}
      `}>
        <Icon
          className={`w-6 h-6 transition-colors duration-200
            ${isActive ? 'text-stellar-cyan' : isDark ? 'text-slate-500' : 'text-slate-400'}
          `}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </div>

      {/* Label - always visible */}
      <span className={`
        text-[10px] font-medium transition-colors duration-200
        ${isActive ? 'text-stellar-cyan' : isDark ? 'text-slate-500' : 'text-slate-400'}
      `}>
        {label}
      </span>
    </div>
  );

  // Common button/link classes
  const baseClasses = `
    flex items-center justify-center
    min-w-12 min-h-12
    rounded-xl
    transition-transform duration-100
    active:scale-95
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
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
 * BottomNavBar - Minimalist stellar navigation
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showEntrance]);

  const isMoreActive = MORE_ROUTES.includes(activeTab);

  return (
    <nav
      className={`
        lg:hidden fixed bottom-0 inset-x-0 z-40
        ${showEntrance ? 'nav-entrance' : ''}
      `}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navegação principal"
    >
      {/* Navigation container */}
      <div className={`
        nav-top-fade
        ${isDark ? 'bg-space-void/90' : 'bg-white/95'}
        backdrop-blur-lg
        flex items-center justify-around
        ${isLandscape ? 'h-12 py-1' : 'h-16 py-2'}
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
    </nav>
  );
};

BottomNavBar.propTypes = {
  /** Current active tab ID from App.jsx */
  activeTab: PropTypes.string.isRequired,
  /** Handler to open mobile sidebar (from useSidebar().toggleMobileSidebar) */
  onMoreClick: PropTypes.func.isRequired,
};

export default memo(BottomNavBar);
