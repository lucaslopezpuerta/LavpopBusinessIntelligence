// MachinePerformanceTable Component v4.3.1
// Machine-level performance tracking with revenue reconciliation
//
// CHANGELOG:
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

import React, { useState, useMemo } from 'react';
import { Droplet, Flame, Cpu, TrendingUp, Info, DollarSign, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { BUSINESS_PARAMS } from '../utils/operationsMetrics';

const MachinePerformanceTable = ({ machinePerformance, dateFilter = 'currentWeek', dateWindow, revenueBreakdown }) => {
  const [showHelp, setShowHelp] = useState(false);

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
      <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-4 sm:p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Loading machine performance data...
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
      <tr className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${rowBgClass}`}>
        <td className="p-2 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {machine.type === 'wash' ? (
              <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            ) : (
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                {machine.name}
              </span>
              {isBest && <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">★ Melhor</span>}
              {isWorst && <span className="text-[10px] sm:text-xs font-semibold text-red-600 dark:text-red-400">↓ Menor</span>}
            </div>
          </div>
        </td>
        <td className="p-2 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className={`text-xs sm:text-sm font-semibold ${
              isAboveAverage
                ? 'text-lavpop-green dark:text-green-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {machine.uses}
            </span>
            {isAboveAverage && (
              <TrendingUp className="w-3 h-3 text-lavpop-green dark:text-green-400 hidden sm:block" />
            )}
          </div>
        </td>
        <td className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
          {formatCurrency(machine.revenue)}
        </td>
        <td className="hidden sm:table-cell p-3 text-center text-sm text-slate-600 dark:text-slate-400">
          {formatCurrency(machine.avgRevenuePerUse)}
        </td>
        <td className="hidden sm:table-cell p-3 text-center">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
            percentDiff >= 0
              ? 'bg-green-50 dark:bg-green-900/20 text-lavpop-green dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Performance por Máquina
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      {/* Collapsible Column Explanation Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center justify-between p-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Como Interpretar
            </span>
          </div>
          {showHelp ? (
            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </button>
        {showHelp && (
          <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div>
              <strong className="text-slate-900 dark:text-white">USOS:</strong> Quantas vezes a máquina foi usada (inclui uso com crédito).
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">RECEITA:</strong> Total arrecadado por esta máquina (R$).
            </div>
            <div className="hidden sm:block">
              <strong className="text-slate-900 dark:text-white">R$/USO:</strong> Receita média por uso (Receita ÷ Usos). Identifica máquinas que geram mais valor.
            </div>
            <div className="hidden sm:block">
              <strong className="text-slate-900 dark:text-white">vs MÉDIA:</strong> Comparação com a média do seu tipo (lavadora ou secadora).
            </div>
          </div>
        )}
      </div>

      {/* Washers Table */}
      {washers.length > 0 && (
        <div className="mb-8">
          <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            Lavadoras
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th scope="col" className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Máquina
                  </th>
                  <th scope="col" className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Usos
                  </th>
                  <th scope="col" className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Receita
                  </th>
                  <th scope="col" className="hidden sm:table-cell p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    R$/Uso
                  </th>
                  <th scope="col" className="hidden sm:table-cell p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    vs Média
                  </th>
                </tr>
              </thead>
              <tbody>
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

      {/* Dryers Table */}
      {dryers.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
            Secadoras
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th scope="col" className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Máquina
                  </th>
                  <th scope="col" className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Usos
                  </th>
                  <th scope="col" className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Receita
                  </th>
                  <th scope="col" className="hidden sm:table-cell p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    R$/Uso
                  </th>
                  <th scope="col" className="hidden sm:table-cell p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    vs Média
                  </th>
                </tr>
              </thead>
              <tbody>
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
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-lavpop-green dark:text-green-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Reconciliação de Receita - {dateWindow?.label || 'Carregando...'}
            </h4>
          </div>

          <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
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

            <div className="flex justify-between pt-2 border-t-2 border-green-200 dark:border-green-800 mt-2">
              <span className="font-semibold">Receita Total do Período:</span>
              <strong className="text-lavpop-green dark:text-green-400 text-base">
                {formatCurrency(revenueBreakdown.totalRevenue)}
              </strong>
            </div>
          </div>

          {revenueBreakdown.recargaRevenue > 0 && (
            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Nota:</strong> Receita de Recargas não aparece na tabela por máquina, pois representa prepagamento para uso futuro.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capacity Footer */}
      <div className="mt-4 flex flex-col items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
        <p>
          Capacidade semanal: {BUSINESS_PARAMS.TOTAL_WASHERS} lavadoras × {maxCyclesPerWeek.wash / BUSINESS_PARAMS.TOTAL_WASHERS} ciclos = {maxCyclesPerWeek.wash} ciclos/semana
        </p>
        <p>
          Capacidade semanal: {BUSINESS_PARAMS.TOTAL_DRYERS} secadoras × {maxCyclesPerWeek.dry / BUSINESS_PARAMS.TOTAL_DRYERS} ciclos = {maxCyclesPerWeek.dry} ciclos/semana
        </p>
        <p className="flex items-center gap-1.5 italic mt-1">
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
          Considera {BUSINESS_PARAMS.EFFICIENCY_FACTOR * 100}% de eficiência operacional
        </p>
      </div>
    </div>
  );
};

export default MachinePerformanceTable;
