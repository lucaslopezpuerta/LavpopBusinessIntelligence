// CampaignList.jsx v3.1
// Campaign list and history display - Backend only
// Design System v4.0 compliant
//
// CHANGELOG:
// v3.1 (2025-12-15): UX enhancements from audit
//   - Added delivery metrics row (Entregues/Lidas/Falhou) to cards
//   - Added "Last Sent" with relative time display
//   - Added tooltips to all metric labels
//   - Added quick stats summary at top (campaigns, contacts, revenue)
//   - Compact "Ver Detalhes" button
// v3.0 (2025-12-11): Backend-only campaigns (deprecated CSV)
//   - Removed legacy CSV campaign support
//   - Simplified component props and data flow
//   - Cleaned up conditional rendering
// v2.2 (2025-12-10): Added RFM segment audience labels
// v2.1 (2025-12-08): Added campaign details modal
// v2.0 (2025-12-08): Backend integration + effectiveness metrics

import React, { useState, useEffect, useMemo } from 'react';
import { Target, Calendar, Users, Search, MessageSquare, TrendingUp, RefreshCw, Eye, CheckCircle2, BookOpen, AlertCircle, ArrowRight, Send } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import ProgressBar from '../ui/ProgressBar';
import { getCampaignPerformance } from '../../utils/campaignService';
import CampaignDetailsModal from './CampaignDetailsModal';

// Helper: Relative time in Portuguese
const getRelativeTime = (date) => {
  if (!date) return null;
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `há ${months} ${months > 1 ? 'meses' : 'mês'}`;
  }
  return date.toLocaleDateString('pt-BR');
};

const CampaignList = ({ formatCurrency, formatPercent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Fetch campaigns from backend on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getCampaignPerformance();
      // Transform backend data to display format
      const transformed = (data || []).map(c => ({
        id: c.id,
        code: c.name || c.id,
        name: c.name,
        audience: c.audience,
        status: c.status || 'active',
        isActive: c.status === 'active',
        contactMethod: c.contact_method || 'whatsapp',
        sends: c.sends || 0,
        // Delivery metrics
        delivered: c.delivered || 0,
        read: c.read || 0,
        failed: c.failed || 0,
        hasDeliveryData: c.has_delivery_data || false,
        deliveryRate: c.delivery_rate || 0,
        // Return metrics
        contactsTracked: c.contacts_tracked || 0,
        contactsReturned: c.contacts_returned || 0,
        returnRate: c.return_rate || 0,
        revenueRecovered: c.total_revenue_recovered || 0,
        avgDaysToReturn: c.avg_days_to_return || null,
        createdAt: c.created_at ? new Date(c.created_at) : null,
        lastSentAt: c.last_sent_at ? new Date(c.last_sent_at) : null
      }));
      setCampaigns(transformed);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate quick stats summary
  const quickStats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const totalContacts = campaigns.reduce((sum, c) => sum + (c.contactsTracked || 0), 0);
    const totalReturned = campaigns.reduce((sum, c) => sum + (c.contactsReturned || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenueRecovered || 0), 0);
    const avgReturnRate = totalContacts > 0 ? (totalReturned / totalContacts) * 100 : 0;
    return { totalCampaigns, totalContacts, totalReturned, totalRevenue, avgReturnRate };
  }, [campaigns]);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
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
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'completed': return 'Concluida';
      case 'draft': return 'Rascunho';
      case 'scheduled': return 'Agendada';
      default: return status;
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      // Churn Risk Level audiences
      case 'atRisk': return 'Em Risco / Critico';
      case 'newCustomers': return 'Novos Clientes';
      case 'healthy': return 'Saudaveis';
      // RFM Segment audiences
      case 'vip': return 'VIP';
      case 'frequent': return 'Frequentes';
      case 'promising': return 'Promissores';
      case 'cooling': return 'Esfriando';
      case 'inactive': return 'Inativos';
      // Other audiences
      case 'withWallet': return 'Com Saldo';
      case 'all': return 'Todos';
      default: return audience || '-';
    }
  };

  return (
    <SectionCard
      title="Historico de Campanhas"
      subtitle={`${filteredCampaigns.length} campanhas`}
      icon={Target}
      color="purple"
      id="campaign-history"
      action={
        <button
          onClick={fetchCampaigns}
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
              { key: 'completed', label: 'Concluidas' },
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

        {/* Quick Stats Summary */}
        {!isLoading && campaigns.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-purple-500" />
              <strong className="text-slate-900 dark:text-white">{quickStats.totalCampaigns}</strong> campanhas
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <strong className="text-slate-900 dark:text-white">{quickStats.totalContacts}</strong> contatos
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <strong className="text-slate-900 dark:text-white">{quickStats.totalReturned}</strong> retornaram
              <span className="text-slate-400">({formatPercent(quickStats.avgReturnRate)})</span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(quickStats.totalRevenue)}</strong> recuperado
            </span>
          </div>
        )}

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
                key={campaign.id}
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
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {campaign.createdAt && (
                        <span className="flex items-center gap-1" title="Data de criação">
                          <Calendar className="w-3 h-3" />
                          {campaign.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {campaign.lastSentAt && (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400" title={`Último envio: ${campaign.lastSentAt.toLocaleDateString('pt-BR')}`}>
                          <Send className="w-3 h-3" />
                          {getRelativeTime(campaign.lastSentAt)}
                        </span>
                      )}
                      {campaign.audience && (
                        <span className="flex items-center gap-1" title="Público-alvo">
                          <Users className="w-3 h-3" />
                          {getAudienceLabel(campaign.audience)}
                        </span>
                      )}
                      {campaign.contactMethod && (
                        <span className="hidden sm:flex items-center gap-1" title="Canal de contato">
                          <MessageSquare className="w-3 h-3" />
                          {campaign.contactMethod === 'whatsapp' ? 'WhatsApp' : campaign.contactMethod}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Funnel Row */}
                {campaign.hasDeliveryData && (
                  <div className="flex items-center gap-1 mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs overflow-x-auto">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <Send className="w-3 h-3" />
                      {campaign.sends}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 whitespace-nowrap" title="Mensagens entregues no dispositivo">
                      <CheckCircle2 className="w-3 h-3" />
                      {campaign.delivered + campaign.read}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 whitespace-nowrap" title="Mensagens lidas pelo cliente">
                      <BookOpen className="w-3 h-3" />
                      {campaign.read}
                    </span>
                    {campaign.failed > 0 && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 whitespace-nowrap" title="Falha na entrega">
                          <AlertCircle className="w-3 h-3" />
                          {campaign.failed}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div title="Mensagens enviadas via WhatsApp">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enviados</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {campaign.sends || 0}
                    </p>
                  </div>
                  <div title="Contatos sendo monitorados para retorno">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Rastreados</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {campaign.contactsTracked || 0}
                    </p>
                  </div>
                  <div title="Clientes que voltaram à loja após a campanha">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Retornaram</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {campaign.contactsReturned || 0}
                    </p>
                  </div>
                  <div title="Porcentagem de contatos que retornaram">
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

                {/* Progress Bar */}
                <ProgressBar
                  value={campaign.returnRate}
                  max={100}
                  color={campaign.returnRate > 15 ? 'emerald' : campaign.returnRate > 5 ? 'blue' : 'slate'}
                  size="sm"
                />

                {/* Revenue recovered */}
                {campaign.revenueRecovered > 0 && (
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

                {/* View Details Button - Compact */}
                <button
                  onClick={() => setSelectedCampaign(campaign)}
                  className="mt-3 flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Contatos
                </button>
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Nenhuma campanha encontrada
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Crie uma nova campanha na aba "Nova Campanha"
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
