// DashboardDateControl.jsx v1.6 - COSMIC EFFECTS
// ✅ Compact toggle for Complete/Current week
// ✅ Date range display
// ✅ Inline mode for header integration
// ✅ Glassmorphism styling
// ✅ Consistent styling with DateRangeSelector
// ✅ Cosmic hover effects and active state glows
//
// CHANGELOG:
// v1.6 (2026-01-16): Cosmic Effects enhancement
//   - Added hover-stellar-glow effect on container
//   - Added cosmic-inner-glow for active button states
//   - Enhanced button transitions with stellar glow shadows
//   - Uses new Cosmic Effects v4.1 utilities
// v1.5 (2026-01-16): Theme-aware colors fix
//   - Added useTheme hook for reliable dark mode detection
//   - Converted all Tailwind dark: prefixes to JavaScript conditionals
//   - Uses Cosmic Precision color tokens (space-dust, stellar-cyan)
//   - Matches proven MinimalTopBar/LoadingScreen pattern
// v1.4 (2025-12-23): Inline header support
//   - Added inline prop for header integration (both compact/expanded layouts)
//   - When inline=true, returns control bar directly without wrapper
//   - Reduced padding for tighter header fit
// v1.3 (2025-12-16): Improved labels and removed sticky
//   - Removed sticky positioning
//   - Labels now "Semana Completa" / "Semana Parcial"
//   - Bigger text on desktop (text-sm)
// v1.2 (2025-12-02): Unified design consistency
//   - Matched visual structure with DateRangeSelector v3.0
//   - Consistent card styling across app
// v1.1 (2025-12-01): Sticky and label fixes
//   - Fixed sticky top position to account for header height
//   - Changed labels from "Anterior/Atual" to "Completa/Parcial" for clarity
//   - "Completa" = last 7 complete days
//   - "Parcial" = current week so far
// v1.0: Initial implementation
import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const DashboardDateControl = ({ viewMode, setViewMode, dateRange, inline = false }) => {
    const { isDark } = useTheme();

    if (!dateRange) return null;

    const controlBar = (
        <div className={`flex items-center ${inline ? 'gap-2 sm:gap-3' : 'justify-between gap-4'} ${isDark ? 'bg-space-dust' : 'bg-white'} border ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'} rounded-xl ${inline ? 'p-2' : 'p-3'} shadow-sm hover-stellar-glow transition-all duration-300`}>
            {/* Date Range Display */}
            <div className={`flex items-center gap-2 text-xs ${inline ? '' : 'sm:text-sm'} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Calendar className={`${inline ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} ${isDark ? 'text-stellar-cyan' : 'text-lavpop-blue'}`} />
                <span className="font-medium">
                    {dateRange.start} - {dateRange.end}
                </span>
                {!inline && (
                    <>
                        <span className={`hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>•</span>
                        <span className="hidden sm:inline font-medium">
                            {dateRange.label}
                        </span>
                    </>
                )}
            </div>

            {/* Toggle Buttons */}
            <div className={`flex items-center gap-1 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} ${inline ? 'p-0.5' : 'p-1'} rounded-lg`}>
                <button
                    onClick={() => setViewMode('complete')}
                    className={`
                        ${inline ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-md text-xs ${inline ? '' : 'sm:text-sm'} font-semibold
                        transition-all duration-300
                        flex items-center gap-1 ${inline ? '' : 'gap-1.5'}
                        ${viewMode === 'complete'
                            ? isDark
                                ? 'bg-gradient-stellar-horizontal text-white shadow-stellar-glow-soft'
                                : 'bg-white text-lavpop-blue shadow-md'
                            : isDark
                                ? 'text-slate-400 hover:text-stellar-cyan hover:bg-white/5'
                                : 'text-slate-600 hover:text-lavpop-blue hover:bg-white/50'}
                    `}
                    title="Últimos 7 dias completos"
                >
                    <CheckCircle2 className={`${inline ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'}`} />
                    <span className={inline ? '' : 'hidden sm:inline'}>
                        {inline ? 'Sem Pasada' : 'Semana Completa'}
                    </span>
                    {!inline && <span className="sm:hidden">7d</span>}
                </button>
                <button
                    onClick={() => setViewMode('current')}
                    className={`
                        ${inline ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-md text-xs ${inline ? '' : 'sm:text-sm'} font-semibold
                        transition-all duration-300
                        flex items-center gap-1 ${inline ? '' : 'gap-1.5'}
                        ${viewMode === 'current'
                            ? isDark
                                ? 'bg-gradient-stellar-horizontal text-white shadow-stellar-glow-soft'
                                : 'bg-white text-lavpop-blue shadow-md'
                            : isDark
                                ? 'text-slate-400 hover:text-stellar-cyan hover:bg-white/5'
                                : 'text-slate-600 hover:text-lavpop-blue hover:bg-white/50'}
                    `}
                    title="Semana atual (parcial)"
                >
                    <Clock className={`${inline ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'}`} />
                    <span className={inline ? '' : 'hidden sm:inline'}>
                        {inline ? 'Sem Atual' : 'Semana Parcial'}
                    </span>
                    {!inline && <span className="sm:hidden">Atual</span>}
                </button>
            </div>
        </div>
    );

    // When inline, return control bar directly (no wrapper)
    if (inline) {
        return controlBar;
    }

    // When not inline, wrap with margin
    return (
        <div className="mb-6">
            {controlBar}
        </div>
    );
};

export default DashboardDateControl;
