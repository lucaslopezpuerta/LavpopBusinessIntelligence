// WashVsDryChart Component v2.1.0
// Comparison of wash vs dry services and revenue
//
// CHANGELOG:
// v2.1.0 (2025-11-30): Chart memoization for performance
//   - Memoized servicesData and revenueData arrays
//   - Memoized CustomTooltip component
//   - Prevents unnecessary chart repaints
// v2.0.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support throughout
//   - Removed COLORS object (using Tailwind classes and theme colors)
//   - Updated Recharts colors to match design system
//   - Replaced emoji with Lightbulb icon
//   - Improved responsive design
//   - Aligned with Design System v3.0
// v1.1 (2025-11-15): Added date window display
//   - Now receives dateWindow prop from parent
//   - Displays explicit date range in subtitle
//   - Synchronized with Operations tab DateRangeSelector
// v1.0 (Previous): Initial implementation

import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Droplet, Flame, Activity, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const WashVsDryChart = ({ washVsDry, dateWindow }) => {
  // Memoize chart data arrays to prevent new references on every render
  const { servicesData, revenueData } = useMemo(() => {
    if (!washVsDry) {
      return { servicesData: [], revenueData: [] };
    }
    const { wash, dry } = washVsDry;
    return {
      servicesData: [
        { name: 'Lavagens', value: wash.services, color: '#1a5a8e' }, // lavpop-blue
        { name: 'Secagens', value: dry.services, color: '#f59e0b' }  // amber-500
      ],
      revenueData: [
        { name: 'Lavagens', value: wash.revenue, color: '#1a5a8e' }, // lavpop-blue
        { name: 'Secagens', value: dry.revenue, color: '#f59e0b' }  // amber-500
      ]
    };
  }, [washVsDry]);

  // Memoize CustomTooltip to prevent recreation on every render
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
          <p className="text-sm font-semibold text-slate-900 dark:text-white m-0">
            {label}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 m-0">
            {payload[0].value.toLocaleString('pt-BR')}
          </p>
        </div>
      );
    }
    return null;
  }, []);

  if (!washVsDry) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Loading wash vs dry comparison...
      </div>
    );
  }

  const { wash, dry, total } = washVsDry;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Lavagem vs Secagem
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Wash Stats */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Lavagens
            </h4>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {wash.services}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {wash.percentOfServices.toFixed(1)}% dos serviços
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(wash.revenue)}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">
            {formatCurrency(wash.avgPerService)}/serviço
          </div>
        </div>

        {/* Dry Stats */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Secagens
            </h4>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
            {dry.services}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {dry.percentOfServices.toFixed(1)}% dos serviços
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(dry.revenue)}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">
            {formatCurrency(dry.avgPerService)}/serviço
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Services Chart */}
        <div>
          <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            Volume de Serviços
          </h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={servicesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {servicesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div>
          <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            Receita Gerada
          </h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-900 dark:text-white">Análise:</strong> {wash.avgPerService > dry.avgPerService
              ? 'Lavagens geram mais receita por serviço'
              : 'Secagens geram mais receita por serviço'}. Considere ajustar a estratégia de preços.
          </span>
        </div>
      </div>
    </div>
  );
};

export default WashVsDryChart;
