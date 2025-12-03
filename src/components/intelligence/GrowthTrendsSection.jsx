// GrowthTrendsSection.jsx v4.2
// Growth & trends analysis section for Intelligence tab
// Design System v3.1 compliant - Migrated to Tremor charts
//
// CHANGELOG:
// v4.2 (2025-12-03): Desktop table improvements
//   - Center-aligned all table headers and cells
//   - Full month names on desktop table (e.g., "Novembro 2024")
// v4.1 (2025-12-03): Mobile chart optimizations
//   - X-axis labels: 'tiny' format on mobile (e.g., "D24" for Dec 2024)
//   - Custom compact tooltip: smaller on mobile, shows full month name
//   - Removed label rotation since tiny format fits without rotation
//   - Fixed Y-axis width for proper currency display
// v4.0 (2025-12-03): Tremor chart library migration
//   - Replaced Recharts with Tremor AreaChart
//   - Beautiful gradient fill with smooth animations
//   - Modern hover interactions with built-in tooltips
//   - Cleaner, more polished visual appearance
//   - Custom value formatter for Brazilian currency
// v3.2 (2025-12-03): Responsive labels + mobile card improvements
//   - KPI cards: full labels on desktop, short labels on mobile
//   - Mobile monthly cards: center-aligned text, improved spacing
//   - Uses KPICard v1.3 mobileLabel/mobileSubtitle props
// v3.1 (2025-12-03): Mobile KPI card improvements
//   - Shortened labels: "Média", "Melhor", "Pior", "Direção" (single words)
//   - Shortened subtitles: "6 meses", "3 meses" (compact)
//   - Works with KPICard v1.2 truncation fixes
// v3.0 (2025-12-03): Major refactor - Nivo to Recharts migration
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
// v2.1 (2025-12-02): Unified section header
// v2.0 (2025-11-30): Major refactor with unified components
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React, { useMemo } from 'react';
import { AreaChart } from '@tremor/react';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Minus, Clock } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import TrendBadge from '../ui/TrendBadge';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { formatMonthKey } from '../../utils/dateUtils';

const GrowthTrendsSection = ({
  growthTrends,
  formatCurrency,
  formatPercent
}) => {
  const isMobile = useIsMobile();

  // Memoize chart data with formatted month names for Tremor
  // Use 'tiny' format on mobile (e.g., "N24") to prevent label truncation
  const chartData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;
    const dataPoints = growthTrends.monthly.slice(-12).map((m) => ({
      month: formatMonthKey(m.month, isMobile ? 'tiny' : 'short'), // Mobile: "N24", Desktop: "Nov 24"
      fullMonth: formatMonthKey(m.month, 'long'), // For tooltip: "Novembro 2024"
      Receita: m.revenue || 0, // Tremor uses category names for display
      isPartial: m.isPartial || false,
    }));
    // Need at least 2 points for a line
    if (dataPoints.length < 2) return null;
    return dataPoints;
  }, [growthTrends?.monthly, isMobile]);

  // Currency formatter for Tremor tooltips and Y-axis
  const currencyFormatter = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom compact tooltip for Tremor (especially for mobile)
  const customTooltip = ({ payload, active }) => {
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
        <p className="text-slate-600 dark:text-slate-300">
          {currencyFormatter(data.Receita)}
        </p>
      </div>
    );
  };

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

        {/* Area Chart - Tremor */}
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
              <AreaChart
                data={chartData}
                index="month"
                categories={['Receita']}
                colors={['blue']}
                valueFormatter={currencyFormatter}
                customTooltip={customTooltip}
                showAnimation={true}
                animationDuration={1000}
                curveType="monotone"
                showGradient={true}
                showLegend={false}
                showGridLines={true}
                showXAxis={true}
                showYAxis={true}
                yAxisWidth={isMobile ? 55 : 85}
                startEndOnly={false}
                intervalType="preserveStartEnd"
                className="h-full [&_.recharts-cartesian-axis-tick-value]:text-xs [&_.recharts-cartesian-axis-tick-value]:fill-slate-600 dark:[&_.recharts-cartesian-axis-tick-value]:fill-slate-400"
                connectNulls={true}
              />
            </div>
          </div>
        )}

        {/* Mobile: Card view for monthly data - Center aligned */}
        <div className="block lg:hidden space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 text-center">
            Últimos 6 Meses
          </h4>
          {monthlyData.map((month) => (
            <div
              key={month.month}
              className={`p-4 rounded-xl text-center ${
                month.isCurrentMonth
                  ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20 border border-lavpop-blue-200 dark:border-lavpop-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Month header with badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="font-bold text-base text-gray-900 dark:text-white">
                  {formatMonthKey(month.month, 'long')}
                </span>
                {month.isPartial && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                    <Clock className="w-2.5 h-2.5" />
                    Parcial
                  </span>
                )}
              </div>

              {/* Growth badge - prominent */}
              {month.momGrowth !== null && (
                <div className="mb-3">
                  <TrendBadge value={month.momGrowth} size="md" showIcon />
                </div>
              )}

              {/* Stats grid - centered */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Receita</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Ciclos</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-lg">
                    {month.services.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table view - center aligned */}
        <div className="hidden lg:block border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Mês
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Receita
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Ciclos
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Crescimento MoM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {monthlyData.map((month) => (
                  <tr
                    key={month.month}
                    className={
                      month.isCurrentMonth
                        ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }
                  >
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
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
                    <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-slate-300">
                      {month.services.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {month.momGrowth !== null ? (
                        <span className={`inline-flex items-center justify-center gap-1 font-semibold ${
                          month.momGrowth > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : month.momGrowth < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-slate-400'
                        }`}>
                          {month.momGrowth > 0 && <TrendingUp className="w-4 h-4" aria-hidden="true" />}
                          {month.momGrowth < 0 && <TrendingDown className="w-4 h-4" aria-hidden="true" />}
                          {formatPercent(month.momGrowth, 1)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
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
