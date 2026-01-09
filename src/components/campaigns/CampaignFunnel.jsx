// CampaignFunnel.jsx v3.2
// Campaign Delivery Funnel + Outcomes Panel
// Design System v4.0 compliant
// ANALYTICAL INTEGRITY ENFORCED
//
// CHANGELOG:
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
  isBiggestLoss = false
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20',
      border: 'border-blue-500'
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20',
      border: 'border-emerald-500'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      icon: 'text-cyan-600 dark:text-cyan-400',
      ring: 'ring-cyan-500/20',
      border: 'border-cyan-500'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-2">
      {/* Stage Card - Compact on mobile, full on desktop */}
      <div className={`
        relative flex flex-col items-center justify-center rounded-xl
        ${colors.bg} ring-1 ${colors.ring}
        ${isCompact ? 'p-2 min-w-[60px]' : 'p-3 sm:p-4 min-w-[90px] sm:min-w-[110px]'}
        ${isBiggestLoss ? 'ring-2 ring-amber-500' : ''}
      `}>
        {/* Icon - hidden on compact mobile */}
        {!isCompact && (
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.bg} flex items-center justify-center mb-1.5`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.icon}`} />
          </div>
        )}
        <p className={`font-bold text-slate-900 dark:text-white ${isCompact ? 'text-sm' : 'text-lg sm:text-xl'}`}>
          {value.toLocaleString('pt-BR')}
        </p>
        <p className={`text-slate-600 dark:text-slate-400 text-center font-medium ${isCompact ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>
          {label}
        </p>
      </div>

      {/* Arrow with conversion rate and drop-off - visible on all sizes */}
      {!isLast && (
        <div className="flex flex-col items-center gap-0.5 px-0.5 sm:px-2">
          <ArrowRight className={`text-slate-300 dark:text-slate-600 ${isCompact ? 'w-3 h-3' : 'w-5 h-5'}`} />
          {conversionRate !== undefined && (
            <span className={`font-bold ${isCompact ? 'text-[9px]' : 'text-xs sm:text-sm'} ${
              conversionRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
              conversionRate >= 70 ? 'text-blue-600 dark:text-blue-400' :
              conversionRate >= 50 ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {conversionRate.toFixed(0)}%
            </span>
          )}
          {dropOff > 0 && (
            <span className={`${isCompact ? 'text-[8px]' : 'text-[11px] sm:text-xs'} ${
              isBiggestLoss ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400'
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
  color
}) => {
  const colorClasses = {
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-700 dark:text-purple-300'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      value: 'text-amber-700 dark:text-amber-300'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      value: 'text-emerald-700 dark:text-emerald-300'
    }
  };

  const colors = colorClasses[color] || colorClasses.purple;

  return (
    <div className={`flex flex-col items-center p-3 sm:p-4 rounded-xl ${colors.bg} min-w-[100px]`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-4 h-4 ${colors.icon}`} />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${colors.value}`}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
      {rate !== undefined && rate !== null && denominator > 0 && (
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-center">
          <span className="font-semibold">{rate.toFixed(1)}%</span> de {denominator.toLocaleString('pt-BR')} {denominatorLabel}
        </p>
      )}
      {subtitle && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
};

// ==================== FUNNEL INSIGHT COMPONENT ====================

const FunnelInsight = ({ insight }) => {
  if (!insight) return null;

  const typeStyles = {
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-700 dark:text-amber-300'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-300'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-700 dark:text-blue-300'
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
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
              {insight.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== DELIVERY FUNNEL (PRIMARY) ====================

const DeliveryFunnel = ({ sent, delivered, read, isLoading, isCompact = false }) => {
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
  avgRevenuePerReturn
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
      />
      <OutcomeCard
        icon={DollarSign}
        label="Receita"
        value={formatCurrency(revenue)}
        subtitle={avgRevenuePerReturn > 0 ? `${formatCurrency(avgRevenuePerReturn)}/retorno` : null}
        color="emerald"
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
              <div key={i} className="w-24 h-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-28 h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Send className="w-8 h-8 text-blue-500" />
          </div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nenhuma campanha enviada
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
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
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Dados inconsistentes detectados
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Os valores não seguem a sequência esperada (enviadas ≥ entregues ≥ lidas).
                  Isso pode indicar dados parciais ou erro de sincronização.
                </p>
              </div>
            </div>
          </div>

          {/* Show raw numbers anyway */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white">{sent.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">Enviadas</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white">{delivered.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">Entregues</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white">{read.toLocaleString('pt-BR')}</p>
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
          />
        </div>

        {/* Insight (if any) */}
        {insight && (
          <FunnelInsight insight={insight} />
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Resultados
            </span>
          </div>
        </div>

        {/* SECONDARY: Outcomes Panel */}
        <div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mb-3 flex items-center justify-center gap-1">
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
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default CampaignFunnel;
