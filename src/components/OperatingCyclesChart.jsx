// OperatingCyclesChart.jsx v5.9 - STAGGERED BAR ANIMATIONS
// ✅ NEW: Staggered bar entrance animation (left-to-right)
// ✅ NEW: Animated number counters in stats footer
// ✅ Split by filter (All/Wash Only/Dry Only)
// ✅ Same month last year comparison (YoY)
// ✅ Gradient bars for visual depth
// ✅ Compact mode for single-glance dashboard
// ✅ Mobile responsive adjustments
// ✅ Design System v5.1 compliant (Cosmic Precision)
//
// CHANGELOG:
// v5.9 (2026-01-30): Staggered bar animations
//   - NEW: Bars animate in left-to-right with staggered delay
//   - NEW: AnimatedNumber component for count-up stats
//   - Uses CHART_ANIMATION.BAR_STAGGER preset
//   - Respects useReducedMotion for accessibility
// v5.8 (2026-01-22): Design System v5.1 compliance
//   - UPDATED: Title size to text-lg (18px) per Design System
//   - UPDATED: Icon size to w-5 h-5, color to cyan-600/cyan-400
//   - UPDATED: Tooltip styling with rounded-xl
//   - REMOVED: Accent side border (handled by parent container)
//   - Note: Parent container in Dashboard.jsx uses Variant A styling
// v5.7 (2025-12-23): Show controls in compact mode
//   - Chart height increased to 300px in compact mode
//   - Controls (filters, month selector) now visible in all modes
// v5.6 (2025-12-23): Fixed compact mode rendering
//   - Removed conflicting flex-1 from compact chart height
//   - Removed h-full from wrapper in compact mode (no parent height)
// v5.5 (2025-12-23): Compact mode for single-glance dashboard
//   - Added compact prop for reduced height layout
//   - Compact: h-[300px], simplified header, inline stats
// v5.4 (2025-12-22): Year-over-year comparison
//   - CHANGED: Comparison lines now show same month from last year (not previous month)
//   - Updated legend text from "Mês Ant." to year reference
//   - More meaningful seasonal comparison for business analysis
// v5.3 (2025-12-16): Mobile header layout fix
//   - FIXED: Controls stack below title on mobile to prevent overlap
//   - Better spacing between filter groups
// v5.2 (2025-12-16): Mobile 7-day rolling view
//   - CHANGED: Mobile shows last 7 days (rolling) instead of 10 days
//   - Better UX at month start (consistent width, no sparse data)
//   - Updated mobile indicator message
// v5.1 (2025-12-16): Mobile layout fix
//   - FIXED: Reduced chart height on mobile (300px vs 400px desktop)
//   - FIXED: Compact header layout on mobile
//   - FIXED: Legend moved inline on mobile to reduce wasted space
//   - FIXED: Removed redundant wrapper when already inside card
// v5.0 (2025-12-16): Split by filter
//   - NEW: Filter to show All/Wash Only/Dry Only
//   - Toggle buttons in header next to month selector
//   - Dynamic chart rendering based on filter
// v4.6 (2025-12-01): Design System compliance
//   - Fixed fontSize: 11 → 12 on XAxis ticks
// v4.5 (2025-12-01): Date selector tabs
//   - Added month/year selector tabs in header
//   - Shows last 4 months for easy navigation
//   - Uses internal state when props not provided
// v4.4 (2025-11-30): Accessibility & UX improvements
// v4.3 (2025-11-30): Chart memoization for performance
// v4.2 (2025-11-30): Performance improvements
// v4.1 (2025-11-29): Design System v3.0 compliance
// v4.0: Previous implementation
import React, { useState, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Line, ComposedChart, Cell } from 'recharts';
import { WashingMachine, TrendingUp, Calendar, Droplet, Flame, Layers } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { getChartColors } from '../utils/chartColors';
import { CHART_ANIMATION } from '../constants/animations';
import AnimatedNumber from './ui/AnimatedNumber';

function countMachines(str) {
  if (!str) return { wash: 0, dry: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry };
}

function getMonthName(monthIndex) {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return months[monthIndex];
}

const OperatingCyclesChart = ({
  salesData,
  month: propMonth = null,
  year: propYear = null,
  compact = false // Compact mode for single-glance dashboard
}) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Reduced motion preference for accessibility
  const prefersReducedMotion = useReducedMotion();
  const chartAnim = prefersReducedMotion ? CHART_ANIMATION.REDUCED : CHART_ANIMATION.BAR_STAGGER;

  // Generate last 4 months for selector
  const monthOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: getMonthName(date.getMonth()).slice(0, 3).toUpperCase(),
        fullLabel: `${getMonthName(date.getMonth())}/${date.getFullYear()}`
      });
    }
    return options;
  }, []);

  // Internal state for selected month/year (uses props if provided)
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: propMonth !== null ? propMonth : monthOptions[0].month,
    year: propYear !== null ? propYear : monthOptions[0].year
  });

  // Split by filter state: 'all' | 'wash' | 'dry'
  const [splitBy, setSplitBy] = useState('all');

  // Use props if provided, otherwise use internal state
  const month = propMonth !== null ? propMonth : selectedPeriod.month;
  const year = propYear !== null ? propYear : selectedPeriod.year;

  // Memoize colors to prevent new object references on every render
  const colors = useMemo(() => getChartColors(isDark), [isDark]);

  const { chartData, periodInfo } = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { chartData: [], periodInfo: null };
    }

    const now = new Date();
    const targetMonth = month !== null ? month : now.getMonth();
    const targetYear = year !== null ? year : now.getFullYear();

    // Year-over-Year: Same month from last year
    const comparisonYear = targetYear - 1;

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    // Get days in comparison month (handles leap years, etc.)
    const daysInComparisonMonth = new Date(comparisonYear, targetMonth + 1, 0).getDate();

    const dailyMap = {};
    const lastYearMap = {};

    // Initialize maps
    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap[day] = {
        dayNum: day,
        day: String(day).padStart(2, '0'),
        Lavagens: 0,
        Secagens: 0,
        Total: 0,
        LastYearWash: 0,
        LastYearDry: 0,
        LastYearTotal: 0
      };
    }
    // Initialize last year map (may have different days if leap year)
    for (let day = 1; day <= daysInComparisonMonth; day++) {
      lastYearMap[day] = { wash: 0, dry: 0, total: 0 };
    }

    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date || !date.brazil) return;

      // Use .brazil property for Brazil timezone-correct day grouping
      // This ensures late-night transactions (22:00-23:59 Brazil = 01:00-02:59 UTC next day)
      // are grouped on the correct Brazil calendar day, not the UTC day
      const dayNum = date.brazil.day;
      const brazilMonth = date.brazil.month - 1; // .brazil.month is 1-indexed, JS months are 0-indexed
      const brazilYear = date.brazil.year;

      const machineInfo = countMachines(row.Maquina || row.machine || row.Maquinas || '');
      const totalCycles = machineInfo.wash + machineInfo.dry;

      // Current Month Data
      if (brazilMonth === targetMonth && brazilYear === targetYear) {
        if (dailyMap[dayNum]) {
          dailyMap[dayNum].Lavagens += machineInfo.wash;
          dailyMap[dayNum].Secagens += machineInfo.dry;
          dailyMap[dayNum].Total += totalCycles;
        }
      }

      // Same Month Last Year Data (for YoY comparison)
      if (brazilMonth === targetMonth && brazilYear === comparisonYear) {
        if (lastYearMap[dayNum]) {
          lastYearMap[dayNum].wash += machineInfo.wash;
          lastYearMap[dayNum].dry += machineInfo.dry;
          lastYearMap[dayNum].total += totalCycles;
        }
      }
    });

    // Merge last year data into dailyMap
    Object.keys(dailyMap).forEach(day => {
      dailyMap[day].LastYearWash = lastYearMap[day]?.wash || 0;
      dailyMap[day].LastYearDry = lastYearMap[day]?.dry || 0;
      dailyMap[day].LastYearTotal = lastYearMap[day]?.total || 0;
    });

    let allData = Object.values(dailyMap).sort((a, b) => a.dayNum - b.dayNum);

    // Calculate FULL MONTH totals (always)
    const totalWash = allData.reduce((sum, d) => sum + d.Lavagens, 0);
    const totalDry = allData.reduce((sum, d) => sum + d.Secagens, 0);
    const totalLastYear = allData.reduce((sum, d) => sum + d.LastYearTotal, 0);

    // For mobile: show last 7 days (rolling window)
    // This prevents sparse charts at month start
    let displayData = allData;
    if (isMobile) {
      const isCurrentMonth = targetMonth === now.getMonth() && targetYear === now.getFullYear();
      if (isCurrentMonth) {
        // Current month: show from (today - 6) to today (7 days)
        const currentDay = now.getDate();
        const startDay = Math.max(1, currentDay - 6);
        displayData = allData.filter(d => d.dayNum >= startDay && d.dayNum <= currentDay);
      } else {
        // Past month: show last 7 days of that month
        const lastDay = daysInMonth;
        const startDay = Math.max(1, lastDay - 6);
        displayData = allData.filter(d => d.dayNum >= startDay && d.dayNum <= lastDay);
      }
    }

    const info = {
      month: getMonthName(targetMonth),
      year: targetYear,
      comparisonYear: comparisonYear,
      totalWash,
      totalDry,
      totalCycles: totalWash + totalDry,
      totalLastYear
    };

    return { chartData: displayData, periodInfo: info };
  }, [salesData, month, year, isMobile]);

  // Memoize CustomTooltip to prevent recreation on every render
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter payload based on splitBy
      const filteredPayload = payload.filter(entry => {
        if (splitBy === 'all') return true;
        if (splitBy === 'wash') {
          return entry.dataKey === 'Lavagens' || entry.dataKey === 'LastYearWash';
        }
        if (splitBy === 'dry') {
          return entry.dataKey === 'Secagens' || entry.dataKey === 'LastYearDry';
        }
        return true;
      });

      return (
        <div className="bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/10 rounded-xl p-3 shadow-lg z-50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Dia {label}
            </p>
          </div>
          {filteredPayload.map((entry, index) => {
            // Skip rendering if value is 0 and it's not the comparison line
            if (entry.value === 0 && !entry.dataKey.startsWith('LastYear')) return null;

            let labelText = entry.name;
            let isLastYear = false;

            if (entry.dataKey === 'LastYearWash') {
              labelText = `Lavagens (${periodInfo?.comparisonYear || ''})`;
              isLastYear = true;
            } else if (entry.dataKey === 'LastYearDry') {
              labelText = `Secagens (${periodInfo?.comparisonYear || ''})`;
              isLastYear = true;
            }

            const color = isLastYear
              ? (entry.dataKey === 'LastYearWash' ? colors.info : colors.warning)
              : (entry.dataKey === 'Lavagens' ? colors.primary : colors.secondary);

            return (
              <div key={index} className="flex items-center justify-between gap-3 text-xs mb-1 last:mb-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 ${isLastYear ? 'rounded-full' : 'rounded-sm'}`}
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {labelText}:
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {entry.value} {entry.value === 1 ? 'ciclo' : 'ciclos'}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }, [periodInfo?.comparisonYear, splitBy]);

  // Memoize renderLabel to prevent recreation on every render
  const renderLabel = useCallback((props) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={colors.labelText}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      >
        {value}
      </text>
    );
  }, [colors.labelText]);

  if (!periodInfo || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64 text-slate-400 dark:text-slate-400">
        <div className="text-center">
          <WashingMachine className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-cyan-500/50 dark:text-cyan-400/50" />
          <p className="text-sm font-medium">Sem dados disponíveis</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 flex flex-col ${compact ? '' : 'h-full'}`}>
      {/* Header - Simplified in compact mode */}
      <div className={compact ? 'mb-2' : 'mb-4 sm:mb-6'}>
        {/* Title row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-slate-900 dark:text-white flex items-center gap-2`}>
              <WashingMachine className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              <span className="truncate">Ciclos de Operação</span>
            </h3>
            {!compact && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden">
                {periodInfo.month}/{periodInfo.year}
              </p>
            )}
          </div>

          {/* Desktop: Controls inline with title */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {/* Split By Filter - icons only on mobile */}
            <div className="flex items-center gap-0.5 p-0.5 sm:p-1 bg-slate-100 dark:bg-space-dust/80 rounded-lg">
              <button
                onClick={() => setSplitBy('all')}
                className={`
                  p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1
                  ${splitBy === 'all'
                    ? 'bg-white dark:bg-slate-600 text-slate-700 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
                title="Mostrar todos os ciclos"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Todos</span>
              </button>
              <button
                onClick={() => setSplitBy('wash')}
                className={`
                  p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1
                  ${splitBy === 'wash'
                    ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400'
                  }
                `}
                title="Apenas lavagens"
              >
                <Droplet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lav</span>
              </button>
              <button
                onClick={() => setSplitBy('dry')}
                className={`
                  p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1
                  ${splitBy === 'dry'
                    ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400'
                  }
                `}
                title="Apenas secagens"
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sec</span>
              </button>
            </div>

            {/* Month Selector Tabs - compact on mobile */}
            {propMonth === null && (
              <div className="flex items-center gap-0.5 p-0.5 sm:p-1 bg-slate-100 dark:bg-space-dust/80 rounded-lg">
                {monthOptions.map((opt) => {
                  const isSelected = opt.month === month && opt.year === year;
                  return (
                    <button
                      key={`${opt.month}-${opt.year}`}
                      onClick={() => setSelectedPeriod({ month: opt.month, year: opt.year })}
                      className={`
                        px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-semibold transition-all
                        ${isSelected
                          ? 'bg-white dark:bg-slate-600 text-stellar-blue dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50'
                        }
                      `}
                      title={opt.fullLabel}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Controls row below title */}
        <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
          {/* Split By Filter */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-space-dust/80 rounded-lg">
            <button
              onClick={() => setSplitBy('all')}
              className={`
                p-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1
                ${splitBy === 'all'
                  ? 'bg-white dark:bg-slate-600 text-slate-700 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
              title="Mostrar todos os ciclos"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSplitBy('wash')}
              className={`
                p-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1
                ${splitBy === 'wash'
                  ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400'
                }
              `}
              title="Apenas lavagens"
            >
              <Droplet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSplitBy('dry')}
              className={`
                p-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1
                ${splitBy === 'dry'
                  ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400'
                }
              `}
              title="Apenas secagens"
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Month Selector */}
          {propMonth === null && (
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-space-dust/80 rounded-lg">
              {monthOptions.map((opt) => {
                const isSelected = opt.month === month && opt.year === year;
                return (
                  <button
                    key={`mobile-${opt.month}-${opt.year}`}
                    onClick={() => setSelectedPeriod({ month: opt.month, year: opt.year })}
                    className={`
                      px-2 py-1 rounded-md text-xs font-semibold transition-all
                      ${isSelected
                        ? 'bg-white dark:bg-slate-600 text-stellar-blue dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }
                    `}
                    title={opt.fullLabel}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend - Inline with smaller text on mobile */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" role="list" aria-label="Legenda do gráfico">
          {(splitBy === 'all' || splitBy === 'wash') && (
            <>
              <div className="flex items-center gap-1" role="listitem">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.primary }} aria-hidden="true"></div>
                <span className="text-slate-600 dark:text-slate-400">Lav {periodInfo?.year}</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <svg className="w-3 h-2" aria-hidden="true" viewBox="0 0 12 8">
                  <line x1="0" y1="4" x2="12" y2="4" stroke={colors.info} strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">{periodInfo?.comparisonYear}</span>
              </div>
            </>
          )}
          {(splitBy === 'all' || splitBy === 'dry') && (
            <>
              <div className="flex items-center gap-1" role="listitem">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.secondary }} aria-hidden="true"></div>
                <span className="text-slate-600 dark:text-slate-400">Sec {periodInfo?.year}</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <svg className="w-3 h-2" aria-hidden="true" viewBox="0 0 12 8">
                  <line x1="0" y1="4" x2="12" y2="4" stroke={colors.warning} strokeWidth="2" strokeDasharray="3 2" />
                </svg>
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">{periodInfo?.comparisonYear}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart - Responsive height, reduced in compact mode */}
      <motion.div
        className={compact ? 'h-[370px]' : 'h-[280px] sm:h-[350px] lg:h-[400px]'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 10, bottom: 10, left: 5 }}
          >
            <defs>
              <linearGradient id="washGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.primary} stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="dryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.secondary} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{
                fontSize: 12,
                fill: colors.tickText,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              axisLine={{ stroke: colors.axisLine }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              label={{
                value: '# Ciclos',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: {
                  fontSize: 12,
                  fill: colors.yAxisLabel,
                  fontWeight: 600,
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.cursorFill }} />

            {/* Last Year Wash Trend - conditional on splitBy */}
            {(splitBy === 'all' || splitBy === 'wash') && (
              <Line
                type="monotone"
                dataKey="LastYearWash"
                name={`Lavagens (${periodInfo?.comparisonYear || 'Ano Anterior'})`}
                stroke={colors.info}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}
            {/* Last Year Dry Trend - conditional on splitBy */}
            {(splitBy === 'all' || splitBy === 'dry') && (
              <Line
                type="monotone"
                dataKey="LastYearDry"
                name={`Secagens (${periodInfo?.comparisonYear || 'Ano Anterior'})`}
                stroke={colors.warning}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Wash Bars - conditional on splitBy, staggered entrance */}
            {(splitBy === 'all' || splitBy === 'wash') && (
              <Bar
                dataKey="Lavagens"
                radius={[4, 4, 0, 0]}
                name="Lavagens"
                maxBarSize={50}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={chartAnim.duration}
                animationEasing={chartAnim.easing}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`wash-${index}`}
                    fill="url(#washGradient)"
                    style={{
                      animationDelay: prefersReducedMotion ? '0ms' : `${chartAnim.baseDelay + (index * chartAnim.staggerDelay)}ms`
                    }}
                  />
                ))}
                <LabelList content={renderLabel} />
              </Bar>
            )}

            {/* Dry Bars - conditional on splitBy, staggered with offset */}
            {(splitBy === 'all' || splitBy === 'dry') && (
              <Bar
                dataKey="Secagens"
                radius={[4, 4, 0, 0]}
                name="Secagens"
                maxBarSize={50}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={chartAnim.duration}
                animationEasing={chartAnim.easing}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`dry-${index}`}
                    fill="url(#dryGradient)"
                    style={{
                      animationDelay: prefersReducedMotion ? '0ms' : `${chartAnim.baseDelay + 50 + (index * chartAnim.staggerDelay)}ms`
                    }}
                  />
                ))}
                <LabelList content={renderLabel} />
              </Bar>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Mobile indicator for partial data - hidden in compact mode */}
      {!compact && isMobile && (
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 py-1">
          Últimos 7 dias • Totais do mês completo
        </div>
      )}

      {/* Stats Footer - Inline row in compact mode */}
      <div className={compact ? 'mt-2 pt-2 border-t border-slate-200 dark:border-stellar-cyan/10' : 'mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-stellar-cyan/10'}>
        {compact ? (
          /* Compact: Inline stats row */
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              <AnimatedNumber value={periodInfo.totalCycles} /> total
            </span>
            <span className="flex items-center gap-1">
              <Droplet className="w-3 h-3" style={{ color: colors.primary }} />
              <AnimatedNumber value={periodInfo.totalWash} className="font-bold" style={{ color: colors.primary }} />
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" style={{ color: colors.secondary }} />
              <AnimatedNumber value={periodInfo.totalDry} className="font-bold" style={{ color: colors.secondary }} />
            </span>
          </div>
        ) : (
          /* Expanded: Grid layout with animated numbers */
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className={`text-center transition-opacity duration-200 ${splitBy !== 'all' ? 'opacity-50' : ''}`}>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                <AnimatedNumber value={periodInfo.totalCycles} />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1 flex items-center justify-center gap-1">
                <span className="hidden sm:inline">Total</span> Ciclos
                {periodInfo.totalCycles > periodInfo.totalLastYear ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : periodInfo.totalLastYear > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                ) : null}
              </div>
            </div>
            <div className={`text-center transition-all duration-200 ${splitBy === 'wash' ? 'sm:scale-110' : splitBy === 'dry' ? 'opacity-50' : ''}`}>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                <AnimatedNumber value={periodInfo.totalWash} />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1 flex items-center justify-center gap-1">
                <Droplet className="w-3 h-3" style={{ color: colors.primary }} />
                <span className="hidden sm:inline">Lavagens</span>
                <span className="sm:hidden">Lav</span>
              </div>
            </div>
            <div className={`text-center transition-all duration-200 ${splitBy === 'dry' ? 'sm:scale-110' : splitBy === 'wash' ? 'opacity-50' : ''}`}>
              <div className="text-xl sm:text-2xl font-bold" style={{ color: colors.secondary }}>
                <AnimatedNumber value={periodInfo.totalDry} />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" style={{ color: colors.secondary }} />
                <span className="hidden sm:inline">Secagens</span>
                <span className="sm:hidden">Sec</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatingCyclesChart;
