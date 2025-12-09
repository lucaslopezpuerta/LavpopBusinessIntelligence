// CampaignList.jsx v2.1
// Campaign list and history display with backend integration
// Design System v3.1 compliant
//
// CHANGELOG:
// v2.1 (2025-12-08): Added campaign details modal
//   - Click campaign to view individual contact outcomes
//   - Shows pending/returned/expired contacts per campaign
// v2.0 (2025-12-08): Backend integration + effectiveness metrics
//   - Fetches campaigns from Supabase via getCampaignPerformance
//   - Shows return rate, tracked contacts, revenue recovered
//   - Combines legacy CSV campaigns with new backend campaigns
//   - Loading state while fetching
// v1.0 (2025-12-03): Initial implementation
//   - Display campaigns from props (CSV-based)

import React, { useState, useEffect } from 'react';
import { Target, Calendar, Users, Search, MessageSquare, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import ProgressBar from '../ui/ProgressBar';
import { getCampaignPerformance } from '../../utils/campaignService';
import CampaignDetailsModal from './CampaignDetailsModal';

const CampaignList = ({ campaigns: legacyCampaigns = [], formatCurrency, formatPercent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed, draft
  const [backendCampaigns, setBackendCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Fetch campaigns from backend on mount
  useEffect(() => {
    async function fetchCampaigns() {
      setIsLoading(true);
      try {
        const data = await getCampaignPerformance();
        setBackendCampaigns(data || []);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  // Combine legacy (CSV) campaigns with backend campaigns
  const allCampaigns = [
    // Backend campaigns first (newer)
    ...backendCampaigns.map(c => ({
      id: c.id,
      code: c.name || c.id,
      name: c.name,
      audience: c.audience,
      status: c.status || 'active',
      isActive: c.status === 'active',
      contactMethod: c.contact_method || 'whatsapp',
      sends: c.sends || 0,
      delivered: c.delivered || 0,
      // Effectiveness metrics
      contactsTracked: c.contacts_tracked || 0,
      contactsReturned: c.contacts_returned || 0,
      returnRate: c.return_rate || 0,
      revenueRecovered: c.total_revenue_recovered || 0,
      avgDaysToReturn: c.avg_days_to_return || null,
      // Dates
      createdAt: c.created_at ? new Date(c.created_at) : null,
      lastSentAt: c.last_sent_at ? new Date(c.last_sent_at) : null,
      // Source indicator
      source: 'backend'
    })),
    // Legacy campaigns (from CSV)
    ...legacyCampaigns.map(c => ({
      ...c,
      source: 'legacy',
      contactsTracked: 0,
      returnRate: 0
    }))
  ];

  // Filter campaigns
  const filteredCampaigns = allCampaigns.filter(campaign => {
    const matchesSearch = (campaign.code || campaign.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && campaign.isActive) ||
      (filterStatus === 'completed' && campaign.status === 'completed') ||
      (filterStatus === 'draft' && campaign.status === 'draft');
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'completed': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'draft': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
      case 'scheduled': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      // Legacy statuses
      case 'excellent': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'good': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      case 'fair': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
      case 'poor': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'completed': return 'Concluída';
      case 'draft': return 'Rascunho';
      case 'scheduled': return 'Agendada';
      // Legacy statuses
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      case 'poor': return 'Fraco';
      default: return status;
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'atRisk': return 'Em Risco';
      case 'newCustomers': return 'Novos';
      case 'healthy': return 'Saudáveis';
      case 'withWallet': return 'Com Saldo';
      case 'all': return 'Todos';
      default: return audience || '-';
    }
  };

  // Refresh campaigns
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await getCampaignPerformance();
      setBackendCampaigns(data || []);
    } catch (error) {
      console.error('Failed to refresh campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionCard
      title="Histórico de Campanhas"
      subtitle={`${filteredCampaigns.length} campanhas ${backendCampaigns.length > 0 ? `(${backendCampaigns.length} do backend)` : ''}`}
      icon={Target}
      color="purple"
      id="campaign-history"
      action={
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          title="Atualizar campanhas"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar campanha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'active', label: 'Ativas' },
              { key: 'completed', label: 'Concluídas' },
              { key: 'draft', label: 'Rascunhos' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === key
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando campanhas...</span>
          </div>
        )}

        {/* Campaign Cards */}
        {!isLoading && filteredCampaigns.length > 0 ? (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id || campaign.code}
                className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {campaign.name || campaign.code}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                      {campaign.source === 'backend' && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded">
                          Backend
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {campaign.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {campaign.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {campaign.audience && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {getAudienceLabel(campaign.audience)}
                        </span>
                      )}
                      {campaign.contactMethod && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {campaign.contactMethod === 'whatsapp' ? 'WhatsApp' : campaign.contactMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Legacy: Discount display */}
                  {campaign.discountPercent && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Desconto</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {campaign.discountPercent}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Metrics Grid - Backend campaigns */}
                {campaign.source === 'backend' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enviados</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {campaign.sends || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Rastreados</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {campaign.contactsTracked || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Retornaram</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {campaign.contactsReturned || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Taxa Retorno</p>
                      <p className={`text-sm font-semibold ${
                        campaign.returnRate > 15
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : campaign.returnRate > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {formatPercent(campaign.returnRate)}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Metrics Grid - Legacy campaigns */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Resgates</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {campaign.redemptions}/{campaign.totalCyclesAvailable}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Conversão</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatPercent(campaign.redemptionRate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Receita</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(campaign.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">ROI Incr.</p>
                      <p className={`text-sm font-semibold ${
                        campaign.roi > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {campaign.roi > 0 ? '+' : ''}{formatPercent(campaign.roi)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Bar - Return rate for backend, redemption for legacy */}
                <ProgressBar
                  value={campaign.source === 'backend' ? campaign.returnRate : campaign.redemptionRate}
                  max={100}
                  color={
                    campaign.source === 'backend'
                      ? (campaign.returnRate > 15 ? 'emerald' : campaign.returnRate > 5 ? 'blue' : 'slate')
                      : (campaign.status === 'excellent' ? 'emerald' : campaign.status === 'good' ? 'blue' : campaign.status === 'fair' ? 'amber' : 'red')
                  }
                  size="sm"
                />

                {/* Revenue recovered (backend only) */}
                {campaign.source === 'backend' && campaign.revenueRecovered > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Receita Recuperada
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(campaign.revenueRecovered)}
                    </span>
                  </div>
                )}

                {/* View Details Button (backend campaigns only) */}
                {campaign.source === 'backend' && (
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes dos Contatos
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Nenhuma campanha encontrada
            </p>
          </div>
        )}
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
        />
      )}
    </SectionCard>
  );
};

export default CampaignList;
