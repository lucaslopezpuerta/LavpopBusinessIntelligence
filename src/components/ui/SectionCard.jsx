// SectionCard.jsx v2.0
// Wrapper component for Intelligence sections
// Design System v3.1 compliant - Unified header pattern
//
// CHANGELOG:
// v2.0 (2025-12-02): Unified header design
//   - Updated icon box to match app-wide pattern (border-l-4 accent)
//   - Consistent with Customers.jsx section headers
//   - Added color prop for customizable accent colors
//   - Reduced title size for visual hierarchy (xl→lg)
// v1.0 (2025-11-30): Initial implementation
//   - Consistent section styling
//   - Header with icon support
//   - Dark mode support
//   - Responsive padding

import React from 'react';

// Color mappings for section accents
const SECTION_COLORS = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-500',
    icon: 'text-emerald-600 dark:text-emerald-400'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-500',
    icon: 'text-green-600 dark:text-green-400'
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    border: 'border-teal-500',
    icon: 'text-teal-600 dark:text-teal-400'
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-500',
    icon: 'text-amber-600 dark:text-amber-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-500',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  lavpop: {
    bg: 'bg-lavpop-blue/10 dark:bg-lavpop-blue/20',
    border: 'border-lavpop-blue',
    icon: 'text-lavpop-blue'
  }
};

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  action,
  id,
  color = 'emerald'
}) => {
  const colors = SECTION_COLORS[color] || SECTION_COLORS.emerald;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center border-l-4 ${colors.border} flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} aria-hidden="true" />
          </div>
        )}
        <div>
          <h2
            id={id}
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
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
      {action && action}
    </div>
  );
};

const SectionCard = ({
  title,
  subtitle,
  icon,
  action,
  children,
  id,
  color = 'emerald',
  className = ''
}) => {
  const headingId = id || `section-${title?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`
        bg-white dark:bg-slate-800
        rounded-2xl shadow-soft border border-slate-200 dark:border-slate-700
        p-4 sm:p-6 lg:p-8
        animate-slide-up
        ${className}
      `}
    >
      {title && (
        <SectionHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          action={action}
          id={headingId}
          color={color}
        />
      )}
      {children}
    </section>
  );
};

export { SectionHeader };
export default SectionCard;
