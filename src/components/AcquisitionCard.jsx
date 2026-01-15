// AcquisitionCard.jsx v1.4
// Unified acquisition metrics + daily chart
// Replaces: CleanKPICard (Novos) + NewClientsChart
// Design System v3.4 compliant - Soft Dashboard aesthetic
//
// CHANGELOG:
// v1.4 (2026-01-15): Bar color coherence
//   - CHANGED: Bar colors now use purple tones matching accent border and icon
//   - Above average: purple-500 (light) / purple-400 (dark)
//   - Below average: purple-300 (light) / gray-500 (dark)
//   - Removed unused getSeriesColors import
// v1.3 (2026-01-15): Chart section header consistency
//   - NEW: Added BarChart3 icon + "Tendência Diária" header to chart section
//   - Matches styling of RFMScatterPlot, VisitHeatmap, RetentionCard
//   - Toggle buttons now right-aligned alongside header
//   - Font updated to text-sm font-bold per Design System
// v1.2 (2026-01-15): Chart enhancements
//   - NEW: 7-day moving average line overlay in daily view
//   - NEW: View toggle (daily/weekly)
//   - Weekly view aggregates 30 days into ~4 bars
//   - MA line uses dashed style to distinguish from bars
// v1.1 (2026-01-15): Compact layout + typography fix
//   - FIXED: Title font now matches Design System (text-base font-bold)
//   - Reduced overall card height (more compact)
//   - Smaller hero number (text-4xl vs text-5xl)
//   - Reduced chart height (h-[180px] vs h-[240px])
//   - Tighter padding throughout
//   - Status pills inline on mobile for space efficiency
// v1.0 (2026-01-15): Initial implementation
//   - Hero section with animated metric + sparkline
//   - Status pills (welcome %, return rate, week trend)
//   - Integrated daily bar chart with touch interactions
//   - Action CTA for pending welcomes
//   - Full-width layout, eliminates redundant info

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import {
  UserPlus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  BarChart3
} from 'lucide-react';
import CustomerSegmentModal from './modals/CustomerSegmentModal';
import { useTouchTooltip } from '../hooks/useTouchTooltip';
import { getChartColors } from '../utils/chartColors';
import { useTheme } from '../contexts/ThemeContext';
import { haptics } from '../utils/haptics';

// ============================================================================
// ANIMATIONS
// ============================================================================

const heroVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const pillVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.2 + i * 0.1, duration: 0.3 }
  })
};

const cardHoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  hover: { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }
};

const cardHoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

// ============================================================================
// ANIMATED SPARKLINE
// ============================================================================

const AnimatedSparkline = ({ data, color = '#8b5cf6', height = 60 }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize to 0-100 with padding
  const normalized = data.map(v => 10 + ((v - min) / range) * 80);

  // Create SVG path
  const width = 100;
  const stepX = width / (data.length - 1);
  const points = normalized.map((y, i) => `${i * stepX},${100 - y}`);
  const linePath = `M ${points.join(' L ')}`;

  // Area path (filled)
  const areaPath = `${linePath} L ${width},100 L 0,100 Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full overflow-visible"
      style={{ height }}
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Filled area */}
      <motion.path
        d={areaPath}
        fill="url(#sparklineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut', delay: 0.2 }}
      />

      {/* End dot */}
      <motion.circle
        cx={width}
        cy={100 - normalized[normalized.length - 1]}
        r="3"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
      />
    </svg>
  );
};

// ============================================================================
// STATUS PILL
// ============================================================================

const StatusPill = ({ icon: Icon, label, value, variant = 'default', index = 0 }) => {
  const variants = {
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    default: 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600/50'
  };

  const iconColors = {
    success: 'text-emerald-500 dark:text-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400',
    info: 'text-blue-500 dark:text-blue-400',
    default: 'text-slate-500 dark:text-slate-400'
  };

  return (
    <motion.div
      custom={index}
      variants={pillVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${variants[variant]}`}
    >
      <Icon className={`w-3 h-3 ${iconColors[variant]}`} />
      <span className="font-bold">{value}</span>
      <span className="opacity-75">{label}</span>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AcquisitionCard = ({
  data,
  totalNewCustomers,
  sparklineData,
  welcomeContactedIds = new Set(),
  returnedCustomerIds = new Set(),
  customerMap = {},
  onOpenCustomerProfile,
  onMarkContacted,
  onCreateCampaign,
  onOpenKPIDrilldown,
  className = ''
}) => {
  // Theme-aware chart colors
  const { isDark } = useTheme();
  const chartColors = useMemo(() => getChartColors(isDark), [isDark]);

  // Handle both old format (array) and new format ({ daily, newCustomerIds })
  const dailyData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.daily || [];
  }, [data]);

  // Get all new customer IDs
  const allNewCustomerIds = useMemo(() => {
    if (data && !Array.isArray(data) && data.newCustomerIds) return data.newCustomerIds;
    return dailyData.flatMap(d => d.customerIds || []);
  }, [data, dailyData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!dailyData || dailyData.length === 0) {
      return {
        totalNew: totalNewCustomers || 0,
        avgNew: 0,
        thisWeek: 0,
        lastWeek: 0,
        weekChange: 0,
        welcomeCount: 0,
        welcomePct: 0,
        returnedCount: 0,
        returnPct: 0,
        notWelcomed: 0
      };
    }

    const total = dailyData.reduce((sum, d) => sum + d.count, 0);
    const avgNew = Math.round(total / dailyData.length);

    // Week-over-week
    const thisWeekData = dailyData.slice(-7);
    const lastWeekData = dailyData.slice(-14, -7);
    const thisWeek = thisWeekData.reduce((sum, d) => sum + d.count, 0);
    const lastWeek = lastWeekData.reduce((sum, d) => sum + d.count, 0);

    // Welcome coverage
    const welcomeCount = allNewCustomerIds.filter(id => welcomeContactedIds.has(String(id))).length;
    const welcomePct = allNewCustomerIds.length > 0
      ? Math.round((welcomeCount / allNewCustomerIds.length) * 100)
      : 0;

    // Return rate
    const returnedCount = allNewCustomerIds.filter(id => returnedCustomerIds.has(String(id))).length;
    const returnPct = allNewCustomerIds.length > 0
      ? Math.round((returnedCount / allNewCustomerIds.length) * 100)
      : 0;

    // Week change
    const weekChange = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : 0;

    return {
      totalNew: totalNewCustomers || total,
      avgNew,
      thisWeek,
      lastWeek,
      weekChange,
      welcomeCount,
      welcomePct,
      returnedCount,
      returnPct,
      notWelcomed: allNewCustomerIds.length - welcomeCount
    };
  }, [dailyData, totalNewCustomers, allNewCustomerIds, welcomeContactedIds, returnedCustomerIds]);

  // Calculate 7-day moving average for daily view
  const dataWithMA = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];
    return dailyData.map((day, index) => {
      // Get previous 6 days + current day (7 total) for rolling average
      const start = Math.max(0, index - 6);
      const window = dailyData.slice(start, index + 1);
      const sum = window.reduce((acc, d) => acc + d.count, 0);
      const ma = window.length > 0 ? sum / window.length : 0;
      return { ...day, ma: Math.round(ma * 10) / 10 };
    });
  }, [dailyData]);

  // Aggregate daily data into weekly buckets for cleaner view
  const weeklyData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];

    const weeks = [];
    let currentWeek = { count: 0, customerIds: [], startDate: null, endDate: null };

    dailyData.forEach((day, i) => {
      if (!currentWeek.startDate) currentWeek.startDate = day.displayDate;
      currentWeek.count += day.count;
      currentWeek.customerIds.push(...(day.customerIds || []));
      currentWeek.endDate = day.displayDate;

      // End of week (every 7 days) or last day
      if ((i + 1) % 7 === 0 || i === dailyData.length - 1) {
        weeks.push({
          ...currentWeek,
          displayDate: `${currentWeek.startDate.slice(0, 5)}-${currentWeek.endDate.slice(0, 5)}`,
          weekLabel: `Sem ${weeks.length + 1}`
        });
        currentWeek = { count: 0, customerIds: [], startDate: null, endDate: null };
      }
    });

    return weeks;
  }, [dailyData]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', customers: [], audienceType: 'newCustomers', color: 'purple' });

  // View mode toggle: 'daily' (30 bars + MA line) or 'weekly' (~4 bars)
  const [viewMode, setViewMode] = useState('daily');

  // Get current chart data based on view mode
  const chartData = viewMode === 'daily' ? dataWithMA : weeklyData;

  // Chart container ref
  const chartContainerRef = useRef(null);

  // Helper to convert IDs to customer objects
  const getCustomersFromIds = useCallback((customerIds) => {
    return customerIds
      .map(id => customerMap[String(id)] || { id, name: `Cliente ${String(id).slice(-4)}` })
      .filter(Boolean);
  }, [customerMap]);

  // Hit-test for long-press (uses current chartData based on viewMode)
  const handleLongPressHitTest = useCallback((touchX, touchY, chartRect) => {
    if (!chartRect || !chartData || chartData.length === 0) return null;

    const relativeX = touchX - chartRect.left;
    const chartWidth = chartRect.width;
    const marginLeft = 45;
    const marginRight = 10;
    const plotWidth = chartWidth - marginLeft - marginRight;
    const barWidth = plotWidth / chartData.length;
    const barIndex = Math.floor((relativeX - marginLeft) / barWidth);

    if (barIndex < 0 || barIndex >= chartData.length) return null;
    return chartData[barIndex];
  }, [chartData]);

  // Touch tooltip hook
  const { handleTouch, isActive: isActiveTouch, tooltipHidden, chartContainerHandlers, setChartRef } = useTouchTooltip({
    onAction: (dayData) => {
      if (!dayData || !dayData.customerIds || dayData.customerIds.length === 0) return;

      const customers = getCustomersFromIds(dayData.customerIds);
      if (customers.length === 0) return;

      setModalData({
        title: `Novos Clientes: ${dayData.displayDate}`,
        subtitle: `${customers.length} clientes`,
        customers,
        audienceType: 'newCustomers',
        color: 'blue',
        icon: UserPlus
      });
      setModalOpen(true);
    },
    onLongPressHitTest: handleLongPressHitTest,
    dismissTimeout: 5000
  });

  // Set chart ref
  useEffect(() => {
    if (chartContainerRef.current) {
      setChartRef(chartContainerRef.current);
    }
  }, [setChartRef]);

  // Open all new customers modal
  const handleNewCustomersClick = useCallback(() => {
    if (!allNewCustomerIds || allNewCustomerIds.length === 0) return;

    const customers = getCustomersFromIds(allNewCustomerIds);
    if (customers.length === 0) return;

    setModalData({
      title: 'Novos Clientes',
      subtitle: `${customers.length} clientes`,
      customers,
      audienceType: 'newCustomers',
      color: 'purple',
      icon: UserPlus
    });
    setModalOpen(true);
  }, [allNewCustomerIds, getCustomersFromIds]);

  // Bar click handler
  const handleBarClick = useCallback((dayData) => {
    if (!dayData || !dayData.customerIds || dayData.customerIds.length === 0) return;
    handleTouch(dayData, dayData.displayDate);
  }, [handleTouch]);

  // Custom tooltip
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      const dayCustomerIds = dayData.customerIds || [];
      const welcomed = dayCustomerIds.filter(id => welcomeContactedIds.has(String(id))).length;
      const isActiveTouchItem = isActiveTouch(dayData.displayDate);

      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{dayData.displayDate}</p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">{payload[0].value}</span> novos
          </p>

          {dayCustomerIds.length > 0 && welcomeContactedIds.size > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 dark:text-emerald-400">Com boas-vindas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{welcomed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Sem boas-vindas:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{dayData.count - welcomed}</span>
              </div>
            </div>
          )}

          {isActiveTouchItem && dayCustomerIds.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-purple-600 dark:text-purple-400 text-xs font-medium text-center animate-pulse">
                Toque novamente para ver clientes
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  }, [welcomeContactedIds, isActiveTouch]);

  // Loading state
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 p-4 ${className}`}>
        <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500">
          <div className="text-center">
            <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Carregando dados de aquisição...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={cardHoverAnimation}
      transition={cardHoverTransition}
      className={`
        bg-gradient-to-br from-purple-50/40 via-white to-white
        dark:from-purple-900/10 dark:via-slate-800 dark:to-slate-800
        rounded-2xl
        border border-slate-200/80 dark:border-slate-700/80
        border-l-4 border-l-purple-500 dark:border-l-purple-400
        overflow-hidden
        ${className}
      `}
    >
      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION (Compact)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Hero Metric */}
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 min-w-0"
          >
            {/* Title row with icon */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg shrink-0">
                <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Novos Clientes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Últimos 30 dias
                </p>
              </div>
            </div>

            {/* Hero Number + Sparkline row */}
            <div className="flex items-end gap-4">
              {/* Hero Number - clickable */}
              <button
                onClick={() => {
                  haptics.light();
                  if (onOpenKPIDrilldown) onOpenKPIDrilldown();
                }}
                className="group flex items-baseline gap-1.5 hover:opacity-80 transition-opacity shrink-0"
              >
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.totalNew}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Sparkline - inline with number */}
              {sparklineData && sparklineData.length > 1 && (
                <div className="flex-1 min-w-[80px] max-w-[140px] mb-1.5">
                  <AnimatedSparkline
                    data={sparklineData}
                    color={isDark ? '#a78bfa' : '#8b5cf6'}
                    height={36}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Status Pills (vertical stack) */}
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            {/* Welcome coverage */}
            {stats.welcomePct > 0 && (
              <StatusPill
                icon={CheckCircle}
                value={`${stats.welcomePct}%`}
                label="welcome"
                variant="success"
                index={0}
              />
            )}

            {/* Week change */}
            {stats.weekChange !== 0 && (
              <StatusPill
                icon={stats.weekChange > 0 ? TrendingUp : TrendingDown}
                value={`${stats.weekChange > 0 ? '+' : ''}${stats.weekChange}%`}
                label="semana"
                variant={stats.weekChange > 0 ? 'success' : 'default'}
                index={1}
              />
            )}

            {/* Return rate */}
            {stats.returnPct > 0 && (
              <StatusPill
                icon={RefreshCw}
                value={`${stats.returnPct}%`}
                label="retorno"
                variant={stats.returnPct >= 30 ? 'success' : 'info'}
                index={2}
              />
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CHART SECTION HEADER + VIEW MODE TOGGLE
          ════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pt-3 flex items-center justify-between">
        {/* Section header with icon */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Tendência Diária
          </span>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'daily'
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'weekly'
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CHART SECTION (Compact)
          ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={chartContainerRef}
        className="px-3 sm:px-4 pt-2 pb-1"
        {...chartContainerHandlers}
      >
        <div className="h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke={chartColors.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={viewMode === 'daily' ? Math.floor(chartData.length / 6) : 0}
                tick={{ fill: chartColors.tickText }}
              />
              <YAxis
                stroke={chartColors.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: chartColors.tickText }}
                width={30}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: chartColors.cursorFill }}
                wrapperStyle={{ visibility: tooltipHidden ? 'hidden' : 'visible' }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                onClick={(barData) => handleBarClick(barData)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count > stats.avgNew
                      ? (isDark ? '#a78bfa' : '#8b5cf6')  // purple-400/500 for above average
                      : (isDark ? '#6b7280' : '#c4b5fd')  // gray-500/purple-300 for below average
                    }
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  fontSize={viewMode === 'daily' ? 9 : 11}
                  fill={chartColors.tickText}
                  formatter={(value) => value > 0 ? value : ''}
                />
              </Bar>
              {/* 7-day moving average line - only in daily view */}
              {viewMode === 'daily' && (
                <Line
                  type="monotone"
                  dataKey="ma"
                  stroke={isDark ? '#c4b5fd' : '#7c3aed'}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 2"
                  name="Média 7 dias"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ACTION SECTION (Compact)
          ════════════════════════════════════════════════════════════════════ */}
      {stats.notWelcomed > 0 && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button
            onClick={() => {
              haptics.light();
              handleNewCustomersClick();
            }}
            className="
              w-full flex items-center justify-between gap-2
              px-3 py-2.5
              bg-amber-50 dark:bg-amber-900/20
              border border-amber-200 dark:border-amber-800/50
              rounded-lg
              hover:bg-amber-100 dark:hover:bg-amber-900/30
              transition-colors
              group
            "
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  {stats.notWelcomed} clientes sem boas-vindas
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Toque para ver e criar campanha
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 dark:text-amber-500 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL
          ════════════════════════════════════════════════════════════════════ */}
      <CustomerSegmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        subtitle={modalData.subtitle}
        icon={modalData.icon}
        color={modalData.color}
        customers={modalData.customers}
        audienceType={modalData.audienceType}
        contactedIds={welcomeContactedIds}
        onOpenCustomerProfile={onOpenCustomerProfile}
        onMarkContacted={onMarkContacted}
        onCreateCampaign={onCreateCampaign}
      />
    </motion.div>
  );
};

export default AcquisitionCard;
