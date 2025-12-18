// BottomNavItem.jsx v1.1 - HAPTIC FEEDBACK
// Individual navigation item for mobile bottom navigation bar
//
// FEATURES:
// - Icon + label layout
// - Active state with lavpop-blue gradient
// - Touch-optimized (44px+ touch target)
// - Dark mode support
// - Smooth transitions
// - Haptic feedback on tap (v1.1)
//
// CHANGELOG:
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
  isButton = false
}) => {
  // Wrap click handler with haptic feedback
  const handleClick = useCallback((e) => {
    // Only trigger haptics if not already active (avoid feedback on re-tap)
    if (!isActive) {
      haptics.light();
    }
    onClick?.(e);
  }, [isActive, onClick]);
  const baseClasses = `
    flex flex-col items-center justify-center
    min-w-[64px] min-h-[56px] px-2 py-1
    rounded-xl
    transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2
  `;

  const activeClasses = isActive
    ? 'text-lavpop-blue dark:text-blue-400'
    : 'text-slate-500 dark:text-slate-400 active:text-lavpop-blue dark:active:text-blue-400';

  const content = (
    <>
      <div className={`
        relative flex items-center justify-center
        w-12 h-8 rounded-2xl
        transition-all duration-200
        ${isActive
          ? 'bg-lavpop-blue/15 dark:bg-blue-500/20'
          : 'group-active:bg-slate-100 dark:group-active:bg-slate-800'
        }
      `}>
        <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-active:scale-95'}`} />
      </div>
      <span className={`
        mt-0.5 text-[11px] font-semibold leading-tight
        transition-all duration-200
        ${isActive ? 'opacity-100' : 'opacity-80'}
      `}>
        {label}
      </span>
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
