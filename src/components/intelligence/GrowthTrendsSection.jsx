// GrowthTrendsSection.jsx v5.0
// Growth & trends analysis section for Intelligence tab
// Design System v3.1 compliant - Migrated to Recharts
//
// CHANGELOG:
// v5.0 (2025-12-14): Migrated from Tremor to Recharts
//   - Replaced Tremor AreaChart with Recharts AreaChart
//   - Custom tooltip matching project patterns
//   - Gradient fill with linear gradient defs
//   - Reduced bundle size by removing Tremor dependency
// v4.2 (2025-12-03): Desktop table improvements
//   - Center-aligned all table headers and cells
//   - Full month names on desktop table (e.g., "Novembro 2024")
// v4.1 (2025-12-03): Mobile chart optimizations
//   - X-axis labels: 'tiny' format on mobile (e.g., "D24" for Dec 2024)
//   - Custom compact tooltip: smaller on mobile, shows full month name
//   - Removed label rotation since tiny format fits without rotation
//   - Fixed Y-axis width for proper currency display
// v4.0 (2025-12-03): Tremor chart library migration
// v3.2 (2025-12-03): Responsive labels + mobile card improvements
// v3.1 (2025-12-03): Mobile KPI card improvements
// v3.0 (2025-12-03): Major refactor - Nivo to Recharts migration
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
// v2.1 (2025-12-02): Unified section header
// v2.0 (2025-11-30): Major refactor with unified components
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React, { useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Minus, Clock, Star, ArrowDown } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import TrendBadge from '../ui/TrendBadge';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMonthKey } from '../../utils/dateUtils';

const GrowthTrendsSection = ({
  growthTrends,
  formatCurrency,
  formatPercent
}) => {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // Memoize chart data with formatted month names
  // Use 'tiny' format on mobile (e.g., "N24") to prevent label truncation
  const chartData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;
    const dataPoints = growthTrends.monthly.slice(-12).map((m) => ({
      month: formatMonthKey(m.month, isMobile ? 'tiny' : 'short'), // Mobile: "N24", Desktop: "Nov 24"
      fullMonth: formatMonthKey(m.month, 'long'), // For tooltip: "Novembro 2024"
      Receita: m.revenue || 0,
      isPartial: m.isPartial || false,
    }));
    // Need at least 2 points for a line
    if (dataPoints.length < 2) return null;
    return dataPoints;
  }, [growthTrends?.monthly, isMobile]);

  // Currency formatter for tooltips and Y-axis
  const currencyFormatter = useCallback((value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Format Y axis values (compact on mobile)
  const formatYAxis = useCallback((value) => {
    if (isMobile) {
      if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
      }
      return `R$ ${value}`;
    }
    return currencyFormatter(value);
  }, [isMobile, currencyFormatter]);

  // Custom tooltip for Recharts
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className={`
        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
        rounded-lg shadow-lg
        ${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
      `}>
        <p className="font-semibold text-slate-900 dark:text-white">
          {data.fullMonth || data.month}
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-bold">
          {currencyFormatter(data.Receita)}
        </p>
      </div>
    );
  }, [isMobile, currencyFormatter]);

  // Memoize monthly data for table/cards
  const monthlyData = useMemo(() =>
    growthTrends?.monthly?.slice(-6).reverse() || [],
    [growthTrends?.monthly]
  );

  if (!growthTrends) return null;

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (growthTrends.trend === 'increasing') {
      return { icon: TrendingUp, color: 'positive', label: 'Crescendo', symbol: '↗' };
    }
    if (growthTrends.trend === 'decreasing') {
      return { icon: TrendingDown, color: 'negative', label: 'Caindo', symbol: '↘' };
    }
    return { icon: Minus, color: 'neutral', label: 'Estável', symbol: '→' };
  };

  const trendDisplay = getTrendDisplay();

  // Format best/worst month for display
  const bestMonthLabel = growthTrends.bestMonth ? formatMonthKey(growthTrends.bestMonth.month, 'short') : '-';
  const worstMonthLabel = growthTrends.worstMonth ? formatMonthKey(growthTrends.worstMonth.month, 'short') : '-';

  return (
    <SectionCard
      title="Crescimento & Tendências"
      subtitle={`Análise de crescimento mensal e trajetória • Últimos ${growthTrends.displayedMonths} meses`}
      icon={TrendingUp}
      id="growth-section"
      color="emerald"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Actionable Insight First */}
        {growthTrends.trend === 'increasing' && (
          <InsightBox
            type="success"
            title="Tendência de Crescimento Positiva"
            message={`Seu negócio está crescendo consistentemente com média de ${formatPercent(growthTrends.avgGrowth)} ao mês. Continue investindo em marketing e mantendo a qualidade do serviço!`}
          />
        )}
        {growthTrends.trend === 'decreasing' && (
          <InsightBox
            type="warning"
            title="Atenção: Tendência de Queda"
            message="Detectamos queda nos últimos meses. Verifique aumento de concorrência, problemas operacionais ou mudanças sazonais. Considere lançar campanhas para reverter a tendência."
          />
        )}
        {growthTrends.trend === 'stable' && (
          <InsightBox
            type="info"
            title="Tendência Estável"
            message="Seu negócio mantém receita estável. Para crescer, considere campanhas de marketing, programas de fidelidade ou horários promocionais."
          />
        )}

        {/* KPI Grid - Responsive labels: full on desktop, short on mobile */}
        <KPIGrid columns={4}>
          <KPICard
            label="Cresc. Médio"
            mobileLabel="Média"
            value={formatPercent(growthTrends.avgGrowth, 1)}
            subtitle="Últimos 6 meses"
            mobileSubtitle="6 meses"
            color={growthTrends.avgGrowth > 0 ? 'positive' : growthTrends.avgGrowth < 0 ? 'negative' : 'neutral'}
            variant="gradient"
            icon={TrendingUp}
          />
          <KPICard
            label="Melhor Mês"
            mobileLabel="Melhor"
            value={bestMonthLabel}
            subtitle={growthTrends.bestMonth ? formatCurrency(growthTrends.bestMonth.revenue) : '-'}
            color="blue"
            variant="gradient"
            icon={Award}
          />
          <KPICard
            label="Pior Mês"
            mobileLabel="Pior"
            value={worstMonthLabel}
            subtitle={growthTrends.worstMonth ? formatCurrency(growthTrends.worstMonth.revenue) : '-'}
            color="warning"
            variant="gradient"
            icon={AlertTriangle}
          />
          <KPICard
            label="Tendência"
            mobileLabel="Direção"
            value={trendDisplay.label}
            subtitle={growthTrends.trend !== 'stable' ? 'Últimos 3 meses' : 'Sem mudança clara'}
            mobileSubtitle={growthTrends.trend !== 'stable' ? '3 meses' : 'Estável'}
            color={trendDisplay.color}
            variant="gradient"
            icon={trendDisplay.icon}
          />
        </KPIGrid>

        {/* Area Chart - Recharts */}
        {chartData && (
          <div>
            <p id="growth-chart-desc" className="sr-only">
              Gráfico de área mostrando a evolução da receita mensal nos últimos 12 meses, com
              tendência {growthTrends.trend === 'increasing' ? 'de crescimento' : growthTrends.trend === 'decreasing' ? 'de queda' : 'estável'}.
            </p>
            <div
              className="h-56 sm:h-72 lg:h-80"
              aria-describedby="growth-chart-desc"
              role="img"
              aria-label="Gráfico de Tendência de Receita"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={isMobile
                    ? { top: 10, right: 10, bottom: 20, left: 45 }
                    : { top: 20, right: 30, bottom: 20, left: 70 }
                  }
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 12,
                      fill: isDark ? '#94a3b8' : '#64748b'
                    }}
                    axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{
                      fontSize: 12,
                      fill: isDark ? '#94a3b8' : '#64748b'
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 45 : 70}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Receita"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={{
                      fill: '#3b82f6',
                      stroke: isDark ? '#1e293b' : '#ffffff',
                      strokeWidth: 2,
                      r: 4
                    }}
                    activeDot={{
                      fill: '#3b82f6',
                      stroke: isDark ? '#1e293b' : '#ffffff',
                      strokeWidth: 2,
                      r: 6
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Mobile/Tablet: Compact stacked cards (no horizontal scroll) */}
        <div className="block lg:hidden">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Últimos 6 Meses
          </h4>

          <div className="space-y-2">
            {monthlyData.map((month) => {
              const isBestMonth = growthTrends.bestMonth && month.month === growthTrends.bestMonth.month;
              const isWorstMonth = growthTrends.worstMonth && month.month === growthTrends.worstMonth.month;

              return (
                <div
                  key={month.month}
                  className={`
                    rounded-xl border p-3 transition-colors
                    ${month.isCurrentMonth
                      ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20 border-lavpop-blue-200 dark:border-lavpop-blue-800'
                      : isBestMonth
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : isWorstMonth
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }
                    active:scale-[0.99]
                  `}
                >
                  {/* Header row: Month name + badges + MoM growth */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isBestMonth && (
                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500 flex-shrink-0" aria-label="Melhor mês" />
                      )}
                      {isWorstMonth && (
                        <ArrowDown className="w-4 h-4 text-amber-600 flex-shrink-0" aria-label="Pior mês" />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {formatMonthKey(month.month, 'short')}
                      </span>
                      {month.isPartial && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          Parcial
                        </span>
                      )}
                    </div>

                    {/* MoM Growth badge - right aligned */}
                    {month.momGrowth !== null ? (
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0
                        ${month.momGrowth > 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : month.momGrowth < 0
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }
                      `}>
                        {month.momGrowth > 0 && <TrendingUp className="w-3 h-3" aria-hidden="true" />}
                        {month.momGrowth < 0 && <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                        {month.momGrowth === 0 && <Minus className="w-3 h-3" aria-hidden="true" />}
                        {month.momGrowth > 0 ? '+' : ''}{month.momGrowth.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>

                  {/* Metrics row: Revenue and Cycles side by side */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Receita</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {formatCurrency(month.revenue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Ciclos</span>
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                        {month.services.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              Melhor
            </span>
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-amber-600" />
              Pior
            </span>
          </div>
        </div>

        {/* Desktop: Table view - center aligned */}
        <div className="hidden lg:block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Mês
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Receita
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Ciclos
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Crescimento MoM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {monthlyData.map((month) => (
                  <tr
                    key={month.month}
                    className={
                      month.isCurrentMonth
                        ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                  >
                    <td className="px-4 py-3 text-sm text-center font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center justify-center gap-2">
                        {formatMonthKey(month.month, 'long')}
                        {month.isPartial && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            Parcial ({month.daysElapsed}/{month.daysInMonth} dias)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700 dark:text-slate-300">
                      {month.services.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {month.momGrowth !== null ? (
                        <span className={`inline-flex items-center justify-center gap-1 font-semibold ${
                          month.momGrowth > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : month.momGrowth < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {month.momGrowth > 0 && <TrendingUp className="w-4 h-4" aria-hidden="true" />}
                          {month.momGrowth < 0 && <TrendingDown className="w-4 h-4" aria-hidden="true" />}
                          {formatPercent(month.momGrowth, 1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default GrowthTrendsSection;
