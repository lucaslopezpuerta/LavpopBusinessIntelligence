// IconButton.jsx v1.0 - Shared icon button component
// Reusable icon button with consistent sizing and accessibility
//
// CHANGELOG:
// v1.0 (2025-12-22): Initial implementation
//   - 44px minimum touch target for accessibility
//   - Active state support
//   - Focus-visible ring for keyboard navigation
//   - Press feedback with scale animation

import React from 'react';

const IconButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  className = '',
  size = 'default', // 'small' | 'default'
}) => {
  const sizeClasses = size === 'small'
    ? 'min-h-[36px] min-w-[36px] p-1.5'
    : 'min-h-[44px] min-w-[44px] p-2';

  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`
        flex items-center justify-center rounded-lg
        transition-all duration-200 active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${sizeClasses}
        ${active
          ? 'bg-lavpop-blue/10 text-lavpop-blue dark:bg-blue-500/20 dark:text-blue-400'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
        }
        ${className}
      `}
    >
      <Icon className={iconSize} />
    </button>
  );
};

export default IconButton;
