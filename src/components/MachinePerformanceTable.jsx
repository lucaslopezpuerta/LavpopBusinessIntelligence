// MachinePerformanceTable Component v4.1.0
// Machine-level performance tracking with revenue reconciliation
//
// CHANGELOG:
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

import React from 'react';
import { Droplet, Flame, Activity, TrendingUp, Info, DollarSign, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const MachinePerformanceTable = ({ machinePerformance, dateFilter = 'currentWeek', dateWindow, revenueBreakdown }) => {
  if (!machinePerformance || machinePerformance.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
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

  const MachineRow = ({ machine, avgUses }) => {
    const isAboveAverage = machine.uses >= avgUses;
    const percentDiff = avgUses > 0 ? ((machine.uses / avgUses - 1) * 100) : 0;

    return (
      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <td className="p-3">
          <div className="flex items-center gap-2">
            {machine.type === 'wash' ? (
              <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {machine.name}
            </span>
          </div>
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className={`text-sm font-semibold ${
              isAboveAverage
                ? 'text-lavpop-green dark:text-green-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {machine.uses}
            </span>
            {isAboveAverage && (
              <TrendingUp className="w-3 h-3 text-lavpop-green dark:text-green-400" />
            )}
          </div>
        </td>
        <td className="p-3 text-right text-sm font-medium text-slate-900 dark:text-white">
          {formatCurrency(machine.revenue)}
        </td>
        <td className="p-3 text-right text-sm text-slate-600 dark:text-slate-400">
          {formatCurrency(machine.avgRevenuePerUse)}
        </td>
        <td className="p-3 text-center">
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
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Performance por Máquina
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      {/* Column Explanation Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Como Interpretar
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div>
            <strong className="text-slate-900 dark:text-white">USOS:</strong> Quantas vezes a máquina foi usada (inclui uso com crédito).
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">RECEITA:</strong> Total arrecadado por esta máquina (R$).
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">R$/USO:</strong> Receita média por uso (Receita ÷ Usos). Identifica máquinas que geram mais valor.
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">vs MÉDIA:</strong> Comparação com a média do seu tipo (lavadora ou secadora).
          </div>
        </div>
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
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Máquina
                  </th>
                  <th scope="col" className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Usos
                  </th>
                  <th scope="col" className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Receita
                  </th>
                  <th scope="col" className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    R$/Uso
                  </th>
                  <th scope="col" className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Máquina
                  </th>
                  <th scope="col" className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Usos
                  </th>
                  <th scope="col" className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Receita
                  </th>
                  <th scope="col" className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    R$/Uso
                  </th>
                  <th scope="col" className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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

      {/* Maintenance Insight */}
      <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-900 dark:text-white">Manutenção:</strong> Máquinas acima da média podem precisar de revisões mais frequentes.
            Máquinas abaixo da média podem ter problemas técnicos, um posicionamento ruim ou uma utilização baixa.
          </span>
        </div>
      </div>
    </div>
  );
};

export default MachinePerformanceTable;
