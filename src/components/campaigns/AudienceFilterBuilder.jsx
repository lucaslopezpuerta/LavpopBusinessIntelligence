// AudienceFilterBuilder.jsx v2.1 - INPUT OVERFLOW FIX
// Custom audience filtering for campaign creation
// Design System v5.0 compliant - Variant D (Glassmorphism Cosmic)
//
// FEATURES:
// - Accordion behavior: only one section expanded at a time
// - Cosmic glassmorphism styling with stellar-cyan accents
// - Framer Motion animations for smooth expand/collapse
// - Segment-specific color coding (VIP=yellow, Frequente=blue, etc.)
// - Risk level color coding (Healthy=emerald, Churning=red, etc.)
// - Touch-friendly chip buttons with haptic feedback
//
// CHANGELOG:
// v2.1 (2026-01-18): Input overflow fix
//   - Changed number inputs from flex to grid layout
//   - Added min-w-0 to allow inputs to shrink properly
//   - Inputs no longer overflow container on mobile
// v2.0 (2026-01-18): Cosmic Design Overhaul
//   - Full Design System v5.0 compliance
//   - Accordion behavior (single section expanded)
//   - Framer Motion animations for section transitions
//   - Cosmic gradients and glassmorphism panels
//   - Segment-specific colors for RFM chips
//   - Risk-specific colors for risk level chips
//   - Enhanced results preview with gradient background
//   - Stellar-cyan accents throughout
// v1.0 (2026-01-08): Initial implementation
//   - Time-based filters (last visit range)
//   - Financial filters (spend, wallet balance)
//   - Behavior filters (RFM segments, risk levels)
//   - Live preview of filtered customer count
//   - Collapsible filter sections

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { haptics } from '../../utils/haptics';

// RFM Segments with cosmic color mapping
const RFM_SEGMENTS = [
  { id: 'VIP', label: 'VIP', color: 'yellow', bgLight: 'bg-yellow-100', bgDark: 'dark:bg-yellow-900/40', textLight: 'text-yellow-700', textDark: 'dark:text-yellow-300', selectedBg: 'bg-yellow-500', borderHover: 'hover:border-yellow-400 dark:hover:border-yellow-500/50' },
  { id: 'Frequente', label: 'Frequente', color: 'blue', bgLight: 'bg-blue-100', bgDark: 'dark:bg-blue-900/40', textLight: 'text-blue-700', textDark: 'dark:text-blue-300', selectedBg: 'bg-blue-500', borderHover: 'hover:border-blue-400 dark:hover:border-blue-500/50' },
  { id: 'Promissor', label: 'Promissor', color: 'cyan', bgLight: 'bg-cyan-100', bgDark: 'dark:bg-cyan-900/40', textLight: 'text-cyan-700', textDark: 'dark:text-cyan-300', selectedBg: 'bg-cyan-500', borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500/50' },
  { id: 'Esfriando', label: 'Esfriando', color: 'slate', bgLight: 'bg-slate-200', bgDark: 'dark:bg-slate-700/50', textLight: 'text-slate-700', textDark: 'dark:text-slate-300', selectedBg: 'bg-slate-500', borderHover: 'hover:border-slate-400 dark:hover:border-slate-500/50' },
  { id: 'Inativo', label: 'Inativo', color: 'gray', bgLight: 'bg-gray-200', bgDark: 'dark:bg-gray-700/50', textLight: 'text-gray-600', textDark: 'dark:text-gray-400', selectedBg: 'bg-gray-500', borderHover: 'hover:border-gray-400 dark:hover:border-gray-500/50' }
];

// Risk Levels with cosmic color mapping
const RISK_LEVELS = [
  { id: 'Healthy', label: 'Saudavel', color: 'emerald', bgLight: 'bg-emerald-100', bgDark: 'dark:bg-emerald-900/40', textLight: 'text-emerald-700', textDark: 'dark:text-emerald-300', selectedBg: 'bg-emerald-500', borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500/50' },
  { id: 'Monitor', label: 'Monitorar', color: 'blue', bgLight: 'bg-blue-100', bgDark: 'dark:bg-blue-900/40', textLight: 'text-blue-700', textDark: 'dark:text-blue-300', selectedBg: 'bg-blue-500', borderHover: 'hover:border-blue-400 dark:hover:border-blue-500/50' },
  { id: 'At Risk', label: 'Em Risco', color: 'amber', bgLight: 'bg-amber-100', bgDark: 'dark:bg-amber-900/40', textLight: 'text-amber-700', textDark: 'dark:text-amber-300', selectedBg: 'bg-amber-500', borderHover: 'hover:border-amber-400 dark:hover:border-amber-500/50' },
  { id: 'Churning', label: 'Critico', color: 'red', bgLight: 'bg-red-100', bgDark: 'dark:bg-red-900/40', textLight: 'text-red-700', textDark: 'dark:text-red-300', selectedBg: 'bg-red-500', borderHover: 'hover:border-red-400 dark:hover:border-red-500/50' },
  { id: 'New Customer', label: 'Novo', color: 'purple', bgLight: 'bg-purple-100', bgDark: 'dark:bg-purple-900/40', textLight: 'text-purple-700', textDark: 'dark:text-purple-300', selectedBg: 'bg-purple-500', borderHover: 'hover:border-purple-400 dark:hover:border-purple-500/50' },
  { id: 'Lost', label: 'Perdido', color: 'slate', bgLight: 'bg-slate-200', bgDark: 'dark:bg-slate-700/50', textLight: 'text-slate-600', textDark: 'dark:text-slate-400', selectedBg: 'bg-slate-500', borderHover: 'hover:border-slate-400 dark:hover:border-slate-500/50' }
];

// Time range options
const TIME_RANGES = [
  { id: 'last7', label: 'Ultimos 7 dias', days: 7, type: 'recent' },
  { id: 'last14', label: 'Ultimos 14 dias', days: 14, type: 'recent' },
  { id: 'last30', label: 'Ultimos 30 dias', days: 30, type: 'recent' },
  { id: 'last60', label: 'Ultimos 60 dias', days: 60, type: 'recent' },
  { id: 'last90', label: 'Ultimos 90 dias', days: 90, type: 'recent' },
  { id: 'moreThan30', label: 'Mais de 30 dias', days: 30, type: 'inactive' },
  { id: 'moreThan60', label: 'Mais de 60 dias', days: 60, type: 'inactive' },
  { id: 'moreThan90', label: 'Mais de 90 dias', days: 90, type: 'inactive' }
];

// Animation variants for section content
const sectionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
};

const AudienceFilterBuilder = ({
  allCustomers = [],
  onFilteredCustomers,
  initialFilters = {},
  className = ''
}) => {
  const { isDark } = useTheme();

  // Filter state
  const [filters, setFilters] = useState({
    // Time-based
    lastVisitRange: null,

    // Financial
    minSpend: '',
    maxSpend: '',
    minWalletBalance: '',
    maxWalletBalance: '',

    // Behavior
    minVisits: '',
    maxVisits: '',
    rfmSegments: [],
    riskLevels: [],

    ...initialFilters
  });

  // Accordion state - only one section open at a time (null = all closed)
  const [expandedSection, setExpandedSection] = useState('time');

  // Toggle section expansion (accordion behavior)
  const toggleSection = useCallback((section) => {
    haptics.tick();
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    haptics.tick();
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Toggle item in array filter
  const toggleArrayFilter = useCallback((key, value) => {
    haptics.tick();
    setFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    haptics.tick();
    setFilters({
      lastVisitRange: null,
      minSpend: '',
      maxSpend: '',
      minWalletBalance: '',
      maxWalletBalance: '',
      minVisits: '',
      maxVisits: '',
      rfmSegments: [],
      riskLevels: []
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.lastVisitRange !== null ||
      filters.minSpend !== '' ||
      filters.maxSpend !== '' ||
      filters.minWalletBalance !== '' ||
      filters.maxWalletBalance !== '' ||
      filters.minVisits !== '' ||
      filters.maxVisits !== '' ||
      filters.rfmSegments.length > 0 ||
      filters.riskLevels.length > 0
    );
  }, [filters]);

  // Apply filters to customer list
  const filteredCustomers = useMemo(() => {
    if (!allCustomers || allCustomers.length === 0) return [];

    return allCustomers.filter(customer => {
      // Time-based filters
      if (filters.lastVisitRange) {
        const daysSince = customer.daysSinceLastVisit ?? Infinity;
        const range = TIME_RANGES.find(r => r.id === filters.lastVisitRange);
        if (range) {
          if (range.type === 'recent' && daysSince > range.days) return false;
          if (range.type === 'inactive' && daysSince <= range.days) return false;
        }
      }

      // Financial filters - Total spend
      if (filters.minSpend !== '' && filters.minSpend !== null) {
        const minVal = parseFloat(filters.minSpend);
        if (!isNaN(minVal) && (customer.netTotal || 0) < minVal) return false;
      }
      if (filters.maxSpend !== '' && filters.maxSpend !== null) {
        const maxVal = parseFloat(filters.maxSpend);
        if (!isNaN(maxVal) && (customer.netTotal || 0) > maxVal) return false;
      }

      // Financial filters - Wallet balance
      if (filters.minWalletBalance !== '' && filters.minWalletBalance !== null) {
        const minVal = parseFloat(filters.minWalletBalance);
        if (!isNaN(minVal) && (customer.walletBalance || 0) < minVal) return false;
      }
      if (filters.maxWalletBalance !== '' && filters.maxWalletBalance !== null) {
        const maxVal = parseFloat(filters.maxWalletBalance);
        if (!isNaN(maxVal) && (customer.walletBalance || 0) > maxVal) return false;
      }

      // Behavior filters - Visit count
      if (filters.minVisits !== '' && filters.minVisits !== null) {
        const minVal = parseInt(filters.minVisits);
        if (!isNaN(minVal) && (customer.transactions || 0) < minVal) return false;
      }
      if (filters.maxVisits !== '' && filters.maxVisits !== null) {
        const maxVal = parseInt(filters.maxVisits);
        if (!isNaN(maxVal) && (customer.transactions || 0) > maxVal) return false;
      }

      // RFM Segment filter
      if (filters.rfmSegments.length > 0) {
        if (!filters.rfmSegments.includes(customer.segment)) return false;
      }

      // Risk Level filter
      if (filters.riskLevels.length > 0) {
        if (!filters.riskLevels.includes(customer.riskLevel)) return false;
      }

      return true;
    });
  }, [allCustomers, filters]);

  // Filter to only valid WhatsApp phones
  const validPhoneCustomers = useMemo(() => {
    return filteredCustomers.filter(c => isValidBrazilianMobile(c.phone));
  }, [filteredCustomers]);

  // Notify parent when filtered customers change
  useEffect(() => {
    if (onFilteredCustomers) {
      onFilteredCustomers(validPhoneCustomers);
    }
  }, [validPhoneCustomers, onFilteredCustomers]);

  // Count active filters in each section
  const timeFilterCount = filters.lastVisitRange ? 1 : 0;
  const financialFilterCount = [
    filters.minSpend, filters.maxSpend, filters.minWalletBalance, filters.maxWalletBalance
  ].filter(v => v !== '' && v !== null).length;
  const behaviorFilterCount =
    (filters.minVisits !== '' ? 1 : 0) +
    (filters.maxVisits !== '' ? 1 : 0) +
    filters.rfmSegments.length +
    filters.riskLevels.length;

  // Section header component with cosmic styling
  const SectionHeader = ({ title, icon: Icon, section, count, accentColor = 'stellar-cyan' }) => {
    const isExpanded = expandedSection === section;

    return (
      <button
        onClick={() => toggleSection(section)}
        className={`
          w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200
          ${isExpanded
            ? 'bg-gradient-to-r from-stellar-cyan/10 via-stellar-cyan/5 to-transparent dark:from-stellar-cyan/20 dark:via-stellar-cyan/10 dark:to-transparent border-stellar-cyan/30 dark:border-stellar-cyan/40'
            : 'bg-slate-50 dark:bg-space-nebula/50 hover:bg-slate-100 dark:hover:bg-space-nebula border-slate-200 dark:border-stellar-cyan/10'
          }
          border
        `}
      >
        <div className="flex items-center gap-2.5">
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center
            ${isExpanded
              ? 'bg-stellar-cyan/20 dark:bg-stellar-cyan/30'
              : 'bg-slate-200 dark:bg-space-dust'
            }
          `}>
            <Icon className={`
              w-3.5 h-3.5
              ${isExpanded
                ? 'text-stellar-cyan'
                : 'text-slate-500 dark:text-slate-400'
              }
            `} />
          </div>
          <span className={`
            text-sm font-semibold
            ${isExpanded
              ? 'text-stellar-cyan dark:text-stellar-cyan'
              : 'text-slate-700 dark:text-slate-300'
            }
          `}>
            {title}
          </span>
          {count > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-stellar-cyan/20 dark:bg-stellar-cyan/30 text-stellar-cyan rounded-full min-w-[18px] text-center">
              {count}
            </span>
          )}
        </div>
        <ChevronDown className={`
          w-4 h-4 transition-transform duration-200
          ${isExpanded ? 'rotate-180 text-stellar-cyan' : 'text-slate-400 dark:text-slate-500'}
        `} />
      </button>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Results Preview - Cosmic Gradient Card */}
      <div className="p-3 sm:p-4 bg-gradient-to-br from-stellar-cyan/10 via-purple-500/5 to-indigo-500/10 dark:from-stellar-cyan/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-stellar-cyan/20 dark:border-stellar-cyan/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-stellar flex items-center justify-center shadow-lg shadow-stellar-cyan/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {validPhoneCustomers.length}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                clientes com WhatsApp valido
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stellar-cyan hover:bg-stellar-cyan/10 dark:hover:bg-stellar-cyan/20 rounded-lg transition-colors border border-stellar-cyan/20 dark:border-stellar-cyan/30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
        {filteredCustomers.length !== validPhoneCustomers.length && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {filteredCustomers.length - validPhoneCustomers.length} clientes sem WhatsApp valido
          </p>
        )}
      </div>

      {/* Time-based Filters */}
      <div className="space-y-0">
        <SectionHeader
          title="Ultima visita"
          icon={Calendar}
          section="time"
          count={timeFilterCount}
        />
        <AnimatePresence initial={false}>
          {expandedSection === 'time' && (
            <motion.div
              key="time-content"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={sectionVariants}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 px-1 space-y-3">
                {/* Recent visitors */}
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    Clientes que visitaram recentemente
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_RANGES.filter(r => r.type === 'recent').map(range => {
                      const isSelected = filters.lastVisitRange === range.id;
                      return (
                        <button
                          key={range.id}
                          onClick={() => updateFilter('lastVisitRange', isSelected ? null : range.id)}
                          className={`
                            px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${isSelected
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                              : 'bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/15 hover:border-emerald-400 dark:hover:border-emerald-500/50'
                            }
                          `}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {range.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inactive (win-back) */}
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Clientes inativos (win-back)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_RANGES.filter(r => r.type === 'inactive').map(range => {
                      const isSelected = filters.lastVisitRange === range.id;
                      return (
                        <button
                          key={range.id}
                          onClick={() => updateFilter('lastVisitRange', isSelected ? null : range.id)}
                          className={`
                            px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${isSelected
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                              : 'bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/15 hover:border-amber-400 dark:hover:border-amber-500/50'
                            }
                          `}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {range.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Financial Filters */}
      <div className="space-y-0">
        <SectionHeader
          title="Gasto e Saldo"
          icon={DollarSign}
          section="financial"
          count={financialFilterCount}
        />
        <AnimatePresence initial={false}>
          {expandedSection === 'financial' && (
            <motion.div
              key="financial-content"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={sectionVariants}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 px-1 space-y-4">
                {/* Total Spend Range */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Gasto total (R$)
                  </label>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minSpend}
                      onChange={(e) => updateFilter('minSpend', e.target.value)}
                      className="w-full min-w-0 h-9 px-3 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40 dark:focus:ring-stellar-cyan/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <span className="text-slate-400 dark:text-slate-500 text-xs">até</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSpend}
                      onChange={(e) => updateFilter('maxSpend', e.target.value)}
                      className="w-full min-w-0 h-9 px-3 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40 dark:focus:ring-stellar-cyan/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Wallet Balance Range */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Saldo na carteira (R$)
                  </label>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minWalletBalance}
                      onChange={(e) => updateFilter('minWalletBalance', e.target.value)}
                      className="w-full min-w-0 h-9 px-3 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40 dark:focus:ring-stellar-cyan/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <span className="text-slate-400 dark:text-slate-500 text-xs">até</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxWalletBalance}
                      onChange={(e) => updateFilter('maxWalletBalance', e.target.value)}
                      className="w-full min-w-0 h-9 px-3 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40 dark:focus:ring-stellar-cyan/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Behavior Filters */}
      <div className="space-y-0">
        <SectionHeader
          title="Comportamento"
          icon={Activity}
          section="behavior"
          count={behaviorFilterCount}
        />
        <AnimatePresence initial={false}>
          {expandedSection === 'behavior' && (
            <motion.div
              key="behavior-content"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={sectionVariants}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 px-1 space-y-4">
                {/* Visit Count */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Numero de visitas
                  </label>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 max-w-[200px]">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minVisits}
                      onChange={(e) => updateFilter('minVisits', e.target.value)}
                      className="w-full min-w-0 h-9 px-3 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40 dark:focus:ring-stellar-cyan/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <span className="text-slate-400 dark:text-slate-500 text-xs">até</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxVisits}
                      onChange={(e) => updateFilter('maxVisits', e.target.value)}
                      className="w-full min-w-0 h-9 px-3 text-sm bg-white dark:bg-space-dust border border-slate-200 dark:border-stellar-cyan/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-stellar-cyan/40 dark:focus:ring-stellar-cyan/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* RFM Segments */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    Segmento RFM
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {RFM_SEGMENTS.map(segment => {
                      const isSelected = filters.rfmSegments.includes(segment.id);
                      return (
                        <button
                          key={segment.id}
                          onClick={() => toggleArrayFilter('rfmSegments', segment.id)}
                          className={`
                            px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${isSelected
                              ? `${segment.selectedBg} text-white shadow-md`
                              : `bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/15 ${segment.borderHover}`
                            }
                          `}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {segment.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Levels */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Nivel de risco
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {RISK_LEVELS.map(level => {
                      const isSelected = filters.riskLevels.includes(level.id);
                      return (
                        <button
                          key={level.id}
                          onClick={() => toggleArrayFilter('riskLevels', level.id)}
                          className={`
                            px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${isSelected
                              ? `${level.selectedBg} text-white shadow-md`
                              : `bg-white dark:bg-space-dust text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stellar-cyan/15 ${level.borderHover}`
                            }
                          `}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Empty state when no customers match */}
      {hasActiveFilters && validPhoneCustomers.length === 0 && (
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Nenhum cliente encontrado
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Tente ajustar os filtros para encontrar clientes
          </p>
        </div>
      )}
    </div>
  );
};

export default AudienceFilterBuilder;
