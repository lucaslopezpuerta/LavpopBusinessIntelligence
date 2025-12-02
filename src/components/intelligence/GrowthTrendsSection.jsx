// GrowthTrendsSection.jsx v2.2
// Growth & trends analysis section for Intelligence tab
// Design System v3.1 compliant - Refactored with unified components
//
// CHANGELOG:
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
//   - Guard against empty monthly data arrays
//   - Require minimum 2 data points for line chart
//   - Conditional render: skip chart when no valid data
// v2.1 (2025-12-02): Unified section header
//   - Added color="emerald" for consistent styling with Intelligence tab
// v2.0 (2025-11-30): Major refactor
//   - Uses unified KPICard component
//   - InsightBox moved to top for visibility
//   - Fixed accessibility (minimum 12px font)
//   - Memoized chart data
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { TrendingUp, TrendingDown, Calendar, Award, AlertTriangle, Minus } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import TrendBadge from '../ui/TrendBadge';
import { ChartLegend } from '../ui/ChartSection';
import { useIsMobile, useIsDesktop } from '../../hooks/useMediaQuery';

const GrowthTrendsSection = ({
  growthTrends,
  formatCurrency,
  formatPercent,
  nivoTheme
}) => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Memoize chart data - guard against empty arrays
  const chartData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;
    const dataPoints = growthTrends.monthly.slice(-12).map((m) => ({
      x: m.month,
      y: m.revenue || 0
    }));
    // Nivo crashes with empty data arrays - need at least 2 points for a line
    if (dataPoints.length < 2) return null;
    return [{
      id: 'Receita Mensal',
      data: dataPoints
    }];
  }, [growthTrends?.monthly]);

  // Memoize chart margins
  const chartMargins = useMemo(() => (
    isMobile
      ? { top: 20, right: 20, bottom: 60, left: 50 }
      : { top: 20, right: 120, bottom: 80, left: 80 }
  ), [isMobile]);

  // Memoize monthly data for table/cards
  const monthlyData = useMemo(() =>
    growthTrends?.monthly?.slice(-6).reverse() || [],
    [growthTrends?.monthly]
  );

  // Chart legend items
  const legendItems = useMemo(() => [
    { color: '#1a5a8e', label: 'Receita Mensal' }
  ], []);

  if (!growthTrends) return null;

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (growthTrends.trend === 'increasing') {
      return { icon: TrendingUp, color: 'positive', label: 'Crescendo', symbol: '↗' };
    }
    if (growthTrends.trend === 'decreasing') {
      return { icon: TrendingDown, color: 'negative', label: 'Caindo', symbol: '↘' };
    }
    return { icon: Minus, color: 'neutral', label: 'Estavel', symbol: '→' };
  };

  const trendDisplay = getTrendDisplay();

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
            title="Tendencia de Crescimento Positiva"
            message={`Seu negocio esta crescendo consistentemente com media de ${formatPercent(growthTrends.avgGrowth)} ao mes. Continue investindo em marketing e mantendo a qualidade do servico!`}
          />
        )}
        {growthTrends.trend === 'decreasing' && (
          <InsightBox
            type="warning"
            title="Atencao: Tendencia de Queda"
            message="Detectamos queda nos ultimos meses. Verifique aumento de concorrencia, problemas operacionais ou mudancas sazonais. Considere lancar campanhas para reverter a tendencia."
          />
        )}
        {growthTrends.trend === 'stable' && (
          <InsightBox
            type="info"
            title="Tendencia Estavel"
            message="Seu negocio mantem receita estavel. Para crescer, considere campanhas de marketing, programas de fidelidade ou horarios promocionais."
          />
        )}

        {/* KPI Grid */}
        <KPIGrid columns={4}>
          <KPICard
            label="Crescimento Medio"
            value={formatPercent(growthTrends.avgGrowth)}
            subtitle="Ultimos 6 meses"
            color={growthTrends.avgGrowth > 0 ? 'positive' : growthTrends.avgGrowth < 0 ? 'negative' : 'neutral'}
            variant="gradient"
            icon={TrendingUp}
          />
          <KPICard
            label="Melhor Mes"
            value={growthTrends.bestMonth.month}
            subtitle={formatCurrency(growthTrends.bestMonth.revenue)}
            color="blue"
            variant="gradient"
            icon={Award}
          />
          <KPICard
            label="Pior Mes"
            value={growthTrends.worstMonth.month}
            subtitle={formatCurrency(growthTrends.worstMonth.revenue)}
            color="warning"
            variant="gradient"
            icon={AlertTriangle}
          />
          <KPICard
            label="Tendencia"
            value={`${trendDisplay.symbol} ${trendDisplay.label}`}
            subtitle={growthTrends.trend !== 'stable' ? 'Ultimos 3 meses' : 'Sem mudanca clara'}
            color={trendDisplay.color}
            variant="gradient"
            icon={trendDisplay.icon}
          />
        </KPIGrid>

        {/* Line Chart - only render if we have valid data */}
        {chartData && (
        <div>
          <p id="growth-chart-desc" className="sr-only">
            Grafico de linha mostrando a evolucao da receita mensal nos ultimos 12 meses, com
            tendencia {growthTrends.trend === 'increasing' ? 'de crescimento' : growthTrends.trend === 'decreasing' ? 'de queda' : 'estavel'}.
          </p>
          <div
            className="h-56 sm:h-72 lg:h-80"
            aria-describedby="growth-chart-desc"
            role="img"
            aria-label="Grafico de Tendencia de Receita"
          >
            <ResponsiveLine
              data={chartData}
              margin={chartMargins}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 'auto',
                max: 'auto',
                stacked: false,
                reverse: false
              }}
              yFormat={(value) => formatCurrency(value)}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: isMobile ? '' : 'Mes',
                legendOffset: 60,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: isMobile ? '' : 'Receita',
                legendOffset: -60,
                legendPosition: 'middle',
                format: (value) => (isMobile ? `${Math.round(value / 1000)}k` : formatCurrency(value))
              }}
              enablePoints={true}
              pointSize={isMobile ? 6 : 10}
              pointColor={{ from: 'color' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              enableArea={true}
              areaOpacity={0.15}
              colors={['#1a5a8e']}
              lineWidth={isMobile ? 2 : 3}
              useMesh={true}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    {slice.points[0].data.x}
                  </div>
                  <div className="text-sm font-bold text-lavpop-blue dark:text-blue-400">
                    {formatCurrency(slice.points[0].data.y)}
                  </div>
                </div>
              )}
              legends={isMobile ? [] : [{
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle'
              }]}
              theme={nivoTheme}
              animate={false}
            />
          </div>

          {/* Mobile Legend */}
          {isMobile && <ChartLegend items={legendItems} />}
        </div>
        )}

        {/* Mobile: Card view for monthly data */}
        <div className="block lg:hidden space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
            Ultimos 6 Meses
          </h4>
          {monthlyData.map((month, index) => (
            <div
              key={month.month}
              className={`p-3 rounded-lg ${
                index === 0
                  ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20 border border-lavpop-blue-200 dark:border-lavpop-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {month.month}
                  {index === 0 && (
                    <span className="ml-2 text-xs text-lavpop-blue dark:text-blue-400 font-medium">
                      Atual
                    </span>
                  )}
                </span>
                {month.momGrowth !== null && (
                  <TrendBadge value={month.momGrowth} size="sm" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Receita</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Ciclos</span>
                  <span className="font-medium text-gray-900 dark:text-white">{month.services}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden lg:block border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Mes
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Receita
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Ciclos
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    Crescimento MoM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {monthlyData.map((month, index) => (
                  <tr
                    key={month.month}
                    className={
                      index === 0
                        ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {month.month}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-lavpop-blue dark:text-blue-400 font-semibold">
                          Mais recente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-slate-300">
                      {month.services}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {month.momGrowth !== null ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          month.momGrowth > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : month.momGrowth < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-slate-400'
                        }`}>
                          {month.momGrowth > 0 && <TrendingUp className="w-4 h-4" aria-hidden="true" />}
                          {month.momGrowth < 0 && <TrendingDown className="w-4 h-4" aria-hidden="true" />}
                          {formatPercent(month.momGrowth)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 text-xs">-</span>
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
