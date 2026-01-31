// CampaignDetailsModal.jsx v3.0 - BASEMODAL MIGRATION
// Shows campaign details with individual contact outcomes
// Displays which contacts have returned vs pending vs expired
// Design System v5.1 compliant
//
// CHANGELOG:
// v3.0 (2026-01-31): BaseModal migration
//   - Migrated to BaseModal component for consistent UX
//   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock)
//   - Uses showHeader={false} for custom campaign header
//   - Reduced from ~820 lines to ~550 lines
// v2.11 (2026-01-31): Enhanced drag handle
// v2.10 (2026-01-31): Enhanced modal transitions
// v2.9 (2026-01-30): Swipe-to-close and portal rendering
// v2.8 (2026-01-29): Mode-aware pending status badge
// v2.7 (2026-01-29): Orange to yellow color migration
// v2.6 (2026-01-29): Amber to orange color migration
// v2.5 (2026-01-29): Solid Color Badges for WCAG AA
// v2.4 (2026-01-27): Animation standardization
// v2.3 (2026-01-12): Refactored to useScrollLock hook
// v2.2 (2026-01-12): Safe area compliance

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
  DollarSign,
  Send,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Search
} from 'lucide-react';
import { getCampaignContacts, getCampaignPerformance } from '../../utils/campaignService';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import BaseModal from '../ui/BaseModal';

// Pagination config
const CONTACTS_PER_PAGE = 20;

const CampaignDetailsModal = ({ campaign, onClose, formatCurrency, formatPercent }) => {
  const [contacts, setContacts] = useState([]);
  const [campaignData, setCampaignData] = useState(campaign);
  const [isLoading, setIsLoading] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDelivery, setFilterDelivery] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState('');

  const { isDark } = useTheme();

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

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterDelivery !== 'all') count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [filterStatus, filterDelivery, searchTerm]);

  // Filter, sort, and paginate contacts
  const { paginatedContacts, totalPages, totalFiltered } = useMemo(() => {
    let filtered = contacts;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.customer_name || '').toLowerCase().includes(search) ||
        (c.phone || '').includes(search)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => (c.status || 'pending') === filterStatus);
    }

    // Apply delivery filter
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
  }, [contacts, searchTerm, filterStatus, filterDelivery, sortBy, sortOrder, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDelivery, sortBy, sortOrder, searchTerm]);

  // Handle jump to page
  const handleJumpToPage = (e) => {
    e.preventDefault();
    const page = parseInt(jumpToPage, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage('');
    }
  };

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
      case 'returned': return 'bg-emerald-600 dark:bg-emerald-500 text-white';
      case 'expired': return 'bg-slate-500 dark:bg-slate-600 text-white';
      case 'cleared': return 'bg-blue-600 dark:bg-blue-500 text-white';
      default: return 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400';
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

  // Filter pill component
  const FilterPill = ({ active, onClick, children, activeColor = 'bg-purple-600 dark:bg-purple-500 text-white' }) => (
    <button
      onClick={() => { haptics.tick(); onClick(); }}
      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active ? activeColor : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );

  // Sort pill component
  const SortPill = ({ field, label }) => (
    <button
      onClick={() => { haptics.tick(); handleSort(field); }}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        sortBy === field
          ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-800'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {label}
      {sortBy === field && <span className="ml-0.5">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  // Pagination footer
  const paginationFooter = totalPages > 1 ? (
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-xs text-slate-500 dark:text-slate-400">
        {totalFiltered} contatos • Pág {currentPage}/{totalPages}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => { haptics.tick(); setCurrentPage(p => Math.max(1, p - 1)); }}
          disabled={currentPage === 1}
          className="p-2 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
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
              onClick={() => { haptics.tick(); setCurrentPage(pageNum); }}
              className={`min-w-[44px] min-h-[44px] rounded text-xs font-medium transition-colors flex items-center justify-center ${
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
          onClick={() => { haptics.tick(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
          disabled={currentPage === totalPages}
          className="p-2 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Jump to page - Only show when > 5 pages */}
        {totalPages > 5 && (
          <form onSubmit={handleJumpToPage} className="ml-2 flex items-center gap-1">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              placeholder="Ir p/"
              className="w-14 h-7 px-1.5 text-xs text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </form>
        )}
      </div>
    </div>
  ) : null;

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      size="full"
      maxWidth="3xl"
      showHeader={false}
      footer={paginationFooter}
      contentClassName="p-0"
    >
      {/* Custom Header with Refresh */}
      <div className={`flex items-center justify-between p-3 sm:p-4 border-b shrink-0 ${
        isDark ? 'border-stellar-cyan/10' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-purple-600 dark:bg-purple-500 rounded-lg shrink-0 shadow-sm">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {campaignData.name || campaign.id}
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-xs text-slate-500 dark:text-slate-400">
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
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { haptics.light(); handleRefresh(); }}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { haptics.light(); onClose(); }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={`border-b shrink-0 p-3 sm:p-4 ${
        isDark ? 'border-stellar-cyan/10 bg-space-nebula/50' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="text-center" title="Mensagens enviadas via WhatsApp">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Enviados</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{campaignData.sends || 0}</p>
          </div>
          <div className="text-center" title="Mensagens entregues no dispositivo">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Entregues</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {campaignData.has_delivery_data ? (campaignData.delivered || 0) + (campaignData.read || 0) : '-'}
            </p>
          </div>
          <div className="text-center" title="Mensagens abertas/lidas">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lidas</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {campaignData.has_delivery_data ? (campaignData.read || 0) : '-'}
              {campaignData.has_delivery_data && (campaignData.failed || 0) > 0 && (
                <span className="text-xs text-red-500 ml-1" title="Falhas na entrega">
                  ({campaignData.failed} ✕)
                </span>
              )}
            </p>
          </div>
          <div className="text-center" title="Contatos sendo monitorados">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Rastreados</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{campaignData.contacts_tracked || contacts.length}</p>
          </div>
          <div className="text-center" title="Clientes que retornaram à loja">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Retornaram</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {campaignData.contacts_returned || statusCounts.returned || 0}
            </p>
          </div>
          <div className="text-center" title="Taxa de retorno e receita recuperada">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Taxa / Receita</p>
            <p className="text-lg font-bold">
              <span className={`${(campaignData.return_rate || 0) > 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {formatPercent(campaignData.return_rate || 0)}
              </span>
              <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(campaignData.total_revenue_recovered || 0)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar - Collapsible */}
      <div className={`border-b shrink-0 ${isDark ? 'border-stellar-cyan/10' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between p-2 sm:p-3">
          <button
            onClick={() => { haptics.tick(); setFiltersExpanded(!filtersExpanded); }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 dark:bg-purple-500 text-white">
                {activeFilterCount}
              </span>
            )}
            {filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1">
            <SortPill field="date" label="Data" />
            <SortPill field="name" label="Nome" />
            <SortPill field="status" label="Status" />
          </div>
        </div>

        {filtersExpanded && (
          <div className="px-3 pb-3 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase w-14">Retorno</span>
              <FilterPill active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>
                Todos ({contacts.length})
              </FilterPill>
              <FilterPill active={filterStatus === 'returned'} onClick={() => setFilterStatus('returned')}>
                <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-500" />
                {statusCounts.returned || 0}
              </FilterPill>
              <FilterPill active={filterStatus === 'pending'} onClick={() => setFilterStatus('pending')}>
                <Clock className="w-3 h-3 inline mr-0.5 text-amber-500" />
                {statusCounts.pending || 0}
              </FilterPill>
              <FilterPill active={filterStatus === 'expired'} onClick={() => setFilterStatus('expired')}>
                <XCircle className="w-3 h-3 inline mr-0.5 text-slate-400" />
                {statusCounts.expired || 0}
              </FilterPill>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase w-14">Entrega</span>
              <FilterPill active={filterDelivery === 'all'} onClick={() => setFilterDelivery('all')}>
                Todas
              </FilterPill>
              <FilterPill
                active={filterDelivery === 'delivered'}
                onClick={() => setFilterDelivery('delivered')}
                activeColor="bg-green-600 dark:bg-green-500 text-white"
              >
                <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                {deliveryCounts.delivered || 0}
              </FilterPill>
              <FilterPill
                active={filterDelivery === 'read'}
                onClick={() => setFilterDelivery('read')}
                activeColor="bg-blue-600 dark:bg-blue-500 text-white"
              >
                <BookOpen className="w-3 h-3 inline mr-0.5" />
                {deliveryCounts.read || 0}
              </FilterPill>
              <FilterPill
                active={filterDelivery === 'failed'}
                onClick={() => setFilterDelivery('failed')}
                activeColor="bg-red-600 dark:bg-red-500 text-white"
              >
                <AlertCircle className="w-3 h-3 inline mr-0.5" />
                {deliveryCounts.failed || 0}
              </FilterPill>
              <FilterPill active={filterDelivery === 'pending'} onClick={() => setFilterDelivery('pending')}>
                <Clock className="w-3 h-3 inline mr-0.5" />
                {deliveryCounts.pending || 0}
              </FilterPill>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-2 sm:px-3 pt-2 sm:pt-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contact List */}
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
                    <div className={`p-1.5 rounded-md shrink-0 ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {contact.customer_name || 'Cliente'}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs sm:text-xs text-slate-500 dark:text-slate-400">
                        {contact.phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {contact.phone}
                          </span>
                        )}
                        <span className="hidden sm:inline">CPF: {maskCpf(contact.customer_id)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700"
                        title={getDeliveryLabel(deliveryStatus)}
                      >
                        {getDeliveryIcon(deliveryStatus)}
                        <span className="hidden sm:inline text-slate-600 dark:text-slate-400 ml-0.5">
                          {getDeliveryLabel(deliveryStatus)}
                        </span>
                      </span>

                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>

                      {status === 'returned' && contact.return_revenue > 0 && (
                        <span className="hidden sm:flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(contact.return_revenue)}
                        </span>
                      )}

                      {contact.contacted_at && (
                        <span className="text-xs text-slate-400 dark:text-slate-500" title={new Date(contact.contacted_at).toLocaleDateString('pt-BR')}>
                          <span className="sm:hidden">
                            {new Date(contact.contacted_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <span className="hidden sm:inline">
                            {new Date(contact.contacted_at).toLocaleDateString('pt-BR')}
                          </span>
                        </span>
                      )}
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
    </BaseModal>
  );
};

export default CampaignDetailsModal;
