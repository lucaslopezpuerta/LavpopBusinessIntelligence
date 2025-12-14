// CampaignFunnel.jsx v2.0
// Campaign conversion funnel visualization
// Design System v3.1 compliant
//
// CHANGELOG:
// v2.0 (2025-12-14): Added 5-stage funnel with real engagement tracking
//   - New stage: "Lidas" (Read) between Entregues and Engajaram
//   - "Engajaram" now shows real button clicks (Quero usar!, etc.) not just reads
//   - Auto-replies from businesses are NOT counted as engagement
//   - Updated funnel: Enviadas → Entregues → Lidas → Engajaram → Retornaram
//   - Some customers return from "Lidas" without clicking (this is normal)
// v1.0 (2025-12-10): Initial implementation
//   - Visual funnel: Enviadas -> Entregues -> Engajaram -> Retornaram
//   - Conversion rates between stages
//   - Summary metrics: avg days to return, avg revenue per return
//   - Responsive design (vertical on mobile, horizontal on desktop)
//   - Dark mode support

import React from 'react';
import {
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  UserCheck,
  ArrowRight,
  ArrowDown,
  Clock,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';

// ==================== FUNNEL STAGE ====================

const FunnelStage = ({
  icon: Icon,
  label,
  value,
  percentage,
  conversionRate,
  color,
  isLast = false,
  isMobile = false
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20'
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/20'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      icon: 'text-cyan-600 dark:text-cyan-400',
      ring: 'ring-cyan-500/20'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
      ring: 'ring-purple-500/20'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500/20'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`flex ${isMobile ? 'flex-col items-center' : 'flex-row items-center'} gap-3`}>
      {/* Stage Card */}
      <div className={`
        flex flex-col items-center p-4 rounded-xl
        ${colors.bg} ring-1 ${colors.ring}
        min-w-[100px] sm:min-w-[120px]
      `}>
        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center mb-2`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {value.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
          {label}
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 mt-1">
          {percentage}%
        </p>
      </div>

      {/* Arrow with conversion rate */}
      {!isLast && (
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-1`}>
          {isMobile ? (
            <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          ) : (
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          )}
          {conversionRate !== undefined && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {conversionRate}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== SUMMARY STAT ====================

const SummaryStat = ({ icon: Icon, label, value, color = 'slate' }) => {
  const colorClasses = {
    slate: 'text-slate-500 dark:text-slate-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400'
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
      <span className="text-slate-600 dark:text-slate-400">{label}:</span>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CampaignFunnel = ({
  funnel = {},
  avgDaysToReturn,
  avgRevenuePerReturn,
  isLoading = false
}) => {
  const {
    sent = 0,
    delivered = 0,
    read = 0,       // Messages opened (read receipts)
    engaged = 0,    // Positive button clicks
    returned = 0
  } = funnel;

  // Calculate percentages (relative to sent)
  const sentPct = 100;
  const deliveredPct = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
  const readPct = sent > 0 ? Math.round((read / sent) * 100) : 0;
  const engagedPct = sent > 0 ? Math.round((engaged / sent) * 100) : 0;
  const returnedPct = sent > 0 ? Math.round((returned / sent) * 100) : 0;

  // Calculate conversion rates between stages
  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
  const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
  const engagementRate = read > 0 ? Math.round((engaged / read) * 100) : 0;
  const conversionRate = engaged > 0 ? Math.round((returned / engaged) * 100) : 0;

  // Format helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Loading state
  if (isLoading) {
    return (
      <SectionCard
        title="Funil de Campanhas"
        subtitle="Jornada do cliente: envio ate retorno"
        icon={TrendingUp}
        color="blue"
      >
        <div className="animate-pulse">
          <div className="flex justify-center gap-4 py-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-24 h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
        title="Funil de Campanhas"
        subtitle="Jornada do cliente: envio ate retorno"
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
            Quando voce enviar campanhas, vera aqui o funil completo mostrando
            quantos clientes receberam, engajaram e retornaram.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Funil de Campanhas"
      subtitle="Jornada do cliente: envio ate retorno"
      icon={TrendingUp}
      color="blue"
    >
      {/* Desktop Funnel (horizontal) */}
      <div className="hidden sm:flex justify-center items-center gap-2 py-4 overflow-x-auto">
        <FunnelStage
          icon={Send}
          label="Enviadas"
          value={sent}
          percentage={sentPct}
          conversionRate={deliveryRate}
          color="blue"
        />
        <FunnelStage
          icon={CheckCircle2}
          label="Entregues"
          value={delivered}
          percentage={deliveredPct}
          conversionRate={readRate}
          color="emerald"
        />
        <FunnelStage
          icon={Eye}
          label="Lidas"
          value={read}
          percentage={readPct}
          conversionRate={engagementRate}
          color="cyan"
        />
        <FunnelStage
          icon={MousePointerClick}
          label="Engajaram"
          value={engaged}
          percentage={engagedPct}
          conversionRate={conversionRate}
          color="purple"
        />
        <FunnelStage
          icon={UserCheck}
          label="Retornaram"
          value={returned}
          percentage={returnedPct}
          color="amber"
          isLast
        />
      </div>

      {/* Mobile Funnel (vertical) */}
      <div className="sm:hidden flex flex-col items-center gap-2 py-4">
        <FunnelStage
          icon={Send}
          label="Enviadas"
          value={sent}
          percentage={sentPct}
          conversionRate={deliveryRate}
          color="blue"
          isMobile
        />
        <FunnelStage
          icon={CheckCircle2}
          label="Entregues"
          value={delivered}
          percentage={deliveredPct}
          conversionRate={readRate}
          color="emerald"
          isMobile
        />
        <FunnelStage
          icon={Eye}
          label="Lidas"
          value={read}
          percentage={readPct}
          conversionRate={engagementRate}
          color="cyan"
          isMobile
        />
        <FunnelStage
          icon={MousePointerClick}
          label="Engajaram"
          value={engaged}
          percentage={engagedPct}
          conversionRate={conversionRate}
          color="purple"
          isMobile
        />
        <FunnelStage
          icon={UserCheck}
          label="Retornaram"
          value={returned}
          percentage={returnedPct}
          color="amber"
          isLast
          isMobile
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {avgDaysToReturn > 0 && (
            <SummaryStat
              icon={Clock}
              label="Tempo medio"
              value={`${avgDaysToReturn.toFixed(1)} dias`}
              color="blue"
            />
          )}
          {avgRevenuePerReturn > 0 && (
            <SummaryStat
              icon={DollarSign}
              label="Receita media"
              value={`${formatCurrency(avgRevenuePerReturn)}/retorno`}
              color="emerald"
            />
          )}
          {returned > 0 && sent > 0 && (
            <SummaryStat
              icon={TrendingUp}
              label="Conversao total"
              value={`${((returned / sent) * 100).toFixed(1)}%`}
              color="slate"
            />
          )}
        </div>
      </div>

      {/* Insights based on funnel data */}
      {sent > 0 && (
        <div className="mt-4 space-y-2">
          {deliveryRate < 90 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Taxa de entrega baixa ({deliveryRate}%):</strong> Verifique se os numeros estao corretos e se nao ha muitos bloqueados.
              </p>
            </div>
          )}
          {engagementRate < 10 && delivered > 10 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Engajamento baixo ({engagementRate}%):</strong> Considere testar diferentes templates ou horarios de envio.
              </p>
            </div>
          )}
          {conversionRate > 30 && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                <strong>Excelente conversao ({conversionRate}%)!</strong> Os clientes que engajam estao retornando bem.
              </p>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
};

export default CampaignFunnel;
