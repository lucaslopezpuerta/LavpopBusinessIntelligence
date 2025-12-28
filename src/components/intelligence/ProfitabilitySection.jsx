// ProfitabilitySection.jsx v3.6
// Profitability analysis section for Intelligence tab
// Design System v3.1 compliant - Refactored with unified components
//
// CHANGELOG:
// v3.6 (2025-12-28): Replaced Manutenção with Custo por Ciclo
//   - Manutenção was redundant (included in Custos Totais)
//   - Custo por Ciclo provides better operational insight
//   - Shows total costs divided by number of services
// v3.5 (2025-12-28): Mobile 2-column card layout
//   - KPIGrid columns={6} for 2 cols mobile, 3 cols desktop
//   - Better mobile card distribution for 6 cards
// v3.4 (2025-12-28): Card design unified with KPICard component
//   - Uses unified KPICard component with variant="gradient" for consistency
//   - KPIGrid columns={3} for 3-col layout (matches GrowthTrendsSection)
//   - OptimizationLever uses matching gradient backgrounds
//   - Consistent design across Intelligence tab sections
// v3.3 (2025-12-28): Removed redundant elements, improved context
//   - REMOVED: Bar chart (redundant with KPI cards showing same data)
//   - REMOVED: Bottom success InsightBox (redundant with top insight)
//   - IMPROVED: InsightBox now shows specific margin context
//   - IMPROVED: Break-even section has clearer progress context
// v3.2 (2025-12-28): Mobile compatibility improvements
//   - OptimizationLever: horizontal layout on mobile, stacked grid
//   - Responsive grid: 1 col mobile, 3 cols desktop for levers
//   - Improved spacing and touch targets on small screens
// v3.1 (2025-12-28): Optimization levers
//   - Added optimizationLevers prop for margin improvement guidance
//   - Shows 3 options: revenue increase, cost reduction, price increase
//   - Only shows when margin is below target (15%)
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

import React from 'react';
import { DollarSign, CheckCircle, AlertTriangle, TrendingUp, Scissors, Tag, Lightbulb, Calendar, Gauge } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import ProgressBar from '../ui/ProgressBar';
import { useIsMobile } from '../../hooks/useMediaQuery';

// Optimization lever card - matches ServiceSegmentCard style from GrowthTrendsSection
const OptimizationLever = ({ title, target, detail, icon: Icon, color }) => {
  const isMobile = useIsMobile();

  // Color variants for icon accent
  const iconColors = {
    emerald: 'text-emerald-500 dark:text-emerald-400',
    amber: 'text-amber-500 dark:text-amber-400',
    blue: 'text-blue-500 dark:text-blue-400',
  };

  const iconClass = iconColors[color] || iconColors.emerald;

  // Mobile: horizontal layout (same as ServiceSegmentCard mobile)
  if (isMobile) {
    return (
      <div className="p-3 rounded-xl border transition-all bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-200 dark:bg-slate-700">
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{detail}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-slate-900 dark:text-white">{target}</p>
        </div>
      </div>
    );
  }

  // Desktop: vertical layout (same as ServiceSegmentCard desktop)
  return (
    <div className="p-3 rounded-xl border transition-all bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{title}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
        {target}
      </p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </div>
  );
};

const ProfitabilitySection = ({
  profitability,
  optimizationLevers,
  formatCurrency,
  formatPercent,
  // Collapsible props
  collapsible = false,
  isCollapsed = false,
  onToggle
}) => {
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
      collapsible={collapsible}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Critical Insight First - Most important info at top */}
        <InsightBox
          type={isAboveBreakEven ? 'success' : 'warning'}
          title={isAboveBreakEven ? 'Negocio Lucrativo' : 'Atencao: Abaixo do Break-Even'}
          message={
            isAboveBreakEven
              ? `Lucro de ${formatCurrency(netProfit)} com margem de ${formatPercent(profitMargin)}. Voce tem ${actualServices - breakEvenServices} servicos de folga alem do break-even - isso significa que pode absorver quedas de ate ${formatPercent(Math.abs(breakEvenBuffer))} na receita antes de ter prejuizo.`
              : `Faltam ${breakEvenServices - actualServices} servicos (~${formatCurrency((breakEvenServices - actualServices) * (profitability.avgServiceValue || 0))}) para cobrir os custos. Acao imediata: foque em aumentar agendamentos ou reduza custos fixos nao essenciais.`
          }
        />

        {/* KPI Grid - 6 cards: 2 cols mobile, 3 cols desktop */}
        <KPIGrid columns={6}>
          <KPICard
            label="Receita Bruta"
            mobileLabel="Receita"
            value={formatCurrency(profitability.grossRevenue)}
            subtitle="+ Cashback aplicado"
            color="revenue"
            variant="gradient"
            icon={DollarSign}
          />
          <KPICard
            label="Custos Fixos"
            mobileLabel="C. Fixos"
            value={formatCurrency(profitability.fixedCosts)}
            subtitle={`${profitability.daysInPeriod} dias`}
            color="neutral"
            variant="gradient"
            icon={Calendar}
          />
          <KPICard
            label="Custo por Ciclo"
            mobileLabel="$/Ciclo"
            value={formatCurrency(actualServices > 0 ? profitability.totalCosts / actualServices : 0)}
            subtitle={`${actualServices} ciclos no mês`}
            color="purple"
            variant="gradient"
            icon={Gauge}
          />
          <KPICard
            label="Custos Totais"
            mobileLabel="Total"
            value={formatCurrency(profitability.totalCosts)}
            subtitle={`${profitability.daysInPeriod} dias`}
            color="cost"
            variant="gradient"
            icon={AlertTriangle}
          />
          <KPICard
            label="Lucro Líquido"
            mobileLabel="Lucro"
            value={formatCurrency(netProfit)}
            subtitle={netProfit > 0 ? 'Positivo' : 'Negativo'}
            color={netProfit > 0 ? 'positive' : 'negative'}
            variant="gradient"
            icon={netProfit > 0 ? TrendingUp : AlertTriangle}
          />
          <KPICard
            label="Margem"
            mobileLabel="Margem"
            value={formatPercent(profitMargin)}
            subtitle={`${profitability.daysInPeriod} dias`}
            color="blue"
            variant="gradient"
            icon={CheckCircle}
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

        {/* Optimization Levers - How to improve margin */}
        {optimizationLevers && !optimizationLevers.alreadyAtTarget && (
          <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              Como Melhorar a Margem (meta: {optimizationLevers.targetMargin}%)
            </h4>

            {/* Responsive grid: stacked on mobile, 3 cols on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Option A: Increase Revenue */}
              <OptimizationLever
                title="Aumentar Receita"
                target={`+${formatCurrency(optimizationLevers.revenue.needed)}/mês`}
                detail={`+${optimizationLevers.revenue.weeklyServicesNeeded} serviços/semana`}
                icon={TrendingUp}
                color="emerald"
              />

              {/* Option B: Reduce Costs */}
              <OptimizationLever
                title="Reduzir Custos"
                target={`-${formatCurrency(optimizationLevers.cost.reduction)}/mês`}
                detail={`${optimizationLevers.cost.largestCost} é ${optimizationLevers.cost.largestCostPercent}% dos custos`}
                icon={Scissors}
                color="amber"
              />

              {/* Option C: Price Adjustment */}
              <OptimizationLever
                title="Ajustar Preços"
                target={`+${optimizationLevers.price.increasePercent}%`}
                detail={`Tolerância: -${optimizationLevers.price.volumeDropTolerance}% volume`}
                icon={Tag}
                color="blue"
              />
            </div>

            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3">
              Gap atual: {formatPercent(optimizationLevers.marginGap)} abaixo da meta de {optimizationLevers.targetMargin}%
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default ProfitabilitySection;
