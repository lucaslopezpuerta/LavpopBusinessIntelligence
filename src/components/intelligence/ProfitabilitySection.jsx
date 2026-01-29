// ProfitabilitySection.jsx v4.2.0 - YELLOW→AMBER REVERT
// Profitability analysis section for Intelligence tab
// Design System v5.1 compliant - Premium Glass styling
//
// CHANGELOG:
// v4.2.0 (2026-01-29): Yellow→Amber revert for icon wells
//   - OptimizationLever amber icon wells now use amber-600/amber-500 (solid)
//   - Critical Insight warning icon wells now use amber-600/amber-500 (solid)
// v4.1.2 (2026-01-29): Orange→Yellow color migration
//   - OptimizationLever amber icon wells now use yellow-600/yellow-500
//   - Critical Insight warning icon wells now use yellow-600/yellow-500
// v4.1.1 (2026-01-29): Amber→Orange color migration
//   - OptimizationLever amber icon wells now use orange-600/orange-500
//   - Critical Insight warning icon wells now use orange-600/orange-500
// v4.1.0 (2026-01-28): Solid color badges for WCAG AA compliance
//   - OptimizationLever icon wells now solid with white icons
//   - Critical Insight icon wells now solid with white icons
// v4.0.0 (2026-01-24): Premium Glass redesign
//   - Replaced SectionCard with direct Premium Glass container
//   - Added useTheme() and useMediaQuery() hooks
//   - Redesigned break-even section with Premium Glass styling
//   - Redesigned optimization levers with compact cards
//   - Removed gradient backgrounds for cleaner look
//   - Coherent with PriorityMatrix and RevenueForecast
// v3.8 (2026-01-09): Light background KPI cards (Hybrid Card Design)
// v3.7 (2026-01-09): Design System v4.0 typography compliance
// v3.6 (2025-12-28): Replaced Manutenção with Custo por Ciclo
// v3.5 (2025-12-28): Mobile 2-column card layout
// v3.4 (2025-12-28): Card design unified with KPICard component
// v3.3 (2025-12-28): Removed redundant elements, improved context
// v3.2 (2025-12-28): Mobile compatibility improvements
// v3.1 (2025-12-28): Optimization levers
// v3.0 (2025-12-14): Migrated from Nivo to Recharts
// v2.x: Previous versions

import React from 'react';
import { DollarSign, CheckCircle, AlertTriangle, TrendingUp, Scissors, Tag, Lightbulb, Calendar, Gauge, ChevronDown } from 'lucide-react';
import KPICard from '../ui/KPICard';
import ProgressBar from '../ui/ProgressBar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';

// Optimization lever card - compact Premium Glass style
const OptimizationLever = ({ title, target, detail, icon: Icon, color, isDark, isDesktop }) => {
  // Solid icon wells with white icons (WCAG AA compliant)
  const iconBgColors = {
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    amber: 'bg-amber-600 dark:bg-amber-500',
    blue: 'bg-blue-600 dark:bg-blue-500',
  };

  const iconBg = iconBgColors[color] || iconBgColors.emerald;

  return (
    <div className={`
      p-3 rounded-xl
      ${isDark ? 'bg-space-dust/60' : 'bg-white'}
      ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
      shadow-sm
    `}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {title}
          </span>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
            {detail}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {target}
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfitabilitySection = ({
  profitability,
  optimizationLevers,
  formatCurrency,
  formatPercent,
  collapsible = false,
  isCollapsed = false,
  onToggle
}) => {
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

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
    <div
      id="profitability-section"
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <DollarSign className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Rentabilidade
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mês atual ({profitability.daysInPeriod} dias)
            </p>
          </div>
        </div>

        {/* Collapse toggle */}
        {collapsible && (
          <button
            onClick={onToggle}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-100'}
            `}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expandir seção' : 'Recolher seção'}
          >
            <ChevronDown className={`
              w-5 h-5 transition-transform duration-200
              ${isDark ? 'text-slate-400' : 'text-slate-500'}
              ${isCollapsed ? '' : 'rotate-180'}
            `} />
          </button>
        )}
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="space-y-5">
          {/* Critical Insight */}
          <div className={`
            p-4 rounded-xl
            ${isAboveBreakEven
              ? isDark ? 'bg-emerald-900/20' : 'bg-emerald-50/80'
              : isDark ? 'bg-amber-900/20' : 'bg-amber-50/80'
            }
            ring-1 ${isAboveBreakEven
              ? isDark ? 'ring-emerald-500/20' : 'ring-emerald-200'
              : isDark ? 'ring-amber-500/20' : 'ring-amber-200'
            }
          `}>
            <div className="flex items-start gap-3">
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                ${isAboveBreakEven
                  ? 'bg-emerald-600 dark:bg-emerald-500'
                  : 'bg-amber-600 dark:bg-amber-500'
                }
              `}>
                {isAboveBreakEven
                  ? <CheckCircle className="w-5 h-5 text-white" />
                  : <AlertTriangle className="w-5 h-5 text-white" />
                }
              </div>
              <div>
                <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold ${
                  isAboveBreakEven
                    ? isDark ? 'text-emerald-200' : 'text-emerald-800'
                    : isDark ? 'text-amber-200' : 'text-amber-800'
                }`}>
                  {isAboveBreakEven ? 'Negócio Lucrativo' : 'Atenção: Abaixo do Break-Even'}
                </h4>
                <p className={`${isDesktop ? 'text-sm' : 'text-xs'} mt-1 ${
                  isAboveBreakEven
                    ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                    : isDark ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  {isAboveBreakEven
                    ? `Lucro de ${formatCurrency(netProfit)} com margem de ${formatPercent(profitMargin)}. Folga de ${actualServices - breakEvenServices} serviços além do break-even.`
                    : `Faltam ${breakEvenServices - actualServices} serviços (~${formatCurrency((breakEvenServices - actualServices) * (profitability.avgServiceValue || 0))}) para cobrir os custos.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* KPI Grid - 2 cols mobile, 6 cols desktop (single row) */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <KPICard
              label="Receita Bruta"
              mobileLabel="Receita"
              value={formatCurrency(profitability.grossRevenue)}
              subtitle="+ Cashback"
              color="revenue"
              variant="default"
              icon={DollarSign}
            />
            <KPICard
              label="Custos Fixos"
              mobileLabel="C. Fixos"
              value={formatCurrency(profitability.fixedCosts)}
              subtitle={`${profitability.daysInPeriod}d`}
              color="neutral"
              variant="default"
              icon={Calendar}
            />
            <KPICard
              label="Custo/Ciclo"
              mobileLabel="$/Ciclo"
              value={formatCurrency(actualServices > 0 ? profitability.totalCosts / actualServices : 0)}
              subtitle={`${actualServices} ciclos`}
              color="purple"
              variant="default"
              icon={Gauge}
            />
            <KPICard
              label="Custos Totais"
              mobileLabel="Total"
              value={formatCurrency(profitability.totalCosts)}
              subtitle={`${profitability.daysInPeriod}d`}
              color="cost"
              variant="default"
              icon={AlertTriangle}
            />
            <KPICard
              label="Lucro Líquido"
              mobileLabel="Lucro"
              value={formatCurrency(netProfit)}
              subtitle={netProfit > 0 ? 'Positivo' : 'Negativo'}
              color={netProfit > 0 ? 'positive' : 'negative'}
              variant="default"
              icon={netProfit > 0 ? TrendingUp : AlertTriangle}
            />
            <KPICard
              label="Margem"
              mobileLabel="Margem"
              value={formatPercent(profitMargin)}
              subtitle={`${profitability.daysInPeriod}d`}
              color="blue"
              variant="default"
              icon={CheckCircle}
            />
          </div>

          {/* Break-even Progress */}
          <div className={`
            p-4 rounded-xl
            ${isDark ? 'bg-space-dust/60' : 'bg-white'}
            ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
            shadow-sm
          `}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Ponto de Equilíbrio
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Serviços necessários para cobrir custos
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-left sm:text-right">
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Realizado / Meta
                  </p>
                  <p className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {actualServices} / {breakEvenServices}
                  </p>
                </div>
                {isAboveBreakEven ? (
                  <CheckCircle className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} aria-hidden="true" />
                ) : (
                  <AlertTriangle className={`w-8 h-8 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} aria-hidden="true" />
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
              ariaLabel={`Progresso para break-even: ${actualServices} de ${breakEvenServices} serviços`}
            />
          </div>

          {/* Optimization Levers */}
          {optimizationLevers && !optimizationLevers.alreadyAtTarget && (
            <div className={`
              p-4 rounded-xl
              ${isDark ? 'bg-purple-900/20' : 'bg-purple-50/60'}
              ring-1 ${isDark ? 'ring-purple-500/20' : 'ring-purple-200'}
            `}>
              <h4 className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                <Lightbulb className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                Como Melhorar a Margem (meta: {optimizationLevers.targetMargin}%)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <OptimizationLever
                  title="Aumentar Receita"
                  target={`+${formatCurrency(optimizationLevers.revenue.needed)}/mês`}
                  detail={`+${optimizationLevers.revenue.weeklyServicesNeeded} serviços/semana`}
                  icon={TrendingUp}
                  color="emerald"
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
                <OptimizationLever
                  title="Reduzir Custos"
                  target={`-${formatCurrency(optimizationLevers.cost.reduction)}/mês`}
                  detail={`${optimizationLevers.cost.largestCost} é ${optimizationLevers.cost.largestCostPercent}% dos custos`}
                  icon={Scissors}
                  color="amber"
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
                <OptimizationLever
                  title="Ajustar Preços"
                  target={`+${optimizationLevers.price.increasePercent}%`}
                  detail={`Tolerância: -${optimizationLevers.price.volumeDropTolerance}% volume`}
                  icon={Tag}
                  color="blue"
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              </div>

              <p className={`text-xs mt-3 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                Gap atual: {formatPercent(optimizationLevers.marginGap)} abaixo da meta de {optimizationLevers.targetMargin}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfitabilitySection;
