// NewClientsChart.jsx v4.0 - LONG-PRESS DIRECT ACTION
// New customer acquisition with campaign integration
//
// CHANGELOG:
// v4.0 (2026-01-15): Long-press opens modal directly
//   - NEW: onLongPressHitTest callback for bar hit-testing
//   - Long-press on bar → opens modal directly (skips tooltip preview)
//   - Uses chartContainerHandlers and setChartRef from useTouchTooltip
// v3.9 (2025-12-22): Added haptic feedback on insight button
// v3.8 (2025-12-16): Theme-aware chart colors
//   - ADDED: Uses getChartColors/getSeriesColors from chartColors.js
//   - FIXED: Grid, axis, labels now respond to dark mode
//   - FIXED: Bar colors use seriesColors for consistency
//   - FIXED: fontSize 10 → 12 for axis labels (Design System minimum)
// v3.7 (2025-12-16): Chart layout improvements
//   - REMOVED: Redundant WoW metric (now shown in header pill)
//   - MOVED: Total and average stats to bottom center
//   - ADDED: X-axis label "Data" and Y-axis label "Novos Clientes"
//   - ADDED: Bar value labels on top of each bar
// v3.6 (2025-12-16): Insight pills relocated to header
//   - MOVED: Insights from bottom InsightBox to compact header pills
//   - REMOVED: InsightBox component dependency
//   - Added TrendingUp/TrendingDown icons for week change pill
// v3.5 (2025-12-16): Tooltip dismiss on action
//   - FIXED: Tooltip now hides when modal opens
//   - Uses tooltipHidden from hook to control Recharts Tooltip visibility
// v3.4 (2025-12-16): Refactored to use useTouchTooltip hook
//   - REMOVED: Duplicated touch handling logic
//   - Uses shared hook for consistent desktop/mobile behavior
//   - Desktop: single click opens modal immediately
//   - Mobile: tap-to-preview, tap-again-to-action
// v3.3 (2025-12-16): Mobile touch tooltip support + bar click
//   - NEW: Click bar → opens modal with customers from that day
//   - Uses tap-to-preview, tap-again-to-action pattern
//   - First tap shows tooltip with "Toque novamente" hint on mobile
//   - Second tap opens CustomerSegmentModal
//   - Fixed text-[10px] violation in tooltip welcome status (min 12px)
// v3.2 (2025-12-16): Pass ALL customers to modal (let modal filter)
//   - Removed pre-filtering of unwelcomed customers
//   - Modal's hideContacted=true handles filtering (more flexible for user)
//   - Fixes issue where unchecking "Ocultar Contactados" showed empty list
// v3.1 (2025-12-15): Interactive insights + modal integration
//   - REFACTORED: Reduced insights from 4 to 2 (primary clickable, secondary info)
//   - NEW: Click insight → opens modal with new customers
//   - NEW: onOpenCustomerProfile and onCreateCampaign props
// v3.0 (2025-12-13): Welcome coverage + return tracking
//   - NEW: welcomeContactedIds prop - IDs who received welcome campaign
//   - NEW: returnedCustomerIds prop - IDs of new customers who returned
//   - NEW: Welcome coverage insight (% of new customers who got welcome message)
//   - NEW: Return tracking insight (% of new customers who came back)
//   - NEW: Trend comparison (this week vs last week)
//   - IMPROVED: Dynamic data-driven insights
// v2.3 (2025-11-30): Chart memoization for performance
// v2.2 (2025-11-29): Design System v3.0 compliance
// v2.1 (2025-11-24): Added actionable insights
// v2.0 (2025-11-23): Redesign for Customer Intelligence Hub

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { UserPlus, AlertTriangle, CheckCircle, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import CustomerSegmentModal from './modals/CustomerSegmentModal';
import { useTouchTooltip } from '../hooks/useTouchTooltip';
import { getChartColors, getSeriesColors } from '../utils/chartColors';
import { useTheme } from '../contexts/ThemeContext';
import { haptics } from '../utils/haptics';

const NewClientsChart = ({
  data,
  newCustomerIds = [],
  welcomeContactedIds = new Set(),
  returnedCustomerIds = new Set(),
  customerMap = {},
  onOpenCustomerProfile,
  onMarkContacted,
  onCreateCampaign
}) => {
  // Theme-aware chart colors (Design System v3.2)
  const { isDark } = useTheme();
  const chartColors = useMemo(() => getChartColors(isDark), [isDark]);
  const seriesColors = useMemo(() => getSeriesColors(isDark), [isDark]);

  // Handle both old format (array) and new format ({ daily, newCustomerIds })
  const dailyData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.daily || [];
  }, [data]);

  // Get all new customer IDs (from props or data)
  const allNewCustomerIds = useMemo(() => {
    if (newCustomerIds && newCustomerIds.length > 0) return newCustomerIds;
    if (data && !Array.isArray(data) && data.newCustomerIds) return data.newCustomerIds;
    // Fallback: collect from daily data
    return dailyData.flatMap(d => d.customerIds || []);
  }, [newCustomerIds, data, dailyData]);

  // Memoize stats
  const stats = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return { totalNew: 0, avgNew: 0, thisWeek: 0, lastWeek: 0 };

    const total = dailyData.reduce((sum, d) => sum + d.count, 0);
    const avgNew = Math.round(total / dailyData.length);

    // Calculate this week vs last week (assuming data is last 30 days)
    const thisWeekData = dailyData.slice(-7);
    const lastWeekData = dailyData.slice(-14, -7);
    const thisWeek = thisWeekData.reduce((sum, d) => sum + d.count, 0);
    const lastWeek = lastWeekData.reduce((sum, d) => sum + d.count, 0);

    // Welcome campaign coverage
    const welcomeCount = allNewCustomerIds.filter(id => welcomeContactedIds.has(String(id))).length;
    const welcomePct = allNewCustomerIds.length > 0
      ? Math.round((welcomeCount / allNewCustomerIds.length) * 100)
      : 0;

    // Return rate (new customers who came back)
    const returnedCount = allNewCustomerIds.filter(id => returnedCustomerIds.has(String(id))).length;
    const returnPct = allNewCustomerIds.length > 0
      ? Math.round((returnedCount / allNewCustomerIds.length) * 100)
      : 0;

    // Week-over-week change
    const weekChange = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : 0;

    return {
      totalNew: total,
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
  }, [dailyData, allNewCustomerIds, welcomeContactedIds, returnedCustomerIds]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', customers: [], audienceType: 'newCustomers', color: 'purple' });

  // Chart container ref for hit-testing
  const chartContainerRef = useRef(null);

  // Helper to convert customer IDs to customer objects (moved up for use in hook callback)
  const getCustomersFromIds = useCallback((customerIds) => {
    return customerIds
      .map(id => customerMap[String(id)] || { id, name: `Cliente ${String(id).slice(-4)}` })
      .filter(Boolean);
  }, [customerMap]);

  /**
   * Hit-test callback for long-press on chart
   * Finds which bar is under the touch X position
   * v4.0: Enables long-press to directly open modal (skips tooltip preview)
   */
  const handleLongPressHitTest = useCallback((touchX, touchY, chartRect) => {
    if (!chartRect || !dailyData || dailyData.length === 0) return null;

    // Calculate position relative to chart
    const relativeX = touchX - chartRect.left;
    const chartWidth = chartRect.width;

    // Account for chart margins (from BarChart: left: 0, right: 10)
    const marginLeft = 45; // Actual left margin accounting for YAxis
    const marginRight = 10;
    const plotWidth = chartWidth - marginLeft - marginRight;

    // Calculate which bar index the touch is over
    const barWidth = plotWidth / dailyData.length;
    const barIndex = Math.floor((relativeX - marginLeft) / barWidth);

    // Bounds check
    if (barIndex < 0 || barIndex >= dailyData.length) return null;

    return dailyData[barIndex];
  }, [dailyData]);

  // Use shared touch tooltip hook for mobile-friendly interactions
  // Desktop: single click opens modal immediately
  // Mobile: tap-to-preview, tap-again-to-action, OR long-press for direct action
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

  // Set chart ref when component mounts
  useEffect(() => {
    if (chartContainerRef.current) {
      setChartRef(chartContainerRef.current);
    }
  }, [setChartRef]);

  // Click handler for new customers insight - passes ALL new customers
  const handleNewCustomersClick = useCallback(() => {
    if (!allNewCustomerIds || allNewCustomerIds.length === 0) return;

    // v3.2: Pass ALL new customers, let modal's hideContacted filter handle it
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

  // Click handler for bar - uses shared touch hook
  // Desktop: immediate action, Mobile: tap-to-preview, tap-again-to-action
  const handleBarClick = useCallback((dayData) => {
    if (!dayData || !dayData.customerIds || dayData.customerIds.length === 0) return;
    handleTouch(dayData, dayData.displayDate);
  }, [handleTouch]);


  // Memoize CustomTooltip - with mobile hint support
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      const dayCustomerIds = dayData.customerIds || [];
      const welcomed = dayCustomerIds.filter(id => welcomeContactedIds.has(String(id))).length;
      const isActiveTouchItem = isActiveTouch(dayData.displayDate);

      return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-bold text-lavpop-blue dark:text-blue-400 text-lg">{payload[0].value}</span> novos clientes
          </p>

          {/* Welcome status for this day - Fixed: text-xs instead of text-[10px] */}
          {dayCustomerIds.length > 0 && welcomeContactedIds.size > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 dark:text-green-400">Com boas-vindas:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{welcomed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Sem boas-vindas:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{dayData.count - welcomed}</span>
              </div>
            </div>
          )}

          {/* Mobile hint - shows when item is active from first tap */}
          {isActiveTouchItem && dayCustomerIds.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-blue-600 dark:text-blue-400 text-xs font-medium text-center animate-pulse">
                👆 Toque novamente para ver clientes
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  }, [welcomeContactedIds, isActiveTouch]);

  if (!dailyData || dailyData.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        {/* Title + Subtitle */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Novos Clientes
              </h3>
              {/* Welcome coverage badge */}
              {welcomeContactedIds.size > 0 && allNewCustomerIds.length > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
                  {stats.welcomeCount}/{allNewCustomerIds.length} com boas-vindas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aquisição nos últimos 30 dias
            </p>
          </div>
        </div>

        {/* Insight Pills - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Welcome status pill */}
          {stats.notWelcomed > 0 ? (
            <button
              onClick={() => { haptics.light(); handleNewCustomersClick(); }}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {stats.notWelcomed}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  sem boas-vindas
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 dark:text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : stats.welcomeCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {stats.welcomePct}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                com boas-vindas
              </span>
            </div>
          ) : null}

          {/* Return/trend pill */}
          {stats.returnedCount > 0 ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              stats.returnPct >= 50
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'
            }`}>
              <CheckCircle className={`w-4 h-4 ${
                stats.returnPct >= 50 ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400'
              }`} />
              <span className={`text-sm font-semibold ${
                stats.returnPct >= 50 ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'
              }`}>
                {stats.returnPct}%
              </span>
              <span className={`text-xs ${
                stats.returnPct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                retornaram
              </span>
            </div>
          ) : stats.weekChange !== 0 ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              stats.weekChange > 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/50'
            }`}>
              {stats.weekChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
              <span className={`text-sm font-semibold ${
                stats.weekChange > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}%
              </span>
              <span className={`text-xs ${
                stats.weekChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                vs semana
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="flex-1 min-h-[200px]"
        {...chartContainerHandlers}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={6}
              tick={{ fill: chartColors.tickText }}
              label={{ value: 'Data', position: 'bottom', offset: 0, fontSize: 12, fill: chartColors.tickText }}
            />
            <YAxis
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: chartColors.tickText }}
              label={{ value: 'Novos Clientes', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: chartColors.tickText }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: chartColors.cursorFill }} wrapperStyle={{ visibility: tooltipHidden ? 'hidden' : 'visible' }} />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              onClick={(barData) => handleBarClick(barData)}
              cursor="pointer"
            >
              {dailyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count > stats.avgNew ? seriesColors[0] : chartColors.info}
                />
              ))}
              <LabelList dataKey="count" position="top" fontSize={10} fill={chartColors.tickText} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stats - centered */}
      <div className="flex justify-center items-center gap-6 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalNew}</div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</div>
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
        <div className="text-center">
          <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.avgNew}</div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Média/Dia</div>
        </div>
      </div>

      {/* Customer Segment Modal */}
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
    </div>
  );
};

export default NewClientsChart;
