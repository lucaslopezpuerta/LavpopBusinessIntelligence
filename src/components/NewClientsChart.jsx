// NewClientsChart.jsx v3.9 - HAPTIC FEEDBACK
// New customer acquisition with campaign integration
//
// CHANGELOG:
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

import React, { useMemo, useCallback, useState } from 'react';
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

  // Helper to convert customer IDs to customer objects (moved up for use in hook callback)
  const getCustomersFromIds = useCallback((customerIds) => {
    return customerIds
      .map(id => customerMap[String(id)] || { id, name: `Cliente ${String(id).slice(-4)}` })
      .filter(Boolean);
  }, [customerMap]);

  // Use shared touch tooltip hook for mobile-friendly interactions
  // Desktop: single click opens modal immediately
  // Mobile: tap-to-preview, tap-again-to-action
  const { handleTouch, isActive: isActiveTouch, tooltipHidden } = useTouchTooltip({
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
    dismissTimeout: 5000
  });

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
      <div className="mb-4">
        {/* Header row with title and insight pills */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Novos Clientes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aquisição nos últimos 30 dias.
            </p>
          </div>

          {/* Insight Pills - relocated to header */}
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            {/* Welcome status pill */}
            {stats.notWelcomed > 0 ? (
              <button
                onClick={() => { haptics.light(); handleNewCustomersClick(); }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
                  {stats.notWelcomed} sem boas-vindas
                </span>
                <ChevronRight className="w-3 h-3 text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : stats.welcomeCount > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                  {stats.welcomePct}% com boas-vindas
                </span>
              </div>
            ) : null}

            {/* Return/trend pill */}
            {stats.returnedCount > 0 ? (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                stats.returnPct >= 50
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
              }`}>
                <CheckCircle className={`w-3.5 h-3.5 ${
                  stats.returnPct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                }`} />
                <span className={`text-xs font-medium whitespace-nowrap ${
                  stats.returnPct >= 50 ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {stats.returnPct}% retornaram
                </span>
              </div>
            ) : stats.weekChange !== 0 ? (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                stats.weekChange > 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
              }`}>
                {stats.weekChange > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <span className={`text-xs font-medium whitespace-nowrap ${
                  stats.weekChange > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}% vs semana
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Welcome coverage legend - Design System compliant (min text-xs) */}
        {welcomeContactedIds.size > 0 && allNewCustomerIds.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Total novos</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {stats.welcomeCount}/{allNewCustomerIds.length} com boas-vindas ({stats.welcomePct}%)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[200px]">
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
