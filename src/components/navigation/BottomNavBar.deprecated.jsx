// BottomNavBar.jsx v4.2 - PURE COMPONENT (NO CONTEXT USAGE)
// Mobile bottom navigation bar with 5 tabs
//
// FEATURES:
// - 5 primary navigation tabs
// - Fixed position at bottom with safe-area support
// - "Mais" tab opens sidebar drawer for secondary routes
// - Active state with stellar-cyan indicator (INSTANT, no animation)
// - Solid opaque backgrounds
// - Only renders on mobile (< lg breakpoint)
// - Haptic feedback on tap
// - Landscape mode: reduced height, icon-only
// - CSS containment for layout isolation
//
// TABS (matches desktop sidebar order):
// 1. Dashboard (/)
// 2. Clientes (/customers)
// 3. Diretório (/diretorio)
// 4. Campanhas (/campaigns)
// 5. Mais (opens drawer)
//
// CHANGELOG:
// v4.2 (2026-01-27): Pure component - NO context usage (FLICKER FIX)
//   - REMOVED: useSidebar() context - receive onMoreClick as prop
//   - REMOVED: useTheme() context - receive isDark as prop
//   - Component is now a pure function of its props
//   - Context re-renders cannot affect this component anymore
//   - Added CSS containment (contain: layout style paint) for isolation
// v4.1 (2026-01-27): Removed ALL CSS transitions from NavItem
// v4.0 (2026-01-27): Prop-based activeTab + transition disable
// v3.6 (2026-01-25): REMOVED createPortal - fixes page transition flicker

import { useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { haptics } from '../../utils/haptics';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BarChart3, Search, Users, MessageSquare, Menu } from 'lucide-react';

// Navigation items for bottom bar (5 tabs)
const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
  { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
  { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
];

// Routes accessible via "More" drawer
const MORE_ROUTES = ['social', 'weather', 'intelligence', 'operations', 'upload'];

// Inline NavItem component - NO CSS TRANSITIONS, pure function of props
const NavItem = memo(({ id, label, icon: Icon, path, isActive, isLandscape, isButton, onClick, isDark }) => {
  const handleClick = useCallback((e) => {
    if (isActive && !isButton) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    haptics.light();
    onClick?.(e);
  }, [isActive, isButton, onClick]);

  // NO transitions on state-dependent properties
  // Active indicator changes INSTANTLY - no animation means no flicker
  const baseClasses = `flex flex-col items-center justify-center ${isLandscape ? 'min-w-[48px] min-h-[44px] px-1' : 'min-w-[64px] min-h-[56px] px-2'} py-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2`;

  const activeClasses = isActive
    ? 'text-stellar-cyan'
    : isDark
      ? 'text-slate-400 active:text-stellar-cyan'
      : 'text-slate-500 active:text-stellar-cyan';

  const content = (
    <>
      <div className={`relative flex items-center justify-center ${isLandscape ? 'w-8 h-6' : 'w-12 h-8'} rounded-2xl ${isActive ? (isDark ? 'bg-stellar-cyan/20' : 'bg-stellar-cyan/15') : (isDark ? 'group-active:bg-slate-800' : 'group-active:bg-slate-100')}`}>
        <Icon className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'} ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
      </div>
      {!isLandscape && (
        <span className={`mt-0.5 text-xs font-semibold leading-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>
          {label}
        </span>
      )}
    </>
  );

  if (isButton) {
    return (
      <button onClick={handleClick} className={`group ${baseClasses} ${activeClasses}`} aria-label={label}>
        {content}
      </button>
    );
  }

  return (
    <Link to={path} onClick={handleClick} className={`group ${baseClasses} ${activeClasses}`} aria-current={isActive ? 'page' : undefined} aria-label={label}>
      {content}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

NavItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  path: PropTypes.string,
  isActive: PropTypes.bool,
  isLandscape: PropTypes.bool,
  isButton: PropTypes.bool,
  onClick: PropTypes.func,
  isDark: PropTypes.bool,
};

/**
 * BottomNavBar - Mobile navigation bar (PURE COMPONENT)
 *
 * This component is a PURE FUNCTION of its props. It has NO context usage,
 * which means context re-renders during navigation CANNOT trigger re-renders here.
 *
 * All values are passed as props from App.jsx:
 * - activeTab: Current tab ID
 * - isDark: Theme state (from useTheme in App.jsx)
 * - onMoreClick: Handler to open mobile sidebar (from useSidebar in App.jsx)
 *
 * @param {string} activeTab - Current active tab ID from App.jsx
 * @param {boolean} isDark - Theme state from App.jsx (useTheme)
 * @param {function} onMoreClick - Handler to open mobile sidebar
 */
const BottomNavBar = ({ activeTab, isDark, onMoreClick }) => {
  // Only hook: media query for landscape detection (doesn't cause re-renders during navigation)
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');

  // Check if current tab is one of the "More" routes
  const isMoreActive = MORE_ROUTES.includes(activeTab);

  // Wrap more click with haptic feedback
  const handleMoreClick = useCallback(() => {
    haptics.light();
    onMoreClick?.();
  }, [onMoreClick]);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      aria-label="Navegação principal"
      style={{
        height: isLandscape
          ? 'calc(48px + env(safe-area-inset-bottom, 0px))'
          : 'calc(64px + env(safe-area-inset-bottom, 0px))',
        // CSS containment: isolate layout calculations from AnimatePresence
        contain: 'layout style paint',
      }}
    >
      {/* Background - SOLID opaque colors */}
      <div className={`absolute inset-0 ${
        isDark ? 'bg-space-dust' : 'bg-white'
      } border-t ${
        isDark ? 'border-stellar-cyan/15' : 'border-slate-200'
      } ${
        isDark ? 'shadow-[0_-4px_24px_-4px_rgba(0,174,239,0.1)]' : 'shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]'
      }`} />

      {/* Nav content */}
      <div className={`relative flex items-center justify-around ${isLandscape ? 'h-12' : 'h-16'} px-1`}>
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            path={item.path}
            isActive={activeTab === item.id}
            isLandscape={isLandscape}
            isDark={isDark}
          />
        ))}

        <NavItem
          id="more"
          label="Mais"
          icon={Menu}
          isActive={isMoreActive}
          isButton={true}
          onClick={handleMoreClick}
          isLandscape={isLandscape}
          isDark={isDark}
        />
      </div>
    </nav>
  );
};

BottomNavBar.propTypes = {
  /** Current active tab ID from App.jsx */
  activeTab: PropTypes.string.isRequired,
  /** Theme state from App.jsx (useTheme().isDark) */
  isDark: PropTypes.bool.isRequired,
  /** Handler to open mobile sidebar (from useSidebar().toggleMobileSidebar) */
  onMoreClick: PropTypes.func.isRequired,
};

export default memo(BottomNavBar);
