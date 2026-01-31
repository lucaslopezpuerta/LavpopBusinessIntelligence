// RetentionCard.jsx v2.7
// Full retention analytics card with segment comparison and re-engage actions
//
// CHANGELOG:
// v2.7 (2026-01-29): Premium Gradient Status Badges
//   - Status badges now use gradient backgrounds matching HealthPill patterns
//   - Saudável: emerald→teal, Moderado: blue→cyan, Em Risco: amber→orange, Crítico: red→rose
//   - Added text shadows for depth on gradient backgrounds
//   - Header icon now uses gradient background
// v2.6 (2026-01-29): Yellow to amber color migration with mode-aware badges
//   - CHANGED: "Em Risco" status bgColor from yellow-600/500 solid to mode-aware amber
//   - CHANGED: "Em Risco" status barColor from yellow-500 to amber-500
//   - Mode-aware badges: bg-amber-50 text-amber-800 border border-amber-200 (light)
//                        bg-amber-500 text-white border-amber-400 (dark)
// v2.5 (2026-01-29): Orange to yellow color migration for status badges
//   - CHANGED: "Em Risco" status bgColor from orange-600/500 to yellow-600/500
//   - CHANGED: "Em Risco" status barColor from orange-500 to yellow-500
//   - Improves visual distinction from other semantic colors
// v2.4 (2026-01-29): Amber to orange color migration for status badges
//   - CHANGED: "Em Risco" status bgColor from amber-600/500 to orange-600/500
//   - CHANGED: "Em Risco" status barColor from amber-500 to orange-500
//   - Improves visual distinction from other semantic colors
// v2.3 (2026-01-29): Solid color migration for badges and status pills
//   - Updated getStatusClasses bgColor from opacity-based to solid colors
//   - Status badges now use bg-{color}-600 dark:bg-{color}-500 with text-white
//   - Updated textColor to white for status badges
// v2.2 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Replaced inline cardHoverTransition with TWEEN.HOVER constant
//   - SegmentBar progress bar respects reduced motion preference
// v2.1 (2026-01-20): Premium Glass Effects
//   - Replaced hard borders with soft glow system
//   - Added ring-1 for subtle edge definition
//   - Added inner top-edge reflection for glass realism
//   - Outer cyan glow in dark mode for layered depth
// v2.0 (2026-01-20): Cosmic Glass Card refactor
//   - Replaced gradient background with glass effect (bg-space-dust/50)
//   - Upgraded backdrop-blur-md to backdrop-blur-xl
//   - Removed left border stripe (accent via icon badge only)
//   - Softer borders blending with page background
// v1.3 (2026-01-15): Added ContextHelp tooltip to main header
//   - NEW: Tooltip explaining "Taxa de Retorno" metric
//   - Clarifies difference from "Conversão 1ª→2ª Visita"
//   - Includes formula for transparency
// v1.2 (2026-01-15): Card styling upgrade
//   - Added hover animation (lift + shadow) matching AcquisitionCard
//   - Added left accent border (border-l-4 border-l-blue-500)
//   - Added gradient background for depth
//   - Optimized padding for consistent feel
// v1.1 (2026-01-15): Header consistency with Design System
//   - FIXED: Icon now wrapped in colored background (p-2 bg-blue-100 rounded-lg)
//   - FIXED: Icon size updated to w-5 h-5 (was w-4 h-4)
//   - FIXED: Title font updated to text-base font-bold (was text-sm)
//   - Matches AcquisitionCard and FirstVisitConversionCard styling
// v1.0 (2026-01-13): Initial implementation
//   - Last-Visit Based retention algorithm visualization
//   - Segment comparison bars (Fiéis vs Novos)
//   - Re-engage buttons that open CustomerSegmentModal
//   - 6-month sparkline trend
//   - Adaptive insights based on segment performance
//
// FEATURES:
// - Primary metric: 30-day return rate with trend indicator
// - Side-by-side segment comparison (Loyalists vs New)
// - Re-engage buttons with overdue customer counts
// - Mini sparkline showing 6-month history
// - Status thresholds: Saudável (70%) > Moderado (50%) > Em Risco (30%) > Crítico

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Sparkles,
  Bell,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import ContextHelp from './ContextHelp';
import useReducedMotion from '../hooks/useReducedMotion';
import { TWEEN } from '../constants/animations';

// Status thresholds for retention rate
const STATUS_THRESHOLDS = {
  HEALTHY: 70,    // 70%+ = Saudável
  MODERATE: 50,   // 50-69% = Moderado
  AT_RISK: 30     // 30-49% = Em Risco, <30% = Crítico
};

// Premium glass hover - subtle lift (no boxShadow to preserve CSS glow)
const cardHoverAnimation = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.005 }
};

// Reduced motion variant - no movement
const cardHoverAnimationReduced = {
  rest: { opacity: 1 },
  hover: { opacity: 0.95 }
};

/**
 * Get status color classes based on retention rate - now with premium gradients
 */
const getStatusClasses = (rate) => {
  if (rate >= STATUS_THRESHOLDS.HEALTHY) {
    return {
      label: 'Saudável',
      textColor: 'text-white',
      bgColor: 'bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-500 dark:to-teal-600',
      barColor: 'bg-emerald-500',
      icon: CheckCircle
    };
  }
  if (rate >= STATUS_THRESHOLDS.MODERATE) {
    return {
      label: 'Moderado',
      textColor: 'text-white',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-500 dark:to-cyan-600',
      barColor: 'bg-blue-500',
      icon: Info
    };
  }
  if (rate >= STATUS_THRESHOLDS.AT_RISK) {
    return {
      label: 'Em Risco',
      textColor: 'text-white',
      bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-500 dark:to-orange-600',
      barColor: 'bg-amber-500',
      icon: AlertCircle
    };
  }
  return {
    label: 'Crítico',
    textColor: 'text-white',
    bgColor: 'bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-500 dark:to-rose-600',
    barColor: 'bg-red-500',
    icon: AlertCircle
  };
};

/**
 * Mini Sparkline Component - 6-month trend visualization
 */
const RetentionSparkline = ({ data, color = 'currentColor', className = '' }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 80;
  const height = 32;
  const padding = 4;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // Last point for dot
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
  const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding);

  return (
    <svg width={width} height={height} className={`flex-shrink-0 ${className}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="opacity-60"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="3"
        fill={color}
      />
    </svg>
  );
};

/**
 * Trend Indicator Component
 */
const TrendIndicator = ({ value, className = '' }) => {
  if (value === 0) {
    return (
      <span className={`flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}>
        <Minus className="w-3 h-3" />
        <span>0%</span>
      </span>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${colorClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span>{isPositive ? '+' : ''}{value}%</span>
    </span>
  );
};

/**
 * Segment Comparison Bar Component
 */
const SegmentBar = ({
  label,
  icon: Icon,
  rate,
  eligible,
  returned,
  trend,
  overdueCount,
  onReengage,
  iconColor = 'text-slate-600 dark:text-slate-400',
  prefersReducedMotion = false
}) => {
  const status = getStatusClasses(rate);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label} <span className="text-slate-500 dark:text-slate-400 font-normal">({returned} de {eligible})</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-800 dark:text-white">
            {rate}%
          </span>
          <TrendIndicator value={trend} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 ${status.barColor} rounded-full`}
          initial={prefersReducedMotion ? { width: `${rate}%` } : { width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Re-engage Button */}
      {overdueCount > 0 && (
        <button
          onClick={onReengage}
          className="
            flex items-center gap-2 w-full px-3 py-2 mt-2
            bg-slate-50 dark:bg-slate-700/50
            hover:bg-slate-100 dark:hover:bg-slate-700
            border border-slate-200 dark:border-slate-600
            rounded-lg text-xs font-medium
            text-slate-600 dark:text-slate-300
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
          "
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Reengajar {overdueCount} atrasados</span>
        </button>
      )}
    </div>
  );
};

/**
 * Insight Box Component
 */
const InsightBox = ({ insight }) => {
  if (!insight) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: AlertCircle,
      iconColor: 'text-amber-600 dark:text-amber-400'
    }
  };

  const config = typeConfig[insight.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3`}>
      <div className="flex gap-2">
        <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {insight.primary}
          </p>
          {insight.secondary && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {insight.secondary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main RetentionCard Component
 */
const RetentionCard = ({
  data,
  onOpenSegmentModal,
  className = ''
}) => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Generate insight based on data
  const insight = useMemo(() => {
    if (!data) return null;

    const { overall, segments } = data;
    const totalOverdue = (segments.loyalists?.overdueCount || 0) + (segments.new?.overdueCount || 0);
    const loyalistRate = segments.loyalists?.rate30 || 0;
    const newRate = segments.new?.rate30 || 0;
    const rateDiff = loyalistRate - newRate;

    if (overall.rate30 >= STATUS_THRESHOLDS.HEALTHY) {
      return {
        type: 'success',
        primary: `Excelente! ${overall.returned} clientes retornaram em 30 dias.`,
        secondary: rateDiff > 20
          ? 'Novos clientes têm retenção menor - considere programa de boas-vindas.'
          : 'Continue mantendo a qualidade do serviço.'
      };
    }

    if (overall.rate30 >= STATUS_THRESHOLDS.MODERATE) {
      return {
        type: 'info',
        primary: `${totalOverdue} clientes não retornaram há 21+ dias.`,
        secondary: newRate < 50
          ? 'Foque em reengajar novos clientes - eles têm maior risco de churn.'
          : 'Envie mensagens de reengajamento para recuperá-los.'
      };
    }

    return {
      type: 'warning',
      primary: `Atenção: apenas ${overall.rate30}% dos clientes retornam.`,
      secondary: 'Reveja a experiência do cliente e considere promoções de fidelidade.'
    };
  }, [data]);

  // Handle empty/loading state
  if (!data) {
    return (
      <div className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        ${className}
      `}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  const { overall, segments, trend, history } = data;
  const overallStatus = getStatusClasses(overall.rate30);
  const StatusIcon = overallStatus.icon;

  // Handle re-engage button clicks
  const handleReengageLoyalists = () => {
    if (onOpenSegmentModal && segments.loyalists?.overdueCustomers?.length > 0) {
      onOpenSegmentModal('loyalists', segments.loyalists.overdueCustomers);
    }
  };

  const handleReengageNew = () => {
    if (onOpenSegmentModal && segments.new?.overdueCustomers?.length > 0) {
      onOpenSegmentModal('new', segments.new.overdueCustomers);
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={prefersReducedMotion ? cardHoverAnimationReduced : cardHoverAnimation}
      transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
        h-full flex flex-col
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-500 dark:to-teal-600 flex items-center justify-center shadow-sm shrink-0">
            <RefreshCw className="w-5 h-5 text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Taxa de Retorno
              <ContextHelp
                title="O que é Taxa de Retorno?"
                description="Mede a porcentagem de clientes que visitaram há 31-60 dias e VOLTARAM nos últimos 30 dias. Diferente da 'Conversão 1ª→2ª Visita', esta métrica avalia engajamento CONTÍNUO - se os clientes estão mantendo o hábito de voltar."
                formula="(Clientes que retornaram ÷ Clientes elegíveis) × 100"
              />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clientes que voltam em 30 dias
            </p>
          </div>
        </div>

        {/* Sparkline */}
        {history?.overall?.length > 0 && (
          <RetentionSparkline
            data={history.overall}
            color={overall.rate30 >= STATUS_THRESHOLDS.HEALTHY ? '#10b981' : overall.rate30 >= STATUS_THRESHOLDS.MODERATE ? '#3b82f6' : '#f59e0b'}
          />
        )}
      </div>

      {/* Primary Metric */}
      <div className="flex items-center justify-center gap-6 py-4 mb-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              {overall.rate30}%
            </span>
            <TrendIndicator value={trend.overall} className="text-sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {overall.returned} de {overall.eligible} retornaram em 30 dias
          </p>
        </div>

        <div className="w-px h-12 bg-slate-200 dark:bg-slate-600" />

        <div className="text-center">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-sm ${overallStatus.bgColor}`}
            aria-label={`Status: ${overallStatus.label}`}
          >
            <StatusIcon
              className={`w-3.5 h-3.5 ${overallStatus.textColor}`}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}
            />
            <span
              className={`text-xs font-bold ${overallStatus.textColor} uppercase`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
            >
              {overallStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Segment Comparison */}
      <div className="flex-1 space-y-4 mb-4">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          Por Segmento
          <ContextHelp
            title="O que significa cada segmento?"
            description="Fiéis: Clientes VIP e Frequentes com histórico sólido. Novos: Clientes com primeira visita recente. Este número mede se eles CONTINUAM voltando após a janela de análise (31-60 dias atrás), não apenas se fizeram uma 2ª visita."
          />
        </h4>

        <SegmentBar
          label="Fiéis"
          icon={Crown}
          iconColor="text-amber-600 dark:text-amber-400"
          rate={segments.loyalists?.rate30 || 0}
          eligible={segments.loyalists?.eligible || 0}
          returned={segments.loyalists?.returned || 0}
          trend={trend.loyalists || 0}
          overdueCount={segments.loyalists?.overdueCount || 0}
          onReengage={handleReengageLoyalists}
          prefersReducedMotion={prefersReducedMotion}
        />

        <SegmentBar
          label="Novos"
          icon={Sparkles}
          iconColor="text-purple-600 dark:text-purple-400"
          rate={segments.new?.rate30 || 0}
          eligible={segments.new?.eligible || 0}
          returned={segments.new?.returned || 0}
          trend={trend.new || 0}
          overdueCount={segments.new?.overdueCount || 0}
          onReengage={handleReengageNew}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Insight */}
      <InsightBox insight={insight} />

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Últimos 90 dias
        </p>
      </div>
    </motion.div>
  );
};

export default RetentionCard;
