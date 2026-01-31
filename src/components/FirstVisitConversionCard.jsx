// FirstVisitConversionCard.jsx v2.3
// Tracks critical 1st→2nd visit conversion rate
// Design System v5.2 compliant - Premium Glass Card pattern
//
// CHANGELOG:
// v2.3 (2026-01-29): Premium Gradient Status Badges
//   - Status badges now use gradient backgrounds matching HealthPill patterns
//   - excellent: emerald→teal, good: blue→cyan, attention: amber→orange, critical: red→rose
//   - Added text shadows for depth on gradient backgrounds
//   - Removed animation features for cleaner, instant rendering
// v2.2 (2026-01-27): Accessibility & consistency improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Replaced inline hoverTransition with TWEEN.HOVER constant
// v2.1 (2026-01-20): Premium Glass Effects
//   - Replaced hard borders with soft glow system
//   - Added ring-1 for subtle edge definition
//   - Added inner top-edge reflection for glass realism
//   - Outer cyan glow in dark mode for layered depth
// v2.0 (2026-01-20): Cosmic Glass Card refactor
//   - Replaced gradient background with glass effect (bg-space-dust/50)
//   - Added backdrop-blur-xl for unified glassmorphism
//   - Removed left border stripe (status shown via icon badge)
//   - Softer borders blending with page background
// v1.0 (2026-01-13): Initial implementation
//   - Primary conversion rate metric with trend
//   - Welcome campaign comparison (with/without)
//   - Action buttons for pending and lost customers
//   - Dynamic insights based on data

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Users,
  TrendingUp,
  TrendingDown,
  Mail,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  Sparkles,
  UserX
} from 'lucide-react';
import { haptics } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';
import ContextHelp from './ContextHelp';
import useReducedMotion from '../hooks/useReducedMotion';
import { TWEEN } from '../constants/animations';

// Premium glass hover - subtle lift (no boxShadow to preserve CSS glow)
const hoverAnimation = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.005 }
};

// Reduced motion variant
const hoverAnimationReduced = {
  rest: { opacity: 1 },
  hover: { opacity: 0.95 }
};

// Status thresholds for conversion rate
const getConversionStatus = (rate) => {
  if (rate >= 30) return { status: 'excellent', color: 'emerald', label: 'Excelente' };
  if (rate >= 15) return { status: 'good', color: 'blue', label: 'Bom' };
  if (rate >= 8) return { status: 'attention', color: 'amber', label: 'Atenção' };
  return { status: 'critical', color: 'red', label: 'Crítico' };
};

// Trend indicator component
const TrendIndicator = ({ value }) => {
  if (value === 0 || value === null || value === undefined) return null;

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400';

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-sm font-semibold">
        {isPositive ? '+' : ''}{value}%
      </span>
    </span>
  );
};

// Welcome comparison bar
const ComparisonBar = ({ label, icon: Icon, count, converted, rate, iconColor }) => {
  const barWidth = Math.min(rate, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-28 shrink-0">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-white w-12 text-right">
            {rate}%
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {converted} de {count}
        </p>
      </div>
    </div>
  );
};

const FirstVisitConversionCard = ({
  data,
  trend = null,
  onSendWelcome,
  onOpenLostCustomers,
  className = ''
}) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Handle missing data gracefully
  const metrics = useMemo(() => {
    if (!data) {
      return {
        conversionRate: 0,
        totalNewCustomers: 0,
        converted: 0,
        notConverted: 0,
        pending: 0,
        avgDaysToSecondVisit: 0,
        withWelcome: { total: 0, converted: 0, rate: 0 },
        withoutWelcome: { total: 0, converted: 0, rate: 0 },
        welcomeLift: 0,
        pendingCustomers: [],
        lostCustomers: []
      };
    }
    return data;
  }, [data]);

  const status = getConversionStatus(metrics.conversionRate);
  const notWelcomedPending = metrics.pendingCustomers?.filter(c => !c.hasWelcome) || [];

  // Handlers
  const handleSendWelcome = useCallback(() => {
    if (onSendWelcome && notWelcomedPending.length > 0) {
      haptics.light();
      onSendWelcome(notWelcomedPending);
    }
  }, [onSendWelcome, notWelcomedPending]);

  const handleOpenLost = useCallback(() => {
    if (onOpenLostCustomers && metrics.lostCustomers?.length > 0) {
      haptics.light();
      onOpenLostCustomers(metrics.lostCustomers);
    }
  }, [onOpenLostCustomers, metrics.lostCustomers]);

  // Generate insight
  const insight = useMemo(() => {
    const { conversionRate, avgDaysToSecondVisit, welcomeLift, withWelcome, withoutWelcome } = metrics;

    if (conversionRate >= 30) {
      return {
        type: 'success',
        text: `Excelente! ${conversionRate}% de conversão.`,
        subtext: avgDaysToSecondVisit > 0
          ? `Tempo médio até 2ª visita: ${avgDaysToSecondVisit} dias.`
          : 'Continue mantendo a qualidade.'
      };
    }

    if (welcomeLift > 10 && withWelcome.total > 0) {
      return {
        type: 'insight',
        text: `Campanha de boas-vindas aumenta ${welcomeLift}% a conversão.`,
        subtext: withoutWelcome.total > 0
          ? `Priorize enviar para os ${notWelcomedPending.length} pendentes.`
          : 'Continue o bom trabalho!'
      };
    }

    if (conversionRate < 8) {
      return {
        type: 'warning',
        text: `Apenas ${conversionRate}% dos novos clientes retornam.`,
        subtext: 'Reveja a experiência de primeira visita e considere promoções.'
      };
    }

    return {
      type: 'info',
      text: avgDaysToSecondVisit > 0
        ? `Tempo médio até 2ª visita: ${avgDaysToSecondVisit} dias.`
        : `${metrics.pending} clientes ainda podem retornar.`,
      subtext: welcomeLift > 0
        ? `Boas-vindas aumentam +${welcomeLift}% a conversão.`
        : 'Acompanhe as tendências semanalmente.'
    };
  }, [metrics, notWelcomedPending.length]);

  // Color classes based on status - now with premium gradients
  const statusColors = {
    excellent: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      accent: 'border-l-emerald-500 dark:border-l-emerald-400',
      iconBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-500 dark:to-teal-600',
      badgeGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-500 dark:to-teal-600 text-white'
    },
    good: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-600 dark:text-blue-400',
      accent: 'border-l-blue-500 dark:border-l-blue-400',
      iconBg: 'bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-500 dark:to-cyan-600',
      badgeGradient: 'bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 text-white'
    },
    attention: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-600 dark:text-amber-400',
      accent: 'border-l-amber-500 dark:border-l-amber-400',
      iconBg: 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-500 dark:to-orange-600',
      badgeGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-500 dark:to-orange-600 text-white'
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800/50',
      text: 'text-red-600 dark:text-red-400',
      accent: 'border-l-red-500 dark:border-l-red-400',
      iconBg: 'bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-500 dark:to-rose-600',
      badgeGradient: 'bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-500 dark:to-rose-600 text-white'
    }
  };

  const colors = statusColors[status.status];

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={prefersReducedMotion ? hoverAnimationReduced : hoverAnimation}
      transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl
        rounded-2xl
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        p-4 sm:p-5
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center shadow-sm shrink-0`}>
          <Users className="w-5 h-5 text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Conversão 1ª → 2ª Visita
              <ContextHelp
                title="O que este número significa?"
                description="Mede quantos clientes NOVOS fizeram uma segunda visita dentro de 30 dias após a primeira. Esta é a taxa de sucesso da primeira experiência - um cliente que volta pela segunda vez está no caminho para se tornar recorrente."
                formula="(Clientes com 2+ visitas ÷ Total de novos) × 100"
              />
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shadow-sm ${colors.badgeGradient}`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
            >
              {status.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Novos clientes que retornaram em 30 dias
          </p>
        </div>
      </div>

      {/* Primary Metric */}
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 mb-4`}>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-4xl font-bold text-slate-900 dark:text-white">
              {metrics.conversionRate}%
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300 ml-2">
              retornaram
            </span>
          </div>
          {trend !== null && trend !== 0 && (
            <TrendIndicator value={trend} />
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {metrics.converted} de {metrics.converted + metrics.notConverted} novos clientes fizeram segunda visita
        </p>
        {metrics.pending > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            + {metrics.pending} ainda dentro do período de conversão
          </p>
        )}
      </div>

      {/* Welcome Campaign Comparison */}
      {(metrics.withWelcome.total > 0 || metrics.withoutWelcome.total > 0) && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Impacto das Boas-vindas
          </h4>
          <div className="space-y-3">
            <ComparisonBar
              label="Com boas-vindas"
              icon={Mail}
              iconColor="text-emerald-600 dark:text-emerald-400"
              count={metrics.withWelcome.total}
              converted={metrics.withWelcome.converted}
              rate={metrics.withWelcome.rate}
            />
            <ComparisonBar
              label="Sem boas-vindas"
              icon={UserX}
              iconColor="text-slate-400 dark:text-slate-500"
              count={metrics.withoutWelcome.total}
              converted={metrics.withoutWelcome.converted}
              rate={metrics.withoutWelcome.rate}
            />
          </div>
          {metrics.welcomeLift !== 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Sparkles className={`w-3.5 h-3.5 ${metrics.welcomeLift > 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={`text-xs font-medium ${metrics.welcomeLift > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {metrics.welcomeLift > 0 ? '+' : ''}{metrics.welcomeLift}% de lift com boas-vindas
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {notWelcomedPending.length > 0 && onSendWelcome && (
          <button
            onClick={handleSendWelcome}
            className="flex items-center justify-between gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {notWelcomedPending.length}
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400">
                sem boas-vindas
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {metrics.lostCustomers?.length > 0 && onOpenLostCustomers && (
          <button
            onClick={handleOpenLost}
            className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                {metrics.lostCustomers.length}
              </span>
              <span className="text-xs text-red-600 dark:text-red-400">
                não retornaram
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Insight */}
      <div className={`flex items-start gap-2 p-3 rounded-lg ${
        insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
        insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
        'bg-slate-50 dark:bg-slate-700/50'
      }`}>
        <Lightbulb className={`w-4 h-4 mt-0.5 shrink-0 ${
          insight.type === 'success' ? 'text-emerald-500' :
          insight.type === 'warning' ? 'text-amber-500' :
          'text-blue-500'
        }`} />
        <div>
          <p className={`text-sm font-medium ${
            insight.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' :
            insight.type === 'warning' ? 'text-amber-700 dark:text-amber-300' :
            'text-slate-700 dark:text-slate-200'
          }`}>
            {insight.text}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {insight.subtext}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default FirstVisitConversionCard;
