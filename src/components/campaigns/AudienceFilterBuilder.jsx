// AudienceFilterBuilder.jsx v1.0
// Custom audience filtering for campaign creation
// Provides on-the-fly filtering as alternative to predefined segments
//
// CHANGELOG:
// v1.0 (2026-01-08): Initial implementation
//   - Time-based filters (last visit range)
//   - Financial filters (spend, wallet balance)
//   - Behavior filters (RFM segments, risk levels)
//   - Live preview of filtered customer count
//   - Collapsible filter sections

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Filter,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { isValidBrazilianMobile } from '../../utils/phoneUtils';

// RFM Segments available for filtering
const RFM_SEGMENTS = [
  { id: 'VIP', label: 'VIP', color: 'yellow' },
  { id: 'Frequente', label: 'Frequente', color: 'blue' },
  { id: 'Promissor', label: 'Promissor', color: 'cyan' },
  { id: 'Esfriando', label: 'Esfriando', color: 'slate' },
  { id: 'Inativo', label: 'Inativo', color: 'gray' }
];

// Risk Levels available for filtering
const RISK_LEVELS = [
  { id: 'Healthy', label: 'Saudavel', color: 'emerald' },
  { id: 'Monitor', label: 'Monitorar', color: 'blue' },
  { id: 'At Risk', label: 'Em Risco', color: 'amber' },
  { id: 'Churning', label: 'Critico', color: 'red' },
  { id: 'New Customer', label: 'Novo', color: 'purple' },
  { id: 'Lost', label: 'Perdido', color: 'slate' }
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

const AudienceFilterBuilder = ({
  allCustomers = [],
  onFilteredCustomers,
  initialFilters = {},
  className = ''
}) => {
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

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    time: true,
    financial: false,
    behavior: false
  });

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Toggle item in array filter
  const toggleArrayFilter = useCallback((key, value) => {
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

  // Section header component
  const SectionHeader = ({ title, icon: Icon, section, count }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
        {count > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
            {count}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );

  // Chip button for selections
  const ChipButton = ({ selected, onClick, children, color = 'slate' }) => (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${selected
          ? `bg-${color}-600 text-white shadow-md`
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
        }
      `}
    >
      {children}
    </button>
  );

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Preview */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {validPhoneCustomers.length}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                clientes com WhatsApp valido
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar filtros
            </button>
          )}
        </div>
        {filteredCustomers.length !== validPhoneCustomers.length && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {filteredCustomers.length - validPhoneCustomers.length} clientes sem WhatsApp valido
          </p>
        )}
      </div>

      {/* Time-based Filters */}
      <div className="space-y-2">
        <SectionHeader
          title="Ultima visita"
          icon={Calendar}
          section="time"
          count={timeFilterCount}
        />
        {expandedSections.time && (
          <div className="px-4 py-3 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Clientes que visitaram recentemente:
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.filter(r => r.type === 'recent').map(range => (
                <button
                  key={range.id}
                  onClick={() => updateFilter('lastVisitRange', filters.lastVisitRange === range.id ? null : range.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${filters.lastVisitRange === range.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-2">
              Clientes inativos (win-back):
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.filter(r => r.type === 'inactive').map(range => (
                <button
                  key={range.id}
                  onClick={() => updateFilter('lastVisitRange', filters.lastVisitRange === range.id ? null : range.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${filters.lastVisitRange === range.id
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-500'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Financial Filters */}
      <div className="space-y-2">
        <SectionHeader
          title="Gasto e Saldo"
          icon={DollarSign}
          section="financial"
          count={financialFilterCount}
        />
        {expandedSections.financial && (
          <div className="px-4 py-3 space-y-4">
            {/* Total Spend Range */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Gasto total (R$)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minSpend}
                  onChange={(e) => updateFilter('minSpend', e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxSpend}
                  onChange={(e) => updateFilter('maxSpend', e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Wallet Balance Range */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Saldo na carteira (R$)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minWalletBalance}
                  onChange={(e) => updateFilter('minWalletBalance', e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxWalletBalance}
                  onChange={(e) => updateFilter('maxWalletBalance', e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Behavior Filters */}
      <div className="space-y-2">
        <SectionHeader
          title="Comportamento"
          icon={Users}
          section="behavior"
          count={behaviorFilterCount}
        />
        {expandedSections.behavior && (
          <div className="px-4 py-3 space-y-4">
            {/* Visit Count */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Numero de visitas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minVisits}
                  onChange={(e) => updateFilter('minVisits', e.target.value)}
                  className="w-20 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxVisits}
                  onChange={(e) => updateFilter('maxVisits', e.target.value)}
                  className="w-20 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* RFM Segments */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Segmento RFM
              </label>
              <div className="flex flex-wrap gap-2">
                {RFM_SEGMENTS.map(segment => (
                  <button
                    key={segment.id}
                    onClick={() => toggleArrayFilter('rfmSegments', segment.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${filters.rfmSegments.includes(segment.id)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500'
                      }
                    `}
                  >
                    {filters.rfmSegments.includes(segment.id) && (
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    )}
                    {segment.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Levels */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Nivel de risco
              </label>
              <div className="flex flex-wrap gap-2">
                {RISK_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => toggleArrayFilter('riskLevels', level.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${filters.riskLevels.includes(level.id)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                      }
                    `}
                  >
                    {filters.riskLevels.includes(level.id) && (
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    )}
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state when no customers match */}
      {hasActiveFilters && validPhoneCustomers.length === 0 && (
        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
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
