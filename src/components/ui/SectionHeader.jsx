// SectionHeader.jsx v1.5 - TYPOGRAPHY CONSISTENCY
// Reusable section header component with icon box and border accent
// Design System v6.4 compliant
//
// CHANGELOG:
// v1.5 (2026-02-05): Typography consistency (Design System v6.4)
//   - Title now uses text-heading semantic size (20px) for better hierarchy
//   - Subtitle uses text-caption semantic pattern (12px)
//   - Updated Design System compliance to v6.4
// v1.4 (2026-01-29): Yellow→Amber revert for icon wells
//   - Changed amber color entry: bg from yellow-600/500 to amber-600/500
//   - Changed amber color entry: border from yellow-700/400 to amber-700/400
// v1.3 (2026-01-29): Orange to yellow migration
//   - Changed amber color entry: bg from orange-600/500 to yellow-600/500
//   - Changed amber color entry: border from orange-700/400 to yellow-700/400
// v1.2 (2026-01-29): Amber to orange migration
//   - Changed amber color entry: bg from amber-600/500 to orange-600/500
//   - Changed amber color entry: border from amber-700/400 to orange-700/400
// v1.1 (2026-01-29): Solid color icon wells for WCAG AA compliance
//   - Icon backgrounds now use solid colors with white icons
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
    bg: 'bg-amber-600 dark:bg-amber-500',
    border: 'border-amber-700 dark:border-amber-400',
    icon: 'text-white',
  },
  emerald: {
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    border: 'border-emerald-700 dark:border-emerald-400',
    icon: 'text-white',
  },
  blue: {
    bg: 'bg-blue-600 dark:bg-blue-500',
    border: 'border-blue-700 dark:border-blue-400',
    icon: 'text-white',
  },
  stellar: {
    bg: 'bg-stellar-blue dark:bg-stellar-cyan',
    border: 'border-stellar-blue dark:border-stellar-cyan',
    icon: 'text-white',
  },
  purple: {
    bg: 'bg-purple-600 dark:bg-purple-500',
    border: 'border-purple-700 dark:border-purple-400',
    icon: 'text-white',
  },
  red: {
    bg: 'bg-red-600 dark:bg-red-500',
    border: 'border-red-700 dark:border-red-400',
    icon: 'text-white',
  },
  slate: {
    bg: 'bg-slate-500 dark:bg-slate-600',
    border: 'border-slate-600 dark:border-slate-500',
    icon: 'text-white',
  },
  teal: {
    bg: 'bg-teal-600 dark:bg-teal-500',
    border: 'border-teal-700 dark:border-teal-400',
    icon: 'text-white',
  },
  cyan: {
    bg: 'bg-cyan-600 dark:bg-cyan-500',
    border: 'border-cyan-700 dark:border-cyan-400',
    icon: 'text-white',
  },
  indigo: {
    bg: 'bg-indigo-600 dark:bg-indigo-500',
    border: 'border-indigo-700 dark:border-indigo-400',
    icon: 'text-white',
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
          className="text-heading font-bold text-slate-900 dark:text-white"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-caption text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
