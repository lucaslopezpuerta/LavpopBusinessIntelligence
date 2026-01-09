// CampaignDashboard.jsx v3.2
// Unified Campaign Analytics Dashboard
// Design System v4.0 compliant
//
// CHANGELOG:
// v3.2 (2026-01-08): UI/UX refinements based on visual review
//   - Widened CAMPANHA column on XL screens (max-w-[320px])
//   - Added alternating row backgrounds for easier scanning
//   - Improved metadata contrast (text-slate-500 instead of text-slate-400)
//   - Tighter spacing in ENTREGA cell
//   - Removed redundant "ent / lid" label on desktop (tooltip instead)
//   - Better visual hierarchy in RESULTADO column
//   - Center-aligned RESULTADO header and cell for consistency
// v3.1 (2026-01-08): UI polish and tracking health indicator
//   - Added tracking health warning indicator (⚠️) in CAMPANHA cell
//   - Improved font sizes: text-sm → text-base for key metrics
//   - Better column width distribution for desktop (35%/10%/12%/13%/15%/15%)
//   - Increased icon sizes in type indicator (w-6 h-6)
//   - Wider campaign name truncation on desktop (max-w-[240px])
//   - Improved spacing and padding throughout
//   - Better mobile responsiveness with scaled font sizes
// v3.0 (2026-01-08): Phase 10 - Funnel-based table redesign
//   - Reduced table from 13 columns to 6 consolidated columns
//   - Follows marketing funnel: SEND → DELIVER → ENGAGE → CONVERT → REVENUE
//   - CAMPANHA: Name + Type icon + Status badge inline + audience + date
//   - OFERTA: Discount + coupon code (lg+ only)
//   - ENVIO: Sends count + failed warning badge
//   - ENTREGA: Delivered/Read compact format (sm+)
//   - CONVERSÃO: Returned count + Rate badge with color (key metric)
//   - RESULTADO: Revenue + avg days + date (sm+)
//   - Responsive: Mobile (3) → Tablet (5) → Desktop (6)
//   - Removed redundant columns: Status (merged), Rastreados (internal),
//     Retornados (merged), Lidas (merged), Falhou (merged), Retorno (merged),
//     Período (merged), Tempo (merged)
// v2.6 (2026-01-08): Phase 6 dashboard enhancements
//   - Added Status column showing campaign status badge (active/completed/draft/scheduled)
//   - Added Retornados column showing absolute returned count (not just percentage)
//   - Added Período column showing campaign tracking window (created → validity days)
//   - Added Tempo column showing avg_days_to_return with color coding
//   - Responsive column visibility: Mobile (4) → Tablet (7) → Desktop (10) → XL (13)
// v2.5 (2026-01-08): Added dedicated Rastreados column & UX improvements
//   - Added "Rastreados" column showing contacts_tracked with status indicator
//   - Visual health badges: ✓ green (working), ⚠️ amber (issue), ⏳ gray (pending)
//   - Improved column layout and responsive visibility
//   - Removed inline warning icon from campaign name (now in dedicated column)
// v2.4 (2026-01-08): Campaign type differentiation & tracking health
//   - Added campaign type indicator (Auto vs Manual) to recent campaigns table
//   - Added tracking status column showing health indicators
//   - Visual differentiation helps identify manual vs automated campaigns
// v2.3.1 (2025-12-23): Fix empty render when fetch fails
//   - Changed loading guard from (isLoading && !metrics) to (isLoading || !metrics)
//   - Prevents empty content when Supabase query fails silently
// v2.3 (2025-12-14): Mobile-responsive table, UX improvements
//   - Removed min-w-[900px] - table now responsive without horizontal scroll
//   - Columns hidden progressively: Mobile (4) → Tablet (6) → Desktop (8)
//   - Merged Desconto + Cupom into single "Oferta" column (desktop only)
//   - Fixed "Entregues" to show TOTAL delivered (delivered + read)
//   - Added "Falhou" column with red highlighting (desktop only)
//   - Fixed bug: total_revenue → total_revenue_recovered
//   - Fixed border colors per Design System (slate-200/700)
//   - Added thead background per Design System
// v2.2 (2025-12-14): Added coupon code column to Recent Campaigns table
//   - Shows coupon_code from campaign_performance view
//   - Styled as monospace badge for readability
// v2.1 (2025-12-12): Real delivery metrics per campaign
//   - RecentCampaignsTable now shows: Entregues, Lidas, Taxa Entrega
//   - Data from webhook_events via campaign_delivery_metrics view
//   - Delivery columns show real Twilio webhook data, not estimates
// v2.0 (2025-12-11): Design System v4.0 update
//   - KPIs now use vibrant gradient cards with white text
//   - Replaced large InsightBox with discrete inline hints
//   - Improved visual consistency with other campaign components
// v1.0 (2025-12-10): Initial implementation
//   - Hero KPIs: Return Rate, Revenue Recovered, At-Risk, Best Discount
//   - A/B Testing insights with discount/service comparison
//   - Campaign funnel visualization
//   - Recent campaigns table with performance metrics
//   - Dynamic insights based on data patterns
//   - All data from Supabase (no CSV dependency)

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Target,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  Calendar,
  Bot,
  User,
  CheckCircle2
} from 'lucide-react';

// UI Components
import KPICard, { KPIGrid } from '../ui/KPICard';
import SectionCard from '../ui/SectionCard';
import ProgressBar from '../ui/ProgressBar';

// Services
import { getDashboardMetrics } from '../../utils/campaignService';

// Sub-components
import DiscountComparisonCard from './DiscountComparisonCard';
import CampaignFunnel from './CampaignFunnel';

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
  return `${(value || 0).toFixed(1)}%`;
};

// v2.6: Status badge helpers
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
    case 'completed': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    case 'draft': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    case 'scheduled': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
  }
};

const getStatusLabel = (status) => {
  const labels = { active: 'Ativa', completed: 'Concluída', draft: 'Rascunho', scheduled: 'Agendada' };
  return labels[status] || status || '-';
};

// ==================== RECENT CAMPAIGNS TABLE ====================

const RecentCampaignsTable = ({ campaigns, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Target className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nenhuma campanha enviada ainda
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Crie sua primeira campanha clicando em "Nova Campanha"
        </p>
      </div>
    );
  }

  // Helper: Calculate total delivered (delivered + read)
  const getTotalDelivered = (campaign) => {
    if (!campaign.has_delivery_data) return null;
    return (campaign.delivered || 0) + (campaign.read || 0);
  };

  // v2.4: Helper to detect automated campaigns
  const isAutomated = (campaign) => {
    const name = campaign.name || '';
    return name.startsWith('Auto:') || name.toLowerCase().includes('automação');
  };

  // v3.0: Tracking issue detection (shows as subtle warning in CAMPANHA cell)
  const hasTrackingIssue = (campaign) => {
    return (campaign.sends || 0) > 0 && (campaign.contacts_tracked || 0) === 0;
  };

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full">
        {/* v3.0: Funnel-based 6-column layout with improved sizing */}
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {/* CAMPANHA: Name + Type + Status - Always visible, wider on desktop */}
            <th className="text-left py-3 px-3 sm:px-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-[40%] lg:w-[35%]">
              Campanha
            </th>
            {/* OFERTA: Discount + Coupon - Desktop only (lg+) */}
            <th className="hidden lg:table-cell text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-[10%]">
              Oferta
            </th>
            {/* ENVIO: Sends + Failed warning - Always visible */}
            <th className="text-center py-3 px-2 sm:px-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-[12%]">
              Envio
            </th>
            {/* ENTREGA: Delivered/Read - Tablet+ (sm+) */}
            <th className="hidden sm:table-cell text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-[13%]">
              Entrega
            </th>
            {/* CONVERSÃO: Returned + Rate % - Always visible (KEY METRIC) */}
            <th className="text-center py-3 px-2 sm:px-3 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-[15%]">
              Conversão
            </th>
            {/* RESULTADO: Revenue + metadata - Tablet+ (sm+) */}
            <th className="hidden sm:table-cell text-center py-3 px-3 sm:px-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-[15%]">
              Resultado
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign, idx) => {
            const totalDelivered = getTotalDelivered(campaign);
            const hasFailed = (campaign.failed || 0) > 0;
            const sends = campaign.sends || 0;
            const returned = campaign.contacts_returned || 0;
            const returnRate = campaign.return_rate || 0;
            const trackingIssue = hasTrackingIssue(campaign);

            return (
              <tr
                key={campaign.id || idx}
                className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 even:bg-slate-50/50 dark:even:bg-slate-800/30 transition-colors"
              >
                {/* ========== CAMPANHA: Name + Type + Status + metadata ========== */}
                <td className="py-3 px-3 sm:px-4">
                  <div className="flex items-start gap-2.5">
                    {/* Campaign type indicator */}
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      isAutomated(campaign)
                        ? 'bg-purple-100 dark:bg-purple-900/40'
                        : 'bg-blue-100 dark:bg-blue-900/40'
                    }`} title={isAutomated(campaign) ? 'Automação' : 'Manual'}>
                      {isAutomated(campaign)
                        ? <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        : <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Name + inline status badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[240px] xl:max-w-[320px]">
                          {campaign.name}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusLabel(campaign.status)}
                        </span>
                        {/* Tracking issue warning indicator */}
                        {trackingIssue && (
                          <span
                            className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                            title="Rastreamento incompleto - mensagens enviadas mas não rastreadas"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      {/* Audience + date subtext */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                        {campaign.audience}
                        {campaign.created_at && (
                          <span className="ml-1.5 text-slate-400 dark:text-slate-500">
                            • {new Date(campaign.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>

                {/* ========== OFERTA: Discount + Coupon - Desktop only (lg+) ========== */}
                <td className="hidden lg:table-cell py-3 px-3 text-center">
                  {campaign.discount_percent ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {campaign.discount_percent}%
                      </span>
                      {campaign.coupon_code && (
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">
                          {campaign.coupon_code}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>

                {/* ========== ENVIO: Sends + Failed warning - Always visible ========== */}
                <td className="py-3 px-2 sm:px-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                      {sends}
                    </span>
                    {hasFailed && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        title={`${campaign.failed} mensagens falharam`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {campaign.failed}
                      </span>
                    )}
                  </div>
                </td>

                {/* ========== ENTREGA: Delivered/Read - Tablet+ (sm+) ========== */}
                <td className="hidden sm:table-cell py-3 px-2 text-center">
                  {campaign.has_delivery_data && totalDelivered !== null ? (
                    <div className="flex flex-col items-center" title="Entregues / Lidas">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {totalDelivered}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 text-xs">/</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {campaign.read || 0}
                        </span>
                      </div>
                      {/* Show label only on tablet, hide on desktop for cleaner look */}
                      <span className="text-[10px] text-slate-400 sm:block lg:hidden">
                        ent / lid
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm" title="Aguardando webhook">-</span>
                  )}
                </td>

                {/* ========== CONVERSÃO: Returned + Rate % - Always visible (KEY) ========== */}
                <td className="py-3 px-2 sm:px-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {/* Returned count prominent */}
                    <span className={`text-sm sm:text-base font-bold ${
                      returned > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}>
                      {returned}
                    </span>
                    {/* Return rate badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      returnRate >= 25
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : returnRate >= 15
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : returnRate > 0
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {formatPercent(returnRate)}
                    </span>
                  </div>
                </td>

                {/* ========== RESULTADO: Revenue + Days + Date - Tablet+ (sm+) ========== */}
                <td className="hidden sm:table-cell py-3 px-3 sm:px-4 text-center">
                  <div className="flex flex-col items-center">
                    {/* Revenue prominent */}
                    <span className={`text-sm sm:text-base font-bold ${
                      (campaign.total_revenue_recovered || 0) > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {formatCurrency(campaign.total_revenue_recovered || 0)}
                    </span>
                    {/* Metadata: avg days to return */}
                    {campaign.avg_days_to_return && (
                      <span className={`text-xs mt-0.5 ${
                        campaign.avg_days_to_return <= 3
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : campaign.avg_days_to_return <= 7
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`} title="Média de dias até retorno">
                        {campaign.avg_days_to_return.toFixed(0)}d retorno
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CampaignDashboard = ({ audienceSegments, className = '' }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboardMetrics({ days: timeRange });
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
        setError('Nao foi possivel carregar as metricas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  // Generate dynamic insights based on data
  const insights = useMemo(() => {
    if (!metrics) return [];

    const insights = [];

    // Best discount insight
    if (metrics.bestDiscount && metrics.discountComparison?.length > 1) {
      const best = metrics.bestDiscount;
      const others = metrics.discountComparison.filter(d => d.discount !== best.discount);
      const avgOthers = others.reduce((sum, d) => sum + d.returnRate, 0) / (others.length || 1);
      const improvement = ((best.returnRate - avgOthers) / avgOthers * 100).toFixed(0);

      if (improvement > 10) {
        insights.push({
          type: 'action',
          title: `Desconto de ${best.discount}% tem melhor resultado`,
          message: `Com ${formatPercent(best.returnRate)} de retorno, supera os demais em ${improvement}%. Considere padronizar campanhas win-back neste desconto.`
        });
      }
    }

    // Service type insight
    if (metrics.serviceComparison?.length > 1) {
      const best = metrics.serviceComparison.reduce((a, b) =>
        (b.returnRate || 0) > (a.returnRate || 0) ? b : a
      , metrics.serviceComparison[0]);

      if (best && best.returnRate > 20) {
        const serviceLabel = {
          'dry': 'Secagem',
          'wash': 'Lavagem',
          'all': 'Todos os servicos'
        }[best.service] || best.service;

        insights.push({
          type: 'success',
          title: `Campanhas de ${serviceLabel} performam melhor`,
          message: `Taxa de retorno de ${formatPercent(best.returnRate)}. Experimente mais campanhas focadas neste servico.`
        });
      }
    }

    // At-risk customers insight
    const atRiskCount = audienceSegments?.atRisk?.length || 0;
    if (atRiskCount > 10 && (!metrics.recentCampaigns || metrics.recentCampaigns.length === 0)) {
      insights.push({
        type: 'warning',
        title: `${atRiskCount} clientes em risco sem contato`,
        message: 'Voce tem clientes inativos ha mais de 30 dias. Uma campanha de win-back pode recuperar ate 25% deles.'
      });
    }

    // Low return rate warning
    if (metrics.summary?.returnRate < 10 && metrics.summary?.totalContacts > 20) {
      insights.push({
        type: 'warning',
        title: 'Taxa de retorno abaixo do esperado',
        message: 'Considere testar descontos maiores ou mensagens mais personalizadas para aumentar a conversao.'
      });
    }

    return insights;
  }, [metrics, audienceSegments]);

  // Summary metrics for KPIs
  const summary = metrics?.summary || {};

  // Loading state - show skeleton if loading OR if metrics failed to load
  // Using || ensures we don't render empty content when fetch fails silently
  if (isLoading || !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button
            onClick={() => setTimeRange(timeRange)}
            className="ml-auto text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Range Selector - Button Group Style */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">Período:</span>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
          {[
            { value: 7, label: '7d', fullLabel: '7 dias' },
            { value: 30, label: '30d', fullLabel: '30 dias' },
            { value: 90, label: '90d', fullLabel: '90 dias' },
            { value: null, label: '∞', fullLabel: 'Todos' }
          ].map(({ value, label, fullLabel }) => (
            <button
              key={label}
              onClick={() => setTimeRange(value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${(timeRange === value || (timeRange === null && value === null))
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }
              `}
            >
              <span className="sm:hidden">{label}</span>
              <span className="hidden sm:inline">{fullLabel}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setTimeRange(timeRange)}
          className={`
            p-2 rounded-xl transition-all duration-200
            ${isLoading
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }
          `}
          title="Atualizar dados"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hero KPIs */}
      <KPIGrid columns={4}>
        <KPICard
          label="Taxa de Retorno"
          mobileLabel="Retorno"
          value={formatPercent(summary.returnRate || 0)}
          subtitle={`${summary.totalReturned || 0} de ${summary.totalContacts || 0} clientes`}
          mobileSubtitle={`${summary.totalReturned || 0} retornaram`}
          icon={TrendingUp}
          color={summary.returnRate >= 20 ? 'positive' : summary.returnRate >= 10 ? 'warning' : 'neutral'}
          variant="gradient"
        />
        <KPICard
          label="Receita Recuperada"
          mobileLabel="Receita"
          value={formatCurrency(summary.totalRevenue || 0)}
          subtitle={summary.totalReturned > 0 ? `${formatCurrency((summary.totalRevenue || 0) / summary.totalReturned)}/cliente` : 'dos retornos'}
          mobileSubtitle="recuperada"
          icon={DollarSign}
          color="revenue"
          variant="gradient"
        />
        <KPICard
          label="Clientes em Risco"
          mobileLabel="Em Risco"
          value={audienceSegments?.atRisk?.length || 0}
          subtitle="precisam de atencao"
          mobileSubtitle="inativos 30d+"
          icon={AlertTriangle}
          color="warning"
          variant="gradient"
        />
        <KPICard
          label="Desconto Ideal"
          mobileLabel="Melhor %"
          value={metrics?.bestDiscount ? `${metrics.bestDiscount.discount}%` : '-'}
          subtitle={metrics?.bestDiscount ? `${formatPercent(metrics.bestDiscount.returnRate)} retorno` : 'sem dados'}
          mobileSubtitle={metrics?.bestDiscount ? 'mais efetivo' : 'sem dados'}
          icon={Percent}
          color="purple"
          variant="gradient"
        />
      </KPIGrid>

      {/* Dynamic Insights - Discrete inline hints */}
      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {insights.slice(0, 2).map((insight, idx) => (
            <p key={idx} className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              insight.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                : insight.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
            }`}>
              <Lightbulb className="w-3 h-3" />
              {insight.title}
            </p>
          ))}
        </div>
      )}

      {/* Recent Campaigns Table - Positioned between KPIs and Funnel */}
      <SectionCard
        title="Campanhas Recentes"
        subtitle={`${metrics?.recentCampaigns?.length || 0} campanhas nos ultimos ${timeRange} dias`}
        icon={Target}
        color="emerald"
      >
        <RecentCampaignsTable
          campaigns={metrics?.recentCampaigns || []}
          isLoading={isLoading}
        />
      </SectionCard>

      {/* Campaign Funnel */}
      <CampaignFunnel
        funnel={metrics?.funnel || {}}
        avgDaysToReturn={summary.avgDaysToReturn}
        avgRevenuePerReturn={summary.totalReturned > 0 ? (summary.totalRevenue / summary.totalReturned) : 0}
        isLoading={isLoading}
      />

      {/* A/B Testing Section */}
      <DiscountComparisonCard
        discountData={metrics?.discountComparison || []}
        serviceData={metrics?.serviceComparison || []}
        bestDiscount={metrics?.bestDiscount}
        bestService={metrics?.bestService}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CampaignDashboard;
