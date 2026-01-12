// BottomNavItem.jsx v1.4 - LANDSCAPE MODE OPTIMIZATION
// Individual navigation item for mobile bottom navigation bar
//
// FEATURES:
// - Icon + label layout (portrait), icon-only (landscape)
// - Active state with lavpop-blue gradient
// - Touch-optimized (44px+ touch target)
// - Dark mode support
// - Smooth transitions
// - Haptic feedback on tap (v1.1)
// - WCAG compliant text size (12px minimum)
// - Re-tap active tab scrolls to top (v1.3)
// - Landscape mode: smaller icons, hidden labels (v1.4)
//
// CHANGELOG:
// v1.4 (2026-01-12): Landscape mode optimization
//   - Accepts isLandscape prop from BottomNavBar
//   - Reduced touch target in landscape (48x44px vs 64x56px)
//   - Smaller icon container in landscape (32x24px vs 48x32px)
//   - Labels hidden in landscape for maximum content space
//   - Still WCAG compliant (44px minimum touch target)
// v1.3 (2026-01-12): Re-tap scroll-to-top
//   - Re-tapping active tab now scrolls view to top (common iOS/Android pattern)
//   - Haptic feedback on re-tap for tactile confirmation
//   - Prevents navigation when already on active tab
// v1.2 (2026-01-12): WCAG accessibility fix
//   - Changed text-[11px] to text-xs (12px) for minimum text size compliance
// v1.1 (2025-12-18): Added haptic feedback on navigation tap
// v1.0 (2025-12-18): Initial implementation

import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { haptics } from '../../utils/haptics';

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
  const baseClasses = `
    flex flex-col items-center justify-center
    ${isLandscape ? 'min-w-[48px] min-h-[44px] px-1' : 'min-w-[64px] min-h-[56px] px-2'} py-1
    rounded-xl
    transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2
  `;

  const activeClasses = isActive
    ? 'text-lavpop-blue dark:text-blue-400'
    : 'text-slate-500 dark:text-slate-400 active:text-lavpop-blue dark:active:text-blue-400';

  const content = (
    <>
      {/* Icon container - smaller in landscape mode */}
      <div className={`
        relative flex items-center justify-center
        ${isLandscape ? 'w-8 h-6' : 'w-12 h-8'} rounded-2xl
        transition-all duration-200
        ${isActive
          ? 'bg-lavpop-blue/15 dark:bg-blue-500/20'
          : 'group-active:bg-slate-100 dark:group-active:bg-slate-800'
        }
      `}>
        <Icon className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'} transition-transform duration-200 ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
      </div>
      {/* Label - hidden in landscape mode for space efficiency */}
      {!isLandscape && (
        <span className={`
          mt-0.5 text-xs font-semibold leading-tight
          transition-all duration-200
          ${isActive ? 'opacity-100' : 'opacity-80'}
        `}>
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

export default BottomNavItem;
