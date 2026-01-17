// VisitHeatmap Component v2.5.0
// Size-based density visualization with segment filtering
//
// CHANGELOG:
// v2.5.0 (2026-01-15): Added ContextHelp tooltip
//   - NEW: Tooltip explaining how to read the heatmap
//   - Import ContextHelp component
//   - Updated header h3 to include tooltip
// v2.4.0 (2026-01-15): Card styling upgrade
//   - Added hover animation (lift + shadow) matching AcquisitionCard
//   - Added left accent border (border-l-4 border-l-blue-500)
//   - Added gradient background for depth
//   - Optimized padding for chart to fill more of the card
// v2.3.0 (2026-01-15): Header styling consistency
//   - Updated header to match Design System pattern
//   - Icon wrapped in colored background pill
//   - Title uses text-base font-bold for consistency
// v2.2.0 (2026-01-12): Segment-based color palettes
//   - Each segment now has its own color palette (blue/amber/purple)
//   - Todos: lavpop-blue (default brand color)
//   - Fiéis: amber (matches VIP crown theme)
//   - Novos: purple (matches Novato segment)
//   - Legend dynamically updates to show current segment color
// v2.1.0 (2026-01-12): Tooltip & Sheet UX upgrade
//   - Desktop: Glass morphism tooltip with spring animations (matches Tooltip.jsx)
//   - Mobile: Bottom sheet with swipe-to-close, scroll lock (matches MobileTooltipSheet.jsx)
//   - Portal rendering for proper z-index stacking
// v2.0.0 (2026-01-12): Major UX upgrade
//   - Cell SIZE now scales with density (small dots → large squares)
//   - Peak cell uses amber/gold color for clear distinction
//   - Removed numbers from cells - size/color communicates density
//   - Cleaner minimal legend in header
// v1.0.0 (2025-12-14): Initial implementation
//
// FEATURES:
// - 7 days × 15 hours grid (8h-23h business hours)
// - Segment toggle: Todos | Fiéis (VIP+Frequente) | Novos (Novato + recent first visit)
// - Segment-specific color palettes (blue/amber/purple)
// - Size-based density + quantile color scale
// - Peak hour/day highlighted in amber
// - Dark mode + responsive design

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Sparkles, Crown, X } from 'lucide-react';
import ContextHelp from './ContextHelp';
import { getVisitHeatmapData } from '../utils/customerMetrics';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MOBILE_SHEET, TWEEN } from '../constants/animations';

// Segment configuration with color palettes
const SEGMENTS = [
  {
    id: 'all',
    label: 'Todos',
    icon: Users,
    color: 'lavpop-blue',
    palette: {
      p95: 'bg-lavpop-blue dark:bg-blue-500',
      p90: 'bg-lavpop-blue/80 dark:bg-blue-500/80',
      p75: 'bg-lavpop-blue/60 dark:bg-blue-500/60',
      p50: 'bg-lavpop-blue/40 dark:bg-blue-500/40',
      low: 'bg-lavpop-blue/20 dark:bg-blue-500/20',
      empty: 'bg-slate-200 dark:bg-slate-700/40'
    }
  },
  {
    id: 'loyalists',
    label: 'Fiéis',
    icon: Crown,
    color: 'amber',
    palette: {
      p95: 'bg-amber-500 dark:bg-amber-400',
      p90: 'bg-amber-500/80 dark:bg-amber-400/80',
      p75: 'bg-amber-500/60 dark:bg-amber-400/60',
      p50: 'bg-amber-500/40 dark:bg-amber-400/40',
      low: 'bg-amber-500/20 dark:bg-amber-400/20',
      empty: 'bg-slate-200 dark:bg-slate-700/40'
    }
  },
  {
    id: 'new',
    label: 'Novos',
    icon: Sparkles,
    color: 'purple',
    palette: {
      p95: 'bg-purple-500 dark:bg-purple-400',
      p90: 'bg-purple-500/80 dark:bg-purple-400/80',
      p75: 'bg-purple-500/60 dark:bg-purple-400/60',
      p50: 'bg-purple-500/40 dark:bg-purple-400/40',
      low: 'bg-purple-500/20 dark:bg-purple-400/20',
      empty: 'bg-slate-200 dark:bg-slate-700/40'
    }
  }
];

// Card hover animation - lift + shadow effect (matches AcquisitionCard)
const cardHoverAnimation = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  hover: { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }
};
const cardHoverTransition = { type: 'tween', duration: 0.2, ease: 'easeOut' };

// Tooltip animation config - refined spring with subtle overshoot
const tooltipAnimation = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 4, scale: 0.98 }
};
const springConfig = { type: 'spring', damping: 25, stiffness: 400, mass: 0.5 };

/**
 * Get cell size in pixels based on density quantiles
 * Returns square dimensions for consistent visual appearance
 */
const getCellSize = (count, quantiles, isMobile = false) => {
  // Base sizes: mobile = 20px max, desktop = 28px max
  const maxSize = isMobile ? 20 : 28;

  if (count === 0) return Math.round(maxSize * 0.2);   // Tiny dot for empty
  if (count >= quantiles.p95) return maxSize;          // Full size for peak
  if (count >= quantiles.p90) return Math.round(maxSize * 0.85);
  if (count >= quantiles.p75) return Math.round(maxSize * 0.70);
  if (count >= quantiles.p50) return Math.round(maxSize * 0.55);
  return Math.round(maxSize * 0.35);  // Below median
};

/**
 * Get color class based on quantile thresholds
 * Uses segment-specific color palette
 * Peak cells get amber color for clear distinction (regardless of segment)
 */
const getQuantileColor = (count, quantiles, palette, isPeak = false) => {
  if (count === 0) return palette.empty;
  if (isPeak) return 'bg-amber-400 dark:bg-amber-500';  // Peak = amber/gold (always)
  if (count >= quantiles.p95) return palette.p95;
  if (count >= quantiles.p90) return palette.p90;
  if (count >= quantiles.p75) return palette.p75;
  if (count >= quantiles.p50) return palette.p50;
  return palette.low;
};

/**
 * Get percentile label for a value
 */
const getPercentileLabel = (count, quantiles) => {
  if (count === 0) return 'Vazio';
  if (count >= quantiles.p95) return 'Top 5% (Pico)';
  if (count >= quantiles.p90) return 'Top 10%';
  if (count >= quantiles.p75) return 'Top 25%';
  if (count >= quantiles.p50) return 'Acima da média';
  return 'Abaixo da média';
};

/**
 * Get percentile badge color classes
 */
const getPercentileBadgeClasses = (count, quantiles) => {
  if (count >= quantiles.p95) return 'bg-lavpop-blue/10 text-lavpop-blue dark:bg-blue-500/20 dark:text-blue-400';
  if (count >= quantiles.p75) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
};

/**
 * Desktop Hover Tooltip - Compact card centered on cell
 * Handles edge detection to prevent truncation
 */
const HoverTooltip = ({ data, coords }) => {
  if (!data || !coords) return null;

  const tooltipWidth = 120;
  const tooltipHeight = 88;
  const arrowSize = 6;
  const gap = 6;
  const edgePadding = 8;

  // Calculate cell center
  const cellCenterX = coords.left + coords.width / 2;

  // Calculate horizontal position with edge detection
  let leftPosition = cellCenterX - tooltipWidth / 2;
  let arrowOffset = 0; // How much to offset the arrow from center

  // Prevent left edge truncation
  if (leftPosition < edgePadding) {
    arrowOffset = leftPosition - edgePadding;
    leftPosition = edgePadding;
  }

  // Prevent right edge truncation
  const rightEdge = leftPosition + tooltipWidth;
  if (rightEdge > window.innerWidth - edgePadding) {
    const overflow = rightEdge - (window.innerWidth - edgePadding);
    arrowOffset = overflow;
    leftPosition -= overflow;
  }

  // Calculate vertical position (above the cell)
  const topPosition = Math.max(edgePadding, coords.top - tooltipHeight - arrowSize - gap);

  // Determine styling based on percentile
  const isPeak = data.percentileLabel.includes('Pico') || data.percentileLabel.includes('Top 5');
  const isHigh = data.percentileLabel.includes('Top');

  return createPortal(
    <motion.div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: topPosition,
        left: leftPosition,
        width: tooltipWidth,
      }}
      initial={tooltipAnimation.initial}
      animate={tooltipAnimation.animate}
      exit={tooltipAnimation.exit}
      transition={springConfig}
    >
      {/* Tooltip Card */}
      <div
        className="relative px-2.5 py-2
                   bg-white dark:bg-slate-800
                   rounded-xl
                   shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]
                   dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5)]
                   border border-slate-200/80 dark:border-slate-700"
      >
        {/* Time Header - Compact */}
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-wide">
          {data.dayName}
        </p>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center mb-1">
          {data.hour}h
        </p>

        {/* Visit Count */}
        <div className="text-center mb-1.5">
          <span className={`
            text-xl font-bold
            ${isPeak
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-lavpop-blue dark:text-blue-400'
            }
          `}>
            {data.count}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">
            visitas
          </span>
        </div>

        {/* Percentile Badge - Compact */}
        <div className="flex justify-center">
          <span className={`
            inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium
            ${isPeak
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
              : isHigh
                ? 'bg-blue-50 text-lavpop-blue dark:bg-blue-900/40 dark:text-blue-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }
          `}>
            {isPeak && <span className="w-1 h-1 rounded-full bg-amber-500" />}
            {data.percentileLabel}
          </span>
        </div>

        {/* Arrow - positioned with offset for edge cases */}
        <div
          className="absolute -bottom-[5px] w-2.5 h-2.5 rotate-45
                     bg-white dark:bg-slate-800
                     border-r border-b border-slate-200/80 dark:border-slate-700"
          style={{
            left: `calc(50% + ${arrowOffset}px)`,
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
      </div>
    </motion.div>,
    document.body
  );
};

/**
 * Mobile Bottom Sheet - Matches MobileTooltipSheet.jsx patterns
 */
const MobileSheet = ({ isOpen, onClose, data, quantiles }) => {
  const sheetRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Swipe-to-close gesture
  const { handlers, style, isDragging, backdropOpacity, dragY } = useSwipeToClose({
    onClose,
    threshold: 40,
    resistance: 0.5
  });

  // Only apply swipe style when actually dragging
  const swipeStyle = dragY > 0 ? style : undefined;

  // iOS-compatible scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.width = originalStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!data) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            exit={prefersReducedMotion ? undefined : "exit"}
            variants={MOBILE_SHEET.BACKDROP}
            transition={prefersReducedMotion ? { duration: 0 } : TWEEN.FADE}
            className="fixed inset-0 bg-black/30 z-50"
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={prefersReducedMotion ? false : "hidden"}
            animate="visible"
            exit={prefersReducedMotion ? undefined : "exit"}
            variants={MOBILE_SHEET.SLIDE_UP}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="fixed bottom-0 left-2 right-2 z-[60]
                       bg-white/95 dark:bg-slate-800/95
                       backdrop-blur-xl rounded-t-3xl
                       shadow-2xl pb-safe"
            style={swipeStyle}
            {...handlers}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${data.dayName} às ${data.hour}h`}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className={`w-10 h-1 rounded-full transition-colors ${
                  isDragging ? 'bg-slate-400 dark:bg-slate-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <div className="px-4 pb-6">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {data.dayName} às {data.hour}h
                </h4>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0
                           rounded-full -mr-2
                           text-slate-400 hover:text-slate-600
                           dark:text-slate-500 dark:hover:text-slate-300
                           hover:bg-slate-100 dark:hover:bg-slate-700
                           transition-colors duration-150"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="text-center">
                <p className="text-4xl font-bold text-lavpop-blue dark:text-blue-400 mb-1">
                  {data.count}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  visitas
                </p>
                <span className={`
                  inline-block px-3 py-1.5 rounded-full text-sm font-medium
                  ${getPercentileBadgeClasses(data.count, quantiles)}
                `}>
                  {data.percentileLabel}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

const VisitHeatmap = ({ salesData, customerMap, className = '' }) => {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipCoords, setTooltipCoords] = useState(null);

  // Detect mobile for interaction mode (tooltip vs sheet)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate heatmap data for selected segment
  const heatmapData = useMemo(() => {
    if (!salesData || salesData.length === 0) return null;
    return getVisitHeatmapData(salesData, customerMap, selectedSegment, 30);
  }, [salesData, customerMap, selectedSegment]);

  // Handle cell hover (desktop only)
  const handleCellHover = useCallback((e, dayRow, cell, quantiles) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipCoords({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
    setTooltipData({
      ...cell,
      dayName: dayRow.dayNameFull,
      percentileLabel: getPercentileLabel(cell.count, quantiles)
    });
  }, [isMobile]);

  const handleCellLeave = useCallback(() => {
    if (isMobile) return;
    setTooltipData(null);
    setTooltipCoords(null);
  }, [isMobile]);

  // Handle cell tap (mobile only - opens bottom sheet)
  const handleCellTap = useCallback((e, dayRow, cell, quantiles) => {
    e.stopPropagation();
    if (isMobile) {
      setSheetData({
        ...cell,
        dayName: dayRow.dayNameFull,
        percentileLabel: getPercentileLabel(cell.count, quantiles)
      });
    }
  }, [isMobile]);

  const handleSheetClose = useCallback(() => {
    setSheetData(null);
  }, []);

  if (!heatmapData) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400 ${className}`}>
        Carregando mapa de visitas...
      </div>
    );
  }

  const { grid, quantiles, peak, hourRange, dateRange } = heatmapData;
  const hours = Array.from({ length: hourRange.end - hourRange.start }, (_, i) => hourRange.start + i);

  // Format date range for footer
  const formatDateRange = () => {
    if (!dateRange) return '';
    const formatDate = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  };

  // Get current segment's color palette
  const currentSegment = SEGMENTS.find(s => s.id === selectedSegment) || SEGMENTS[0];
  const palette = currentSegment.palette;

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={cardHoverAnimation}
      transition={cardHoverTransition}
      className={`
        bg-gradient-to-br from-blue-50/40 via-white to-white
        dark:from-blue-900/10 dark:via-space-nebula dark:to-space-nebula
        rounded-2xl
        border border-slate-200/80 dark:border-stellar-cyan/10
        border-l-4 border-l-blue-500 dark:border-l-blue-400
        overflow-hidden
        px-3 py-3 sm:px-4 sm:py-4
        h-full flex flex-col
        ${className}
      `}
    >
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-0.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0">
              <Clock className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Mapa de Visitas
              <ContextHelp
                title="Como ler este mapa?"
                description="Mostra quando os clientes visitam durante a semana. Células maiores e mais escuras indicam mais visitas naquele horário. O horário em destaque (dourado) é o pico de movimento. Use os filtros para ver padrões de diferentes segmentos de clientes."
              />
            </h3>
            {/* Inline Legend - uses segment color palette */}
            <div className="hidden sm:flex items-center gap-1 ml-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span>MIN</span>
              <div className="flex items-center gap-0.5">
                <div className={`w-1.5 h-1.5 rounded-sm ${palette.low}`} />
                <div className={`w-2 h-2 rounded-sm ${palette.p50}`} />
                <div className={`w-2.5 h-2.5 rounded-sm ${palette.p75}`} />
                <div className={`w-3 h-3 rounded-sm ${palette.p95}`} />
              </div>
              <span>MAX</span>
            </div>
          </div>

          {/* Segment Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            {SEGMENTS.map(seg => {
              const Icon = seg.icon;
              const isActive = selectedSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedSegment(seg.id); }}
                  className={`
                    flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors
                    ${isActive
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                  title={seg.label}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{seg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Peak indicator with amber accent */}
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Pico: <span className="font-semibold text-amber-500 dark:text-amber-400">{peak.dayNameFull} {peak.hour}h</span>
          <span className="text-slate-400 dark:text-slate-500"> ({peak.count} visitas)</span>
        </p>
      </div>

      {/* Heatmap Grid - Days (rows) × Hours (columns) */}
      <div className="flex-1 min-w-[280px] overflow-x-auto">
        {/* Hour Headers */}
        <div className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: `32px repeat(${hours.length}, 1fr)` }}>
          <div /> {/* Empty corner */}
          {hours.map(hour => (
            <div
              key={hour}
              className="text-center text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {hour}
            </div>
          ))}
        </div>

        {/* Day Rows */}
        {grid.map(dayRow => (
          <div
            key={dayRow.day}
            className="grid gap-0.5 mb-0.5"
            style={{ gridTemplateColumns: `32px repeat(${hours.length}, 1fr)` }}
          >
            {/* Day Label */}
            <div className="flex items-center justify-end pr-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              {dayRow.dayName}
            </div>

            {/* Hour Cells - Square size varies with density */}
            {dayRow.cells.map(cell => {
              const isPeak = dayRow.day === peak.day && cell.hour === peak.hour;
              const sizePx = getCellSize(cell.count, quantiles, isMobile);
              const colorClass = getQuantileColor(cell.count, quantiles, palette, isPeak);
              const ariaLabel = `${dayRow.dayNameFull} ${cell.hour}h: ${cell.count} visitas (${getPercentileLabel(cell.count, quantiles)})`;

              return (
                <button
                  key={cell.hour}
                  onClick={(e) => handleCellTap(e, dayRow, cell, quantiles)}
                  onMouseEnter={(e) => handleCellHover(e, dayRow, cell, quantiles)}
                  onMouseLeave={handleCellLeave}
                  className="h-6 sm:h-8 flex items-center justify-center relative group focus:outline-none"
                  aria-label={ariaLabel}
                >
                  <div
                    className={`
                      rounded-lg transition-all duration-200 ${colorClass}
                      group-hover:scale-110 group-hover:ring-2 group-hover:ring-slate-400/50 dark:group-hover:ring-slate-500/50
                      ${isPeak ? 'ring-2 ring-amber-500/50' : ''}
                    `}
                    style={{
                      width: sizePx,
                      height: sizePx
                    }}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile Legend (only visible on small screens) - uses segment color palette */}
      <div className="sm:hidden mt-1.5 flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span>MIN</span>
        <div className="flex items-center gap-0.5">
          <div className={`w-1.5 h-1.5 rounded-sm ${palette.low}`} />
          <div className={`w-2 h-2 rounded-sm ${palette.p50}`} />
          <div className={`w-2.5 h-2.5 rounded-sm ${palette.p75}`} />
          <div className={`w-3 h-3 rounded-sm ${palette.p95}`} />
        </div>
        <span>MAX</span>
        <span className="ml-2">•</span>
        <div className="w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-500" />
        <span>PICO</span>
      </div>

      {/* Footer - Data date range */}
      <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50 text-center">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {formatDateRange()}
        </span>
      </div>

      {/* Desktop Hover Tooltip */}
      <AnimatePresence>
        {tooltipData && !isMobile && (
          <HoverTooltip
            data={tooltipData}
            coords={tooltipCoords}
          />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet */}
      <MobileSheet
        isOpen={!!sheetData && isMobile}
        onClose={handleSheetClose}
        data={sheetData}
        quantiles={quantiles}
      />
    </motion.div>
  );
};

export default VisitHeatmap;
