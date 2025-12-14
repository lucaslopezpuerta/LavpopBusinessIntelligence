// NewClientsChart.jsx v3.0 - WELCOME COVERAGE + RETURN TRACKING
// New customer acquisition with campaign integration
//
// CHANGELOG:
// v3.0 (2025-12-13): Welcome coverage + return tracking
//   - NEW: welcomeContactedIds prop - IDs who received welcome campaign
//   - NEW: returnedCustomerIds prop - IDs of new customers who returned
//   - NEW: Welcome coverage insight (% of new customers who got welcome message)
//   - NEW: Return tracking insight (% of new customers who came back)
//   - NEW: Trend comparison (this week vs last week)
//   - IMPROVED: Dynamic data-driven insights
//   - UPDATED: Handles new data format { daily, newCustomerIds }
// v2.3 (2025-11-30): Chart memoization for performance
//   - Memoized stats, insights, and CustomTooltip
//   - Prevents unnecessary chart repaints
// v2.2 (2025-11-29): Design System v3.0 compliance
//   - Removed emojis from insight text strings
// v2.1 (2025-11-24): Added actionable insights
//   - NEW: InsightBox with acquisition recommendations
// v2.0 (2025-11-23): Redesign for Customer Intelligence Hub

import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import InsightBox from './ui/InsightBox';

const NewClientsChart = ({
  data,
  newCustomerIds = [],
  welcomeContactedIds = new Set(),
  returnedCustomerIds = new Set()
}) => {
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

  // Generate dynamic insights
  const insights = useMemo(() => {
    const result = [];

    // Base stats
    result.push({
      type: 'success',
      text: `${stats.totalNew} novos clientes (média ${stats.avgNew}/dia)`
    });

    // Week-over-week trend
    if (stats.weekChange !== 0) {
      const trendType = stats.weekChange > 0 ? 'success' : 'warning';
      const trendText = stats.weekChange > 0
        ? `+${stats.weekChange}% vs semana anterior`
        : `${stats.weekChange}% vs semana anterior`;
      result.push({ type: trendType, text: trendText });
    }

    // Welcome campaign coverage
    if (welcomeContactedIds.size > 0 && allNewCustomerIds.length > 0) {
      if (stats.welcomePct >= 80) {
        result.push({
          type: 'success',
          text: `${stats.welcomeCount}/${allNewCustomerIds.length} receberam boas-vindas (${stats.welcomePct}%)`
        });
      } else if (stats.notWelcomed > 0) {
        result.push({
          type: 'warning',
          text: `${stats.notWelcomed} novos clientes sem mensagem de boas-vindas`
        });
      }
    }

    // Return tracking
    if (returnedCustomerIds.size > 0 && stats.returnedCount > 0) {
      const returnType = stats.returnPct >= 50 ? 'success' : 'info';
      result.push({
        type: returnType,
        text: `${stats.returnedCount} novos clientes já retornaram (${stats.returnPct}% conversão)`
      });
    }

    // Action items
    if (stats.notWelcomed > 0 && welcomeContactedIds.size > 0) {
      result.push({
        type: 'action',
        text: 'Ação: Ativar automação de boas-vindas para novos clientes'
      });
    } else {
      result.push({
        type: 'action',
        text: 'Meta: Converter 80% em clientes recorrentes'
      });
    }

    return result;
  }, [stats, welcomeContactedIds, returnedCustomerIds, allNewCustomerIds]);

  // Memoize CustomTooltip
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      const dayCustomerIds = dayData.customerIds || [];
      const welcomed = dayCustomerIds.filter(id => welcomeContactedIds.has(String(id))).length;

      return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-bold text-lavpop-blue dark:text-blue-400 text-lg">{payload[0].value}</span> novos clientes
          </p>

          {/* Welcome status for this day */}
          {dayCustomerIds.length > 0 && welcomeContactedIds.size > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-green-600 dark:text-green-400">Com boas-vindas:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{welcomed}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 dark:text-slate-400">Sem boas-vindas:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">{dayData.count - welcomed}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  }, [welcomeContactedIds]);

  if (!dailyData || dailyData.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Novos Clientes
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aquisição nos últimos 30 dias.
        </p>

        {/* Welcome coverage legend */}
        {welcomeContactedIds.size > 0 && allNewCustomerIds.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]">
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

      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalNew}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Total</div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.avgNew}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Média/Dia</div>
        </div>
        {stats.weekChange !== 0 && (
          <div>
            <div className={`text-xl font-bold ${stats.weekChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.weekChange > 0 ? '+' : ''}{stats.weekChange}%
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase">vs Semana</div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {dailyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count > stats.avgNew ? '#3b82f6' : '#93c5fd'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <InsightBox insights={insights} />
    </div>
  );
};

export default NewClientsChart;
