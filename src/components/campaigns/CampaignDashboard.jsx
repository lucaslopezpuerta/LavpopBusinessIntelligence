// CampaignDashboard.jsx v2.3
// Unified Campaign Analytics Dashboard
// Design System v4.0 compliant
//
// CHANGELOG:
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
  Users,
  DollarSign,
  Percent,
  Target,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  Lightbulb,
  Calendar
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

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {/* Always visible */}
            <th className="text-left py-3 px-3 sm:px-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Campanha
            </th>
            {/* Desktop only: Oferta (merged Desconto + Cupom) */}
            <th className="hidden lg:table-cell text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Oferta
            </th>
            {/* Always visible */}
            <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Enviadas
            </th>
            {/* Tablet+ */}
            <th className="hidden sm:table-cell text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Entregues
            </th>
            {/* Always visible */}
            <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Lidas
            </th>
            {/* Desktop only: Falhou */}
            <th className="hidden lg:table-cell text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Falhou
            </th>
            {/* Always visible */}
            <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Retorno
            </th>
            {/* Tablet+ */}
            <th className="hidden sm:table-cell text-right py-3 px-3 sm:px-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              Receita
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign, idx) => {
            const totalDelivered = getTotalDelivered(campaign);
            const hasFailed = (campaign.failed || 0) > 0;

            return (
              <tr
                key={campaign.id || idx}
                className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Campanha - Always visible */}
                <td className="py-3 px-3 sm:px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      campaign.status === 'active' ? 'bg-green-500' :
                      campaign.status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {campaign.audience}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Oferta (Desconto + Cupom) - Desktop only */}
                <td className="hidden lg:table-cell py-3 px-2 text-center">
                  {campaign.discount_percent ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {campaign.discount_percent}%
                      </span>
                      {campaign.coupon_code && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {campaign.coupon_code}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Enviadas - Always visible */}
                <td className="py-3 px-2 text-center text-slate-700 dark:text-slate-300">
                  {campaign.sends || 0}
                </td>

                {/* Entregues (Total = delivered + read) - Tablet+ */}
                <td className="hidden sm:table-cell py-3 px-2 text-center">
                  {totalDelivered !== null ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {totalDelivered}
                    </span>
                  ) : (
                    <span className="text-slate-400" title="Aguardando webhook">-</span>
                  )}
                </td>

                {/* Lidas - Always visible */}
                <td className="py-3 px-2 text-center">
                  {campaign.has_delivery_data ? (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {campaign.read || 0}
                    </span>
                  ) : (
                    <span className="text-slate-400" title="Aguardando webhook">-</span>
                  )}
                </td>

                {/* Falhou - Desktop only */}
                <td className="hidden lg:table-cell py-3 px-2 text-center">
                  {campaign.has_delivery_data ? (
                    hasFailed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        <AlertCircle className="w-3 h-3" />
                        {campaign.failed}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Retorno - Always visible */}
                <td className="py-3 px-2 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    (campaign.return_rate || 0) >= 25
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : (campaign.return_rate || 0) >= 15
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {formatPercent(campaign.return_rate || 0)}
                  </span>
                </td>

                {/* Receita - Tablet+ */}
                <td className="hidden sm:table-cell py-3 px-3 sm:px-4 text-right font-medium text-slate-900 dark:text-white">
                  {formatCurrency(campaign.total_revenue_recovered || 0)}
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

  // Loading state
  if (isLoading && !metrics) {
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
            { value: 90, label: '90d', fullLabel: '90 dias' }
          ].map(({ value, label, fullLabel }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${timeRange === value
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

      {/* A/B Testing Section */}
      <DiscountComparisonCard
        discountData={metrics?.discountComparison || []}
        serviceData={metrics?.serviceComparison || []}
        bestDiscount={metrics?.bestDiscount}
        bestService={metrics?.bestService}
        isLoading={isLoading}
      />

      {/* Campaign Funnel */}
      <CampaignFunnel
        funnel={metrics?.funnel || {}}
        avgDaysToReturn={summary.avgDaysToReturn}
        avgRevenuePerReturn={summary.totalReturned > 0 ? (summary.totalRevenue / summary.totalReturned) : 0}
        isLoading={isLoading}
      />

      {/* Recent Campaigns Table */}
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
    </div>
  );
};

export default CampaignDashboard;
