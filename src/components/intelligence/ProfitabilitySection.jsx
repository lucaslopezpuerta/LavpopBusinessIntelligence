// ProfitabilitySection.jsx v3.0
// Profitability analysis section for Intelligence tab
// Design System v3.1 compliant - Refactored with unified components
//
// CHANGELOG:
// v3.0 (2025-12-14): Migrated from Nivo to Recharts
//   - Replaced ResponsiveBar (Nivo) with BarChart (Recharts)
//   - Custom tooltip matching project patterns
//   - Better dark mode support via Tailwind classes
//   - Reduced bundle size by removing Nivo dependency
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
//   - Guard against empty/zero revenue/cost data
//   - Fixed division by zero in maintenance % calculation
//   - Conditional render: skip chart when no valid data
// v2.1 (2025-12-02): Unified section header
//   - Added color="emerald" for consistent styling with Intelligence tab
// v2.0 (2025-11-30): Major refactor
//   - Uses unified KPICard, ChartSection, ProgressBar components
//   - InsightBox moved to top for visibility
//   - Fixed accessibility (minimum 12px font)
//   - Memoized chart data
//   - Reduced code from 308 to ~200 lines
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import ProgressBar from '../ui/ProgressBar';
import { ChartLegend } from '../ui/ChartSection';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';

// Chart colors
const CHART_COLORS = {
  receita: '#10b981',
  custos: '#ef4444',
  lucro: '#8b5cf6'
};

const ProfitabilitySection = ({
  profitability,
  formatCurrency,
  formatPercent
}) => {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // Memoize chart data for Recharts format (array of objects per bar)
  const chartData = useMemo(() => {
    if (!profitability) return null;
    // Check if we have valid data (not all zeros/NaN)
    const hasValidData = (profitability.totalRevenue || 0) > 0 ||
                         (profitability.totalCosts || 0) > 0;
    if (!hasValidData) return null;

    // Format data for grouped bar chart
    return [
      { name: 'Receita', value: profitability.totalRevenue || 0, fill: CHART_COLORS.receita },
      { name: 'Custos', value: profitability.totalCosts || 0, fill: CHART_COLORS.custos },
      { name: 'Lucro', value: Math.max(0, profitability.netProfit || 0), fill: CHART_COLORS.lucro }
    ];
  }, [profitability?.totalRevenue, profitability?.totalCosts, profitability?.netProfit]);

  // Chart legend items
  const legendItems = useMemo(() => [
    { color: CHART_COLORS.receita, label: 'Receita' },
    { color: CHART_COLORS.custos, label: 'Custos' },
    { color: CHART_COLORS.lucro, label: 'Lucro' }
  ], []);

  // Custom tooltip for Recharts
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="font-semibold text-slate-900 dark:text-white text-sm">
            {data.payload.name}
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-bold">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }, [formatCurrency]);

  // Format Y axis values
  const formatYAxis = useCallback((value) => {
    if (isMobile) {
      if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
      }
      return `R$ ${value}`;
    }
    return formatCurrency(value);
  }, [isMobile, formatCurrency]);

  if (!profitability) return null;

  const {
    isAboveBreakEven,
    breakEvenBuffer,
    netProfit,
    profitMargin,
    breakEvenServices,
    actualServices
  } = profitability;

  return (
    <SectionCard
      title="Rentabilidade"
      subtitle={`Análise de custos vs receita e ponto de equilíbrio • Mês atual (${profitability.daysInPeriod} dias)`}
      icon={DollarSign}
      id="profitability-section"
      color="emerald"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Critical Insight First - Most important info at top */}
        <InsightBox
          type={isAboveBreakEven ? 'success' : 'warning'}
          title={isAboveBreakEven ? 'Negocio Lucrativo' : 'Atencao: Abaixo do Break-Even'}
          message={
            isAboveBreakEven
              ? `Voce esta ${formatPercent(Math.abs(breakEvenBuffer))} acima do ponto de equilibrio. Margem de lucro de ${formatPercent(profitMargin)}. Continue mantendo a eficiencia operacional!`
              : `Voce precisa de mais ${breakEvenServices - actualServices} servicos para atingir o ponto de equilibrio. Considere lancar promocoes ou revisar custos fixos.`
          }
        />

        {/* KPI Grid - Uses unified component */}
        <KPIGrid columns={4}>
          <KPICard
            label="Receita Bruta"
            value={formatCurrency(profitability.grossRevenue)}
            subtitle="+ Cashback aplicado"
            color="revenue"
            variant="gradient"
            icon={DollarSign}
          />
          <KPICard
            label="Custos Totais"
            value={formatCurrency(profitability.totalCosts)}
            subtitle="Fixos + Manutencao"
            color="neutral"
            variant="gradient"
          />
          <KPICard
            label="Lucro Liquido"
            value={formatCurrency(netProfit)}
            color={netProfit > 0 ? 'positive' : 'negative'}
            variant="gradient"
            trend={{ label: netProfit > 0 ? 'Positivo' : 'Negativo' }}
          />
          <KPICard
            label="Margem"
            value={formatPercent(profitMargin)}
            subtitle={`${profitability.daysInPeriod} dias`}
            color="profit"
            variant="gradient"
          />
        </KPIGrid>

        {/* Break-even Progress */}
        <div className="bg-gradient-to-br from-lavpop-blue-50 to-lavpop-blue-100 dark:from-lavpop-blue-900/30 dark:to-lavpop-blue-800/20 rounded-xl border border-lavpop-blue-200 dark:border-lavpop-blue-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-lavpop-blue-900 dark:text-lavpop-blue-100">
                Ponto de Equilibrio
              </h3>
              <p className="text-xs sm:text-sm text-lavpop-blue-700 dark:text-lavpop-blue-400">
                Servicos necessarios para cobrir custos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <p className="text-xs text-lavpop-blue-700 dark:text-lavpop-blue-400">
                  Realizado / Meta
                </p>
                <p className="text-xl sm:text-2xl font-bold text-lavpop-blue-900 dark:text-lavpop-blue-100">
                  {actualServices} / {breakEvenServices}
                </p>
              </div>
              {isAboveBreakEven ? (
                <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" aria-hidden="true" />
              )}
            </div>
          </div>

          <ProgressBar
            value={actualServices}
            max={breakEvenServices}
            color={isAboveBreakEven ? 'emerald' : 'amber'}
            size="md"
            showLabels
            minLabel="0 ciclos"
            maxLabel={`${breakEvenServices} (break-even)`}
            ariaLabel={`Progresso para break-even: ${actualServices} de ${breakEvenServices} servicos`}
          />
        </div>

        {/* Cost Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Custos Fixos
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Periodo:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profitability.daysInPeriod} dias
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(profitability.fixedCosts)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Manutencao
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Custo:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(profitability.maintenanceCosts)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">% do Total:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPercent(profitability.totalCosts > 0
                    ? (profitability.maintenanceCosts / profitability.totalCosts) * 100
                    : 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart - only render if we have valid data */}
        {chartData && (
        <div>
          <p id="profitability-chart-desc" className="sr-only">
            Grafico de barras mostrando receita de {formatCurrency(profitability.totalRevenue)},
            custos de {formatCurrency(profitability.totalCosts)}, e lucro de{' '}
            {formatCurrency(Math.max(0, profitability.netProfit))}.
          </p>
          <div
            className="h-48 sm:h-56 lg:h-64"
            aria-describedby="profitability-chart-desc"
            role="img"
            aria-label="Grafico de Rentabilidade"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={isMobile
                  ? { top: 10, right: 10, bottom: 20, left: 50 }
                  : { top: 20, right: 30, bottom: 20, left: 60 }
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 12,
                    fill: isDark ? '#94a3b8' : '#64748b'
                  }}
                  axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                  tickLine={false}
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
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={80}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend - Desktop shows inline, mobile uses unified component */}
          {!isMobile ? (
            <div className="flex justify-center gap-6 mt-4">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ChartLegend items={legendItems} />
          )}
        </div>
        )}
      </div>
    </SectionCard>
  );
};

export default ProfitabilitySection;
