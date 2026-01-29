// FrequencyDegradationAlert.jsx v3.1 - COSMIC PRECISION 2.0
// Early warning for customers with growing visit intervals
// Design System v5.0 compliant - Premium Glass Card pattern
//
// CHANGELOG:
// v3.1 (2026-01-29): Soft stat boxes for reduced eye strain
//   - VIP stat box: solid amber → soft amber-50/amber-500/15 with border
//   - Revenue at risk box: solid red → soft red-50/red-500/15 with border
//   - Insight box: solid blue → soft blue-50/blue-500/15 with border
//   - Maintains semantic color meaning while reducing visual fatigue
// v3.0 (2026-01-29): Cosmic Precision 2.0 - Warning color fix
//   - REVERTED yellow back to AMBER for WCAG AA compliance
//   - Yellow-600 fails WCAG AA (3.5:1 contrast) - amber-600 passes (4.7:1)
//   - All warning elements now use amber-600/500 consistently
// v2.6 (2026-01-29): Migrated orange colors to yellow (REVERTED in v3.0)
// v2.5 (2026-01-29): Migrated amber colors to orange (REVERTED in v3.0)
// v2.4 (2026-01-29): Complete solid color migration for all badges/pills
//   - Segment icon wells: solid amber/slate with white icons
//   - Summary stat boxes: solid fills for VIP and revenue sections
//   - Insight box: solid blue with white icon
// v2.3 (2026-01-28): Solid color badges for WCAG AA compliance
//   - IntervalBadge: solid red with white text
//   - Alert badge: solid amber with white text
// v2.2 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Replaced inline hoverTransition with TWEEN.HOVER constant
// v2.1 (2026-01-20): Premium Glass Effects
//   - Replaced hard borders with soft amber glow system
//   - Added ring-1 with amber tint for warning semantic
//   - Added inner top-edge reflection for glass realism
//   - Outer amber glow for layered depth (matches alert type)
// v2.0 (2026-01-20): Cosmic Glass Card refactor
//   - Replaced amber gradient with glass effect (bg-space-dust/50)
//   - Added backdrop-blur-xl for unified glassmorphism
//   - Removed left border stripe (amber accent via icon badge)
//   - Softer borders blending with page background
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
import { useTheme } from '../contexts/ThemeContext';
import ContextHelp from './ContextHelp';
import useReducedMotion from '../hooks/useReducedMotion';
import { TWEEN } from '../constants/animations';

// Premium glass hover - subtle lift (no boxShadow to preserve CSS glow)
const hoverAnimation = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.005 }
};

// Reduced motion variant - no movement
const hoverAnimationReduced = {
  rest: { opacity: 1 },
  hover: { opacity: 0.95 }
};

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

// Interval badge component (solid colors for WCAG AA compliance)
const IntervalBadge = ({ historicalAvg, recentAvg }) => (
  <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-red-600 dark:bg-red-500 rounded-full">
    <TrendingDown className="w-3 h-3 text-white" />
    <span className="text-xs font-bold text-white">
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
            ? 'bg-amber-600 dark:bg-amber-500'      // FIXED: amber passes WCAG (4.7:1)
            : 'bg-slate-600 dark:bg-slate-500'
        }`}>
          <SegmentIcon className="w-3.5 h-3.5 text-white" />
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
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
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
      variants={prefersReducedMotion ? hoverAnimationReduced : hoverAnimation}
      transition={prefersReducedMotion ? { duration: 0 } : TWEEN.HOVER}
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl
        rounded-2xl
        ${isDark
          ? 'ring-1 ring-amber-500/[0.20] shadow-[0_0_20px_-5px_rgba(245,158,11,0.20),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-amber-200/80 shadow-[0_8px_32px_-12px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        p-4 sm:p-5
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-600 dark:bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
          <AlertTriangle className="w-5 h-5 text-white" />
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
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-600 dark:bg-amber-500 text-white">
              Alerta
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clientes com intervalos de visita crescentes
          </p>
        </div>
      </div>

      {/* Summary stats - Soft backgrounds for reduced eye strain */}
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

        <div className="bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
              {metrics.priorityCount}
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">VIPs</p>
        </div>

        <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-bold text-red-700 dark:text-red-300">
              {formatCurrency(metrics.totalRevenue)}
            </span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">em risco</p>
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors mb-4"
        >
          <Phone className="w-4 h-4" />
          Contatar antes que virem "Em Risco"
        </button>
      )}

      {/* Insight - Soft background for reduced eye strain */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded-lg">
        <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {insight.text}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {insight.subtext}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default FrequencyDegradationAlert;
