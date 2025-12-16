// HealthPill.jsx v1.0
// Compact health rate indicator for header integration
// Matches RetentionPulse design pattern
//
// CHANGELOG:
// v1.0 (2025-12-16): Initial implementation
//   - Compact pill showing customer health rate percentage
//   - Status-based coloring (Excelente/Bom/Atenção/Crítico)
//   - Expandable dropdown with breakdown details
//   - Animated pulse effect matching RetentionPulse

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrendingUp, TrendingDown, ChevronDown, AlertTriangle, Users } from 'lucide-react';

const HealthPill = ({ healthRate, activeCount, atRiskCount, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (healthRate === null || healthRate === undefined) return null;

  // Determine status based on health rate
  const getStatus = (rate) => {
    if (rate >= 80) return {
      label: 'Excelente',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      pulse: 'bg-emerald-500',
      icon: TrendingUp
    };
    if (rate >= 60) return {
      label: 'Bom',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      pulse: 'bg-blue-500',
      icon: Heart
    };
    if (rate >= 40) return {
      label: 'Atenção',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      pulse: 'bg-amber-500',
      icon: AlertTriangle
    };
    return {
      label: 'Crítico',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      pulse: 'bg-red-500',
      icon: TrendingDown
    };
  };

  const status = getStatus(healthRate);
  const StatusIcon = status.icon;
  const healthyCount = activeCount - atRiskCount;

  return (
    <div className={`relative ${className}`}>
      {/* Main Pill Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-3 py-1.5
          ${status.bg} ${status.border}
          border rounded-full
          transition-all duration-200
          hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        {/* Heart Icon */}
        <Heart className={`w-3.5 h-3.5 ${status.color}`} fill="currentColor" />

        {/* Label */}
        <span className={`text-xs font-semibold ${status.color}`}>
          Saúde: {Math.round(healthRate)}%
        </span>

        {/* Status Badge - Hidden on mobile to save space */}
        <span className={`hidden sm:inline text-xs font-bold ${status.color} uppercase tracking-wide`}>
          {status.label}
        </span>

        {/* Expand Icon */}
        <ChevronDown
          className={`w-3.5 h-3.5 ${status.color} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[220px]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Taxa de Saúde
                  </p>
                  <p className={`text-xs font-semibold ${status.color} uppercase`}>
                    {status.label}
                  </p>
                </div>
              </div>

              {/* Health Breakdown */}
              <div className="space-y-3">
                {/* Health Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Clientes Saudáveis</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {healthyCount > 0 ? healthyCount : 0}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${healthRate}%` }}
                    />
                  </div>
                </div>

                {/* At Risk Count */}
                <div className="flex items-center justify-between py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs text-red-700 dark:text-red-300">Em Risco</span>
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    {atRiskCount || 0}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Ativos</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {activeCount || 0}
                  </span>
                </div>
              </div>

              {/* Insight */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {healthRate >= 80
                    ? 'Base de clientes muito saudável!'
                    : healthRate >= 60
                    ? 'Boa saúde, monitore os em risco.'
                    : healthRate >= 40
                    ? 'Atenção: muitos clientes em risco.'
                    : 'Crítico: ação de retenção urgente!'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default HealthPill;
