// RetentionPulse.jsx v1.1
// Compact retention indicator for header integration
// Replaces full CustomerRetentionScore chart with space-efficient widget
//
// CHANGELOG:
// v1.1 (2025-12-16): Design System compliance
//   - Fixed text-[10px] violations (min 12px = text-xs)
//   - Status badge hidden on mobile for space efficiency
//   - Shortened insight text for dropdown
// v1.0 (2025-12-16): Initial implementation
//   - Compact inline design for header placement
//   - Shows 30-day retention with trend indicator
//   - Status badge (Excelente/Bom/Atenção/Crítico)
//   - Hover tooltip with 30/60/90 day breakdown
//   - Animated pulse effect for visual feedback

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const RetentionPulse = ({ data, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  const { rate30, rate60, rate90 } = data;

  // Determine status based on 30-day retention
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
      icon: Activity
    };
    if (rate >= 40) return {
      label: 'Atenção',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      pulse: 'bg-amber-500',
      icon: Activity
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

  const status = getStatus(rate30);
  const StatusIcon = status.icon;

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
        {/* Animated Pulse Dot */}
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.pulse} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.pulse}`}></span>
        </span>

        {/* Label */}
        <span className={`text-xs font-semibold ${status.color}`}>
          Pulso: {rate30}%
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[200px]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Pulso de Retenção
                  </p>
                  <p className={`text-xs font-semibold ${status.color} uppercase`}>
                    {status.label}
                  </p>
                </div>
              </div>

              {/* Retention Breakdown */}
              <div className="space-y-2">
                <RetentionRow label="30 dias" value={rate30} highlight />
                <RetentionRow label="60 dias" value={rate60} />
                <RetentionRow label="90 dias" value={rate90} />
              </div>

              {/* Insight */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {rate30 >= 70
                    ? 'Clientes estão retornando bem!'
                    : rate30 >= 50
                    ? 'Considere campanhas de reengajamento.'
                    : 'Implemente ações de retenção urgentes.'}
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

// Helper component for retention row
const RetentionRow = ({ label, value, highlight = false }) => {
  const getBarColor = (val) => {
    if (val >= 70) return 'bg-emerald-500';
    if (val >= 50) return 'bg-blue-500';
    if (val >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs ${highlight ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'} w-14`}>
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(value)} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${highlight ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'} w-10 text-right`}>
        {value}%
      </span>
    </div>
  );
};

export default RetentionPulse;
