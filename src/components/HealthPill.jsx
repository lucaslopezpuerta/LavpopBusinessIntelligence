// HealthPill.jsx v4.2 - CONTEXT-AWARE TREND INDICATOR
// Enhanced health rate indicator for header integration
// Now includes trend, full risk breakdown, and action button
//
// CHANGELOG:
// v4.2 (2026-01-29): Context-aware trend indicator design
//   - Trend in pill: white text with subtle badge (arrows provide direction)
//   - Trend in dropdown: semantic green/red colors on neutral background
//   - Added variant prop to TrendIndicator ("pill" | "default")
//   - Improved visual harmony on colored pill backgrounds
// v4.1 (2026-01-29): Fixed invisible status label in dropdown
//   - Added labelColor property for text on glassmorphism backgrounds
//   - Status label in dropdown now uses semantic colors (not text-white)
//   - text-white was invisible on bg-white/95 in light mode
// v4.0 (2026-01-29): Cosmic Precision 2.0 - Warning color fix
//   - REVERTED yellow back to AMBER for WCAG AA compliance
//   - Yellow-600 fails WCAG AA (3.5:1 contrast) - amber-600 passes (4.7:1)
//   - "Atenção" status: amber-600/500 (was yellow - failed contrast)
// v3.4 (2026-01-29): Migrated "Atenção" status from orange to yellow (REVERTED in v4.0)
// v3.3 (2026-01-29): Migrated "Atenção" status from amber to orange (REVERTED in v4.0)
// v3.2 (2026-01-28): Solid color badges for WCAG AA compliance
//   - Changed status pills from opacity-based to solid colors
//   - White text on solid backgrounds for 4.5:1+ contrast
// v3.1 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Dropdown animations disabled/simplified when user prefers reduced motion
// v3.0 (2026-01-20): Cosmic Glass Card refactor for dropdown
//   - Dropdown now uses glassmorphism (bg-space-dust/90 + backdrop-blur-xl)
//   - Softer borders with stellar-cyan accent
//   - Better dark mode contrast
// v2.0 (2026-01-13): Enhanced HealthPill
//   - NEW: Trend indicator in collapsed pill (↑+3% or ↓-2%)
//   - NEW: Full risk breakdown (Healthy/Monitor/At Risk/Churning/New)
//   - NEW: "Ver Clientes em Risco" action button
//   - NEW: Dynamic insights with specific customer counts
//   - Improved visual hierarchy with color-coded risk bars
// v1.0 (2025-12-16): Initial implementation
//   - Compact pill showing customer health rate percentage
//   - Status-based coloring (Excelente/Bom/Atenção/Crítico)
//   - Expandable dropdown with breakdown details

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import useReducedMotion from '../hooks/useReducedMotion';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  AlertTriangle,
  Users,
  Eye,
  Sparkles,
  Bell,
  CheckCircle
} from 'lucide-react';

/**
 * Trend Indicator Component
 * @param {number} value - The trend percentage value
 * @param {string} variant - "pill" for colored backgrounds, "default" for neutral backgrounds
 * @param {string} className - Additional classes
 */
const TrendIndicator = ({ value, variant = 'default', className = '' }) => {
  if (value === 0 || value === null || value === undefined) return null;

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  // Pill variant: white text with subtle badge (on colored backgrounds)
  // Default variant: semantic green/red colors (on neutral backgrounds)
  if (variant === 'pill') {
    return (
      <span className={`
        inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
        bg-white/20 text-white text-xs font-semibold
        ${className}
      `}>
        <Icon className="w-3 h-3" />
        {isPositive ? '+' : ''}{value}%
      </span>
    );
  }

  // Default variant: semantic colors for neutral backgrounds
  const colorClass = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-semibold">
        {isPositive ? '+' : ''}{value}%
      </span>
    </span>
  );
};

/**
 * Risk Breakdown Bar Component
 */
const RiskBreakdownBar = ({ label, count, total, icon: Icon, colorClass, bgClass }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${colorClass}`} />
          <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${colorClass}`}>{count}</span>
          <span className="text-xs text-slate-400">({percentage}%)</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${bgClass} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const HealthPill = ({
  healthRate,
  activeCount,
  atRiskCount,
  trend = 0,
  breakdown = {},
  atRiskCustomers = [],
  onOpenAtRiskModal,
  className = ''
}) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);

  if (healthRate === null || healthRate === undefined) return null;

  // Determine status based on health rate (solid colors for WCAG AA compliance)
  // - color: for text on colored backgrounds (pill, icon wells)
  // - labelColor: for status label text on glassmorphism dropdown
  const getStatus = (rate) => {
    if (rate >= 80) return {
      label: 'Excelente',
      color: 'text-white',
      labelColor: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      border: 'border-emerald-700 dark:border-emerald-400',
      pulse: 'bg-emerald-500',
      icon: TrendingUp
    };
    if (rate >= 60) return {
      label: 'Bom',
      color: 'text-white',
      labelColor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-600 dark:bg-blue-500',
      border: 'border-blue-700 dark:border-blue-400',
      pulse: 'bg-blue-500',
      icon: Heart
    };
    if (rate >= 40) return {
      label: 'Atenção',
      color: 'text-white',
      labelColor: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-600 dark:bg-amber-500',      // FIXED: amber passes WCAG (4.7:1), not yellow (3.5:1)
      border: 'border-amber-700 dark:border-amber-400',
      pulse: 'bg-amber-500',
      icon: AlertTriangle
    };
    return {
      label: 'Crítico',
      color: 'text-white',
      labelColor: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-600 dark:bg-red-500',
      border: 'border-red-700 dark:border-red-400',
      pulse: 'bg-red-500',
      icon: TrendingDown
    };
  };

  const status = getStatus(healthRate);
  const StatusIcon = status.icon;

  // Extract breakdown values with defaults
  const {
    healthy = 0,
    monitor = 0,
    atRisk = 0,
    churning = 0,
    newCustomer = 0
  } = breakdown;

  const needsAttention = atRisk + churning;

  // Generate dynamic insight
  const getInsight = () => {
    if (healthRate >= 80) {
      return {
        icon: CheckCircle,
        color: 'text-emerald-600 dark:text-emerald-400',
        text: `Excelente! ${healthy} clientes saudáveis.`
      };
    }
    if (healthRate >= 60) {
      return {
        icon: Eye,
        color: 'text-blue-600 dark:text-blue-400',
        text: `${monitor} clientes em monitoramento. ${needsAttention} precisam de atenção.`
      };
    }
    if (healthRate >= 40) {
      return {
        icon: AlertTriangle,
        color: 'text-amber-600 dark:text-amber-400',
        text: `${needsAttention} clientes em risco. ${churning} em estado crítico.`
      };
    }
    return {
      icon: Bell,
      color: 'text-red-600 dark:text-red-400',
      text: `Crítico: ${needsAttention} clientes precisam de ação urgente!`
    };
  };

  const insight = getInsight();
  const InsightIcon = insight.icon;

  // Handle action button click
  const handleActionClick = (e) => {
    e.stopPropagation();
    setIsExpanded(false);
    if (onOpenAtRiskModal) {
      onOpenAtRiskModal(atRiskCustomers);
    }
  };

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

        {/* Trend Indicator - Inline in pill (white on colored bg) */}
        {trend !== 0 && (
          <TrendIndicator value={trend} variant="pill" />
        )}

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
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : { duration: 0.15 }}
            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50"
          >
            <div className={`
              ${isDark ? 'bg-space-dust/90' : 'bg-white/95'}
              backdrop-blur-xl
              rounded-xl
              shadow-xl dark:shadow-glass-dark
              border ${isDark ? 'border-stellar-cyan/15' : 'border-slate-200/60'}
              p-4 min-w-[280px] max-w-[320px]
            `}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center`}>
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Taxa de Saúde
                    </p>
                    <p className={`text-xs font-semibold ${status.labelColor} uppercase`}>
                      {status.label}
                    </p>
                  </div>
                </div>
                {trend !== 0 && (
                  <div className="text-right">
                    <TrendIndicator value={trend} />
                    <p className="text-xs text-slate-400 mt-0.5">vs 30 dias</p>
                  </div>
                )}
              </div>

              {/* Risk Distribution Section */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Distribuição por Risco
                </h4>

                <div className="space-y-3">
                  <RiskBreakdownBar
                    label="Saudáveis"
                    count={healthy}
                    total={activeCount}
                    icon={CheckCircle}
                    colorClass="text-emerald-600 dark:text-emerald-400"
                    bgClass="bg-emerald-500"
                  />

                  <RiskBreakdownBar
                    label="Monitor"
                    count={monitor}
                    total={activeCount}
                    icon={Eye}
                    colorClass="text-blue-600 dark:text-blue-400"
                    bgClass="bg-blue-500"
                  />

                  <RiskBreakdownBar
                    label="Em Risco"
                    count={atRisk}
                    total={activeCount}
                    icon={AlertTriangle}
                    colorClass="text-amber-600 dark:text-amber-400"
                    bgClass="bg-amber-500"
                  />

                  <RiskBreakdownBar
                    label="Churning"
                    count={churning}
                    total={activeCount}
                    icon={TrendingDown}
                    colorClass="text-red-600 dark:text-red-400"
                    bgClass="bg-red-500"
                  />

                  <RiskBreakdownBar
                    label="Novos"
                    count={newCustomer}
                    total={activeCount}
                    icon={Sparkles}
                    colorClass="text-purple-600 dark:text-purple-400"
                    bgClass="bg-purple-500"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Total Ativos</span>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {activeCount || 0}
                </span>
              </div>

              {/* Action Button */}
              {needsAttention > 0 && onOpenAtRiskModal && (
                <button
                  onClick={handleActionClick}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors mb-4"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Ver Clientes em Risco ({needsAttention})
                </button>
              )}

              {/* Insight */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-start gap-2">
                  <InsightIcon className={`w-4 h-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
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
