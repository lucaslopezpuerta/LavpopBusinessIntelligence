// MachinePerformanceTable Component v5.0.0
// Machine-level performance tracking with revenue reconciliation
//
// CHANGELOG:
// v5.0.1 (2026-01-23): Replaced collapsible help panel with header tooltip
//   - Removed "Como Interpretar" collapsible panel (reduces visual clutter)
//   - Added ContextHelp tooltip to header title
//   - Removed neutral styling from revenue reconciliation footer
// v5.0.0 (2026-01-23): Premium Glass styling (consistency with DayOfWeekChart/PeakHoursSummary)
//   - Upgraded to Premium Glass card (backdrop-blur, ring-1, glow shadows)
//   - Header icon badge: cyan bg with white icon
//   - Implemented useTheme() for theme-aware styling
//   - Loading skeleton animation
//   - Responsive text sizing with useMediaQuery
//   - Replaced legacy colors (lavpop-blue → cyan, lavpop-green → emerald)
// v4.3.1 (2025-11-30): Mobile font/padding refinements
//   - Reduced cell padding: p-3 → p-2 sm:p-3
//   - Reduced header font: text-xs → text-[10px] sm:text-xs
//   - Reduced cell font: text-sm → text-xs sm:text-sm
//   - Badge stacks below name on mobile (flex-col sm:flex-row)
//   - Smaller icons on mobile: w-4 → w-3.5 sm:w-4
//   - Hide TrendingUp icon on mobile
// v4.3.0 (2025-11-30): Mobile-responsive table (no horizontal scroll)
//   - Hide R$/Uso and vs Média columns on mobile (hidden sm:table-cell)
//   - Mobile shows 3 columns: Máquina, Usos, Receita
//   - Desktop shows all 5 columns
//   - Best/worst badges provide context without vs Média column
//   - Updated Como Interpretar panel to match visible columns
// v4.2.0 (2025-11-30): UX improvements + Design System audit fixes
//   - Changed icon: Activity → Cpu (better represents machines)
//   - Fixed mobile padding: p-6 → px-3 py-4 sm:p-6
//   - Made "Como Interpretar" panel collapsible (saves vertical space)
//   - Added best/worst performer highlighting (green/red rows)
//   - Removed static Maintenance Insight (generic, not data-driven)
//   - Added capacity footer with BUSINESS_PARAMS context
//   - Imported BUSINESS_PARAMS for capacity calculations
// v4.1.0 (2025-11-30): Accessibility & production cleanup
//   - Removed console.log statements
//   - Added scope="col" to all table headers
// v4.0.0 (2025-11-26): Design System alignment
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support throughout
//   - Removed COLORS object (using Tailwind classes)
//   - Replaced emoji (💡) with Lightbulb icon
//   - Improved responsive design
//   - Aligned with Design System v3.0
// v3.0.1 (2025-11-15): Bug fix release
//   - Fixed line 526: replaced periodLabels[period] with dateWindow?.label
//   - Resolves ReferenceError crash in revenue reconciliation section
//   - No functional changes, pure compatibility fix
// v3.0 (2025-11-15): Unified date filtering
//   - Removed individual period dropdown
//   - Now receives dateFilter and dateWindow props from parent
//   - Displays explicit date range in subtitle
//   - Removed periodLabels object (no longer needed)
//   - Synchronized with Operations tab DateRangeSelector
// v2.0 (Previous): Added revenue breakdown display
// v1.0 (Previous): Initial implementation with local period control

import React, { useMemo } from 'react';
import { Droplet, Flame, Cpu, TrendingUp, Info, DollarSign, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { BUSINESS_PARAMS } from '../utils/operationsMetrics';
import { useTheme } from '../contexts/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import ContextHelp from './ContextHelp';

const MachinePerformanceTable = ({ machinePerformance, dateFilter = 'currentWeek', dateWindow, revenueBreakdown }) => {
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Calculate capacity context
  const maxCyclesPerWeek = useMemo(() => {
    const hoursPerDay = BUSINESS_PARAMS.OPERATING_HOURS.end - BUSINESS_PARAMS.OPERATING_HOURS.start;
    const washCyclesPerDay = BUSINESS_PARAMS.TOTAL_WASHERS * (hoursPerDay * 60 / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES);
    const dryCyclesPerDay = BUSINESS_PARAMS.TOTAL_DRYERS * (hoursPerDay * 60 / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES);
    return {
      wash: Math.round(washCyclesPerDay * 7 * BUSINESS_PARAMS.EFFICIENCY_FACTOR),
      dry: Math.round(dryCyclesPerDay * 7 * BUSINESS_PARAMS.EFFICIENCY_FACTOR)
    };
  }, []);

  if (!machinePerformance || machinePerformance.length === 0) {
    return (
      <div
        className={`
          ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
          backdrop-blur-xl rounded-2xl p-5
          ${isDark
            ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
            : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
          }
          overflow-hidden
        `}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Performance por Máquina
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CLIENT-SIDE FILTERING: Exclude "Recarga" as backup
  const filteredMachines = machinePerformance.filter(m => {
    const nameLower = (m.name || '').toLowerCase();
    return !nameLower.includes('recarga');
  });

  // Separate washers and dryers
  const washers = filteredMachines.filter(m => m.type === 'wash');
  const dryers = filteredMachines.filter(m => m.type === 'dry');

  // Calculate totals
  const totalWashUses = washers.reduce((sum, m) => sum + m.uses, 0);
  const totalDryUses = dryers.reduce((sum, m) => sum + m.uses, 0);
  const totalWashRevenue = washers.reduce((sum, m) => sum + m.revenue, 0);
  const totalDryRevenue = dryers.reduce((sum, m) => sum + m.revenue, 0);
  const totalMachineRevenue = totalWashRevenue + totalDryRevenue;

  const avgWashUses = washers.length > 0 ? totalWashUses / washers.length : 0;
  const avgDryUses = dryers.length > 0 ? totalDryUses / dryers.length : 0;

  // Identify best and worst performers
  const bestWasher = washers.length > 0 ? washers.reduce((best, m) => m.uses > best.uses ? m : best) : null;
  const worstWasher = washers.length > 0 ? washers.reduce((worst, m) => m.uses < worst.uses ? m : worst) : null;
  const bestDryer = dryers.length > 0 ? dryers.reduce((best, m) => m.uses > best.uses ? m : best) : null;
  const worstDryer = dryers.length > 0 ? dryers.reduce((worst, m) => m.uses < worst.uses ? m : worst) : null;

  const MachineRow = ({ machine, avgUses, isBest, isWorst }) => {
    const isAboveAverage = machine.uses >= avgUses;
    const percentDiff = avgUses > 0 ? ((machine.uses / avgUses - 1) * 100) : 0;

    // Row background based on best/worst status
    const rowBgClass = isBest
      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500'
      : isWorst
        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500'
        : '';

    return (
      <tr className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${rowBgClass}`}>
        <td className="py-1.5 px-2 sm:py-2 sm:px-3 lg:py-2.5 lg:px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {machine.type === 'wash' ? (
              <Droplet className={`${isDesktop ? 'w-5 h-5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-blue-600 dark:text-blue-400 flex-shrink-0`} />
            ) : (
              <Flame className={`${isDesktop ? 'w-5 h-5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-amber-600 dark:text-amber-400 flex-shrink-0`} />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className={`${isDesktop ? 'text-base' : 'text-xs sm:text-sm'} font-medium text-slate-900 dark:text-white whitespace-nowrap`}>
                {machine.name}
              </span>
              {isBest && <span className={`${isDesktop ? 'text-xs' : 'text-[10px] sm:text-xs'} font-semibold text-emerald-600 dark:text-emerald-400`}>★ Melhor</span>}
              {isWorst && <span className={`${isDesktop ? 'text-xs' : 'text-[10px] sm:text-xs'} font-semibold text-red-600 dark:text-red-400`}>↓ Menor</span>}
            </div>
          </div>
        </td>
        <td className="py-1.5 px-2 sm:py-2 sm:px-3 lg:py-2.5 lg:px-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className={`${isDesktop ? 'text-base' : 'text-xs sm:text-sm'} font-semibold ${
              isAboveAverage
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {machine.uses}
            </span>
            {isAboveAverage && (
              <TrendingUp className={`${isDesktop ? 'w-4 h-4' : 'w-3 h-3'} text-emerald-600 dark:text-emerald-400 hidden sm:block`} />
            )}
          </div>
        </td>
        <td className={`py-1.5 px-2 sm:py-2 sm:px-3 lg:py-2.5 lg:px-4 text-center ${isDesktop ? 'text-base' : 'text-xs sm:text-sm'} font-medium text-slate-900 dark:text-white`}>
          {formatCurrency(machine.revenue)}
        </td>
        <td className={`hidden sm:table-cell py-2 px-3 lg:py-2.5 lg:px-4 text-center ${isDesktop ? 'text-base' : 'text-sm'} text-slate-600 dark:text-slate-400`}>
          {formatCurrency(machine.avgRevenuePerUse)}
        </td>
        <td className="hidden sm:table-cell py-2 px-3 lg:py-2.5 lg:px-4 text-center">
          <span className={`inline-block px-2 py-0.5 rounded-full ${isDesktop ? 'text-sm' : 'text-xs'} font-semibold ${
            percentDiff >= 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
      `}
    >
      {/* Header with Icon Badge */}
      <div className="mb-4">
        <div className="flex items-start gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold text-slate-800 dark:text-white flex items-center gap-1.5`}>
              Performance por Máquina
              <ContextHelp
                title="Como Interpretar"
                description={
                  <ul className="space-y-1.5 list-none">
                    <li><strong>Usos:</strong> Quantas vezes a máquina foi usada</li>
                    <li><strong>Receita:</strong> Total arrecadado (R$)</li>
                    <li><strong>R$/Uso:</strong> Receita média por uso</li>
                    <li><strong>vs Média:</strong> Comparação com a média do tipo</li>
                  </ul>
                }
              />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Período: {dateWindow?.dateRange || 'Carregando...'}
            </p>
          </div>
        </div>
      </div>

      {/* Washers Table - with sticky headers */}
      {washers.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Droplet className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-blue-600 dark:text-blue-400`} />
            <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide`}>
              Lavadoras
            </h4>
          </div>
          <div className={`overflow-x-auto max-h-[350px] overflow-y-auto rounded-xl ${isDark ? 'ring-1 ring-white/[0.05]' : 'ring-1 ring-slate-200/50'}`}>
            <table className="w-full border-collapse">
              <thead className={`sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-space-dust/90' : 'bg-slate-50/90'}`}>
                <tr className={`border-b-2 ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                  <th scope="col" className={`py-2 px-2 sm:px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-[10px] sm:text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    Máquina
                  </th>
                  <th scope="col" className={`py-2 px-2 sm:px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-[10px] sm:text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    Usos
                  </th>
                  <th scope="col" className={`py-2 px-2 sm:px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-[10px] sm:text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    Receita
                  </th>
                  <th scope="col" className={`hidden sm:table-cell py-2 px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    R$/Uso
                  </th>
                  <th scope="col" className={`hidden sm:table-cell py-2 px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    vs Média
                  </th>
                </tr>
              </thead>
              <tbody className={isDark ? 'bg-space-dust/20' : 'bg-white/50'}>
                {washers.map(machine => (
                  <MachineRow
                    key={machine.name}
                    machine={machine}
                    avgUses={avgWashUses}
                    isBest={bestWasher && machine.name === bestWasher.name}
                    isWorst={worstWasher && machine.name === worstWasher.name && washers.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dryers Table - with sticky headers */}
      {dryers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-amber-600 dark:text-amber-400`} />
            <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide`}>
              Secadoras
            </h4>
          </div>
          <div className={`overflow-x-auto max-h-[350px] overflow-y-auto rounded-xl ${isDark ? 'ring-1 ring-white/[0.05]' : 'ring-1 ring-slate-200/50'}`}>
            <table className="w-full border-collapse">
              <thead className={`sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-space-dust/90' : 'bg-slate-50/90'}`}>
                <tr className={`border-b-2 ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                  <th scope="col" className={`py-2 px-2 sm:px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-[10px] sm:text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    Máquina
                  </th>
                  <th scope="col" className={`py-2 px-2 sm:px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-[10px] sm:text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    Usos
                  </th>
                  <th scope="col" className={`py-2 px-2 sm:px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-[10px] sm:text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    Receita
                  </th>
                  <th scope="col" className={`hidden sm:table-cell py-2 px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    R$/Uso
                  </th>
                  <th scope="col" className={`hidden sm:table-cell py-2 px-3 lg:px-4 text-center ${isDesktop ? 'text-sm' : 'text-xs'} font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider`}>
                    vs Média
                  </th>
                </tr>
              </thead>
              <tbody className={isDark ? 'bg-space-dust/20' : 'bg-white/50'}>
                {dryers.map(machine => (
                  <MachineRow
                    key={machine.name}
                    machine={machine}
                    avgUses={avgDryUses}
                    isBest={bestDryer && machine.name === bestDryer.name}
                    isWorst={worstDryer && machine.name === worstDryer.name && dryers.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Reconciliation Summary */}
      {revenueBreakdown && (
        <div className={`
          mt-6 p-4 rounded-xl backdrop-blur-sm ring-1
          ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50/80'}
          ${isDark ? 'ring-white/[0.05]' : 'ring-slate-200'}
        `}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-slate-600 dark:text-slate-400`} />
            <h4 className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-slate-900 dark:text-white`}>
              Reconciliação de Receita - {dateWindow?.label || 'Carregando...'}
            </h4>
          </div>

          <div className={`${isDesktop ? 'text-base' : 'text-sm'} text-slate-700 dark:text-slate-300 space-y-2`}>
            <div className="flex justify-between">
              <span>Receita de Máquinas (atribuída na tabela acima):</span>
              <strong className="text-slate-900 dark:text-white">{formatCurrency(totalMachineRevenue)}</strong>
            </div>

            {revenueBreakdown.recargaRevenue > 0 && (
              <div className="flex justify-between">
                <span>Venda de Créditos (Recarga - não atribuída):</span>
                <strong className="text-amber-600 dark:text-amber-400">+ {formatCurrency(revenueBreakdown.recargaRevenue)}</strong>
              </div>
            )}

            <div className={`flex justify-between pt-2 border-t mt-2 ${isDark ? 'border-slate-700/50' : 'border-slate-300'}`}>
              <span className="font-semibold">Receita Total do Período:</span>
              <strong className={`${isDesktop ? 'text-lg' : 'text-base'} text-slate-900 dark:text-white`}>
                {formatCurrency(revenueBreakdown.totalRevenue)}
              </strong>
            </div>
          </div>

          {revenueBreakdown.recargaRevenue > 0 && (
            <div className={`
              mt-3 p-2 rounded-lg backdrop-blur-sm ring-1
              ${isDark ? 'bg-amber-950/30' : 'bg-amber-50/80'}
              ${isDark ? 'ring-amber-500/20' : 'ring-amber-200'}
              ${isDesktop ? 'text-sm' : 'text-xs'} text-slate-700 dark:text-slate-300
            `}>
              <div className="flex items-start gap-2">
                <Lightbulb className={`${isDesktop ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5`} />
                <span>
                  <strong>Nota:</strong> Receita de Recargas não aparece na tabela por máquina, pois representa prepagamento para uso futuro.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capacity Footer */}
      <div className={`mt-4 flex flex-col items-center gap-1 ${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400`}>
        <p>
          Capacidade semanal: {BUSINESS_PARAMS.TOTAL_WASHERS} lavadoras × {maxCyclesPerWeek.wash / BUSINESS_PARAMS.TOTAL_WASHERS} ciclos = {maxCyclesPerWeek.wash} ciclos/semana
        </p>
        <p>
          Capacidade semanal: {BUSINESS_PARAMS.TOTAL_DRYERS} secadoras × {maxCyclesPerWeek.dry / BUSINESS_PARAMS.TOTAL_DRYERS} ciclos = {maxCyclesPerWeek.dry} ciclos/semana
        </p>
        <p className="flex items-center gap-1.5 italic mt-1">
          <Info className={`${isDesktop ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} aria-hidden="true" />
          Considera {BUSINESS_PARAMS.EFFICIENCY_FACTOR * 100}% de eficiência operacional
        </p>
      </div>
    </div>
  );
};

export default MachinePerformanceTable;
