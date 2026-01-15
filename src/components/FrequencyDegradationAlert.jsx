// FrequencyDegradationAlert.jsx v1.5
// Early warning for customers with growing visit intervals
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.5 (2026-01-14): Responsive 2-row mobile layout
//   - Mobile: Name on row 1, badge + gap history on row 2
//   - Badge shown first (key insight), gap history is secondary
//   - Mobile shows last 4 gaps (truncates gracefully on small screens)
//   - Tablet/Desktop: All info on single row with full 5 gaps
// v1.4 (2026-01-14): Mobile optimization
//   - Hide gap history on mobile to prevent horizontal scroll
//   - Badge (9d → 19d) provides key insight on all screen sizes
//   - Gap history visible on sm+ screens for full detail
// v1.3 (2026-01-14): Clearer interval badge
//   - Replaced percentage badge (+97%) with interval change (9d → 19d)
//   - More intuitive: users see actual visit frequency shift
// v1.2 (2026-01-14): UI improvements for consistency
//   - Added pagination (3 customers per page) instead of expand/collapse
//   - Matched hover animation with FirstVisitConversionCard
//   - Consistent height and structure for mobile view
// v1.1 (2026-01-14): Added gap history display
//   - Shows last 5 visit intervals (e.g., "12d → 17d → 44d → 36d → 42d")
//   - Last interval highlighted in amber for visual clarity
//   - Replaces "Usual → Agora" with actual trend data
// v1.0 (2026-01-13): Initial implementation
//   - Shows customers whose intervals are increasing
//   - VIP-focused prioritization
//   - Revenue at-risk calculation
//   - Expandable customer preview list

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  TrendingDown,
  Crown,
  Star,
  ChevronRight,
  ChevronLeft,
  Users,
  DollarSign,
  Lightbulb,
  Phone
} from 'lucide-react';
import { haptics } from '../utils/haptics';
import ContextHelp from './ContextHelp';

// Smooth hover animation (matches FirstVisitConversionCard)
const hoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  hover: { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }
};

const hoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

// Format currency in Brazilian Real
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Gap history component
const GapHistory = ({ gaps }) => (
  <div className="flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400">
    {gaps?.map((gap, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <span className="text-slate-300 dark:text-slate-600">→</span>}
        <span className={
          i === gaps.length - 1
            ? 'text-amber-600 dark:text-amber-400 font-semibold'
            : ''
        }>
          {gap}d
        </span>
      </span>
    ))}
  </div>
);

// Interval badge component
const IntervalBadge = ({ historicalAvg, recentAvg }) => (
  <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
    <TrendingDown className="w-3 h-3 text-red-500" />
    <span className="text-xs font-bold text-red-600 dark:text-red-400">
      {historicalAvg}d → {recentAvg}d
    </span>
  </div>
);

// Customer row in preview list
const CustomerPreviewRow = ({ customer, onOpenProfile }) => {
  const handleClick = useCallback(() => {
    if (onOpenProfile) {
      haptics.light();
      onOpenProfile(customer.id);
    }
  }, [onOpenProfile, customer.id]);

  const SegmentIcon = customer.isPriority ? Crown : Star;

  return (
    <button
      onClick={handleClick}
      className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
    >
      {/* Mobile: 2 rows | Desktop: 1 row */}
      <div className="flex items-center gap-3">
        {/* Segment icon */}
        <div className={`p-1.5 rounded-lg shrink-0 ${
          customer.isPriority
            ? 'bg-amber-100 dark:bg-amber-900/30'
            : 'bg-slate-100 dark:bg-slate-700'
        }`}>
          <SegmentIcon className={`w-3.5 h-3.5 ${
            customer.isPriority
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400'
          }`} />
        </div>

        {/* Desktop: Name + gap history inline */}
        <div className="hidden sm:flex flex-1 items-center gap-3 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
            {customer.name}
          </p>
          <GapHistory gaps={customer.recentGaps} />
        </div>

        {/* Mobile: Name only */}
        <p className="sm:hidden flex-1 text-sm font-medium text-slate-800 dark:text-white truncate">
          {customer.name}
        </p>

        {/* Desktop: Badge + chevron */}
        <div className="hidden sm:flex items-center gap-2">
          <IntervalBadge historicalAvg={customer.historicalAvg} recentAvg={customer.recentAvg} />
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
        </div>

        {/* Mobile: Chevron only */}
        <ChevronRight className="sm:hidden w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
      </div>

      {/* Mobile: Second row with badge (key insight) + gap history (truncates if needed) */}
      <div className="sm:hidden flex items-center gap-2 mt-1.5 ml-9 overflow-hidden">
        <IntervalBadge historicalAvg={customer.historicalAvg} recentAvg={customer.recentAvg} />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 text-xs font-mono text-slate-400 dark:text-slate-500 truncate">
            {customer.recentGaps?.slice(-4).map((gap, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600">→</span>}
                <span className={
                  i === (customer.recentGaps?.slice(-4).length || 0) - 1
                    ? 'text-amber-500 dark:text-amber-400 font-semibold'
                    : ''
                }>
                  {gap}d
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

const ITEMS_PER_PAGE = 3;

const FrequencyDegradationAlert = ({
  data,
  onContactCustomers,
  onOpenCustomerProfile,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Handle missing data
  const metrics = useMemo(() => {
    if (!data) {
      return {
        customers: [],
        count: 0,
        priorityCount: 0,
        totalRevenue: 0,
        avgDegradation: 0
      };
    }
    return data;
  }, [data]);

  // Don't render if no data to show
  if (metrics.count === 0) {
    return null;
  }

  // Visibility logic: show only if >= 3 customers OR any VIP is slipping
  const shouldShow = metrics.count >= 3 || metrics.priorityCount >= 1;
  if (!shouldShow) {
    return null;
  }

  // Pagination logic
  const totalPages = Math.ceil(metrics.customers.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleCustomers = metrics.customers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleContactAll = useCallback(() => {
    if (onContactCustomers) {
      haptics.light();
      onContactCustomers(metrics.customers);
    }
  }, [onContactCustomers, metrics.customers]);

  const handlePrevPage = useCallback(() => {
    haptics.light();
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    haptics.light();
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  // Insight based on data
  const insight = useMemo(() => {
    if (metrics.priorityCount > 0) {
      return {
        text: `${metrics.priorityCount} cliente${metrics.priorityCount > 1 ? 's' : ''} VIP/Frequente mostrando sinais de esfriamento.`,
        subtext: 'Contato proativo pode prevenir churn de alto valor.'
      };
    }
    return {
      text: 'Estes clientes ainda estão "Saudáveis" mas visitam menos.',
      subtext: 'Ação antecipada pode recuperá-los antes do risco.'
    };
  }, [metrics.priorityCount]);

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={hoverAnimation}
      transition={hoverTransition}
      className={`
        bg-white dark:bg-slate-800
        rounded-xl
        border border-amber-200 dark:border-amber-800/50
        border-l-4 border-l-amber-500 dark:border-l-amber-400
        p-4 sm:p-5
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Frequência Diminuindo
              <ContextHelp
                title="Como funciona este alerta?"
                description="Detecta clientes ATIVOS cujos intervalos entre visitas estão aumentando. Se um cliente que vinha a cada 10 dias passa a vir a cada 20 dias, ele aparece aqui ANTES de entrar em risco. É um sistema de alerta precoce."
              />
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              Alerta
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clientes com intervalos de visita crescentes
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              {metrics.count}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">clientes</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {metrics.priorityCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">VIPs</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              {formatCurrency(metrics.totalRevenue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">em risco</p>
        </div>
      </div>

      {/* Customer list with pagination - fixed height for 3 rows (taller on mobile due to 2-line layout) */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700 mb-4 min-h-[210px] sm:min-h-[156px]">
        {visibleCustomers.map(customer => (
          <CustomerPreviewRow
            key={customer.id}
            customer={customer}
            onOpenProfile={onOpenCustomerProfile}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {currentPage + 1} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action button */}
      {onContactCustomers && (
        <button
          onClick={handleContactAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors mb-4"
        >
          <Phone className="w-4 h-4" />
          Contatar antes que virem "Em Risco"
        </button>
      )}

      {/* Insight */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Lightbulb className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {insight.text}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {insight.subtext}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default FrequencyDegradationAlert;
