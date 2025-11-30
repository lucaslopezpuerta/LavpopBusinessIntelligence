// WashVsDryChart Component v2.4.0
// Comparison of wash vs dry services and revenue
//
// CHANGELOG:
// v2.4.0 (2025-11-30): Final cleanup
//   - Removed insight box (irrelevant for simple comparison)
//   - Changed icon from Activity to Scale (better represents comparison)
// v2.3.0 (2025-11-30): Simplified to summary stats only
//   - REMOVED: Bar charts (redundant for 2 data points)
//   - REMOVED: Recharts dependency (zero bundle overhead now)
//   - KEPT: Summary stat cards (clearer, more mobile-friendly)
//   - Fixes: fontSize: 11 violation, hardcoded dark mode colors
//   - Benefits: ~15KB bundle savings, better mobile UX, Design System compliant
// v2.2.0 (2025-11-30): Mobile optimization + Design System fix
//   - Fixed text-[10px] → text-xs (Design System minimum 12px)
//   - Reduced mobile padding: p-6 → px-2 py-3 sm:p-6
// v2.1.0 (2025-11-30): Chart memoization for performance
// v2.0.0 (2025-11-26): Design System alignment
// v1.1 (2025-11-15): Added date window display
// v1.0 (Previous): Initial implementation

import React from 'react';
import { Droplet, Flame, Scale } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const WashVsDryChart = ({ washVsDry, dateWindow }) => {
  if (!washVsDry) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-4 sm:p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Loading wash vs dry comparison...
      </div>
    );
  }

  const { wash, dry } = washVsDry;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Lavagem vs Secagem
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Wash Stats */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Lavagens
            </h4>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {wash.services.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {wash.percentOfServices.toFixed(1)}% dos serviços
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(wash.revenue)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {formatCurrency(wash.avgPerService)}/serviço
          </div>
        </div>

        {/* Dry Stats */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Secagens
            </h4>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
            {dry.services.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {dry.percentOfServices.toFixed(1)}% dos serviços
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(dry.revenue)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {formatCurrency(dry.avgPerService)}/serviço
          </div>
        </div>
      </div>
    </div>
  );
};

export default WashVsDryChart;
