// DateRangeSelector Component v3.7.1 - COSMIC DROPDOWN
// Unified date filter - consistent with DashboardDateControl
//
// CHANGELOG:
// v3.7.1 (2026-01-17): Removed hover-stellar-glow from container
// v3.7.0 (2026-01-16): Custom CosmicDropdown integration
//   - Replaced native <select> with CosmicDropdown component
//   - Full Design System compliance for dropdown menu
//   - Glassmorphism panel with stellar-cyan accents
//   - Keyboard navigation and accessible ARIA attributes
// v3.6.0 (2026-01-16): Cosmic Effects enhancement (reverted in v3.7.1)
//   - Enhanced dropdown with cosmic inner glow on focus
//   - Added gradient background for dropdown in dark mode
//   - Uses new Cosmic Effects v4.1 utilities
// v3.5.0 (2026-01-16): Theme-aware colors fix
//   - Added useTheme hook for reliable dark mode detection
//   - Converted all Tailwind dark: prefixes to JavaScript conditionals
//   - Uses Cosmic Precision color tokens (space-dust, stellar-cyan)
//   - Matches proven MinimalTopBar/LoadingScreen pattern
// v3.4.1 (2026-01-12): Hooks order fix (React error #300)
//   - FIXED: Moved useCallback before conditional return
//   - All hooks must run in same order every render (Rules of Hooks)
// v3.4.0 (2026-01-12): Sidebar awareness
//   - Added useSidebar hook to detect mobile drawer state
//   - Returns null when sticky AND mobile sidebar is open
//   - Prevents z-index conflicts with sidebar drawer (z-50)
//   - Same pattern as SocialMediaNavigation v1.4
// v3.3.0 (2026-01-12): Safe area compliance
//   - Sticky position now uses safe-area-inset-top in calculation
//   - Prevents clipping behind iPhone notch when scrolling
// v3.2.0 (2025-12-28): Improved desktop font size
//   - Date display: text-xs → text-xs sm:text-sm
//   - Dropdown: text-xs → text-xs sm:text-sm
// v3.1.0 (2025-12-22): Added haptic feedback on date change
// v3.0.0 (2025-12-02): Unified design with DashboardDateControl
//   - Compact inline layout matching Dashboard style
//   - Added sticky positioning support
//   - Removed verbose "Período Selecionado" label
//   - Streamlined date display format
//   - Consistent visual hierarchy across app
// v2.2.0 (2025-11-30): Configurable options filtering
//   - Added excludeAllTime prop to filter out "Todo Período" option
//   - Used by Operations tab (allTime not actionable for operations)
// v2.1.1 (2025-11-30): Mobile font size refinement
// v2.1.0 (2025-11-30): Mobile overflow fix + Design System audit
// v2.0 (2025-11-26): Design System alignment
// v1.0 (2025-11-15): Initial implementation

import React, { useMemo, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { getDateOptions } from '../utils/dateWindows';
import { haptics } from '../utils/haptics';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import CosmicDropdown from './ui/CosmicDropdown';

const DateRangeSelector = ({ value, onChange, dateWindow, excludeAllTime = false, sticky = false }) => {
  // Get sidebar state to hide sticky nav when mobile sidebar is open
  const { isMobileOpen } = useSidebar();
  const { isDark } = useTheme();
  const options = useMemo(() => getDateOptions({ excludeAllTime }), [excludeAllTime]);

  // Handle change with haptic feedback
  // NOTE: Must be before conditional return to satisfy Rules of Hooks
  // CosmicDropdown passes value directly (not event object)
  const handleChange = useCallback((newValue) => {
    haptics.tick();
    onChange(newValue);
  }, [onChange]);

  // Hide sticky selector when mobile sidebar is open to prevent z-index conflicts
  if (sticky && isMobileOpen) {
    return null;
  }

  const content = (
    <div className={`flex items-center justify-between gap-4 ${isDark ? 'bg-space-dust' : 'bg-white'} border ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'} rounded-xl p-3 shadow-sm transition-all duration-300`}>
      {/* Left: Date range display */}
      <div className={`flex items-center gap-2 text-xs sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <Calendar className={`w-4 h-4 ${isDark ? 'text-stellar-gold' : 'text-amber-500'}`} />
        <span className="font-medium">
          {dateWindow.dateRange}
        </span>
        <span className={`hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>•</span>
        <span className="hidden sm:inline font-medium">
          {dateWindow.label}
        </span>
      </div>

      {/* Right: Dropdown selector - Cosmic styled */}
      <CosmicDropdown
        value={value}
        onChange={handleChange}
        options={options}
      />
    </div>
  );

  if (sticky) {
    return (
      <div
        className={`sticky z-30 -mt-2 mb-6 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 ${isDark ? 'bg-space-void/80' : 'bg-slate-50/80'} backdrop-blur-sm`}
        style={{
          top: 'calc(3.5rem + env(safe-area-inset-top, 0px))'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default DateRangeSelector;
