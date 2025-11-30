// GrowthTrendsSection.jsx v1.0
// Growth & trends analysis section for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx
//   - Mobile card view for monthly data (replaces table)
//   - Responsive chart margins
//   - Accessibility improvements (scope, aria)

import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { TrendingUp, TrendingDown } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';
import TrendBadge from '../ui/TrendBadge';
import { useIsMobile, useIsDesktop } from '../../hooks/useMediaQuery';

const GrowthTrendsSection = ({
  growthTrends,
  formatCurrency,
  formatPercent,
  nivoTheme
}) => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  const chartMargins = useMemo(() => (
    isMobile
      ? { top: 20, right: 20, bottom: 60, left: 50 }
      : { top: 20, right: 120, bottom: 80, left: 80 }
  ), [isMobile]);

  if (!growthTrends) return null;

  const monthlyData = growthTrends.monthly.slice(-6).reverse();

  return (
    <SectionCard
      title="Crescimento & Tendências"
      subtitle="Análise de crescimento mensal e trajetória de longo prazo"
      icon={TrendingUp}
      id="growth-section"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Key Metrics - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-300 mb-1 uppercase tracking-wide">
              Crescimento Médio
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 dark:text-green-100">
              {formatPercent(growthTrends.avgGrowth)}
            </p>
            <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-400 mt-0.5 sm:mt-1">
              Últimos 6 meses
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wide">
              Melhor Mês
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 dark:text-blue-100 truncate">
              {growthTrends.bestMonth.month}
            </p>
            <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400 mt-0.5 sm:mt-1 truncate">
              {formatCurrency(growthTrends.bestMonth.revenue)}
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-300 mb-1 uppercase tracking-wide">
              Pior Mês
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-900 dark:text-amber-100 truncate">
              {growthTrends.worstMonth.month}
            </p>
            <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5 sm:mt-1 truncate">
              {formatCurrency(growthTrends.worstMonth.revenue)}
            </p>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg bg-gradient-to-br ${
              growthTrends.trend === 'increasing'
                ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
                : growthTrends.trend === 'decreasing'
                  ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
                  : 'from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700'
            }`}
          >
            <p
              className={`text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide ${
                growthTrends.trend === 'increasing'
                  ? 'text-green-700 dark:text-green-300'
                  : growthTrends.trend === 'decreasing'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-700 dark:text-slate-300'
              }`}
            >
              Tendência
            </p>
            <p
              className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                growthTrends.trend === 'increasing'
                  ? 'text-green-900 dark:text-green-100'
                  : growthTrends.trend === 'decreasing'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-gray-900 dark:text-white'
              }`}
            >
              {growthTrends.trend === 'increasing' && '↗ Crescendo'}
              {growthTrends.trend === 'decreasing' && '↘ Caindo'}
              {growthTrends.trend === 'stable' && '→ Estável'}
            </p>
            <p
              className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${
                growthTrends.trend === 'increasing'
                  ? 'text-green-700 dark:text-green-400'
                  : growthTrends.trend === 'decreasing'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-gray-700 dark:text-slate-400'
              }`}
            >
              {growthTrends.trend !== 'stable' ? 'Últimos 3 meses' : 'Sem mudança clara'}
            </p>
          </div>
        </div>

        {/* Line Chart with accessible description */}
        <div>
          <p id="growth-chart-desc" className="sr-only">
            Gráfico de linha mostrando a evolução da receita mensal nos últimos 12 meses, com
            tendência {growthTrends.trend === 'increasing' ? 'de crescimento' : growthTrends.trend === 'decreasing' ? 'de queda' : 'estável'}.
          </p>
          <div
            className="h-64 sm:h-80 lg:h-96"
            aria-describedby="growth-chart-desc"
            role="img"
            aria-label="Gráfico de Tendência de Receita"
          >
            <ResponsiveLine
              data={[
                {
                  id: 'Receita Mensal',
                  data: growthTrends.monthly.slice(-12).map((m) => ({
                    x: m.month,
                    y: m.revenue
                  }))
                }
              ]}
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
                tickRotation: isMobile ? -45 : -45,
                legend: isMobile ? '' : 'Mês',
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
              enablePointLabel={false}
              pointLabelYOffset={-12}
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
                  <div className="text-sm font-bold text-lavpop-primary dark:text-blue-400">
                    {formatCurrency(slice.points[0].data.y)}
                  </div>
                </div>
              )}
              legends={
                isMobile
                  ? []
                  : [
                      {
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
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]
              }
              theme={nivoTheme}
              animate={true}
              motionConfig="gentle"
            />
          </div>
        </div>

        {/* Mobile: Card view for monthly data */}
        <div className="block lg:hidden space-y-2 sm:space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
            Últimos 6 Meses
          </h4>
          {monthlyData.map((month, index) => (
            <div
              key={month.month}
              className={`p-3 rounded-lg ${
                index === 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {month.month}
                  {index === 0 && (
                    <span className="ml-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      Atual
                    </span>
                  )}
                </span>
                {month.momGrowth !== null && (
                  <TrendBadge value={month.momGrowth} size="sm" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
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
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Clientes</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {month.customerCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden lg:block border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide"
                  >
                    Mês
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide"
                  >
                    Receita
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide"
                  >
                    Ciclos
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide"
                  >
                    Clientes
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide"
                  >
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
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {month.month}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
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
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-slate-300">
                      {month.customerCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {month.momGrowth !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            month.momGrowth > 0
                              ? 'text-green-600 dark:text-green-400'
                              : month.momGrowth < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600 dark:text-slate-400'
                          }`}
                        >
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

        {/* Insights */}
        {growthTrends.trend === 'increasing' && (
          <InsightBox
            type="success"
            title="Tendência de Crescimento Positiva"
            message={`Seu negócio está crescendo consistentemente com média de ${formatPercent(growthTrends.avgGrowth)} ao mês. Continue investindo em marketing e mantendo a qualidade do serviço para sustentar esse crescimento!`}
          />
        )}

        {growthTrends.trend === 'decreasing' && (
          <InsightBox
            type="warning"
            title="Atenção: Tendência de Queda"
            message="Detectamos queda nos últimos meses. Análise recomendada: verifique se houve aumento de concorrência, problemas operacionais ou mudanças sazonais. Considere lançar campanhas agressivas para reverter a tendência."
          />
        )}

        {growthTrends.trend === 'stable' && (
          <InsightBox
            type="info"
            title="Tendência Estável"
            message="Seu negócio mantém receita estável. Para crescer, considere: (1) Campanhas de marketing para novos clientes, (2) Programas de fidelidade para aumentar frequência, (3) Horários promocionais em períodos de baixa utilização."
          />
        )}
      </div>
    </SectionCard>
  );
};

export default GrowthTrendsSection;
