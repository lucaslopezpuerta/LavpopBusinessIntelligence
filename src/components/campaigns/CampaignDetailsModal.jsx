// CampaignDetailsModal.jsx v1.6
// Shows campaign details with individual contact outcomes
// Displays which contacts have returned vs pending vs expired
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.6 (2025-12-14): Major UX overhaul - mobile scroll fix, compact layout
//   - FIXED: Mobile scroll not working (added min-h-0 to flex container)
//   - Reduced contacts per page: 50 → 20 for better UX
//   - Compact metrics: single row on mobile with horizontal scroll
//   - Filter pills: horizontal scroll on mobile, no awkward wrapping
//   - Contact cards: tighter padding, single-line layout on mobile
//   - Numbers right-aligned for better readability
//   - Removed redundant footer stats (already shown in metrics)
//   - Sort/filter combined into single row with overflow scroll
// v1.5 (2025-12-14): Delivery metrics, pagination, sort/filter options
// v1.4 (2025-12-14): Mask CPF for privacy
// v1.3 (2025-12-14): Added phone display (now in contact_tracking)
// v1.2 (2025-12-14): Fixed contacts not showing for automations
// v1.1 (2025-12-13): Mobile compatibility improvements
// v1.0 (2025-12-08): Initial implementation

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Target,
  Users,
  Calendar,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  ArrowRight,
  DollarSign,
  Send,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getCampaignContacts, getCampaignPerformance } from '../../utils/campaignService';

// Pagination config - reduced for better UX
const CONTACTS_PER_PAGE = 20;

const CampaignDetailsModal = ({ campaign, onClose, formatCurrency, formatPercent }) => {
  const [contacts, setContacts] = useState([]);
  const [campaignData, setCampaignData] = useState(campaign);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDelivery, setFilterDelivery] = useState('all');

  // Sort
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch campaign contacts on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const performance = await getCampaignPerformance(campaign.id);
        if (performance) {
          setCampaignData(prev => ({ ...prev, ...performance }));
        }
        const contactsData = await getCampaignContacts(campaign.id);
        setContacts(contactsData || []);
      } catch (error) {
        console.error('Failed to fetch campaign details:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [campaign.id]);

  // Count by return status
  const statusCounts = useMemo(() => contacts.reduce((acc, c) => {
    const status = c.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}), [contacts]);

  // Count by delivery status
  const deliveryCounts = useMemo(() => contacts.reduce((acc, c) => {
    const ds = c.delivery_status || 'pending';
    if (ds === 'delivered' || ds === 'read') {
      acc.delivered = (acc.delivered || 0) + 1;
      if (ds === 'read') acc.read = (acc.read || 0) + 1;
    } else if (ds === 'failed' || ds === 'undelivered') {
      acc.failed = (acc.failed || 0) + 1;
    } else {
      acc.pending = (acc.pending || 0) + 1;
    }
    return acc;
  }, {}), [contacts]);

  // Filter, sort, and paginate contacts
  const { paginatedContacts, totalPages, totalFiltered } = useMemo(() => {
    let filtered = filterStatus === 'all'
      ? contacts
      : contacts.filter(c => (c.status || 'pending') === filterStatus);

    if (filterDelivery !== 'all') {
      filtered = filtered.filter(c => {
        const ds = c.delivery_status || 'pending';
        if (filterDelivery === 'delivered') return ds === 'delivered' || ds === 'read';
        if (filterDelivery === 'read') return ds === 'read';
        if (filterDelivery === 'failed') return ds === 'failed' || ds === 'undelivered';
        if (filterDelivery === 'pending') return ds === 'pending' || ds === 'sent';
        return true;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
      } else if (sortBy === 'date') {
        comparison = new Date(a.contacted_at || 0) - new Date(b.contacted_at || 0);
      } else if (sortBy === 'status') {
        const statusOrder = { returned: 0, pending: 1, expired: 2, cleared: 3 };
        comparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const totalPages = Math.ceil(sorted.length / CONTACTS_PER_PAGE);
    const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE;
    const paginated = sorted.slice(startIndex, startIndex + CONTACTS_PER_PAGE);

    return { paginatedContacts: paginated, totalPages, totalFiltered: sorted.length };
  }, [contacts, filterStatus, filterDelivery, sortBy, sortOrder, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDelivery, sortBy, sortOrder]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'returned': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'expired': return <XCircle className="w-3.5 h-3.5 text-slate-400" />;
      case 'cleared': return <XCircle className="w-3.5 h-3.5 text-blue-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'returned': return 'Retornou';
      case 'expired': return 'Expirado';
      case 'cleared': return 'Limpo';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'returned': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'expired': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
      case 'cleared': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      default: return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    }
  };

  const getDeliveryIcon = (deliveryStatus) => {
    switch (deliveryStatus) {
      case 'read': return <BookOpen className="w-3 h-3 text-blue-500" />;
      case 'delivered': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'failed':
      case 'undelivered': return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'sent': return <Send className="w-3 h-3 text-amber-500" />;
      default: return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  const getDeliveryLabel = (deliveryStatus) => {
    switch (deliveryStatus) {
      case 'read': return 'Lida';
      case 'delivered': return 'Entregue';
      case 'failed':
      case 'undelivered': return 'Falhou';
      case 'sent': return 'Enviada';
      default: return 'Pendente';
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const maskCpf = (cpf) => {
    if (!cpf) return '-';
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.***.***-${clean.slice(-2)}`;
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

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const contactsData = await getCampaignContacts(campaign.id);
      setContacts(contactsData || []);
    } catch (error) {
      console.error('Failed to refresh contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Metric item component for consistency
  const MetricItem = ({ label, value, color = 'text-slate-900 dark:text-white' }) => (
    <div className="flex flex-col items-center min-w-[70px] px-2">
      <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
      <span className={`text-base sm:text-lg font-bold ${color}`}>{value}</span>
    </div>
  );

  // Filter pill component
  const FilterPill = ({ active, onClick, children, activeColor = 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' }) => (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
        active ? activeColor : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header - Compact */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {campaignData.name || campaign.id}
              </h2>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                {campaignData.created_at && (
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(campaignData.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {campaignData.audience && (
                  <span className="flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {getAudienceLabel(campaignData.audience)}
                  </span>
                )}
                {campaignData.contact_method && (
                  <span className="hidden sm:flex items-center gap-0.5">
                    <MessageSquare className="w-3 h-3" />
                    {campaignData.contact_method === 'whatsapp' ? 'WhatsApp' : campaignData.contact_method}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics - Horizontal scroll on mobile */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-stretch divide-x divide-slate-200 dark:divide-slate-700 py-3 px-1 min-w-max">
              <MetricItem label="Enviados" value={campaignData.sends || 0} />
              <MetricItem
                label="Entregues"
                value={campaignData.has_delivery_data ? (campaignData.delivered || 0) + (campaignData.read || 0) : '-'}
                color="text-green-600 dark:text-green-400"
              />
              <MetricItem
                label="Lidas"
                value={campaignData.has_delivery_data ? (campaignData.read || 0) : '-'}
                color="text-blue-600 dark:text-blue-400"
              />
              <MetricItem
                label="Falhou"
                value={campaignData.has_delivery_data ? (campaignData.failed || 0) : '-'}
                color={(campaignData.failed || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}
              />
              <MetricItem label="Rastreados" value={campaignData.contacts_tracked || contacts.length} />
              <MetricItem
                label="Retornaram"
                value={campaignData.contacts_returned || statusCounts.returned || 0}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <MetricItem
                label="Taxa"
                value={formatPercent(campaignData.return_rate || 0)}
                color={(campaignData.return_rate || 0) > 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}
              />
              <MetricItem
                label="Receita"
                value={formatCurrency(campaignData.total_revenue_recovered || 0)}
                color="text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Filter & Sort Bar - Horizontal scroll */}
        <div className="border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 p-2 sm:p-3 min-w-max">
              {/* Return Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase">Retorno</span>
                {[
                  { key: 'all', label: `Todos (${contacts.length})` },
                  { key: 'returned', label: `${statusCounts.returned || 0}` },
                  { key: 'pending', label: `${statusCounts.pending || 0}` },
                ].map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    active={filterStatus === key}
                    onClick={() => setFilterStatus(key)}
                  >
                    {key === 'returned' && <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-500" />}
                    {key === 'pending' && <Clock className="w-3 h-3 inline mr-0.5 text-amber-500" />}
                    {label}
                  </FilterPill>
                ))}
              </div>

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

              {/* Delivery Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase">Entrega</span>
                {[
                  { key: 'all', label: 'Todas' },
                  { key: 'delivered', label: `${deliveryCounts.delivered || 0}`, color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
                  { key: 'read', label: `${deliveryCounts.read || 0}`, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
                  { key: 'failed', label: `${deliveryCounts.failed || 0}`, color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
                  { key: 'pending', label: `${deliveryCounts.pending || 0}` },
                ].map(({ key, label, color }) => (
                  <FilterPill
                    key={key}
                    active={filterDelivery === key}
                    onClick={() => setFilterDelivery(key)}
                    activeColor={color}
                  >
                    {key === 'delivered' && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                    {key === 'read' && <BookOpen className="w-3 h-3 inline mr-0.5" />}
                    {key === 'failed' && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                    {label}
                  </FilterPill>
                ))}
              </div>

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase">Ordenar</span>
                {[
                  { key: 'date', label: 'Data' },
                  { key: 'name', label: 'Nome' },
                  { key: 'status', label: 'Status' }
                ].map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    active={sortBy === key}
                    onClick={() => handleSort(key)}
                    activeColor="bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-800"
                  >
                    {label}
                    {sortBy === key && <span className="ml-0.5 text-[9px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </FilterPill>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 ml-auto"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Contact List - CRITICAL: min-h-0 enables flex overflow scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-2 sm:p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Carregando...</span>
              </div>
            ) : paginatedContacts.length > 0 ? (
              <div className="space-y-1.5">
                {paginatedContacts.map((contact) => {
                  const status = contact.status || 'pending';
                  const deliveryStatus = contact.delivery_status || 'pending';

                  return (
                    <div
                      key={contact.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      {/* Status Icon */}
                      <div className={`p-1.5 rounded-md shrink-0 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {contact.customer_name || 'Cliente'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          {contact.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              <span className="hidden sm:inline">{contact.phone}</span>
                              <span className="sm:hidden">{contact.phone.slice(-4)}</span>
                            </span>
                          )}
                          <span className="hidden sm:inline">CPF: {maskCpf(contact.customer_id)}</span>
                        </div>
                      </div>

                      {/* Badges - Right side */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Delivery Status */}
                        <span
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700"
                          title={getDeliveryLabel(deliveryStatus)}
                        >
                          {getDeliveryIcon(deliveryStatus)}
                          <span className="hidden sm:inline text-slate-600 dark:text-slate-400 ml-0.5">
                            {getDeliveryLabel(deliveryStatus)}
                          </span>
                        </span>

                        {/* Return Status Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>

                        {/* Return details */}
                        {status === 'returned' && contact.return_revenue > 0 && (
                          <span className="hidden sm:flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(contact.return_revenue)}
                          </span>
                        )}

                        {/* Date */}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
                          {contact.contacted_at && new Date(contact.contacted_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {contacts.length === 0
                    ? 'Nenhum contato registrado'
                    : 'Nenhum contato com os filtros selecionados'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination - Only show if needed */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              {totalFiltered} contatos • Pág {currentPage}/{totalPages}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers - Show fewer on mobile */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
