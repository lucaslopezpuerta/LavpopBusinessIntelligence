// CampaignList.jsx v3.10 - SOLID COLOR BADGES
// Campaign list and history display - Backend only
// Design System v5.1 compliant
//
// CHANGELOG:
// v3.10 (2026-01-28): Solid color badges for WCAG AA compliance
//   - Status badges now use solid colors with white text
//   - Campaign type badges now solid with white text/icons
//   - Type filter toggle buttons now solid when active
//   - Tracking health alert kept opacity (container, not badge)
// v3.9 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Card hover animations disabled when user prefers reduced motion
// v3.8 (2026-01-12): Removed manual sync button
//   - Data now refreshes via realtime Supabase subscription
//   - Kept lastSync timestamp display for user reference
//   - Removed sync button from action prop (data refreshes automatically)
// v3.7 (2026-01-09): Hybrid card design implementation
//   - Added Framer Motion hover animation (y: -2 lift effect)
//   - Changed status border from type-based to return-rate-based:
//     - border-l-emerald-500 (>15% return rate)
//     - border-l-amber-500 (5-15% return rate)
//     - border-l-rose-500 (<5% return rate)
//   - Added haptic feedback on card tap
//   - Premium shadow-lift on hover
// v3.6 (2026-01-09): Mobile layout redesign for cleaner UX
//   - Reordered: Search → Status Filter → Type Toggle → Stats
//   - Status filter buttons now flex-1 on mobile (equal width)
//   - Type toggle on separate row for visual clarity
//   - Quick stats: 2x2 grid on mobile (no horizontal scroll)
//   - Hidden stat labels on mobile for compact display
//   - Consistent with WhatsApp/Instagram patterns
// v3.5 (2026-01-09): Added sync time label + improved refresh button
//   - Added lastSync state to track when data was last fetched
//   - Added formatTimeAgo helper (Xd, Xh, Xmin, agora)
//   - Sync time displayed below refresh button
//   - Type filter toggle (removed redundant "Todos")
// v3.4 (2026-01-09): Improved filter buttons layout
//   - Consolidated status + type filters into segmented button groups
//   - Added touch targets (36px min-height) for better mobile tapping
//   - Filters wrap naturally on mobile, single row on desktop
//   - Better visual grouping with pill-style backgrounds
// v3.3 (2026-01-08): Campaign type differentiation & tracking health
//   - Added campaign type badge (Automated vs Manual)
//   - Added tracking health indicator (warning when sends > 0 but tracked = 0)
//   - Added campaign type filter (All, Manual, Automated)
//   - Visual differentiation: left border purple for auto, blue for manual
//   - Automated detection based on name starting with "Auto:"
// v3.2 (2025-12-22): Haptic feedback on refresh
//   - haptics.success() after successful campaign fetch
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
import { motion } from 'framer-motion';
import { Target, Calendar, Users, Search, MessageSquare, TrendingUp, RefreshCw, Eye, CheckCircle2, BookOpen, AlertCircle, ArrowRight, Send, Bot, User, AlertTriangle } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import ProgressBar from '../ui/ProgressBar';
import { getCampaignPerformance } from '../../utils/campaignService';
import CampaignDetailsModal from './CampaignDetailsModal';
import { haptics } from '../../utils/haptics';
import useReducedMotion from '../../hooks/useReducedMotion';
import { TWEEN } from '../../constants/animations';

// Helper: Relative time in Portuguese (for campaign dates)
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

// Helper: Format timestamp as relative time for sync label (Xd, Xh, Xmin, agora)
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return 'agora';
};

const CampaignList = ({ formatCurrency, formatPercent }) => {
  const prefersReducedMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all'); // v3.3: Campaign type filter
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [lastSync, setLastSync] = useState(null); // v3.5: Track last sync time

  // Fetch campaigns from backend on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getCampaignPerformance();
      // Transform backend data to display format
      const transformed = (data || []).map(c => {
        const name = c.name || c.id || '';
        // v3.3: Detect if campaign is automated based on name prefix
        const isAutomated = name.startsWith('Auto:') || name.toLowerCase().includes('automação');
        const sends = c.sends || 0;
        const contactsTracked = c.contacts_tracked || 0;
        // v3.3: Detect tracking issues (sends > 0 but no tracking)
        const hasTrackingIssue = sends > 0 && contactsTracked === 0;

        return {
          id: c.id,
          code: name,
          name: name,
          audience: c.audience,
          status: c.status || 'active',
          isActive: c.status === 'active',
          contactMethod: c.contact_method || 'whatsapp',
          sends,
          // Delivery metrics
          delivered: c.delivered || 0,
          read: c.read || 0,
          failed: c.failed || 0,
          hasDeliveryData: c.has_delivery_data || false,
          deliveryRate: c.delivery_rate || 0,
          // Return metrics
          contactsTracked,
          contactsReturned: c.contacts_returned || 0,
          returnRate: c.return_rate || 0,
          revenueRecovered: c.total_revenue_recovered || 0,
          avgDaysToReturn: c.avg_days_to_return || null,
          createdAt: c.created_at ? new Date(c.created_at) : null,
          lastSentAt: c.last_sent_at ? new Date(c.last_sent_at) : null,
          // v3.3: Campaign type differentiation
          isAutomated,
          hasTrackingIssue
        };
      });
      setCampaigns(transformed);
      setLastSync(new Date()); // v3.5: Track sync time
      haptics.success();
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
    // v3.3: Filter by campaign type
    const matchesType = filterType === 'all' ||
      (filterType === 'automated' && campaign.isAutomated) ||
      (filterType === 'manual' && !campaign.isAutomated);
    return matchesSearch && matchesStatus && matchesType;
  });

  // Solid color status badges (WCAG AA compliant)
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-600 dark:bg-emerald-500 text-white';
      case 'completed': return 'bg-blue-600 dark:bg-blue-500 text-white';
      case 'draft': return 'bg-slate-500 dark:bg-slate-600 text-white';
      case 'scheduled': return 'bg-purple-600 dark:bg-purple-500 text-white';
      default: return 'bg-slate-500 dark:bg-slate-600 text-white';
    }
  };

  // v3.7: Status border based on return rate (not campaign type)
  const getReturnRateBorder = (returnRate) => {
    if (returnRate >= 15) return 'border-l-emerald-500';
    if (returnRate >= 5) return 'border-l-amber-500';
    return 'border-l-rose-500';
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
        lastSync && (
          <span className="text-slate-400 text-xs" title="Última atualização">
            {formatTimeAgo(lastSync)}
          </span>
        )
      }
    >
      <div className="space-y-4">
        {/* Search and Filters - v3.6: Mobile-optimized layout */}
        <div className="flex flex-col gap-3">
          {/* 1. Search Input - FIRST (most important action) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar campanha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 2. Status Filter - Full width on mobile */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'active', label: 'Ativas' },
              { key: 'completed', label: 'Concluídas' },
              { key: 'draft', label: 'Rascunhos' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex-1 sm:flex-none min-h-[36px] px-2 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === key
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 3. Type Filter Toggle - Separate row */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {[
                { key: 'manual', label: 'Manual', icon: User },
                { key: 'automated', label: 'Auto', icon: Bot }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(filterType === key ? 'all' : key)}
                  className={`flex items-center gap-1 min-h-[36px] px-2.5 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                    filterType === key
                      ? key === 'automated'
                        ? 'bg-purple-600 dark:bg-purple-500 text-white'
                        : 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Quick Stats - 2x2 grid on mobile, row on desktop */}
          {!isLoading && campaigns.length > 0 && (
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-x-4 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-purple-500" />
                <strong className="text-slate-900 dark:text-white">{quickStats.totalCampaigns}</strong>
                <span className="hidden sm:inline">campanhas</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <strong className="text-slate-900 dark:text-white">{quickStats.totalContacts}</strong>
                <span className="hidden sm:inline">contatos</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <strong className="text-slate-900 dark:text-white">{quickStats.totalReturned}</strong>
                <span className="text-slate-400">({formatPercent(quickStats.avgReturnRate)})</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(quickStats.totalRevenue)}</strong>
              </span>
            </div>
          )}
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
              <motion.div
                key={campaign.id}
                whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
                onClick={() => { haptics.light(); setSelectedCampaign(campaign); }}
                className={`p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm cursor-pointer border-l-4 ${getReturnRateBorder(campaign.returnRate)}`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {campaign.name || campaign.code}
                      </h3>
                      {/* v3.3: Campaign Type Badge (solid colors) */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                        campaign.isAutomated
                          ? 'bg-purple-600 dark:bg-purple-500'
                          : 'bg-blue-600 dark:bg-blue-500'
                      }`}>
                        {campaign.isAutomated ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {campaign.isAutomated ? 'Auto' : 'Manual'}
                      </span>
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

                {/* v3.3: Tracking Health Indicator */}
                {campaign.hasTrackingIssue && (
                  <div
                    className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300"
                    title="Mensagens foram enviadas mas o rastreamento de retorno falhou. Isso pode afetar as métricas da campanha."
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Rastreamento incompleto:</strong> {campaign.sends} enviado{campaign.sends > 1 ? 's' : ''}, 0 rastreados
                    </span>
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
                  onClick={(e) => { e.stopPropagation(); setSelectedCampaign(campaign); }}
                  className="mt-3 flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Contatos
                </button>
              </motion.div>
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
