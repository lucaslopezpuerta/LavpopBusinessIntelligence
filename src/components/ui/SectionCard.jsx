// SectionCard.jsx v1.0
// Wrapper component for Intelligence sections
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial implementation
//   - Consistent section styling
//   - Header with icon support
//   - Dark mode support
//   - Responsive padding

import React from 'react';

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  action,
  id
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-lavpop-blue-100 dark:bg-lavpop-blue-900/30 rounded-lg flex-shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-lavpop-blue dark:text-blue-400" aria-hidden="true" />
        </div>
      )}
      <div>
        <h2
          id={id}
          className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-0.5 sm:mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action && action}
  </div>
);

const SectionCard = ({
  title,
  subtitle,
  icon,
  action,
  children,
  id,
  className = ''
}) => {
  const headingId = id || `section-${title?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`
        bg-white dark:bg-slate-800
        rounded-2xl shadow-soft
        p-4 sm:p-6 lg:p-8
        mb-6 sm:mb-8
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
        />
      )}
      {children}
    </section>
  );
};

export { SectionHeader };
export default SectionCard;
