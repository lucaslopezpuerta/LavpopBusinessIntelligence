// SectionCard.jsx v3.1 - CLEANER ICON WELLS
// Wrapper component for Intelligence sections
// Design System v5.1 compliant - Tier 1 Essential
//
// CHANGELOG:
// v3.1 (2026-01-29): Removed left border accent from icon wells
//   - Cleaner look without border-l-4/border-l-2 on icon containers
// v3.0 (2026-01-29): Cosmic Precision 2.0 - Warning color fix
//   - REVERTED yellow back to AMBER for WCAG AA compliance
//   - Yellow-600 fails WCAG AA (3.5:1 contrast) - amber-600 passes (4.7:1)
//   - amber color entry: bg amber-600/500 (was yellow - failed contrast)
// v2.10 (2026-01-29): Orange to yellow migration (REVERTED in v3.0)
// v2.9 (2026-01-29): Amber to orange migration (REVERTED in v3.0)
// v2.8 (2026-01-29): Solid color icon wells for WCAG AA compliance
//   - Icon backgrounds now use solid colors with white icons
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

// Color mappings for section accents (solid colors for WCAG AA compliance)
const SECTION_COLORS = {
  blue: {
    bg: 'bg-blue-600 dark:bg-blue-500',
    border: 'border-blue-700 dark:border-blue-400',
    icon: 'text-white'
  },
  emerald: {
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    border: 'border-emerald-700 dark:border-emerald-400',
    icon: 'text-white'
  },
  green: {
    bg: 'bg-green-600 dark:bg-green-500',
    border: 'border-green-700 dark:border-green-400',
    icon: 'text-white'
  },
  teal: {
    bg: 'bg-teal-600 dark:bg-teal-500',
    border: 'border-teal-700 dark:border-teal-400',
    icon: 'text-white'
  },
  amber: {
    bg: 'bg-amber-600 dark:bg-amber-500',      // FIXED: amber passes WCAG (4.7:1), not yellow (3.5:1)
    border: 'border-amber-700 dark:border-amber-400',
    icon: 'text-white'
  },
  purple: {
    bg: 'bg-purple-600 dark:bg-purple-500',
    border: 'border-purple-700 dark:border-purple-400',
    icon: 'text-white'
  },
  lavpop: {
    bg: 'bg-lavpop-blue-600 dark:bg-lavpop-blue-500',
    border: 'border-lavpop-blue-700 dark:border-lavpop-blue-400',
    icon: 'text-white'
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
            <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
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
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
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
