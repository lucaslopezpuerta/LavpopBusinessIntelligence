// Directory.jsx v2.6 - SAFE AREA COMPLIANCE
// Dedicated view for browsing and searching customers
// Design System v4.0 compliant - coherent with Dashboard, SocialMedia, etc.
//
// CHANGELOG:
// v2.6 (2026-01-12): Safe area compliance
//   - FAB now uses safe-area-inset for bottom/right positioning
//   - Prevents clipping on iPhone notch and home indicator
// v2.5 (2026-01-12): Pull-to-refresh support
//   - Added PullToRefreshWrapper for mobile swipe-to-refresh gesture
//   - Accepts onDataChange prop for refresh callback
// v2.4 (2026-01-07): Smart filter presets & bulk campaign FAB
//   - NEW: 4 smart filter preset buttons (Em Risco, VIPs Inativos, Novos, Críticos)
//   - NEW: Floating action button for bulk campaign to filtered customers
//   - Preset toggle on/off with visual feedback
//   - FAB appears when filters active AND results > 0
//   - Navigates to /campaigns with prefilledCustomers state
// v2.3 (2025-12-23): Better filter distribution
//   - 4-column grid layout on desktop (Segmento, Risco, Ordenar, Contactados)
//   - 2-column grid on mobile for compact display
//   - Smaller pills (text-[11px]) to fit more content
//   - Clear filters button integrated into Contactados column
// v2.2 (2025-12-23): Mobile filter improvements
//   - Improved mobile layout with 2-column grid for filters
//   - Changed Contactados toggle to pill-style switch (Incluir/Excluir)
//   - Shortened labels for mobile (Risco, Ordenar)
//   - Clear filters button now full-width on mobile
// v2.1 (2025-12-23): Visits sorting fix
//   - Fixed "Mais Visitas" sort to use customer.visits (unique days) not transactions
// v2.0 (2025-12-23): Complete UX redesign
//   - Enhanced header with polished stats pills (Total, Active, At-Risk, Filtered)
//   - Collapsible advanced filters with prominent search bar
//   - Framer Motion animations for filter panel and card grid
//   - localStorage persistence for filter expanded state
//   - Improved responsive design and dark mode support
// v1.2 (2025-12-23): Fixed empty tab rendering
//   - Replaced tiny spinner with DirectoryLoadingSkeleton
//   - Prevents "empty tab" appearance during data loading
// v1.1 (2025-12-16): Full-width layout
//   - REMOVED: Redundant padding (now uses App.jsx padding)
//   - REMOVED: max-w-[1600px] constraint for full-width
//   - Consistent with Dashboard.jsx layout pattern
// v1.0 (2025-12-16): Initial implementation
//   - Extracted from Customers.jsx (was Section 4: Diretório)
//   - Dedicated route in App.jsx
//   - Full-screen customer browsing experience
//   - Enhanced search with instant filtering
//   - CustomerProfileModal integration

import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users as UsersIcon,
  Download,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  UserX,
  Activity,
  AlertTriangle,
  Filter,
  Send,
  Crown,
  UserPlus,
  TrendingDown
} from 'lucide-react';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import CustomerCard from '../components/CustomerCard';
import { useContactTracking } from '../hooks/useContactTracking';
import { DirectoryLoadingSkeleton } from '../components/ui/Skeleton';
import PullToRefreshWrapper from '../components/ui/PullToRefreshWrapper';

// Lazy-load heavy modals
const CustomerProfileModal = lazy(() => import('../components/CustomerProfileModal'));

// Animation variants for filter panel
const filterPanelVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeInOut' }
  }
};

// Animation variants for card grid stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// Stats Pill Component
const StatsPill = ({ icon: Icon, value, label, color = 'slate', pulse = false }) => {
  const colorMap = {
    slate: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-300',
      icon: 'text-slate-500 dark:text-slate-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-500 dark:text-blue-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-500 dark:text-purple-400',
    },
  };

  const colors = colorMap[color];

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5
      ${colors.bg}
      rounded-lg border border-transparent
      transition-all duration-200
    `}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      )}
      <Icon className={`w-4 h-4 ${colors.icon}`} />
      <span className={`text-sm font-bold ${colors.text}`}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </span>
      <span className={`text-xs font-medium ${colors.text} opacity-75 hidden sm:inline`}>
        {label}
      </span>
    </div>
  );
};

// Smart Filter Presets - Quick access to common customer segments
const FILTER_PRESETS = [
  {
    id: 'at-risk-not-contacted',
    label: 'Em Risco',
    mobileLabel: 'Risco',
    icon: AlertTriangle,
    color: 'red',
    filters: { selectedRisk: 'At Risk', excludeContacted: true }
  },
  {
    id: 'vip-inactive',
    label: 'VIPs Inativos',
    mobileLabel: 'VIPs',
    icon: Crown,
    color: 'amber',
    filters: { selectedSegment: 'VIP', sortBy: 'lastVisit', sortDirection: 'asc' }
  },
  {
    id: 'new-customers',
    label: 'Novos',
    mobileLabel: 'Novos',
    icon: UserPlus,
    color: 'emerald',
    filters: { selectedRisk: 'New Customer' }
  },
  {
    id: 'churning',
    label: 'Críticos',
    mobileLabel: 'Crítico',
    icon: TrendingDown,
    color: 'rose',
    filters: { selectedRisk: 'Churning', excludeContacted: true }
  }
];

const Directory = ({ data, onDataChange }) => {
  // Navigation for FAB
  const navigate = useNavigate();

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState('spending');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  const [excludeContacted, setExcludeContacted] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activePreset, setActivePreset] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(() => window.innerWidth < 640 ? 5 : 25);

  // Adjust itemsPerPage when switching between mobile/desktop
  useEffect(() => {
    const mobileOptions = [5, 10, 25];
    const desktopOptions = [25, 50, 100];
    const currentOptions = isMobile ? mobileOptions : desktopOptions;

    if (!currentOptions.includes(itemsPerPage)) {
      setItemsPerPage(currentOptions[0]);
      setCurrentPage(1);
    }
  }, [isMobile, itemsPerPage]);

  // Collapsible filters state
  const [filtersExpanded, setFiltersExpanded] = useState(() => {
    const saved = localStorage.getItem('directoryFiltersExpanded');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Persist filter expanded state
  useEffect(() => {
    localStorage.setItem('directoryFiltersExpanded', JSON.stringify(filtersExpanded));
  }, [filtersExpanded]);

  // Contact tracking
  const { contactedIds } = useContactTracking();

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data || !data.sales || data.sales.length === 0) return null;
    return calculateCustomerMetrics(data.sales, data.rfm || [], data.customer || []);
  }, [data]);

  // Filter & Sort Customers
  const { filteredCustomers, contactedInResults } = useMemo(() => {
    if (!metrics) return { filteredCustomers: [], contactedInResults: 0 };

    let result = [...metrics.allCustomers];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        c.doc.includes(term)
      );
    }

    // Segment Filter
    if (selectedSegment !== 'all') {
      result = result.filter(c => c.segment === selectedSegment);
    }

    // Risk Filter
    if (selectedRisk !== 'all') {
      result = result.filter(c => c.riskLevel === selectedRisk);
    }

    // Count contacted in current results (before excluding)
    const contacted = result.filter(c => contactedIds.has(String(c.doc))).length;

    // Exclude Contacted Filter
    if (excludeContacted) {
      result = result.filter(c => !contactedIds.has(String(c.doc)));
    }

    // Sort (with direction support)
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'spending':
          comparison = b.netTotal - a.netTotal;
          break;
        case 'visits':
          comparison = (b.visits || b.transactions || 0) - (a.visits || a.transactions || 0);
          break;
        case 'lastVisit':
          comparison = b.lastVisit - a.lastVisit;
          break;
        case 'risk':
          const riskOrder = { 'Churning': 4, 'At Risk': 3, 'Monitor': 2, 'Healthy': 1, 'New Customer': 0, 'Lost': -1 };
          comparison = (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt-BR');
          break;
        default:
          comparison = 0;
      }
      // For 'desc' (default), keep natural order; for 'asc', reverse it
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return { filteredCustomers: result, contactedInResults: contacted };
  }, [metrics, searchTerm, selectedSegment, selectedRisk, sortBy, sortDirection, excludeContacted, contactedIds]);

  // Get unique segments for filter
  const segments = useMemo(() => {
    if (!metrics) return [];
    const segs = new Set(metrics.activeCustomers.map(c => c.segment));
    return ['all', ...Array.from(segs)];
  }, [metrics]);

  // Calculate header stats
  const headerStats = useMemo(() => {
    if (!metrics) return null;
    const atRiskCount = metrics.allCustomers.filter(c =>
      ['At Risk', 'Churning'].includes(c.riskLevel)
    ).length;
    const activeCount = metrics.activeCustomers?.length || 0;

    return {
      total: metrics.allCustomers.length,
      active: activeCount,
      atRisk: atRiskCount
    };
  }, [metrics]);

  // Check if filters are active
  const hasActiveFilters = searchTerm || selectedSegment !== 'all' || selectedRisk !== 'all' || excludeContacted;
  const activeFilterCount = [searchTerm, selectedSegment !== 'all', selectedRisk !== 'all', excludeContacted].filter(Boolean).length;

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSegment('all');
    setSelectedRisk('all');
    setExcludeContacted(false);
    setActivePreset(null);
  };

  // Apply a filter preset
  const applyPreset = (preset) => {
    if (activePreset === preset.id) {
      // Toggle off - reset filters
      handleClearFilters();
    } else {
      // Reset filters first
      setSearchTerm('');
      setSelectedSegment('all');
      setSelectedRisk('all');
      setExcludeContacted(false);
      setSortBy('spending');
      setSortDirection('desc');

      // Apply preset filters
      const { filters } = preset;
      if (filters.selectedSegment) setSelectedSegment(filters.selectedSegment);
      if (filters.selectedRisk) setSelectedRisk(filters.selectedRisk);
      if (filters.excludeContacted !== undefined) setExcludeContacted(filters.excludeContacted);
      if (filters.sortBy) setSortBy(filters.sortBy);
      if (filters.sortDirection) setSortDirection(filters.sortDirection);
      setActivePreset(preset.id);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSegment, selectedRisk, sortBy, sortDirection, excludeContacted]);

  // Export Handler
  const handleExport = () => {
    if (!filteredCustomers.length) return;

    const headers = ['Nome', 'Telefone', 'Segmento', 'Risco', 'Gasto Total', 'Visitas', 'Última Visita'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(c => [
        `"${c.name}"`,
        c.phone || '',
        c.segment,
        c.riskLevel,
        c.netTotal.toFixed(2),
        c.transactions,
        c.lastVisit ? c.lastVisit.toLocaleDateString('pt-BR') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clientes_lavpop.csv';
    link.click();
  };

  if (!metrics) {
    return <DirectoryLoadingSkeleton />;
  }

  return (
    <PullToRefreshWrapper onRefresh={onDataChange}>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">

        {/* Enhanced Header with Stats Pills */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-l-4 border-blue-500">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Diretório
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Navegue e gerencie sua base de clientes
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatsPill
            icon={UsersIcon}
            value={headerStats.total}
            label="Total"
            color="slate"
          />
          <StatsPill
            icon={Activity}
            value={headerStats.active}
            label="Ativos"
            color="blue"
          />
          {headerStats.atRisk > 0 && (
            <StatsPill
              icon={AlertTriangle}
              value={headerStats.atRisk}
              label="Em Risco"
              color="amber"
              pulse={true}
            />
          )}
          {hasActiveFilters && filteredCustomers.length !== headerStats.total && (
            <StatsPill
              icon={Filter}
              value={filteredCustomers.length}
              label="Filtrados"
              color="purple"
            />
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Primary Search Row - Always Visible */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

            {/* Large, Prominent Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar cliente, telefone ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full pl-12 pr-10 py-3
                  bg-slate-50 dark:bg-slate-900
                  border border-slate-200 dark:border-slate-700
                  rounded-xl
                  text-base font-medium
                  text-slate-700 dark:text-white
                  placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-lavpop-blue/50 focus:border-lavpop-blue
                  transition-all
                "
                aria-label="Buscar cliente por nome, telefone ou CPF"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={`
                flex items-center justify-center gap-2 px-4 py-3
                rounded-xl text-sm font-semibold
                transition-all duration-200
                min-w-[120px]
                ${filtersExpanded
                  ? 'bg-lavpop-blue text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              `}
              aria-expanded={filtersExpanded}
              aria-controls="advanced-filters-panel"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && !filtersExpanded && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-lavpop-blue text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Export Button - Hidden on mobile */}
            <button
              onClick={handleExport}
              disabled={!filteredCustomers.length}
              className="
                hidden sm:flex items-center justify-center gap-2 px-4 py-3
                bg-lavpop-green hover:bg-green-600
                text-white rounded-xl text-sm font-bold
                transition-all shadow-sm hover:shadow-md
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>

          {/* Smart Filter Presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            {FILTER_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePreset === preset.id;
              const colorClasses = {
                red: isActive
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400',
                amber: isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400',
                emerald: isActive
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400',
                rose: isActive
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400',
              };
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold
                    transition-all active:scale-95
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-lavpop-blue focus-visible:ring-offset-2
                    ${colorClasses[preset.color]}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{preset.label}</span>
                  <span className="sm:hidden">{preset.mobileLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              id="advanced-filters-panel"
              variants={filterPanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">

                {/* Responsive Grid Layout - 2 cols on mobile, 4 cols on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

                  {/* Segment */}
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                      Segmento
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', ...segments.filter(s => s !== 'all')].map(seg => (
                        <button
                          key={seg}
                          onClick={() => setSelectedSegment(seg)}
                          className={`
                            px-2.5 py-1 rounded-full text-[11px] font-semibold
                            transition-all duration-200
                            ${selectedSegment === seg
                              ? 'bg-lavpop-blue text-white shadow-md'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-lavpop-blue hover:text-lavpop-blue'
                            }
                          `}
                        >
                          {seg === 'all' ? 'Todos' : seg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                      Risco
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { value: 'all', label: 'Todos', color: 'bg-slate-400' },
                        { value: 'Healthy', label: 'Saudável', color: 'bg-emerald-500' },
                        { value: 'Monitor', label: 'Monitorar', color: 'bg-blue-500' },
                        { value: 'At Risk', label: 'Risco', color: 'bg-amber-500' },
                        { value: 'Churning', label: 'Crítico', color: 'bg-red-500' },
                        { value: 'New Customer', label: 'Novo', color: 'bg-purple-500' },
                        { value: 'Lost', label: 'Perdido', color: 'bg-slate-500' },
                      ].map(risk => (
                        <button
                          key={risk.value}
                          onClick={() => setSelectedRisk(risk.value)}
                          className={`
                            flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold
                            transition-all duration-200
                            ${selectedRisk === risk.value
                              ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-800 shadow-md'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                            }
                          `}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.color}`} />
                          {risk.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                      Ordenar
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { value: 'spending', label: 'Gasto' },
                        { value: 'visits', label: 'Visitas' },
                        { value: 'lastVisit', label: 'Recente' },
                        { value: 'risk', label: 'Risco' },
                        { value: 'name', label: 'A-Z' },
                      ].map(sort => (
                        <button
                          key={sort.value}
                          onClick={() => {
                            if (sortBy === sort.value) {
                              // Toggle direction if same sort option
                              setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                            } else {
                              // New sort option - reset to desc
                              setSortBy(sort.value);
                              setSortDirection('desc');
                            }
                          }}
                          className={`
                            flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold
                            transition-all duration-200
                            ${sortBy === sort.value
                              ? 'bg-lavpop-blue text-white shadow-md'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-lavpop-blue hover:text-lavpop-blue'
                            }
                          `}
                        >
                          {sort.label}
                          {sortBy === sort.value && (
                            sortDirection === 'desc'
                              ? <ChevronDown className="w-3 h-3" />
                              : <ChevronUp className="w-3 h-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contacted Toggle + Clear */}
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Contactados
                      </label>
                      <button
                        onClick={() => setExcludeContacted(!excludeContacted)}
                        className="
                          w-full max-w-[180px] h-[32px] p-0.5
                          bg-slate-200 dark:bg-slate-700
                          rounded-full
                          relative
                          transition-colors
                        "
                        role="switch"
                        aria-checked={excludeContacted}
                      >
                        {/* Sliding pill */}
                        <div
                          className={`
                            absolute top-0.5 h-[28px] w-[calc(50%-2px)]
                            bg-white dark:bg-slate-800
                            rounded-full shadow-sm
                            transition-all duration-200 ease-out
                            ${excludeContacted ? 'left-[calc(50%)]' : 'left-0.5'}
                          `}
                        />
                        {/* Labels */}
                        <div className="relative flex h-full">
                          <span
                            className={`
                              flex-1 flex items-center justify-center
                              text-[11px] font-semibold transition-colors z-10
                              ${!excludeContacted ? 'text-lavpop-blue' : 'text-slate-400 dark:text-slate-500'}
                            `}
                          >
                            Incluir
                          </span>
                          <span
                            className={`
                              flex-1 flex items-center justify-center
                              text-[11px] font-semibold transition-colors z-10
                              ${excludeContacted ? 'text-lavpop-blue' : 'text-slate-400 dark:text-slate-500'}
                            `}
                          >
                            Excluir
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Clear Filters - inline with contacted */}
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="
                          flex items-center gap-1.5 px-3 py-1.5
                          rounded-full text-[11px] font-semibold
                          text-red-500 dark:text-red-400
                          bg-red-50 dark:bg-red-900/20
                          hover:bg-red-100 dark:hover:bg-red-900/30
                          transition-all w-fit
                        "
                      >
                        <X className="w-3 h-3" />
                        <span>Limpar filtros</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Grid */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
          {filteredCustomers.length > 0 ? (
            <>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={`${currentPage}-${sortBy}-${selectedRisk}-${selectedSegment}`}
              >
                {paginatedCustomers.map(customer => (
                  <motion.div key={customer.doc} variants={cardVariants}>
                    <CustomerCard
                      customer={customer}
                      onClick={() => setSelectedCustomer(customer)}
                      isContacted={contactedIds.has(String(customer.doc))}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Mostrar:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-lavpop-blue/20"
                    >
                      {isMobile ? (
                        <>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </>
                      ) : (
                        <>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </>
                      )}
                    </select>
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">por página</span>
                  </div>

                  {/* Page info */}
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length} Clientes
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* First page */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Primeira página"
                    >
                      «
                    </button>

                    {/* Previous page */}
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Página anterior"
                    >
                      ‹
                    </button>

                    <div className="flex items-center gap-1 sm:gap-1">
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
                            className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNum
                              ? 'bg-lavpop-blue text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next page */}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Próxima página"
                    >
                      ›
                    </button>

                    {/* Last page */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Última página"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <UsersIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Nenhum cliente encontrado</h3>
              <p className="text-slate-400 dark:text-slate-500">Tente ajustar seus filtros de busca</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl"><div className="w-8 h-8 border-3 border-lavpop-blue border-t-transparent rounded-full animate-spin" /></div></div>}>
          <CustomerProfileModal
            customer={selectedCustomer}
            sales={data.sales}
            onClose={() => setSelectedCustomer(null)}
          />
        </Suspense>
      )}

      {/* Floating Action Button - Campaign for filtered customers */}
      <AnimatePresence>
        {hasActiveFilters && filteredCustomers.length > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => navigate('/campaigns', {
              state: { prefilledCustomers: filteredCustomers.map(c => c.doc) }
            })}
            className="
              fixed z-40
              bg-gradient-to-r from-lavpop-blue to-lavpop-green
              text-white px-6 py-3 rounded-full shadow-lg
              flex items-center gap-2 font-semibold
              hover:shadow-xl active:scale-95 transition-all
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-lavpop-blue
            "
            style={{
              bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
              right: 'calc(1.5rem + env(safe-area-inset-right, 0px))'
            }}
            aria-label={`Enviar campanha para ${filteredCustomers.length} clientes`}
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Enviar Campanha</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {filteredCustomers.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </PullToRefreshWrapper>
  );
};

export default Directory;
