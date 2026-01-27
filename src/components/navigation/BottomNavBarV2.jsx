// BottomNavBarV2.jsx v2.4 - CSS-ONLY GLASSMORPHISM FLOATING PILL
// Modern bottom navigation with CSS transitions (NO Framer Motion)
//
// FEATURES:
// - Floating pill design with glassmorphism (backdrop-blur, semi-transparent)
// - CSS-based active indicator (no layoutId conflicts with AnimatePresence)
// - Icon transitions via CSS transform (hover, active states)
// - Container entrance via pure CSS classes (no inline animated properties)
// - Accessibility: useReducedMotion support
// - Theme: useTheme() directly (safe - memoized context)
// - Anti-flicker: ZERO Framer Motion usage = ZERO conflicts with page transitions
//
// ARCHITECTURE:
// - Props: activeTab (from App.jsx), onMoreClick (sidebar handler)
// - Hooks: useTheme, useMediaQuery, useReducedMotion (all safe)
// - Rendered OUTSIDE AnimatePresence in App.jsx for isolation
// - Uses ONLY CSS classes for opacity/transform (never inline styles)
// - animationend event + module-level flag ensures one-time animation
//
// CHANGELOG:
// v2.4 (2026-01-27): Pure CSS classes for animation states
//   - REMOVED inline opacity/transform styles (caused animation conflicts)
//   - Added .bottom-nav-visible and .bottom-nav-animating CSS classes
//   - Uses animationend event to detect completion
//   - Module-level flag + React state for proper sync
// v2.3 (2026-01-27): Module-level flag (still had inline style conflicts)
// v2.2 (2026-01-27): CSS class approach (still restarted)
// v2.1 (2026-01-27): Global keyframes (partial fix)
// v2.0 (2026-01-27): CSS-only rewrite
// v1.0 (2026-01-27): Initial Framer Motion implementation

import { memo, useCallback, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';
import { BarChart3, Search, Users, MessageSquare, Menu } from 'lucide-react';

// Module-level flag - persists across component remounts within the same session
// This ensures the entrance animation only plays ONCE per page load
let hasPlayedEntranceAnimation = false;

// Navigation items for bottom bar (5 tabs total: 4 direct + 1 "More")
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
  { id: 'diretorio', label: 'Diretório', icon: Search, path: '/diretorio' },
  { id: 'campaigns', label: 'Campanhas', icon: MessageSquare, path: '/campaigns' },
];

// Routes accessible via "More" drawer (secondary navigation)
const MORE_ROUTES = ['social', 'weather', 'intelligence', 'operations', 'upload'];

// Get index of active tab for indicator positioning
const getActiveIndex = (activeTab, isMoreActive) => {
  if (isMoreActive) return 4; // "More" is always index 4
  const index = NAV_ITEMS.findIndex(item => item.id === activeTab);
  return index >= 0 ? index : 0;
};

/**
 * NavItem - Individual navigation item with CSS transitions
 * Memoized to prevent unnecessary re-renders during page transitions
 */
const NavItem = memo(({
  id: _id,
  label,
  icon: Icon,
  path,
  isActive,
  isLandscape,
  isButton,
  onClick,
  isDark,
  reducedMotion
}) => {
  // Memoized click handler
  const handleClick = useCallback((e) => {
    // Re-tap active tab scrolls to top
    if (isActive && !isButton) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    haptics.light();
    onClick?.(e);
  }, [isActive, isButton, onClick]);

  // CSS transition duration based on reduced motion preference
  const transitionStyle = reducedMotion
    ? { transition: 'none' }
    : { transition: 'transform 150ms ease-out, opacity 150ms ease-out' };

  const content = (
    <div className="relative flex flex-col items-center justify-center p-2">
      {/* Icon with CSS transitions */}
      <div
        className="relative z-10"
        style={{
          ...transitionStyle,
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
          opacity: isActive ? 1 : 0.6,
        }}
      >
        <Icon className={isLandscape ? 'w-5 h-5' : 'w-6 h-6'} />
      </div>

      {/* Label (hidden in landscape mode for compact design) */}
      {!isLandscape && (
        <span
          className="mt-1 text-xs font-medium"
          style={{
            ...transitionStyle,
            opacity: isActive ? 1 : 0.7,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );

  // Base classes for touch targets and styling
  const baseClasses = `
    relative flex items-center justify-center
    ${isLandscape ? 'min-w-[52px] min-h-[44px]' : 'min-w-[64px] min-h-[56px]'}
    rounded-xl
    ${isActive ? 'text-stellar-cyan' : isDark ? 'text-slate-400' : 'text-slate-500'}
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
    active:scale-95
  `;

  // Render as button for "More" tab (opens drawer)
  if (isButton) {
    return (
      <button
        onClick={handleClick}
        className={baseClasses}
        style={reducedMotion ? undefined : { transition: 'transform 100ms ease-out' }}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  // Render as Link for navigation tabs
  return (
    <Link
      to={path}
      onClick={handleClick}
      className={baseClasses}
      style={reducedMotion ? undefined : { transition: 'transform 100ms ease-out' }}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
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
  reducedMotion: PropTypes.bool,
};

/**
 * BottomNavBarV2 - Glassmorphism floating pill navigation (CSS-only)
 *
 * Rendered OUTSIDE AnimatePresence in App.jsx for complete isolation
 * from page transitions. Uses ONLY CSS for animations - no Framer Motion.
 *
 * @param {string} activeTab - Current active tab ID from App.jsx
 * @param {function} onMoreClick - Handler to open mobile sidebar drawer
 */
const BottomNavBarV2 = ({ activeTab, onMoreClick }) => {
  // Hooks - all safe to use (memoized values, don't change during navigation)
  const { isDark } = useTheme();
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');
  const reducedMotion = useReducedMotion();

  // Check if current tab is one of the "More" routes
  const isMoreActive = MORE_ROUTES.includes(activeTab);

  // Calculate indicator position (0-4 for 5 items)
  const activeIndex = getActiveIndex(activeTab, isMoreActive);

  // Memoized handler for "More" button
  const handleMoreClick = useCallback(() => {
    haptics.light();
    onMoreClick?.();
  }, [onMoreClick]);

  // CSS transition for indicator
  const indicatorTransition = reducedMotion
    ? 'none'
    : 'left 200ms cubic-bezier(0.4, 0, 0.2, 1)';

  // Ref for the nav element
  const navRef = useRef(null);

  // Track animation completion with React state (synced with module-level flag)
  const [animationComplete, setAnimationComplete] = useState(hasPlayedEntranceAnimation);

  // Listen for animation end to switch from animating to visible class
  useEffect(() => {
    const nav = navRef.current;
    // Skip if already animated or reduced motion
    if (!nav || hasPlayedEntranceAnimation || reducedMotion) return;

    const handleAnimationEnd = () => {
      hasPlayedEntranceAnimation = true;
      setAnimationComplete(true);
    };

    nav.addEventListener('animationend', handleAnimationEnd);
    return () => nav.removeEventListener('animationend', handleAnimationEnd);
  }, [reducedMotion]);

  // Determine CSS class: visible (post-animation/reduced motion) or animating
  const animationClass = animationComplete || reducedMotion
    ? 'bottom-nav-visible'
    : 'bottom-nav-animating';

  return (
    <nav
      ref={navRef}
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 ${animationClass}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // ANTI-FLICKER: CSS containment isolates from page reflows
        contain: 'layout style paint',
        // ANTI-FLICKER: Hint GPU acceleration
        willChange: animationComplete ? 'auto' : 'transform',
        // NO opacity or transform here - handled entirely by CSS classes
      }}
      aria-label="Navegação principal"
    >
      {/* Floating glassmorphism pill */}
      <div
        className={`
          mb-4 rounded-3xl relative
          ${isDark ? 'bg-space-dust/80' : 'bg-white/90'}
          backdrop-blur-xl
          border ${isDark ? 'border-stellar-cyan/25' : 'border-slate-200/60'}
          shadow-xl
          flex items-center justify-around
          ${isLandscape ? 'h-14' : 'h-16'}
        `}
      >
        {/* Sliding active indicator - CSS positioned */}
        <div
          className={`
            absolute rounded-2xl pointer-events-none
            ${isDark ? 'bg-stellar-cyan/20' : 'bg-stellar-cyan/15'}
          `}
          style={{
            transition: indicatorTransition,
            // Position indicator based on active index (20% width per item, 5 items)
            left: `calc(${activeIndex * 20}% + 4px)`,
            width: 'calc(20% - 8px)',
            top: '4px',
            bottom: '4px',
          }}
          aria-hidden="true"
        />

        {/* Primary navigation items */}
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            {...item}
            isActive={activeTab === item.id}
            isLandscape={isLandscape}
            isDark={isDark}
            reducedMotion={reducedMotion}
          />
        ))}

        {/* "More" button - opens sidebar drawer */}
        <NavItem
          id="more"
          label="Mais"
          icon={Menu}
          isActive={isMoreActive}
          isButton
          onClick={handleMoreClick}
          isLandscape={isLandscape}
          isDark={isDark}
          reducedMotion={reducedMotion}
        />
      </div>
    </nav>
  );
};

BottomNavBarV2.propTypes = {
  /** Current active tab ID from App.jsx */
  activeTab: PropTypes.string.isRequired,
  /** Handler to open mobile sidebar (from useSidebar().toggleMobileSidebar) */
  onMoreClick: PropTypes.func.isRequired,
};

export default memo(BottomNavBarV2);
