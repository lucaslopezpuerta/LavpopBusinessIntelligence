// CampaignROISection.jsx v2.0
// Campaign ROI analysis section for Intelligence tab
// Design System v3.1 compliant - Refactored with unified components
//
// CHANGELOG:
// v2.0 (2025-11-30): Major refactor
//   - Uses unified KPICard component
//   - Uses semantic colors from colorMapping
//   - InsightBox moved to top for visibility
//   - Fixed accessibility (minimum 12px font)
//   - Added summary metrics display
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React from 'react';
import { Target, Award, AlertTriangle, TrendingUp, Percent } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import ProgressBar from '../ui/ProgressBar';
import { getCampaignStatusColor } from '../../utils/colorMapping';

// Campaign Card with improved styling
const CampaignCard = ({ campaign, formatCurrency, formatPercent }) => {
  const statusColors = getCampaignStatusColor(campaign.status);

  const progressGradients = {
    excellent: 'emerald',
    good: 'blue',
    fair: 'amber',
    poor: 'red'
  };

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {campaign.code}
            </h3>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${statusColors.badge} ${statusColors.text}`}>
              {statusColors.label}
            </span>
            {campaign.isActive && (
              <span className="px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded">
                ATIVA
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Desconto: <span className="font-semibold">{campaign.discountPercent}%</span>
            <span className="hidden sm:inline">
              {' | '}
              {campaign.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              {' - '}
              {campaign.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </p>
          {/* Mobile dates */}
          <p className="sm:hidden text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            {campaign.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            {' - '}
            {campaign.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Resgates</p>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {campaign.redemptions}/{campaign.totalCyclesAvailable}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Conversao</p>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {formatPercent(campaign.redemptionRate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Receita</p>
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(campaign.totalRevenue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Desconto</p>
          <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
            -{formatCurrency(campaign.totalDiscount)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">ROI Incr.</p>
          <p className={`text-base sm:text-lg font-bold ${
            campaign.roi > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {campaign.roi > 0 ? '+' : ''}{formatPercent(campaign.roi)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <ProgressBar
          value={campaign.redemptionRate}
          max={100}
          color={progressGradients[campaign.status]}
          size="sm"
          ariaLabel={`Taxa de conversao: ${campaign.redemptionRate.toFixed(1)}%`}
        />
      </div>

      {/* Recommendation */}
      <div className={`p-3 rounded-lg ${statusColors.bg}`}>
        <p className={`text-sm font-medium ${statusColors.text}`}>
          <span className="font-bold">Recomendacao:</span> {campaign.recommendation}
        </p>
      </div>
    </div>
  );
};

const CampaignROISection = ({ campaignROI, formatCurrency, formatPercent }) => {
  if (!campaignROI) return null;

  const hasCampaigns = campaignROI.campaigns && campaignROI.campaigns.length > 0;
  const summary = campaignROI.summary || {};

  // Determine overall insight type
  const getOverallInsightType = () => {
    if (!hasCampaigns) return null;
    const excellentCount = campaignROI.campaigns.filter(c => c.status === 'excellent').length;
    const poorCount = campaignROI.campaigns.filter(c => c.status === 'poor').length;

    if (excellentCount > poorCount) return 'success';
    if (poorCount > excellentCount) return 'warning';
    return 'info';
  };

  const insightType = getOverallInsightType();

  return (
    <SectionCard
      title="Efetividade de Campanhas"
      subtitle={`ROI incremental e desempenho de cupons • Ativas + últimos 6 meses (${campaignROI.totalCampaigns} de ${campaignROI.totalCampaignsInSystem || campaignROI.totalCampaigns})`}
      icon={Target}
      id="campaigns-section"
    >
      {hasCampaigns ? (
        <div className="space-y-5 sm:space-y-6">
          {/* Actionable Insight First */}
          {insightType === 'success' && (
            <InsightBox
              type="success"
              title="Campanhas com Bom Desempenho"
              message="A maioria das suas campanhas esta performando bem. Continue monitorando e considere aumentar o limite de ciclos nas melhores."
            />
          )}
          {insightType === 'warning' && (
            <InsightBox
              type="warning"
              title="Campanhas Precisam de Atencao"
              message="Algumas campanhas nao estao performando bem. Considere cancelar as com baixa conversao e realocar o budget para as melhores."
            />
          )}
          {insightType === 'info' && (
            <InsightBox
              type="info"
              title="Otimizacao de Campanhas"
              message="Para maximizar ROI: cancele cupons com <10% de conversao, renove cupons com >50% de conversao, e use WhatsApp para divulgar em dias de baixa movimento."
            />
          )}

          {/* Summary KPIs */}
          <KPIGrid columns={4}>
            <KPICard
              label="Total Campanhas"
              value={campaignROI.totalCampaigns}
              subtitle={`${campaignROI.activeCampaigns} ativas`}
              color="blue"
              variant="gradient"
              icon={Target}
            />
            {campaignROI.bestPerforming && (
              <KPICard
                label="Melhor Campanha"
                value={campaignROI.bestPerforming.code}
                subtitle={`ROI: ${formatPercent(campaignROI.bestPerforming.roi)}`}
                color="positive"
                variant="gradient"
                icon={Award}
              />
            )}
            {campaignROI.worstPerforming && (
              <KPICard
                label="Pior Campanha"
                value={campaignROI.worstPerforming.code}
                subtitle={`ROI: ${formatPercent(campaignROI.worstPerforming.roi)}`}
                color="negative"
                variant="gradient"
                icon={AlertTriangle}
              />
            )}
            <KPICard
              label="ROI Incremental"
              value={formatPercent(summary.overallROI || 0)}
              subtitle={`${summary.totalRedemptions || 0} resgates`}
              color={summary.overallROI > 0 ? 'positive' : 'negative'}
              variant="gradient"
              icon={TrendingUp}
            />
          </KPIGrid>

          {/* Campaign Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Detalhes por Campanha
            </h4>
            {campaignROI.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.code}
                campaign={campaign}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400 dark:text-slate-500" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma Campanha Encontrada
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 max-w-md mx-auto">
            Certifique-se de que o arquivo campaigns.csv esta disponivel e contem dados de cupons.
          </p>
        </div>
      )}
    </SectionCard>
  );
};

export default CampaignROISection;
