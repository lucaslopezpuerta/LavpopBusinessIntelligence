// SectionCard.jsx v2.7 - DEEPER COSMIC UPDATE
// Wrapper component for Intelligence sections
// Design System v5.0 compliant - Tier 1 Essential
//
// CHANGELOG:
// v2.7 (2026-01-17): Deeper cosmic background
//   - Changed dark:bg-space-dust to dark:bg-space-nebula (darker)
//   - Better contrast for internal card gradients to space-void
// v2.6 (2026-01-17): Cosmic Precision upgrade
//   - Updated to space-dust background (from slate-800)
//   - Updated to stellar-cyan borders (from slate-700)
//   - Cosmic compliant: Tier 1 Essential
// v2.5 (2025-12-28): Expanded header layout matches non-collapsible
//   - Expanded header uses same flex-col/sm:flex-row layout as non-collapsible
//   - Chevron positioned at bottom-right on mobile, center-right on desktop
//   - Added text-left for proper button text alignment
// v2.4 (2025-12-28): Compact collapsed state redesign
//   - Separate compact header when collapsed: smaller icon (28px), no subtitle
//   - Smaller title font when collapsed (text-sm vs text-base/lg)
//   - Reduced section padding when collapsed (px-3 py-2)
//   - Overall collapsed height ~40px vs ~60px before
// v2.3 (2025-12-28): Further collapsed state refinements
//   - Reduced vertical padding when collapsed (py-2.5 for tighter title spacing)
// v2.2 (2025-12-28): Collapsed state styling improvements
//   - Reduced padding when collapsed (p-4 only)
//   - Header margin removed when collapsed for compact look
//   - Smooth transition on padding change
// v2.1 (2025-12-28): Collapsible sections support
//   - Added collapsible prop to enable section collapse
//   - isCollapsed and onToggle props for controlled collapse state
//   - Smooth animation for collapse/expand transition
//   - ChevronDown icon rotates based on state
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
import { ChevronDown } from 'lucide-react';

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
  color = 'emerald',
  collapsible = false,
  isCollapsed = false,
  onToggle
}) => {
  const colors = SECTION_COLORS[color] || SECTION_COLORS.emerald;

  // Compact header for collapsed state - smaller icon, no subtitle
  if (collapsible && onToggle && isCollapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
        aria-expanded={false}
        aria-controls={`${id}-content`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && (
            <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center border-l-2 ${colors.border} flex-shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${colors.icon}`} aria-hidden="true" />
            </div>
          )}
          <h2
            id={id}
            className="text-sm font-semibold text-slate-900 dark:text-white truncate"
          >
            {title}
          </h2>
        </div>
        <ChevronDown
          className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0"
        />
      </button>
    );
  }

  const headerContent = (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center border-l-4 ${colors.border} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <h2
          id={id}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (collapsible && onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 hover:opacity-80 transition-opacity text-left"
        aria-expanded={true}
        aria-controls={`${id}-content`}
      >
        {headerContent}
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
          {action && action}
          <ChevronDown
            className="w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 rotate-180"
          />
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
      {headerContent}
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
  className = '',
  // Collapsible props
  collapsible = false,
  isCollapsed = false,
  onToggle
}) => {
  const headingId = id || `section-${title?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`
        bg-white dark:bg-space-nebula
        rounded-2xl shadow-soft border border-slate-200 dark:border-stellar-cyan/10
        ${collapsible && isCollapsed ? 'px-3 py-2' : 'p-4 sm:p-6 lg:p-8'}
        animate-slide-up
        transition-all duration-200
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
          collapsible={collapsible}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
        />
      )}
      {collapsible ? (
        <div
          id={`${headingId}-content`}
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}
          `}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
};

export { SectionHeader };
export default SectionCard;
