// CustomerCyclesTrend.jsx v2.1 - CARD LABEL CONTRAST FIX
// Lifetime cycles trend chart for customer profile modal
// Triggered by clicking customer name - shows monthly service history
// Design System v5.0 compliant - Variant D (Glassmorphism Cosmic)
//
// CHANGELOG:
// v2.1 (2026-01-18): Improved card label contrast in dark mode
//   - Changed stat card titles from dark:text-slate-500 to dark:text-slate-300
//   - Better readability for Total, Média, Melhor Mês labels
// v2.0 (2026-01-18): Cosmic Design System v5.0 overhaul
//   - Updated to space-nebula/space-dust backgrounds
//   - Stellar-cyan accents for icons and borders
//   - Glassmorphism cards with cosmic borders
//   - Chart gradient uses stellar-cyan palette
//   - Cosmic hover states on buttons
// v1.2 (2025-12-22): Improved "Melhor Mês" card UX
//   - Changed layout: month as value, cycles as subtitle
//   - Header now says "Melhor Mês" for clarity
//   - Consistent pattern with other stat cards
// v1.1 (2025-12-22): Fixed to count services (wash+dry), not transactions
//   - Uses countMachines from transactionParser for accurate counts
//   - Aggregates total services (wash + dry) per month
// v1.0 (2025-12-22): Initial implementation
//   - Monthly aggregation of customer cycles
//   - Stats cards (total, average, best month)
//   - AreaChart with gradient fill
//   - Collapse button with haptic feedback

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getChartColors } from '../../utils/chartColors';
import { haptics } from '../../utils/haptics';
import { parseBrDate } from '../../utils/dateUtils';
import { countMachines } from '../../utils/transactionParser';

// Cosmic color palette for chart
const STELLAR_CYAN = '#22d3ee';

const CustomerCyclesTrend = ({ sales, customerDoc, onCollapse }) => {
  const { isDark } = useTheme();
  const chartColors = getChartColors(isDark);

  // Calculate monthly cycles data
  const { monthlyData, stats } = useMemo(() => {
    if (!sales || sales.length === 0 || !customerDoc) {
      return { monthlyData: [], stats: { total: 0, average: 0, bestMonth: '-', bestValue: 0 } };
    }

    // Filter sales for this customer
    const customerSales = sales.filter(row => {
      const doc = String(row.Doc_Cliente || row.document || '').replace(/\D/g, '').padStart(11, '0');
      return doc === customerDoc;
    });

    if (customerSales.length === 0) {
      return { monthlyData: [], stats: { total: 0, average: 0, bestMonth: '-', bestValue: 0 } };
    }

    // Aggregate services (wash + dry) by month
    const monthMap = {};

    customerSales.forEach(row => {
      const dateStr = row.Data_Hora || row.Data || '';
      const date = parseBrDate(dateStr);

      if (date && !isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const machineStr = row.Maquinas || row.Maquina || row.machine || '';
        // Count services (wash + dry), not transactions
        const machineInfo = countMachines(machineStr);
        const services = machineInfo.total; // wash + dry

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { services: 0, year: date.getFullYear(), month: date.getMonth() };
        }
        monthMap[monthKey].services += services;
      }
    });

    // Convert to sorted array
    const sortedMonths = Object.keys(monthMap).sort();
    const data = sortedMonths.map(key => {
      const { services, year, month } = monthMap[key];
      // Format as short month name (Jan, Fev, Mar...)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const displayMonth = monthNames[month];
      const displayYear = String(year).slice(-2); // 2024 → 24

      return {
        month: key,
        displayMonth: sortedMonths.length > 12 ? `${displayMonth}/${displayYear}` : displayMonth,
        services
      };
    });

    // Calculate stats
    const total = data.reduce((sum, d) => sum + d.services, 0);
    const average = data.length > 0 ? total / data.length : 0;

    const best = data.reduce((max, d) => d.services > max.services ? d : max, data[0] || { services: 0, displayMonth: '-' });

    return {
      monthlyData: data,
      stats: {
        total,
        average: Math.round(average * 10) / 10,
        bestMonth: best.displayMonth,
        bestValue: best.services
      }
    };
  }, [sales, customerDoc]);

  const handleCollapse = () => {
    haptics.light();
    onCollapse?.();
  };

  const gradientId = 'customer-cycles-gradient-cosmic';

  // Empty state
  if (monthlyData.length === 0) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-space-nebula/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-stellar-cyan" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Histórico de Ciclos
            </h4>
          </div>
          <button
            onClick={handleCollapse}
            className="flex items-center gap-1 px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-stellar-cyan hover:bg-slate-200 dark:hover:bg-space-dust rounded-lg transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="text-xs font-medium">Ocultar</span>
          </button>
        </div>
        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
          Nenhum histórico de ciclos disponível
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-space-nebula/50 space-y-3">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-stellar-cyan" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            Histórico de Ciclos
          </h4>
        </div>
        <button
          onClick={handleCollapse}
          className="flex items-center gap-1 px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-stellar-cyan hover:bg-slate-200 dark:hover:bg-space-dust rounded-lg transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-xs font-medium">Ocultar</span>
        </button>
      </div>

      {/* Stats cards (3 cols) - Cosmic glassmorphism */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-space-dust/80 rounded-xl p-2.5 border border-slate-200 dark:border-stellar-cyan/15">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">Total</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.total}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">ciclos</p>
        </div>
        <div className="bg-white dark:bg-space-dust/80 rounded-xl p-2.5 border border-slate-200 dark:border-stellar-cyan/15">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">Média</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.average}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">por mês</p>
        </div>
        <div className="bg-white dark:bg-space-dust/80 rounded-xl p-2.5 border border-slate-200 dark:border-stellar-cyan/15">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-0.5">Melhor Mês</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.bestMonth}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{stats.bestValue} ciclos</p>
        </div>
      </div>

      {/* Chart - Stellar cyan gradient */}
      <div className="h-32 sm:h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={STELLAR_CYAN} stopOpacity={0.4} />
                <stop offset="95%" stopColor={STELLAR_CYAN} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(34, 211, 238, 0.1)' : chartColors.axis}
              vertical={false}
            />
            <XAxis
              dataKey="displayMonth"
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : chartColors.tickText }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis hide={true} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : chartColors.tooltipBg,
                borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : chartColors.tooltipBorder,
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${value} ciclos`, 'Ciclos']}
              labelFormatter={(label) => label}
              labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}
              itemStyle={{ color: STELLAR_CYAN }}
            />
            <Area
              type="monotone"
              dataKey="services"
              stroke={STELLAR_CYAN}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerCyclesTrend;
