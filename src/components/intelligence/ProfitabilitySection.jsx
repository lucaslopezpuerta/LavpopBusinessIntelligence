// ProfitabilitySection.jsx v2.2
// Profitability analysis section for Intelligence tab
// Design System v3.1 compliant - Refactored with unified components
//
// CHANGELOG:
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

import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import ProgressBar from '../ui/ProgressBar';
import { ChartLegend } from '../ui/ChartSection';
import { useIsMobile } from '../../hooks/useMediaQuery';

const ProfitabilitySection = ({
  profitability,
  formatCurrency,
  formatPercent,
  nivoTheme
}) => {
  const isMobile = useIsMobile();

  // Memoize chart data to prevent re-renders - guard against invalid values
  const chartData = useMemo(() => {
    if (!profitability) return null;
    // Check if we have valid data (not all zeros/NaN)
    const hasValidData = (profitability.totalRevenue || 0) > 0 ||
                         (profitability.totalCosts || 0) > 0;
    if (!hasValidData) return null;
    return [{
      category: 'Analise',
      Receita: profitability.totalRevenue || 0,
      Custos: profitability.totalCosts || 0,
      Lucro: Math.max(0, profitability.netProfit || 0)
    }];
  }, [profitability?.totalRevenue, profitability?.totalCosts, profitability?.netProfit]);

  // Memoize chart margins
  const chartMargins = useMemo(() => (
    isMobile
      ? { top: 10, right: 20, bottom: 40, left: 70 }
      : { top: 20, right: 130, bottom: 50, left: 80 }
  ), [isMobile]);

  // Chart legend items
  const legendItems = useMemo(() => [
    { color: '#10b981', label: 'Receita' },
    { color: '#ef4444', label: 'Custos' },
    { color: '#8b5cf6', label: 'Lucro' }
  ], []);

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
            <ResponsiveBar
              data={chartData}
              keys={['Receita', 'Custos', 'Lucro']}
              indexBy="category"
              margin={chartMargins}
              padding={0.3}
              groupMode="grouped"
              colors={['#10b981', '#ef4444', '#8b5cf6']}
              borderRadius={8}
              axisLeft={{
                format: (value) => isMobile ? `${Math.round(value / 1000)}k` : formatCurrency(value)
              }}
              labelTextColor="white"
              labelSkipWidth={12}
              labelSkipHeight={12}
              legends={isMobile ? [] : [{
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                translateX: 120,
                itemWidth: 100,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: 'circle'
              }]}
              animate={false}
              theme={nivoTheme}
            />
          </div>

          {/* Mobile Legend - Uses unified component */}
          {isMobile && <ChartLegend items={legendItems} />}
        </div>
        )}
      </div>
    </SectionCard>
  );
};

export default ProfitabilitySection;
