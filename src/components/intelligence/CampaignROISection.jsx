// CampaignROISection.jsx v1.0
// Campaign ROI analysis section for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx
//   - Mobile responsive campaign cards
//   - Responsive metrics grid (2→3→5 columns)
//   - Accessibility improvements

import React from 'react';
import { Target } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';

const CampaignCard = ({ campaign, formatCurrency, formatPercent }) => {
  const statusColors = {
    excellent: 'from-green-500 to-green-600',
    good: 'from-blue-500 to-blue-600',
    fair: 'from-amber-500 to-amber-600',
    poor: 'from-red-500 to-red-600'
  };

  const statusBadges = {
    excellent: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      label: 'Excelente'
    },
    good: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      label: 'Bom'
    },
    fair: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-300',
      label: 'Razoável'
    },
    poor: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      label: 'Fraco'
    }
  };

  const badge = statusBadges[campaign.status] || statusBadges.fair;

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {campaign.code}
            </h3>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
            {campaign.isActive && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-[10px] sm:text-xs font-semibold rounded">
                ATIVA
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
            Desconto: <span className="font-semibold">{campaign.discountPercent}%</span>
            <span className="hidden sm:inline">
              {' • '}
              Período: {campaign.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              {' até '}
              {campaign.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </p>
          {/* Mobile-only dates */}
          <p className="sm:hidden text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            {campaign.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            {' - '}
            {campaign.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Metrics Grid - 2 cols mobile, 3 tablet, 5 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 mb-0.5 sm:mb-1">
            Resgates
          </p>
          <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
            {campaign.redemptions}/{campaign.totalCyclesAvailable}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 mb-0.5 sm:mb-1">
            Conversão
          </p>
          <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
            {formatPercent(campaign.redemptionRate)}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 mb-0.5 sm:mb-1">
            Receita
          </p>
          <p className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(campaign.totalRevenue)}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 mb-0.5 sm:mb-1">
            Desconto
          </p>
          <p className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400">
            -{formatCurrency(campaign.totalDiscount)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 mb-0.5 sm:mb-1">
            ROI
          </p>
          <p
            className={`text-sm sm:text-lg font-bold ${
              campaign.roi > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {campaign.roi > 0 ? '+' : ''}{formatPercent(campaign.roi)}
          </p>
        </div>
      </div>

      {/* Progress bar with sr-only description */}
      <div className="mb-3 sm:mb-4">
        <div
          className="h-1.5 sm:h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={campaign.redemptionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Taxa de conversão: ${campaign.redemptionRate.toFixed(1)}%`}
        >
          <div
            className={`h-full bg-gradient-to-r ${statusColors[campaign.status]} transition-all duration-500`}
            style={{ width: `${Math.min(campaign.redemptionRate, 100)}%` }}
          />
        </div>
        <span className="sr-only">
          {campaign.redemptionRate.toFixed(1)}% de conversão
        </span>
      </div>

      {/* Recommendation */}
      <div className={`p-2 sm:p-3 rounded-lg ${badge.bg}`}>
        <p className={`text-xs sm:text-sm font-medium ${badge.text}`}>
          <span className="font-bold">Recomendação:</span> {campaign.recommendation}
        </p>
      </div>
    </div>
  );
};

const CampaignROISection = ({ campaignROI, formatCurrency, formatPercent }) => {
  if (!campaignROI) return null;

  const hasCampaigns = campaignROI.campaigns && campaignROI.campaigns.length > 0;

  return (
    <SectionCard
      title="Efetividade de Campanhas"
      subtitle="ROI e desempenho de cupons de desconto"
      icon={Target}
      id="campaigns-section"
    >
      {hasCampaigns ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Stats - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5 sm:mb-1">
                Total de Campanhas
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 dark:text-blue-100">
                {campaignROI.totalCampaigns}
              </p>
              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400 mt-0.5 sm:mt-1">
                {campaignROI.activeCampaigns} ativas
              </p>
            </div>

            {campaignROI.bestPerforming && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <p className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-300 mb-0.5 sm:mb-1">
                  Melhor Campanha
                </p>
                <p className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100 truncate">
                  {campaignROI.bestPerforming.code}
                </p>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 mt-0.5 sm:mt-1">
                  ROI: {formatPercent(campaignROI.bestPerforming.roi)}
                </p>
              </div>
            )}

            {campaignROI.worstPerforming && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
                <p className="text-[10px] sm:text-xs font-medium text-red-700 dark:text-red-300 mb-0.5 sm:mb-1">
                  Pior Campanha
                </p>
                <p className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-100 truncate">
                  {campaignROI.worstPerforming.code}
                </p>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mt-0.5 sm:mt-1">
                  ROI: {formatPercent(campaignROI.worstPerforming.roi)}
                </p>
              </div>
            )}
          </div>

          {/* Campaign Cards */}
          <div className="space-y-3 sm:space-y-4">
            {campaignROI.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.code}
                campaign={campaign}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
              />
            ))}
          </div>

          {/* Overall Insight */}
          <InsightBox
            type="info"
            title="Otimização de Campanhas"
            message="Para maximizar ROI: (1) Cancele cupons com <10% de conversão, (2) Renove cupons com >50% de conversão, (3) Teste descontos entre 15-30% para encontrar o ponto ideal, (4) Use WhatsApp para divulgar cupons específicos em dias de baixa movimento."
          />
        </div>
      ) : (
        /* No campaigns message */
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-slate-500" aria-hidden="true" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Nenhuma Campanha Encontrada
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 max-w-md mx-auto px-4">
            Certifique-se de que o arquivo campaigns.csv está disponível e contém dados de cupons.
          </p>
        </div>
      )}
    </SectionCard>
  );
};

export default CampaignROISection;
