// SectionHeader.jsx v1.0
// Reusable section header component with icon box and border accent
// Design System v3.4 compliant
//
// CHANGELOG:
// v1.0 (2026-01-07): Initial implementation
//   - Extracted from repeated patterns in Operations.jsx, Intelligence.jsx
//   - Supports multiple color themes
//   - Accessibility: id prop for aria-labelledby

import React from 'react';

/**
 * Color configuration for section headers
 * Maps color keys to Tailwind classes for consistent theming
 */
const SECTION_COLORS = {
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-500',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  lavpop: {
    bg: 'bg-lavpop-blue-100 dark:bg-lavpop-blue-900/30',
    border: 'border-lavpop-blue-500',
    icon: 'text-lavpop-blue-600 dark:text-lavpop-blue-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-500',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-500',
    icon: 'text-red-600 dark:text-red-400',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-500',
    icon: 'text-slate-600 dark:text-slate-400',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    border: 'border-teal-500',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    border: 'border-cyan-500',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    border: 'border-indigo-500',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
};

/**
 * SectionHeader - Consistent section header with icon box and left border accent
 *
 * @param {string} title - Section title text
 * @param {string} subtitle - Optional subtitle/description text
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} color - Color theme key (amber, emerald, blue, lavpop, purple, red, slate, teal, cyan, indigo)
 * @param {string} id - ID for the heading element (used with aria-labelledby on parent section)
 * @param {string} className - Additional classes for the container
 */
const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  color = 'amber',
  id,
  className = ''
}) => {
  const colors = SECTION_COLORS[color] || SECTION_COLORS.amber;

  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center border-l-4 ${colors.border}`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div>
        <h2
          id={id}
          className="text-base font-bold text-slate-900 dark:text-white"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
