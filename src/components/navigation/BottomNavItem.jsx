// BottomNavItem.jsx v1.9 - REMOVED TRANSITIONING PROP
// Individual navigation item for mobile bottom navigation bar
//
// FEATURES:
// - Icon + label layout (portrait), icon-only (landscape)
// - Active state with stellar-cyan accent
// - Touch-optimized (44px+ touch target)
// - Dark mode support
// - Smooth CSS transitions (always enabled)
// - Haptic feedback on tap
// - WCAG compliant text size (12px minimum)
// - Re-tap active tab scrolls to top
// - Landscape mode: smaller icons, hidden labels
//
// CHANGELOG:
// v1.9 (2026-01-25): Removed transitioning prop
//   - REMOVED: isTransitioning prop (wasn't the cause of flicker)
//   - CSS transitions always enabled - they don't cause flicker
//   - Flicker was caused by context re-renders, now fixed in NavigationContext
// v1.8 (2026-01-25): Transitioning support restored (REVERTED)
// v1.7 (2026-01-25): PropTypes added
// v1.5 (2026-01-16): Theme-aware colors fix
// v1.4 (2026-01-12): Landscape mode optimization
// v1.3 (2026-01-12): Re-tap scroll-to-top
// v1.2 (2026-01-12): WCAG accessibility fix
// v1.1 (2025-12-18): Added haptic feedback on navigation tap
// v1.0 (2025-12-18): Initial implementation

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';

const BottomNavItem = ({
  id,
  label,
  icon: Icon,
  path,
  isActive,
  onClick,
  isButton = false,
  isLandscape = false
}) => {
  const { isDark } = useTheme();

  // Wrap click handler with haptic feedback and re-tap scroll-to-top
  const handleClick = useCallback((e) => {
    if (isActive) {
      // Already on this tab - scroll to top instead of navigating
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      haptics.light(); // Provide tactile feedback for re-tap
    } else {
      // Normal navigation
      haptics.light();
    }
    onClick?.(e);
  }, [isActive, onClick]);

  // Landscape mode: smaller touch targets (still WCAG 44px min)
  // Portrait: 64x56px, Landscape: 48x44px
  const baseClasses = `flex flex-col items-center justify-center ${isLandscape ? 'min-w-[48px] min-h-[44px] px-1' : 'min-w-[64px] min-h-[56px] px-2'} py-1 rounded-xl transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2`;

  const activeClasses = isActive
    ? 'text-stellar-cyan'
    : isDark
      ? 'text-slate-400 active:text-stellar-cyan'
      : 'text-slate-500 active:text-stellar-cyan';

  const content = (
    <>
      {/* Icon container - smaller in landscape mode */}
      <div className={`relative flex items-center justify-center ${isLandscape ? 'w-8 h-6' : 'w-12 h-8'} rounded-2xl transition-colors duration-200 ${isActive ? (isDark ? 'bg-stellar-cyan/20' : 'bg-stellar-cyan/15') : (isDark ? 'group-active:bg-slate-800' : 'group-active:bg-slate-100')}`}>
        <Icon className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'} transition-transform duration-200 ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
      </div>
      {/* Label - hidden in landscape mode for space efficiency */}
      {!isLandscape && (
        <span className={`mt-0.5 text-xs font-semibold leading-tight transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
          {label}
        </span>
      )}
    </>
  );

  // If it's a button (like "More"), render as button
  if (isButton) {
    return (
      <button
        onClick={handleClick}
        className={`group ${baseClasses} ${activeClasses}`}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  // Otherwise, render as Link for proper navigation
  return (
    <Link
      to={path}
      onClick={handleClick}
      className={`group ${baseClasses} ${activeClasses}`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      {content}
    </Link>
  );
};

BottomNavItem.propTypes = {
  /** Unique identifier for the nav item */
  id: PropTypes.string.isRequired,
  /** Display label for the nav item */
  label: PropTypes.string.isRequired,
  /** Lucide icon component */
  icon: PropTypes.elementType.isRequired,
  /** Route path for navigation (required if not isButton) */
  path: PropTypes.string,
  /** Whether this item is currently active */
  isActive: PropTypes.bool,
  /** Click handler (for button mode) */
  onClick: PropTypes.func,
  /** Render as button instead of Link */
  isButton: PropTypes.bool,
  /** Landscape mode - smaller icons, hidden labels */
  isLandscape: PropTypes.bool,
};

export default BottomNavItem;
