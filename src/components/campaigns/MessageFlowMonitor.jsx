// MessageFlowMonitor.jsx v4.0 - MOBILE FILTER BOTTOM SHEET
// Unified message tracking view: KPIs + filters + paginated card list + detail modal
// Design System v6.4 compliant - Cosmic Precision
//
// CHANGELOG:
// v4.0 (2026-02-13): Mobile filter bottom sheet redesign
//   - Replaced inline expandable filters with BaseModal bottom sheet on mobile
//   - Added active filter chips row with individual dismiss
//   - Fixed CosmicDropdown clipping (now renders in modal portal, not overflow-hidden container)
//   - Reduced mobile vertical space consumption (~250px → ~80px for filters)
//   - Added "Aplicar" button pattern with temp state (batch filter apply)
//   - Fixed text-[10px] → text-xs on filter badge
//   - Desktop layout unchanged
// v3.0 (2026-02-13): Mobile UX overhaul
//   - Fixed text-[10px] violations → text-xs minimum (Design System compliance)
//   - Hide per-page selector on mobile, abbreviate pagination text
//   - Enlarge loading spinner with label during page transitions
//   - PullToRefreshWrapper integration for pull-to-refresh gesture
//   - Move rule dropdown into expandable filter section on mobile
//   - Limit pagination buttons to 3 on mobile (5 on desktop)
//   - EmptyState size="sm" for inline usage
//   - Pass messages array + onNavigate to detail modal for prev/next navigation
// v2.1 (2026-02-12): Mobile filter layout fix
// v2.0 (2026-02-12): Full polish pass
// v1.0 (2026-02-12): Initial implementation

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Inbox,
  X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../utils/apiService';
import { haptics } from '../../utils/haptics';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useIsMobile } from '../../hooks/useMediaQuery';
import PullToRefreshWrapper from '../ui/PullToRefreshWrapper';
import KPICard, { KPIGrid } from '../ui/KPICard';
import EmptyState from '../ui/EmptyState';
import BaseModal from '../ui/BaseModal';
import CosmicDropdown from '../ui/CosmicDropdown';
import MessageFlowCard from './MessageFlowCard';
import MessageFlowDetailModal from './MessageFlowDetailModal';
import { MessageFlowLoadingSkeleton } from '../ui/Skeleton';

// ==================== CONSTANTS ====================

const DATE_FILTERS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'Tudo' },
];

const DELIVERY_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'read', label: 'Lida' },
  { value: 'failed', label: 'Falhou' },
  { value: 'pending', label: 'Pendente' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'automation', label: 'Automação' },
  { value: 'manual', label: 'Manual' },
];

const CAMPAIGN_TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'winback', label: 'Reconquista' },
  { value: 'welcome', label: 'Boas-vindas' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'post_visit', label: 'Pós-visita' },
  { value: 'manual', label: 'Manual' },
  { value: 'promo', label: 'Promocional' },
];

const SORT_OPTIONS = [
  { value: 'contacted_at', label: 'Data' },
  { value: 'customer_name', label: 'Nome' },
  { value: 'delivery_status', label: 'Status' },
];

const PER_PAGE_OPTIONS = [10, 15, 25];

// Convert date filter to ISO date string
const getDateFrom = (filter) => {
  if (filter === 'all') return null;
  const days = parseInt(filter);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

// ==================== ANIMATION VARIANTS ====================

const monitorContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.1,
      when: 'beforeChildren',
      staggerChildren: 0.06,
    },
  },
};

const monitorContainerVariantsReduced = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
};

const sectionVariantsReduced = {
  hidden: {},
  visible: {},
};

const cardListContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.04,
    },
  },
};

const cardListContainerVariantsReduced = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 32 },
  },
};

const cardItemVariantsReduced = {
  hidden: {},
  visible: {},
};

const bannerVariants = {
  initial: { opacity: 0, y: -12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.96 },
};

const bannerVariantsReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ==================== FILTER PILL COMPONENT ====================

const FilterPill = ({ active, onClick, children, isDark }) => (
  <button
    type="button"
    onClick={() => { haptics.tick(); onClick(); }}
    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 flex items-center ${
      active
        ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-sm'
        : isDark
          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`}
  >
    {children}
  </button>
);

// ==================== SORT PILL COMPONENT ====================

const SortPill = ({ active, direction, onClick, children, isDark }) => (
  <button
    type="button"
    onClick={() => { haptics.tick(); onClick(); }}
    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 flex items-center ${
      active
        ? isDark ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-white'
        : isDark ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`}
  >
    {children}
    {active && <span className="ml-0.5">{direction === 'asc' ? '↑' : '↓'}</span>}
  </button>
);

// ==================== ACTIVE FILTER CHIPS (MOBILE) ====================

const ActiveFilterChips = ({ deliveryFilter, typeFilter, campaignTypeFilter, ruleFilter, automationRules, onRemove, isDark }) => {
  const chips = [];

  if (deliveryFilter !== 'all') {
    const label = DELIVERY_FILTERS.find(f => f.value === deliveryFilter)?.label;
    chips.push({ id: 'delivery', label: `Status: ${label}` });
  }
  if (typeFilter !== 'all') {
    const label = TYPE_FILTERS.find(f => f.value === typeFilter)?.label;
    chips.push({ id: 'type', label: `Tipo: ${label}` });
  }
  if (campaignTypeFilter !== 'all') {
    const label = CAMPAIGN_TYPE_FILTERS.find(f => f.value === campaignTypeFilter)?.label;
    chips.push({ id: 'campaignType', label: label });
  }
  if (ruleFilter) {
    const rule = automationRules.find(r => r.id === ruleFilter);
    chips.push({ id: 'rule', label: `Regra: ${rule?.name || '...'}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {chips.map(chip => (
        <button
          key={chip.id}
          type="button"
          onClick={() => { haptics.tick(); onRemove(chip.id); }}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0
            ${isDark
              ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }
          `}
        >
          <span className="truncate max-w-[120px]">{chip.label}</span>
          <X className="w-3 h-3 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
};

// ==================== MOBILE FILTER SHEET ====================

const MobileFilterSheet = ({ isOpen, onClose, tempFilters, onTempChange, onApply, onClear, automationRules, ruleOptions, tempFilterCount, isDark }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    size="large"
    maxWidth="md"
    title="Filtros"
    icon={SlidersHorizontal}
    iconColor="purple"
    solidIconColors
    showDragHandle={true}
    footer={
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { haptics.tick(); onClear(); }}
          disabled={tempFilterCount === 0}
          className={`
            flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isDark
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          `}
        >
          Limpar tudo
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          Aplicar{tempFilterCount > 0 ? ` (${tempFilterCount})` : ''}
        </button>
      </div>
    }
  >
    <div className="space-y-3">
      {/* Status */}
      <div className="space-y-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</span>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {DELIVERY_FILTERS.map(df => (
            <FilterPill key={df.value} active={tempFilters.delivery === df.value} onClick={() => onTempChange('delivery', df.value)} isDark={isDark}>
              {df.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tipo</span>
        <div className="flex items-center gap-1.5">
          {TYPE_FILTERS.map(tf => (
            <FilterPill key={tf.value} active={tempFilters.type === tf.value} onClick={() => onTempChange('type', tf.value)} isDark={isDark}>
              {tf.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Campaign type */}
      <div className="space-y-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Campanha</span>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {CAMPAIGN_TYPE_FILTERS.map(cf => (
            <FilterPill key={cf.value} active={tempFilters.campaignType === cf.value} onClick={() => onTempChange('campaignType', cf.value)} isDark={isDark}>
              {cf.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Rule dropdown */}
      {automationRules.length > 0 && (
        <div className="space-y-1.5">
          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Regra</span>
          <CosmicDropdown
            options={ruleOptions}
            value={tempFilters.rule || ''}
            onChange={(val) => onTempChange('rule', val || null)}
            placeholder="Todas as regras"
          />
        </div>
      )}

      {/* Sort */}
      <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ordenar</span>
        <div className="flex items-center gap-1.5">
          {SORT_OPTIONS.map(so => (
            <SortPill
              key={so.value}
              active={tempFilters.sortBy === so.value}
              direction={tempFilters.sortOrder}
              onClick={() => {
                if (tempFilters.sortBy === so.value) {
                  onTempChange('sortOrder', tempFilters.sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  onTempChange('sortBy', so.value);
                  onTempChange('sortOrder', 'desc');
                }
              }}
              isDark={isDark}
            >
              {so.label}
            </SortPill>
          ))}
        </div>
      </div>
    </div>
  </BaseModal>
);

// ==================== MAIN COMPONENT ====================

const MessageFlowMonitor = () => {
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const toast = useToast();

  // Data state
  const [messages, setMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('all');
  const [ruleFilter, setRuleFilter] = useState(null);

  // Sort state
  const [sortBy, setSortBy] = useState('contacted_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Detail modal state
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Mobile filter bottom sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    delivery: 'all', type: 'all', campaignType: 'all', rule: null, sortBy: 'contacted_at', sortOrder: 'desc',
  });

  // Automation rules for dropdown
  const [automationRules, setAutomationRules] = useState([]);

  // KPI state
  const [kpis, setKpis] = useState({ sent: 0, delivered: 0, read: 0, failed: 0, returned: 0, revenue: 0 });
  const [kpiRefreshing, setKpiRefreshing] = useState(false);

  // New messages indicator
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Pick animation variants based on reduced motion preference
  const containerV = prefersReducedMotion ? monitorContainerVariantsReduced : monitorContainerVariants;
  const sectionV = prefersReducedMotion ? sectionVariantsReduced : sectionVariants;
  const cardListV = prefersReducedMotion ? cardListContainerVariantsReduced : cardListContainerVariants;
  const cardV = prefersReducedMotion ? cardItemVariantsReduced : cardItemVariants;
  const bannerV = prefersReducedMotion ? bannerVariantsReduced : bannerVariants;

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, deliveryFilter, typeFilter, campaignTypeFilter, ruleFilter, dateFilter, sortBy, sortOrder]);

  // Fetch automation rules for dropdown (once)
  useEffect(() => {
    async function fetchRules() {
      try {
        const rules = await api.automation.getAll();
        setAutomationRules(rules || []);
      } catch (err) {
        console.error('Failed to fetch automation rules:', err);
      }
    }
    fetchRules();
  }, []);

  // Main data fetch
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasNewMessages(false);
    try {
      const params = {
        from_date: getDateFrom(dateFilter),
        search: debouncedSearch || undefined,
        delivery_status: deliveryFilter !== 'all' ? deliveryFilter : undefined,
        type_filter: typeFilter !== 'all' ? typeFilter : undefined,
        campaign_type: campaignTypeFilter !== 'all' ? campaignTypeFilter : undefined,
        rule_id: ruleFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: perPage,
        offset: (currentPage - 1) * perPage,
      };

      // Remove undefined values
      Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

      const result = await api.contacts.getMessageFlow(params);
      setMessages(result.messages || []);
      setTotalCount(result.total_count || 0);
    } catch (err) {
      console.error('Failed to fetch message flow:', err);
      setError(err.message || 'Erro ao carregar mensagens');
      setMessages([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, debouncedSearch, deliveryFilter, typeFilter, campaignTypeFilter, ruleFilter, sortBy, sortOrder, currentPage, perPage]);

  // Fetch KPI summary (lightweight server-side aggregation)
  const fetchKPIs = useCallback(async () => {
    setKpiRefreshing(true);
    try {
      const params = {};
      const fromDate = getDateFrom(dateFilter);
      if (fromDate) params.from_date = fromDate;
      if (campaignTypeFilter !== 'all') params.campaign_type = campaignTypeFilter;

      const result = await api.contacts.getMessageFlowKPIs(params);
      setKpis({
        sent: result.sent || 0,
        delivered: result.delivered || 0,
        read: result.read || 0,
        failed: result.failed || 0,
        returned: result.returned || 0,
        revenue: result.revenue || 0,
      });
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
      toast.error('Erro ao carregar indicadores');
    } finally {
      setKpiRefreshing(false);
    }
  }, [dateFilter, campaignTypeFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

  // Realtime: listen for contact_tracking updates
  useEffect(() => {
    const handleUpdate = () => {
      if (currentPage === 1 && sortBy === 'contacted_at' && sortOrder === 'desc') {
        fetchData();
        fetchKPIs();
      } else {
        setHasNewMessages(true);
      }
    };

    window.addEventListener('contactTrackingUpdate', handleUpdate);
    return () => window.removeEventListener('contactTrackingUpdate', handleUpdate);
  }, [currentPage, sortBy, sortOrder, fetchData, fetchKPIs]);

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Refresh handler for toast action & pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setCurrentPage(1);
    setSortBy('contacted_at');
    setSortOrder('desc');
    await Promise.all([fetchData(), fetchKPIs()]);
  }, [fetchData, fetchKPIs]);

  // Show toast for new messages instead of inline banner
  useEffect(() => {
    if (hasNewMessages) {
      toast.info('Novas mensagens recebidas', {
        action: { label: 'Atualizar', onClick: handleRefresh },
      });
      setHasNewMessages(false);
    }
  }, [hasNewMessages, toast, handleRefresh]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setDeliveryFilter('all');
    setTypeFilter('all');
    setCampaignTypeFilter('all');
    setRuleFilter(null);
    haptics.tick();
    toast.info('Filtros limpos');
  }, [toast]);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / perPage);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalCount);

  // Active filter count (for mobile collapsed indicator)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (deliveryFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (campaignTypeFilter !== 'all') count++;
    if (ruleFilter) count++;
    if (debouncedSearch) count++;
    return count;
  }, [deliveryFilter, typeFilter, campaignTypeFilter, ruleFilter, debouncedSearch]);

  // Rule dropdown options
  const ruleOptions = useMemo(() => [
    { value: '', label: 'Todas as regras' },
    ...automationRules.map(r => ({
      value: r.id,
      label: r.name || r.id,
    }))
  ], [automationRules]);

  // Temp filter count (for sheet "Aplicar" badge)
  const tempFilterCount = useMemo(() => {
    let count = 0;
    if (tempFilters.delivery !== 'all') count++;
    if (tempFilters.type !== 'all') count++;
    if (tempFilters.campaignType !== 'all') count++;
    if (tempFilters.rule) count++;
    return count;
  }, [tempFilters]);

  // Temp filter change handler
  const handleTempChange = useCallback((field, value) => {
    setTempFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // Open filter sheet: sync temp state from live filters
  const openFilterSheet = useCallback(() => {
    setTempFilters({
      delivery: deliveryFilter,
      type: typeFilter,
      campaignType: campaignTypeFilter,
      rule: ruleFilter,
      sortBy,
      sortOrder,
    });
    haptics.tick();
    setFilterSheetOpen(true);
  }, [deliveryFilter, typeFilter, campaignTypeFilter, ruleFilter, sortBy, sortOrder]);

  // Apply temp filters to live state
  const applyTempFilters = useCallback(() => {
    setDeliveryFilter(tempFilters.delivery);
    setTypeFilter(tempFilters.type);
    setCampaignTypeFilter(tempFilters.campaignType);
    setRuleFilter(tempFilters.rule);
    setSortBy(tempFilters.sortBy);
    setSortOrder(tempFilters.sortOrder);
    haptics.medium();
    setFilterSheetOpen(false);
    toast.success('Filtros aplicados');
  }, [tempFilters, toast]);

  // Clear temp filters
  const clearTempFilters = useCallback(() => {
    setTempFilters({ delivery: 'all', type: 'all', campaignType: 'all', rule: null, sortBy: 'contacted_at', sortOrder: 'desc' });
    haptics.tick();
  }, []);

  // Remove individual active filter chip
  const removeFilter = useCallback((field) => {
    if (field === 'delivery') setDeliveryFilter('all');
    else if (field === 'type') setTypeFilter('all');
    else if (field === 'campaignType') setCampaignTypeFilter('all');
    else if (field === 'rule') setRuleFilter(null);
  }, []);

  // KPI values
  const deliveryRate = kpis.sent > 0 ? ((kpis.delivered / kpis.sent) * 100).toFixed(1) : '0.0';
  const readRate = kpis.delivered > 0 ? ((kpis.read / kpis.delivered) * 100).toFixed(1) : '0.0';

  // Filter rows renderer (shared between mobile and desktop)
  const renderFilterRows = () => (
    <div className="space-y-1.5 sm:space-y-2.5">
      {/* Status row */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 w-10 sm:w-16 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Status
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap flex-1 min-w-0">
          {DELIVERY_FILTERS.map(df => (
            <FilterPill
              key={df.value}
              active={deliveryFilter === df.value}
              onClick={() => setDeliveryFilter(df.value)}
              isDark={isDark}
            >
              {df.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Type + Rule row */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 w-10 sm:w-16 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Tipo
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap flex-1 min-w-0">
          {TYPE_FILTERS.map(tf => (
            <FilterPill
              key={tf.value}
              active={typeFilter === tf.value}
              onClick={() => setTypeFilter(tf.value)}
              isDark={isDark}
            >
              {tf.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Campaign type row */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 w-10 sm:w-16 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Camp.
          <span className="hidden sm:inline">anha</span>
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap flex-1 min-w-0">
          {CAMPAIGN_TYPE_FILTERS.map(cf => (
            <FilterPill
              key={cf.value}
              active={campaignTypeFilter === cf.value}
              onClick={() => setCampaignTypeFilter(cf.value)}
              isDark={isDark}
            >
              {cf.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Rule row — mobile only (desktop has inline dropdown) */}
      {automationRules.length > 0 && (
        <div className="sm:hidden flex items-center gap-1.5">
          <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 w-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Regra
          </span>
          <div className="flex-1 min-w-0">
            <CosmicDropdown
              options={ruleOptions}
              value={ruleFilter || ''}
              onChange={(val) => setRuleFilter(val || null)}
              placeholder="Todas"
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Sort row */}
      <div className={`flex items-center gap-1.5 sm:gap-2.5 pt-1.5 sm:pt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 w-10 sm:w-16 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Ordem
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
          {SORT_OPTIONS.map(so => (
            <SortPill
              key={so.value}
              active={sortBy === so.value}
              direction={sortOrder}
              onClick={() => handleSort(so.value)}
              isDark={isDark}
            >
              {so.label}
            </SortPill>
          ))}

          {/* Clear filters button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                isDark
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">Limpar filtros</span>
              <span className="sm:hidden">Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Loading skeleton
  if (isLoading && messages.length === 0) {
    return <MessageFlowLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
    <motion.div
      className="space-y-4 sm:space-y-5 overflow-x-hidden"
      variants={containerV}
      initial="hidden"
      animate="visible"
    >

      {/* KPI Strip */}
      <motion.div variants={sectionV}>
        <KPIGrid columns={4}>
          <KPICard
            label="Enviadas"
            mobileLabel="Enviad"
            value={kpis.sent.toLocaleString('pt-BR')}
            icon={Send}
            iconColor="amber"
            status={kpis.failed > 10 ? 'warning' : 'neutral'}
            subtitle={kpis.failed > 0 ? `${kpis.failed} falharam` : undefined}
            isRefreshing={kpiRefreshing}
          />
          <KPICard
            label="Taxa Entrega"
            mobileLabel="Entrega"
            value={`${deliveryRate}%`}
            icon={CheckCircle2}
            iconColor="green"
            status={parseFloat(deliveryRate) >= 90 ? 'success' : parseFloat(deliveryRate) >= 70 ? 'warning' : 'danger'}
            subtitle={`${kpis.delivered} entregues`}
            isRefreshing={kpiRefreshing}
          />
          <KPICard
            label="Taxa Leitura"
            mobileLabel="Leitura"
            value={`${readRate}%`}
            icon={BookOpen}
            iconColor="cyan"
            status={parseFloat(readRate) >= 50 ? 'success' : 'neutral'}
            subtitle={`${kpis.read} lidas`}
            isRefreshing={kpiRefreshing}
          />
          <KPICard
            label="Receita Recuperada"
            mobileLabel="Receita"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(kpis.revenue)}
            icon={DollarSign}
            iconColor="emerald"
            status={kpis.returned > 0 ? 'success' : 'neutral'}
            subtitle={`${kpis.returned} retornaram`}
            isRefreshing={kpiRefreshing}
          />
        </KPIGrid>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        variants={sectionV}
        className={`rounded-xl border p-3 sm:p-4 space-y-2.5 sm:space-y-3 ${
          isDark ? 'bg-space-dust border-stellar-cyan/10' : 'bg-white border-slate-200'
        }`}
      >
        {/* Row 1: Search + Rule dropdown (desktop) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className={`
                w-full pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border transition-colors
                ${isDark
                  ? 'bg-space-nebula border-stellar-cyan/10 text-slate-200 placeholder-slate-500 focus:border-stellar-cyan/30'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-300'
                }
                focus:outline-none focus:ring-1 focus:ring-purple-500/20
              `}
            />
          </div>

          {/* Rule dropdown — desktop only */}
          {automationRules.length > 0 && (
            <div className="hidden sm:block w-48 flex-shrink-0">
              <CosmicDropdown
                options={ruleOptions}
                value={ruleFilter || ''}
                onChange={(val) => setRuleFilter(val || null)}
                placeholder="Todas as regras"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Row 2: Date pills + Filter button (mobile) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {DATE_FILTERS.map(df => (
              <FilterPill
                key={df.value}
                active={dateFilter === df.value}
                onClick={() => setDateFilter(df.value)}
                isDark={isDark}
              >
                {df.label}
              </FilterPill>
            ))}
          </div>

          {/* Mobile: open filter sheet */}
          <button
            type="button"
            onClick={openFilterSheet}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex-shrink-0 ${
              isDark
                ? 'bg-space-nebula border-stellar-cyan/10 text-slate-300 hover:bg-space-nebula/80'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile: Active filter chips */}
        <div className="sm:hidden">
          <ActiveFilterChips
            deliveryFilter={deliveryFilter}
            typeFilter={typeFilter}
            campaignTypeFilter={campaignTypeFilter}
            ruleFilter={ruleFilter}
            automationRules={automationRules}
            onRemove={removeFilter}
            isDark={isDark}
          />
        </div>

        {/* Desktop: always visible filter rows */}
        <div className="hidden sm:block">
          {renderFilterRows()}
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            variants={bannerV}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 28 }}
            className={`p-4 rounded-xl text-sm ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}
          >
            {error}
            <button onClick={fetchData} className="ml-2 underline hover:no-underline">Tentar novamente</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message List with page crossfade */}
      <AnimatePresence mode="wait">
        {!isLoading && messages.length === 0 && !error ? (
          <motion.div
            key="empty"
            variants={bannerV}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            <EmptyState
              icon={Inbox}
              title="Nenhuma mensagem encontrada"
              description={activeFilterCount > 0
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Ainda não há mensagens registradas no período selecionado.'
              }
              size="sm"
            />
          </motion.div>
        ) : (
          <motion.div
            key={`page-${currentPage}`}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative"
          >
            <motion.div
              className="space-y-2.5"
              variants={cardListV}
              initial="hidden"
              animate="visible"
            >
              {messages.map((msg) => (
                <motion.div key={msg.id} variants={cardV}>
                  <MessageFlowCard
                    message={msg}
                    onClick={setSelectedMessage}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Loading overlay for page changes */}
            <AnimatePresence>
              {isLoading && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute inset-0 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-space-void/40' : 'bg-white/50'
                  } backdrop-blur-[2px]`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 animate-spin" />
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Carregando...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={sectionV} className="flex items-center justify-between pt-2">
          {/* Info */}
          <span className={`text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="sm:hidden">{startItem}-{endItem}/{totalCount.toLocaleString('pt-BR')}</span>
            <span className="hidden sm:inline">Mostrando {startItem}-{endItem} de {totalCount.toLocaleString('pt-BR')}</span>
          </span>

          {/* Page controls */}
          <div className="flex items-center gap-0.5">
            <motion.button
              type="button"
              onClick={() => { haptics.tick(); setCurrentPage(p => Math.max(1, p - 1)); }}
              disabled={currentPage === 1}
              whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
              className={`p-2 rounded min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Page numbers - 3 on mobile, 5 on desktop */}
            {(() => {
              const pages = [];
              const maxButtons = isMobile ? 3 : 5;
              let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
              let end = Math.min(totalPages, start + maxButtons - 1);
              if (end - start < maxButtons - 1) start = Math.max(1, end - (maxButtons - 1));

              for (let i = start; i <= end; i++) {
                pages.push(
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => { haptics.tick(); setCurrentPage(i); }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
                    className={`min-h-[44px] min-w-[44px] rounded flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                      i === currentPage
                        ? 'bg-purple-600 text-white'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-700'
                          : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {i}
                  </motion.button>
                );
              }
              return pages;
            })()}

            <motion.button
              type="button"
              onClick={() => { haptics.tick(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
              disabled={currentPage === totalPages}
              whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
              className={`p-2 rounded min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Per-page selector — desktop only */}
          <div className="hidden sm:flex items-center gap-1">
            {PER_PAGE_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { haptics.tick(); setPerPage(opt); }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  perPage === opt
                    ? isDark ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-white'
                    : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {opt}
              </button>
            ))}
            <span className={`text-xs ml-0.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/pg</span>
          </div>
        </motion.div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      {isMobile && (
        <MobileFilterSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          tempFilters={tempFilters}
          onTempChange={handleTempChange}
          onApply={applyTempFilters}
          onClear={clearTempFilters}
          automationRules={automationRules}
          ruleOptions={ruleOptions}
          tempFilterCount={tempFilterCount}
          isDark={isDark}
        />
      )}

      {/* Detail Modal */}
      {selectedMessage && (
        <MessageFlowDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          messages={messages}
          onNavigate={setSelectedMessage}
        />
      )}
    </motion.div>
    </PullToRefreshWrapper>
  );
};

export default MessageFlowMonitor;
