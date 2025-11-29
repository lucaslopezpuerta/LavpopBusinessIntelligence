// CustomerRetentionScore.jsx v2.2 - RETENTION PULSE WITH INSIGHTS
// Simplified survival score visualization
//
// CHANGELOG:
// v2.2 (2025-11-29): Design System v3.0 compliance
//   - Removed emojis from insight text strings
// v2.1 (2025-11-24): Added actionable insights
//   - NEW: InsightBox with contextual recommendations
//   - Insights adapt based on retention rate
// v2.0 (2025-11-23): Complete redesign for Customer Intelligence Hub
//   - NEW: Visual "pulse" design with status icon and color
//   - NEW: Simplified 30/60/90 day retention display
//   - REFACTOR: Migrated to Tailwind CSS (removed all inline styles)
//   - REFACTOR: Data now passed as prop (calculated in parent)
//   - UI: Circular status indicator with animated border
//   - UI: Status labels: Excelente/Bom/Atenção/Crítico
//   - UI: Glassmorphism styling
// v1.0 (2024): Initial implementation with complex calculation logic

import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import InsightBox from './InsightBox';

const CustomerRetentionScore = ({ data }) => {
  if (!data) return null;

  const { rate30, rate60, rate90 } = data;

  // Helper to determine status color and icon
  const getStatus = (rate) => {
    if (rate >= 80) return { color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20', icon: TrendingUp, label: 'Excelente' };
    if (rate >= 60) return { color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20', icon: Activity, label: 'Bom' };
    if (rate >= 40) return { color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20', icon: Activity, label: 'Atenção' };
    return { color: 'text-red-500 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20', icon: TrendingDown, label: 'Crítico' };
  };

  const status30 = getStatus(rate30);

  // Generate insights based on retention rate
  const insights = [];
  if (rate30 >= 70) {
    insights.push({ type: 'success', text: `${rate30}% dos clientes retornam em 30 dias - Excelente!` });
    insights.push({ type: 'action', text: 'Meta: Manter acima de 70% com programa de fidelidade' });
  } else if (rate30 >= 50) {
    insights.push({ type: 'warning', text: `${100 - rate30}% não retornam - Foco em reengajamento` });
    insights.push({ type: 'action', text: 'Ação: Contatar clientes após 25 dias sem visitar' });
  } else {
    insights.push({ type: 'warning', text: `Apenas ${rate30}% retornam - CRÍTICO!` });
    insights.push({ type: 'action', text: 'Urgente: Implementar campanha de reativação' });
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Pulso de Retenção
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Porcentagem de clientes que retornam após visitar.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center mb-6">
        <div className={`w-24 h-24 rounded-full ${status30.bg} flex items-center justify-center mb-3 relative`}>
          <status30.icon className={`w-10 h-10 ${status30.color}`} />
          <div className="absolute inset-0 rounded-full border-4 border-white/50 dark:border-slate-700/50"></div>
        </div>
        <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
          {rate30}%
        </div>
        <div className={`text-sm font-bold ${status30.color} uppercase tracking-wide`}>
          {status30.label}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Retorno em 30 dias</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-400 mb-1">60 Dias</div>
          <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{rate60}%</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-400 mb-1">90 Dias</div>
          <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{rate90}%</div>
        </div>
      </div>

      <InsightBox insights={insights} />
    </div>
  );
};

export default CustomerRetentionScore;
