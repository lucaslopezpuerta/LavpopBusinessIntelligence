// CampaignDetailsModal.jsx v1.5
// Shows campaign details with individual contact outcomes
// Displays which contacts have returned vs pending vs expired
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.5 (2025-12-14): Delivery metrics, pagination, sort/filter options
//   - Added delivery metrics row: Entregues, Lidas, Falhou
//   - Added delivery status icon to each contact card
//   - Added pagination with page navigation (50 per page)
//   - Added sort options as pill buttons (Nome, Data, Status)
//   - Added delivery status filter pills
//   - Metrics grid reorganized: 2 rows for better readability
// v1.4 (2025-12-14): Mask CPF for privacy
//   - Added maskCpf() helper: 12345678901 → 123.***.***-01
//   - Customer ID now displays masked for data protection
// v1.3 (2025-12-14): Added phone display (now in contact_tracking)
//   - contact_tracking now has phone field (migration 006)
//   - Re-added Phone icon import
// v1.2 (2025-12-14): Fixed contacts not showing for automations
//   - getCampaignContacts now queries contact_tracking directly (not campaign_contacts)
//   - Automations create contact_tracking without campaign_contacts bridge records
//   - Updated to handle flat structure from contact_tracking table
//   - Uses contacted_at instead of sent_at (contact_tracking schema)
// v1.1 (2025-12-13): Mobile compatibility improvements
//   - Responsive modal width (full on mobile, max-w-4xl on desktop)
//   - Responsive padding (p-4 sm:p-6) per Design System
//   - Metrics grid: 1-col mobile, 2-col tablet, 5-col desktop
//   - Filter buttons: larger touch targets (min-h-9), flex-wrap for mobile
//   - Contact cards: stack layout on mobile, horizontal on desktop
//   - Footer: stack layout on mobile
//   - Responsive text sizes for metric values
// v1.0 (2025-12-08): Initial implementation
//   - Campaign info header with metrics
//   - Contact list with status indicators
//   - Return revenue and days to return for returned contacts

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
  TrendingUp,
  Phone,
  ArrowRight,
  DollarSign,
  Send,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { getCampaignContacts, getCampaignPerformance } from '../../utils/campaignService';

// Pagination config
const CONTACTS_PER_PAGE = 50;

const CampaignDetailsModal = ({ campaign, onClose, formatCurrency, formatPercent }) => {
  const [contacts, setContacts] = useState([]);
  const [campaignData, setCampaignData] = useState(campaign);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all'); // Return status filter
  const [filterDelivery, setFilterDelivery] = useState('all'); // Delivery status filter

  // Sort
  const [sortBy, setSortBy] = useState('date'); // 'name', 'date', 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch campaign contacts on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch full campaign performance data
        const performance = await getCampaignPerformance(campaign.id);
        if (performance) {
          setCampaignData(prev => ({ ...prev, ...performance }));
        }

        // Fetch individual contacts
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
    // Group delivered and read as "delivered" for filter
    if (ds === 'delivered' || ds === 'read') {
      acc.delivered = (acc.delivered || 0) + 1;
      if (ds === 'read') {
        acc.read = (acc.read || 0) + 1;
      }
    } else if (ds === 'failed' || ds === 'undelivered') {
      acc.failed = (acc.failed || 0) + 1;
    } else {
      acc.pending = (acc.pending || 0) + 1;
    }
    return acc;
  }, {}), [contacts]);

  // Filter, sort, and paginate contacts
  const { paginatedContacts, totalPages, totalFiltered } = useMemo(() => {
    // Step 1: Filter by return status
    let filtered = filterStatus === 'all'
      ? contacts
      : contacts.filter(c => (c.status || 'pending') === filterStatus);

    // Step 2: Filter by delivery status
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

    // Step 3: Sort
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

    // Step 4: Paginate
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
      case 'returned':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-slate-400" />;
      case 'cleared':
        return <XCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
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
      case 'returned':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'expired':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
      case 'cleared':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    }
  };

  // Delivery status helpers
  const getDeliveryIcon = (deliveryStatus) => {
    switch (deliveryStatus) {
      case 'read':
        return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case 'failed':
      case 'undelivered':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'sent':
        return <Send className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
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

  // Toggle sort order or change sort field
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Mask CPF for privacy: 12345678901 → 123.***.***-01
  const maskCpf = (cpf) => {
    if (!cpf) return '-';
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length !== 11) return cpf; // Return as-is if not valid CPF length
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {campaignData.name || campaign.id}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {campaignData.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(campaignData.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {campaignData.audience && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {getAudienceLabel(campaignData.audience)}
                  </span>
                )}
                {campaignData.contact_method && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {campaignData.contact_method === 'whatsapp' ? 'WhatsApp' : campaignData.contact_method}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Summary */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {/* Row 1: Send & Delivery Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Enviados</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {campaignData.sends || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Entregues</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {campaignData.has_delivery_data
                  ? (campaignData.delivered || 0) + (campaignData.read || 0)
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Lidas</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                {campaignData.has_delivery_data ? (campaignData.read || 0) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Falhou</p>
              <p className={`text-lg sm:text-xl font-bold ${
                (campaignData.failed || 0) > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400'
              }`}>
                {campaignData.has_delivery_data ? (campaignData.failed || 0) : '-'}
              </p>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa Entrega</p>
              <p className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">
                {campaignData.has_delivery_data
                  ? formatPercent(campaignData.delivery_rate || 0)
                  : '-'}
              </p>
            </div>
          </div>

          {/* Row 2: Return Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rastreados</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {campaignData.contacts_tracked || contacts.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Retornaram</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {campaignData.contacts_returned || statusCounts.returned || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa Retorno</p>
              <p className={`text-lg sm:text-xl font-bold ${
                (campaignData.return_rate || 0) > 15
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (campaignData.return_rate || 0) > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
              }`}>
                {formatPercent(campaignData.return_rate || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Receita</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(campaignData.total_revenue_recovered || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
          {/* Row 1: Return Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Retorno:
            </span>
            {[
              { key: 'all', label: 'Todos', count: contacts.length },
              { key: 'returned', label: 'Retornaram', count: statusCounts.returned || 0 },
              { key: 'pending', label: 'Pendentes', count: statusCounts.pending || 0 },
              { key: 'expired', label: 'Expirados', count: statusCounts.expired || 0 }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-2.5 py-1.5 min-h-[32px] rounded-full text-xs font-medium transition-colors ${
                  filterStatus === key
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Row 2: Delivery Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Send className="w-3 h-3" />
              Entrega:
            </span>
            {[
              { key: 'all', label: 'Todas' },
              { key: 'delivered', label: 'Entregues', count: deliveryCounts.delivered || 0 },
              { key: 'read', label: 'Lidas', count: deliveryCounts.read || 0 },
              { key: 'failed', label: 'Falhou', count: deliveryCounts.failed || 0 },
              { key: 'pending', label: 'Pendentes', count: deliveryCounts.pending || 0 }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterDelivery(key)}
                className={`px-2.5 py-1.5 min-h-[32px] rounded-full text-xs font-medium transition-colors ${
                  filterDelivery === key
                    ? key === 'failed'
                      ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      : key === 'read'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : key === 'delivered'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}{count !== undefined ? ` (${count})` : ''}
              </button>
            ))}
          </div>

          {/* Row 3: Sort Options + Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Ordenar:
              </span>
              {[
                { key: 'date', label: 'Data' },
                { key: 'name', label: 'Nome' },
                { key: 'status', label: 'Status' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-2.5 py-1.5 min-h-[32px] rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    sortBy === key
                      ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                  {sortBy === key && (
                    <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 min-h-[32px] min-w-[32px] text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando contatos...</span>
            </div>
          ) : paginatedContacts.length > 0 ? (
            <div className="space-y-2">
              {paginatedContacts.map((contact) => {
                const status = contact.status || 'pending';
                const deliveryStatus = contact.delivery_status || 'pending';

                return (
                  <div
                    key={contact.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {contact.customer_name || 'Cliente'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </span>
                            )}
                            <span>CPF: {maskCpf(contact.customer_id)}</span>
                            {contact.risk_level && (
                              <span className="text-slate-400">• {contact.risk_level}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badges & Details */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-11 sm:ml-0">
                        {/* Delivery Status Icon */}
                        <span
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700"
                          title={getDeliveryLabel(deliveryStatus)}
                        >
                          {getDeliveryIcon(deliveryStatus)}
                          <span className="hidden sm:inline text-slate-600 dark:text-slate-400">
                            {getDeliveryLabel(deliveryStatus)}
                          </span>
                        </span>

                        {/* Return Status Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>

                        {/* Return details for returned contacts */}
                        {status === 'returned' && (
                          <div className="flex items-center gap-2 sm:gap-3 text-sm">
                            {contact.days_to_return !== null && contact.days_to_return !== undefined && (
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <ArrowRight className="w-3 h-3" />
                                {contact.days_to_return}d
                              </span>
                            )}
                            {contact.return_revenue > 0 && (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(contact.return_revenue)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Contact date */}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {contact.contacted_at && new Date(contact.contacted_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {contacts.length === 0
                  ? 'Nenhum contato registrado para esta campanha'
                  : 'Nenhum contato com os filtros selecionados'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {totalFiltered} contatos • Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
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
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {contacts.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-slate-600 dark:text-slate-400">
                  Média dias para retorno:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {campaignData.avg_days_to_return
                      ? `${campaignData.avg_days_to_return} dias`
                      : '-'}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  {(statusCounts.returned || 0)} de {contacts.length} retornaram
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
