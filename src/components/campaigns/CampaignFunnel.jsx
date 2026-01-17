// CampaignFunnel.jsx v3.8
// Campaign Delivery Funnel + Outcomes Panel
// Design System v4.2 compliant - Cosmic Precision Theme
// ANALYTICAL INTEGRITY ENFORCED
//
// CHANGELOG:
// v3.8 (2026-01-17): Glassmorphism fix + subtle badge indicator
//   - Added backdrop-blur-sm and semi-transparent backgrounds (bg-white/80, bg-space-dust/80)
//   - True glassmorphism effect now visible on cards
//   - Replaced prominent amber ring with small badge in top-right corner
// v3.7 (2026-01-17): Fixed OutcomeCard colors
//   - Custom colors (cosmic-purple, stellar-gold) don't support Tailwind opacity modifiers
//   - Switched to standard Tailwind colors (purple-500, amber-500) for reliable styling
//   - Values now show proper colored text (purple-400, amber-400, emerald-400 in dark)
// v3.6 (2026-01-17): Design System v4.1 compliance
//   - Applied proper Cosmic Glassmorphism pattern from Design System
//   - Cards now use bg-space-dust (dark) with border-stellar-cyan/10
//   - Colors expressed through icon backgrounds, not card borders
//   - FunnelStage uses consistent subtle borders
//   - Removed harsh colored borders in favor of Design System pattern
// v3.5 (2026-01-17): Cosmic Precision theme conversion
//   - Added useTheme hook for reliable dark mode
//   - Converted dark: prefixes to isDark conditionals
//   - Uses space/stellar color tokens
//   - Enhanced with cosmic glassmorphism patterns
// v3.4 (2026-01-09): Typography compliance (12px minimum)
//   - Fixed text-[10px] → text-xs throughout component
//   - All text now meets minimum 12px requirement
// v3.3 (2026-01-09): Improved mobile readability
//   - Increased mobile font sizes: values text-sm→text-base, labels text-[8px]→text-[10px]
//   - Larger conversion rates on mobile: text-[9px]→text-xs
//   - Larger drop-off counts: text-[8px]→text-[10px]
//   - Wider compact cards: min-w-[60px]→min-w-[70px], p-2→p-2.5
//   - Larger arrow icons on mobile: w-3→w-4
// v3.2 (2026-01-08): Removed redundant percentages, show drop-offs on mobile
//   - REMOVED: percentOfTotal from cards (redundant with step-to-step conversion)
//   - Cards now show only: value (count) + label
//   - Between stages: conversion rate % + drop-off count (visible on all sizes)
//   - Compact cards: min-w-[60px], text-sm for value, text-[8px] for label
// v3.1 (2026-01-08): Horizontal mobile layout
//   - Funnel now displays horizontally on all screen sizes
//   - Mobile uses compact mode: no icons, smaller text
//   - Desktop uses full mode: with icons, standard text
// v3.0 (2026-01-08): Complete redesign for analytical integrity
//   - REMOVED: "Engajaram" and "Retornaram" from funnel (they are OUTCOMES, not funnel steps)
//   - Canonical funnel now: Enviadas → Entregues → Lidas (3-stage only)
//   - NEW: OutcomesPanel shows Engajaram, Retornaram, Receita with EXPLICIT denominators
//   - NEW: Drop-off counts between funnel stages
//   - NEW: Biggest loss step highlight
//   - NEW: Funnel monotonicity validation (sent ≥ delivered ≥ read)
//   - NEW: FunnelInsight with actionable recommendations
//   - All percentages now declare their denominator explicitly
//   - Conversion rates can NEVER exceed 100% (mathematically guaranteed)
// v2.0 (2025-12-14): Added 5-stage funnel with real engagement tracking
//   - DEPRECATED: Mixed journey metrics with outcome metrics
// v1.0 (2025-12-10): Initial implementation
//
// DESIGN PRINCIPLES (from analytics spec):
// 1. One funnel = one invariant base population
// 2. Funnel steps must be sequential, mutually exclusive, monotonically decreasing
// 3. Step-to-step conversion must NEVER exceed 100%
// 4. Engagement/Return/Revenue are OUTCOMES, never funnel steps
// 5. Every percentage must explicitly declare its denominator

import React, { useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  UserCheck,
  DollarSign,
  ArrowRight,
  ArrowDown,
  Clock,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Info
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import { useTheme } from '../../contexts/ThemeContext';

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
};

// ==================== FUNNEL STAGE COMPONENT ====================

const FunnelStage = ({
  icon: Icon,
  label,
  value,
  dropOff,
  conversionRate,
  color,
  isFirst = false,
  isLast = false,
  isCompact = false,
  isBiggestLoss = false,
  isDark = false
}) => {
  // Design System v4.1 - Cosmic Glassmorphism pattern
  // Cards use bg-space-dust with color-coordinated subtle borders
  // Colors are expressed through icon backgrounds and subtle border tints
  const colorStyles = {
    blue: {
      bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      icon: isDark ? 'text-blue-400' : 'text-blue-600',
      border: isDark ? 'border-blue-500/20' : 'border-blue-200'
    },
    emerald: {
      bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
      icon: isDark ? 'text-emerald-400' : 'text-emerald-600',
      border: isDark ? 'border-emerald-500/20' : 'border-emerald-200'
    },
    cyan: {
      bg: isDark ? 'bg-stellar-cyan/20' : 'bg-cyan-100',
      icon: isDark ? 'text-stellar-cyan' : 'text-cyan-600',
      border: isDark ? 'border-stellar-cyan/20' : 'border-cyan-200'
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  // Conversion rate color based on value
  const getConversionColor = (rate) => {
    if (rate >= 90) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (rate >= 70) return isDark ? 'text-blue-400' : 'text-blue-600';
    if (rate >= 50) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-2">
      {/* Stage Card - Glassmorphism with color-coordinated border */}
      <div className={`
        relative flex flex-col items-center justify-center rounded-xl
        ${isDark ? 'bg-space-dust/80' : 'bg-white/80'}
        backdrop-blur-sm
        border ${style.border}
        ${isCompact ? 'p-2.5 min-w-[70px]' : 'p-3 sm:p-4 min-w-[90px] sm:min-w-[110px]'}
        transition-all duration-200
      `}>
        {/* Biggest loss badge - subtle indicator */}
        {isBiggestLoss && (
          <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center ${isDark ? 'bg-amber-500/80' : 'bg-amber-400'}`}>
            <span className="text-[8px] font-bold text-white">!</span>
          </div>
        )}
        {/* Icon - hidden on compact mobile */}
        {!isCompact && (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${style.bg} flex items-center justify-center mb-1.5`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.icon}`} />
          </div>
        )}
        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} ${isCompact ? 'text-base' : 'text-lg sm:text-xl'}`}>
          {value.toLocaleString('pt-BR')}
        </p>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-center font-medium ${isCompact ? 'text-xs' : 'text-xs'}`}>
          {label}
        </p>
      </div>

      {/* Arrow with conversion rate and drop-off - visible on all sizes */}
      {!isLast && (
        <div className="flex flex-col items-center gap-0.5 px-0.5 sm:px-2">
          <ArrowRight className={`${isDark ? 'text-slate-600' : 'text-slate-300'} ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          {conversionRate !== undefined && (
            <span className={`font-bold ${isCompact ? 'text-xs' : 'text-xs sm:text-sm'} ${getConversionColor(conversionRate)}`}>
              {conversionRate.toFixed(0)}%
            </span>
          )}
          {dropOff > 0 && (
            <span className={`text-xs ${
              isBiggestLoss
                ? (isDark ? 'text-amber-400 font-semibold' : 'text-amber-600 font-semibold')
                : (isDark ? 'text-slate-500' : 'text-slate-400')
            }`}>
              -{dropOff.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== OUTCOME CARD COMPONENT ====================

const OutcomeCard = ({
  icon: Icon,
  label,
  value,
  rate,
  denominator,
  denominatorLabel,
  subtitle,
  color,
  isDark = false
}) => {
  // Design System v4.1 - Cosmic Glassmorphism pattern
  // Cards use bg-space-dust with color-coordinated subtle borders
  // NOTE: Using standard Tailwind colors for reliable opacity support
  const colorStyles = {
    purple: {
      iconBg: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      icon: isDark ? 'text-purple-400' : 'text-purple-600',
      value: isDark ? 'text-purple-400' : 'text-purple-700',
      border: isDark ? 'border-purple-500/20' : 'border-purple-200'
    },
    amber: {
      iconBg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
      icon: isDark ? 'text-amber-400' : 'text-amber-600',
      value: isDark ? 'text-amber-400' : 'text-amber-700',
      border: isDark ? 'border-amber-500/20' : 'border-amber-200'
    },
    emerald: {
      iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
      icon: isDark ? 'text-emerald-400' : 'text-emerald-600',
      value: isDark ? 'text-emerald-400' : 'text-emerald-700',
      border: isDark ? 'border-emerald-500/20' : 'border-emerald-200'
    }
  };

  const style = colorStyles[color] || colorStyles.purple;

  return (
    <div className={`
      flex flex-col items-center p-3 sm:p-4 rounded-xl min-w-[100px]
      ${isDark ? 'bg-space-dust/80' : 'bg-white/80'}
      backdrop-blur-sm
      border ${style.border}
      transition-all duration-200
    `}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${style.icon}`} />
        </div>
        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${style.value}`}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
      {rate !== undefined && rate !== null && denominator > 0 && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 text-center`}>
          <span className="font-semibold">{rate.toFixed(1)}%</span> de {denominator.toLocaleString('pt-BR')} {denominatorLabel}
        </p>
      )}
      {subtitle && (
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>{subtitle}</p>
      )}
    </div>
  );
};

// ==================== FUNNEL INSIGHT COMPONENT ====================

const FunnelInsight = ({ insight, isDark = false }) => {
  if (!insight) return null;

  // Cosmic-aware insight styles
  const typeStyles = {
    warning: {
      bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      border: isDark ? 'border-amber-800' : 'border-amber-200',
      icon: isDark ? 'text-amber-400' : 'text-amber-600',
      text: isDark ? 'text-amber-300' : 'text-amber-700'
    },
    success: {
      bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
      border: isDark ? 'border-emerald-800' : 'border-emerald-200',
      icon: isDark ? 'text-emerald-400' : 'text-emerald-600',
      text: isDark ? 'text-emerald-300' : 'text-emerald-700'
    },
    info: {
      bg: isDark ? 'bg-stellar-cyan/10' : 'bg-blue-50',
      border: isDark ? 'border-stellar-cyan/30' : 'border-blue-200',
      icon: isDark ? 'text-stellar-cyan' : 'text-blue-600',
      text: isDark ? 'text-blue-300' : 'text-blue-700'
    }
  };

  const styles = typeStyles[insight.type] || typeStyles.info;
  const IconComponent = insight.type === 'warning' ? AlertTriangle :
                        insight.type === 'success' ? TrendingUp : Lightbulb;

  return (
    <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border}`}>
      <div className="flex items-start gap-2">
        <IconComponent className={`w-4 h-4 ${styles.icon} mt-0.5 shrink-0`} />
        <div>
          <p className={`text-xs font-semibold ${styles.text}`}>
            {insight.title}
          </p>
          {insight.action && (
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
              {insight.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== DELIVERY FUNNEL (PRIMARY) ====================

const DeliveryFunnel = ({ sent, delivered, read, isLoading, isCompact = false, isDark = false }) => {
  // Calculate step-to-step conversion rates
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
  const readRate = delivered > 0 ? (read / delivered) * 100 : 0;

  // Calculate drop-offs
  const deliveryDropOff = sent - delivered;
  const readDropOff = delivered - read;

  // Identify biggest loss
  const biggestLoss = deliveryDropOff > readDropOff ? 'delivery' : 'read';

  const stages = [
    {
      icon: Send,
      label: 'Enviadas',
      value: sent,
      conversionRate: deliveryRate,
      dropOff: deliveryDropOff,
      color: 'blue',
      isFirst: true,
      isBiggestLoss: biggestLoss === 'delivery' && deliveryDropOff > 0
    },
    {
      icon: CheckCircle2,
      label: 'Entregues',
      value: delivered,
      conversionRate: readRate,
      dropOff: readDropOff,
      color: 'emerald',
      isBiggestLoss: biggestLoss === 'read' && readDropOff > 0
    },
    {
      icon: Eye,
      label: 'Lidas',
      value: read,
      color: 'cyan',
      isLast: true,
      isBiggestLoss: false
    }
  ];

  // Always horizontal layout - use compact on mobile
  return (
    <div className="flex flex-row justify-center items-center gap-1 sm:gap-2">
      {stages.map((stage) => (
        <FunnelStage
          key={stage.label}
          {...stage}
          isCompact={isCompact}
          isDark={isDark}
        />
      ))}
    </div>
  );
};

// ==================== OUTCOMES PANEL (SECONDARY) ====================

const OutcomesPanel = ({
  engaged,
  returned,
  revenue,
  basePopulation,
  avgDaysToReturn,
  avgRevenuePerReturn,
  isDark = false
}) => {
  // Calculate rates with explicit denominator (basePopulation = read messages)
  const engagementRate = basePopulation > 0 ? (engaged / basePopulation) * 100 : null;
  const returnRate = basePopulation > 0 ? (returned / basePopulation) * 100 : null;

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      <OutcomeCard
        icon={MousePointerClick}
        label="Engajaram"
        value={engaged}
        rate={engagementRate}
        denominator={basePopulation}
        denominatorLabel="lidas"
        color="purple"
        isDark={isDark}
      />
      <OutcomeCard
        icon={UserCheck}
        label="Retornaram"
        value={returned}
        rate={returnRate}
        denominator={basePopulation}
        denominatorLabel="lidas"
        subtitle={avgDaysToReturn > 0 ? `~${avgDaysToReturn.toFixed(0)}d para retornar` : null}
        color="amber"
        isDark={isDark}
      />
      <OutcomeCard
        icon={DollarSign}
        label="Receita"
        value={formatCurrency(revenue)}
        subtitle={avgRevenuePerReturn > 0 ? `${formatCurrency(avgRevenuePerReturn)}/retorno` : null}
        color="emerald"
        isDark={isDark}
      />
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CampaignFunnel = ({
  funnel = {},
  avgDaysToReturn = 0,
  avgRevenuePerReturn = 0,
  isLoading = false
}) => {
  const { isDark } = useTheme();
  const {
    sent = 0,
    delivered = 0,
    read = 0,
    engaged = 0,
    returned = 0
  } = funnel;

  // Calculate total revenue from avgRevenuePerReturn * returned
  const totalRevenue = avgRevenuePerReturn * returned;

  // Validate funnel monotonicity (CRITICAL)
  const isValidFunnel = useMemo(() => {
    return sent >= delivered && delivered >= read;
  }, [sent, delivered, read]);

  // Generate insight based on funnel data
  const insight = useMemo(() => {
    if (sent === 0) return null;

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const readRate = delivered > 0 ? (read / delivered) * 100 : 0;
    const returnRate = read > 0 ? (returned / read) * 100 : 0;

    const deliveryDropOff = sent - delivered;
    const readDropOff = delivered - read;
    const biggestLoss = deliveryDropOff > readDropOff ? 'delivery' : 'read';

    // Primary insight: biggest loss
    if (biggestLoss === 'delivery' && (100 - deliveryRate) > 5 && deliveryDropOff > 10) {
      return {
        type: 'warning',
        title: `Maior perda: Envio → Entrega (${deliveryDropOff.toLocaleString('pt-BR')} mensagens, ${(100 - deliveryRate).toFixed(0)}% perdidas)`,
        action: 'Verifique números bloqueados, incorretos ou sem WhatsApp'
      };
    }

    if (biggestLoss === 'read' && (100 - readRate) > 30 && readDropOff > 10) {
      return {
        type: 'warning',
        title: `Maior perda: Entrega → Leitura (${readDropOff.toLocaleString('pt-BR')} mensagens, ${(100 - readRate).toFixed(0)}% não lidas)`,
        action: 'Teste horários diferentes ou mensagens mais chamativas'
      };
    }

    // Success insight
    if (returnRate > 15 && returned > 5) {
      return {
        type: 'success',
        title: `Excelente taxa de retorno: ${returnRate.toFixed(1)}% dos que leram retornaram`,
        action: 'Considere expandir para outros segmentos de clientes'
      };
    }

    if (readRate > 70 && deliveryRate > 95) {
      return {
        type: 'success',
        title: `Ótima taxa de leitura: ${readRate.toFixed(0)}% das mensagens entregues foram lidas`,
        action: null
      };
    }

    return null;
  }, [sent, delivered, read, returned]);

  // Loading state
  if (isLoading) {
    return (
      <SectionCard
        title="Funil de Entrega"
        subtitle="Jornada da mensagem: envio até leitura"
        icon={TrendingUp}
        color="blue"
      >
        <div className="animate-pulse space-y-6">
          <div className="flex justify-center gap-4 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-24 h-28 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-xl`} />
            ))}
          </div>
          <div className={`h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <div className="flex justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-28 h-24 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-xl`} />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  // Empty state
  if (sent === 0) {
    return (
      <SectionCard
        title="Funil de Entrega"
        subtitle="Jornada da mensagem: envio até leitura"
        icon={TrendingUp}
        color="blue"
      >
        <div className="text-center py-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDark ? 'bg-stellar-cyan/20' : 'bg-blue-100'} flex items-center justify-center`}>
            <Send className={`w-8 h-8 ${isDark ? 'text-stellar-cyan' : 'text-blue-500'}`} />
          </div>
          <h4 className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
            Nenhuma campanha enviada
          </h4>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-md mx-auto`}>
            Quando você enviar campanhas, verá aqui o funil de entrega mostrando
            quantas mensagens foram enviadas, entregues e lidas.
          </p>
        </div>
      </SectionCard>
    );
  }

  // Invalid funnel state (data inconsistency)
  if (!isValidFunnel) {
    return (
      <SectionCard
        title="Funil de Entrega"
        subtitle="Jornada da mensagem: envio até leitura"
        icon={TrendingUp}
        color="blue"
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'} mt-0.5 shrink-0`} />
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  Dados inconsistentes detectados
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                  Os valores não seguem a sequência esperada (enviadas ≥ entregues ≥ lidas).
                  Isso pode indicar dados parciais ou erro de sincronização.
                </p>
              </div>
            </div>
          </div>

          {/* Show raw numbers anyway */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="text-center">
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sent.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">Enviadas</p>
            </div>
            <div className="text-center">
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{delivered.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">Entregues</p>
            </div>
            <div className="text-center">
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{read.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">Lidas</p>
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Funil de Entrega"
      subtitle="Jornada da mensagem: envio até leitura"
      icon={TrendingUp}
      color="blue"
    >
      <div className="space-y-5">
        {/* PRIMARY: Delivery Funnel (3 stages) - Always horizontal */}
        {/* Desktop: full size with icons */}
        <div className="hidden sm:block">
          <DeliveryFunnel
            sent={sent}
            delivered={delivered}
            read={read}
            isLoading={isLoading}
            isCompact={false}
            isDark={isDark}
          />
        </div>
        {/* Mobile: compact horizontal (no icons, smaller text) */}
        <div className="sm:hidden">
          <DeliveryFunnel
            sent={sent}
            delivered={delivered}
            read={read}
            isLoading={isLoading}
            isCompact={true}
            isDark={isDark}
          />
        </div>

        {/* Insight (if any) */}
        {insight && (
          <FunnelInsight insight={insight} isDark={isDark} />
        )}

        {/* Divider - Cosmic styled */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}`} />
          </div>
          <div className="relative flex justify-center">
            <span className={`${isDark ? 'bg-space-dust' : 'bg-white'} px-3 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
              Resultados
            </span>
          </div>
        </div>

        {/* SECONDARY: Outcomes Panel */}
        <div>
          <p className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3 flex items-center justify-center gap-1`}>
            <Info className="w-3 h-3" />
            Métricas de engajamento e conversão (base: mensagens lidas)
          </p>
          <OutcomesPanel
            engaged={engaged}
            returned={returned}
            revenue={totalRevenue}
            basePopulation={read}
            avgDaysToReturn={avgDaysToReturn}
            avgRevenuePerReturn={avgRevenuePerReturn}
            isDark={isDark}
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default CampaignFunnel;
