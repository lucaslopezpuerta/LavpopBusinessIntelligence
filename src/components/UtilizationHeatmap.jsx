// UtilizationHeatmap Component v5.0.0
// Hour x Day heatmap showing average service utilization patterns
//
// CHANGELOG:
// v5.0.0 (2026-01-23): Premium Glass styling (consistency with Operations tab components)
//   - Upgraded to Premium Glass card (backdrop-blur, ring-1, glow shadows)
//   - Header icon badge: cyan bg with white icon
//   - Added ContextHelp tooltip to header
//   - Implemented useTheme() for theme-aware styling
//   - Loading skeleton animation
//   - Glassmorphism on selected cell detail panel
//   - Responsive text sizing with useMediaQuery
//   - Updated view toggle styling
//   - Replaced legacy colors (lavpop-blue → cyan)
// v4.5.0 (2025-12-28): Unified utilization calculation with operationsMetrics.js
//   - Track wash and dry services separately per cell
//   - Use weighted utilization formula (37.5% wash, 62.5% dry by machine count)
//   - Fixes ~3% discrepancy between heatmap and PeakHoursSummary values
// v4.4.0 (2025-12-10): Timezone-independent hour/day extraction
//   - Uses date.brazil components instead of getHours()/getDay()
//   - Ensures correct heatmap regardless of viewer's browser timezone
// v4.3.0 (2025-11-30): Mobile width optimization
//   - Reduced mobile padding: p-4 → px-2 py-3 (gains ~24px horizontal space)
//   - Keeps sm:p-6 for desktop
// v4.2.0 (2025-11-30): Mobile polish + simplified detail panel
//   - Removed "vs Média" metric (redundant with color intensity)
//   - Removed hardcoded peak hour highlighting (let PeakHoursSummary handle that)
//   - Improved mobile detail panel layout (stacked on narrow screens)
//   - Simplified footer (just max services/hour)
// v4.1.0 (2025-11-30): Compact Layout + Enhanced Footer
//   - Fixed cell sizing: use fixed heights (h-6 sm:h-7) instead of aspect ratios
//   - All 15 hours now fit without scrolling on desktop
//   - Compact detail panel (inline on desktop)
//   - Capacity footer shows max hourly services
// v4.0.0 (2025-11-30): Custom CSS Grid + Full Design System Compliance
//   - Replaced Nivo with custom Tailwind CSS grid (zero bundle overhead)
//   - Fixed timezone bug: using formatDate() instead of toISOString() (UTC issue)
//   - Added responsive heights: h-[300px] sm:h-[400px] lg:h-[500px]
//   - Fixed font sizes: minimum 12px (text-xs) throughout
//   - Added touch-friendly interactions: tap to select cell, tap elsewhere to dismiss
//   - Added capacity context: shows utilization % based on BUSINESS_PARAMS
//   - Added view toggle: Services (count) vs Utilization (%)
//   - Improved mobile layout with smaller cells and responsive padding
//   - Full dark mode support
//   - Aligned with Design System v3.1
// v3.0.0 (2025-11-26): Nivo Charts Migration + Design System alignment
// v2.1 (2025-11-15): Portuguese labels
// v2.0 (2025-11-15): Dynamic date filtering
// v1.0 (Previous): Initial implementation

import React, { useMemo, useState, useCallback } from 'react';
import { Activity, X } from 'lucide-react';
import { parseBrDate, formatDate } from '../utils/dateUtils';
import { BUSINESS_PARAMS } from '../utils/operationsMetrics';
import { useTheme } from '../contexts/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import ContextHelp from './ContextHelp';

/**
 * Count machines from transaction string
 */
function countMachines(str) {
  if (!str) return { wash: 0, dry: 0, total: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry, total: wash + dry };
}

/**
 * Get color based on value intensity and view mode
 * Services mode: Blue/Cyan scale
 * Utilization mode: Green scale
 */
const getColorFromIntensity = (intensity, mode = 'services') => {
  if (intensity === 0) return 'bg-slate-100 dark:bg-slate-700/30';

  if (mode === 'services') {
    // Blue/Cyan scale for services
    if (intensity > 0.8) return 'bg-cyan-700 dark:bg-cyan-600';
    if (intensity > 0.6) return 'bg-cyan-600 dark:bg-cyan-500';
    if (intensity > 0.4) return 'bg-cyan-500 dark:bg-cyan-400';
    if (intensity > 0.2) return 'bg-cyan-400 dark:bg-cyan-300';
    return 'bg-cyan-200 dark:bg-cyan-200';
  } else {
    // Green scale for utilization
    if (intensity > 0.8) return 'bg-emerald-700 dark:bg-emerald-600';
    if (intensity > 0.6) return 'bg-emerald-600 dark:bg-emerald-500';
    if (intensity > 0.4) return 'bg-emerald-500 dark:bg-emerald-400';
    if (intensity > 0.2) return 'bg-emerald-400 dark:bg-emerald-300';
    return 'bg-emerald-200 dark:bg-emerald-200';
  }
};

/**
 * Get text color based on intensity for contrast
 */
const getTextColorFromIntensity = (intensity) => {
  if (intensity === 0) return 'text-slate-400 dark:text-slate-400';
  if (intensity > 0.5) return 'text-white';
  return 'text-slate-700 dark:text-slate-800';
};

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const UtilizationHeatmap = ({ salesData, dateFilter = 'currentWeek', dateWindow }) => {
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [selectedCell, setSelectedCell] = useState(null);
  const [viewMode, setViewMode] = useState('services'); // 'services' or 'utilization'

  // Calculate max services per hour for footer display
  const maxServicesPerHour = useMemo(() => {
    const washCyclesPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * (60 / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES);
    const dryCyclesPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES);
    return Math.round((washCyclesPerHour + dryCyclesPerHour) * BUSINESS_PARAMS.EFFICIENCY_FACTOR * 10) / 10;
  }, []);

  const { gridData, maxAvg } = useMemo(() => {
    if (!salesData || salesData.length === 0 || !dateWindow) {
      return { gridData: null, maxAvg: 0 };
    }

    const { start: HOUR_START, end: HOUR_END } = BUSINESS_PARAMS.OPERATING_HOURS;

    // Use same capacity calculation as operationsMetrics.js for consistency
    const efficiencyFactor = BUSINESS_PARAMS.EFFICIENCY_FACTOR;
    const washCapacityPerHour = BUSINESS_PARAMS.TOTAL_WASHERS * (60 / BUSINESS_PARAMS.WASHER_CYCLE_MINUTES) * efficiencyFactor;
    const dryCapacityPerHour = BUSINESS_PARAMS.TOTAL_DRYERS * (60 / BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) * efficiencyFactor;

    // Weights based on machine count (same as operationsMetrics.js)
    const totalMachines = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
    const washWeight = BUSINESS_PARAMS.TOTAL_WASHERS / totalMachines;
    const dryWeight = BUSINESS_PARAMS.TOTAL_DRYERS / totalMachines;

    const startDate = dateWindow.start;
    const endDate = dateWindow.end;

    // Initialize grid: [hour][day] - track wash and dry separately
    const grid = {};
    const daysSeen = {};

    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      grid[hour] = {};
      daysSeen[hour] = {};
      for (let day = 0; day < 7; day++) {
        grid[hour][day] = { wash: 0, dry: 0, total: 0 };
        daysSeen[hour][day] = new Set();
      }
    }

    // Process sales data
    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date || date < startDate || date > endDate) return;

      // Use date.brazil components for timezone-independent hour/day extraction
      // This ensures correct categorization regardless of viewer's browser timezone
      const hour = date.brazil?.hour ?? date.getHours();
      const dayOfWeek = date.brazil
        ? new Date(date.brazil.year, date.brazil.month - 1, date.brazil.day).getDay()
        : date.getDay();

      if (hour >= HOUR_START && hour < HOUR_END) {
        const machineInfo = countMachines(row.Maquinas || row.machine || '');
        grid[hour][dayOfWeek].wash += machineInfo.wash;
        grid[hour][dayOfWeek].dry += machineInfo.dry;
        grid[hour][dayOfWeek].total += machineInfo.total;

        // Use Brazil date components for consistent date key
        const dateStr = date.brazil
          ? `${date.brazil.year}-${String(date.brazil.month).padStart(2, '0')}-${String(date.brazil.day).padStart(2, '0')}`
          : formatDate(date);
        daysSeen[hour][dayOfWeek].add(dateStr);
      }
    });

    // Calculate averages and utilization (using weighted formula from operationsMetrics.js)
    const processedGrid = [];
    let maxValue = 0;

    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      const hourRow = {
        hour,
        cells: []
      };

      for (let day = 0; day < 7; day++) {
        const uniqueDays = daysSeen[hour][day].size;
        const avgWash = uniqueDays > 0 ? grid[hour][day].wash / uniqueDays : 0;
        const avgDry = uniqueDays > 0 ? grid[hour][day].dry / uniqueDays : 0;
        const avgServices = uniqueDays > 0 ? grid[hour][day].total / uniqueDays : 0;
        const roundedAvg = Math.round(avgServices * 10) / 10;

        // Weighted utilization calculation (same as operationsMetrics.js)
        const washUtil = (avgWash / washCapacityPerHour) * 100;
        const dryUtil = (avgDry / dryCapacityPerHour) * 100;
        const utilization = (washUtil * washWeight) + (dryUtil * dryWeight);

        maxValue = Math.max(maxValue, roundedAvg);

        hourRow.cells.push({
          day,
          dayName: DAYS[day],
          dayNameFull: DAYS_FULL[day],
          avgServices: roundedAvg,
          utilization: Math.min(Math.round(utilization * 10) / 10, 100), // Cap at 100%
          uniqueDays,
          totalServices: grid[hour][day].total
        });
      }

      processedGrid.push(hourRow);
    }

    return {
      gridData: processedGrid,
      maxAvg: maxValue
    };
  }, [salesData, dateWindow]);

  const handleCellClick = useCallback((hour, cell) => {
    setSelectedCell(prev =>
      prev?.hour === hour && prev?.day === cell.day
        ? null
        : { hour, ...cell }
    );
  }, []);

  const handleOutsideClick = useCallback(() => {
    setSelectedCell(null);
  }, []);

  if (!gridData) {
    return (
      <div
        className={`
          ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
          backdrop-blur-xl rounded-2xl p-5
          ${isDark
            ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
            : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
          }
          overflow-hidden
        `}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Mapa de Calor de Utilização
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-8 gap-1">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                <div key={col} className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(103,232,249,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
      `}
      onClick={handleOutsideClick}
    >
      {/* Header with Icon Badge */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 dark:bg-cyan-600 flex items-center justify-center shadow-sm shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className={`${isDesktop ? 'text-lg' : 'text-base'} font-bold text-slate-800 dark:text-white flex items-center gap-1.5`}>
                Mapa de Calor
                <ContextHelp
                  title="Como Interpretar"
                  description={
                    <ul className="space-y-1.5 list-none">
                      <li><strong>Cores:</strong> Verde mais intenso = maior utilização</li>
                      <li><strong>Serviços:</strong> Média de serviços por hora/dia</li>
                      <li><strong>Utilização:</strong> % da capacidade operacional</li>
                      <li><strong>Clique:</strong> Toque em uma célula para detalhes</li>
                    </ul>
                  }
                />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Período: {dateWindow?.dateRange || 'Carregando...'}
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className={`
            flex items-center gap-0.5 rounded-lg p-0.5
            ${isDark ? 'bg-white/[0.05] ring-1 ring-white/[0.05]' : 'bg-slate-100 ring-1 ring-slate-200/50'}
          `}>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('services'); }}
              className={`px-2.5 py-1.5 ${isDesktop ? 'text-sm' : 'text-xs'} font-medium rounded-md transition-colors ${
                viewMode === 'services'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
                    : 'bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-200'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Serviços
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('utilization'); }}
              className={`px-2.5 py-1.5 ${isDesktop ? 'text-sm' : 'text-xs'} font-medium rounded-md transition-colors ${
                viewMode === 'utilization'
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Utilização %
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS Grid Heatmap - Compact: all hours fit without scroll */}
      <div className="min-w-[280px]">
        {/* Day Headers */}
        <div className="grid grid-cols-[36px_repeat(7,1fr)] sm:grid-cols-[44px_repeat(7,1fr)] gap-1 mb-1">
          <div /> {/* Empty corner */}
          {DAYS.map(day => (
            <div
              key={day}
              className={`text-center ${isDesktop ? 'text-sm' : 'text-xs'} font-semibold text-slate-600 dark:text-slate-400 py-1`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Hour Rows - Fixed height cells */}
        {gridData.map(row => (
          <div
            key={row.hour}
            className="grid grid-cols-[36px_repeat(7,1fr)] sm:grid-cols-[44px_repeat(7,1fr)] gap-1 mb-1"
          >
            {/* Hour Label */}
            <div className={`flex items-center justify-end pr-1.5 ${isDesktop ? 'text-sm' : 'text-xs'} font-medium text-slate-500 dark:text-slate-400`}>
              {row.hour}h
            </div>

              {/* Day Cells - Fixed heights for compact display */}
              {row.cells.map(cell => {
                const intensity = viewMode === 'services'
                  ? (maxAvg > 0 ? cell.avgServices / maxAvg : 0)
                  : (cell.utilization / 100);
                const displayValue = viewMode === 'services'
                  ? (cell.avgServices > 0 ? cell.avgServices.toFixed(1) : '')
                  : (cell.utilization > 0 ? `${Math.round(cell.utilization)}%` : '');
                const isSelected = selectedCell?.hour === row.hour && selectedCell?.day === cell.day;

                return (
                  <button
                    key={cell.day}
                    onClick={(e) => { e.stopPropagation(); handleCellClick(row.hour, cell); }}
                    className={`
                      h-6 sm:h-7 lg:h-8 rounded-md transition-all
                      flex items-center justify-center
                      ${getColorFromIntensity(intensity, viewMode)}
                      ${getTextColorFromIntensity(intensity)}
                      ${isSelected
                        ? 'ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-1 dark:ring-offset-space-dust z-10'
                        : 'hover:ring-1 hover:ring-slate-400 dark:hover:ring-slate-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400
                      text-[10px] sm:text-xs font-medium
                    `}
                    aria-label={`${cell.dayNameFull} ${row.hour}h: ${cell.avgServices.toFixed(1)} serviços, ${Math.round(cell.utilization)}% utilização`}
                  >
                    {displayValue}
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {/* Selected Cell Detail - Glassmorphism panel */}
      {selectedCell && (
        <div
          className={`
            mt-4 p-3 rounded-xl backdrop-blur-sm ring-1
            ${viewMode === 'services'
              ? isDark ? 'bg-cyan-950/30 ring-cyan-500/20' : 'bg-cyan-50/80 ring-cyan-200'
              : isDark ? 'bg-emerald-950/30 ring-emerald-500/20' : 'bg-emerald-50/80 ring-emerald-200'
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold text-slate-900 dark:text-white`}>
              {selectedCell.dayNameFull} às {selectedCell.hour}h
            </span>
            <button
              onClick={handleOutsideClick}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          {/* Metrics row */}
          <div className={`flex items-center gap-4 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Média: </span>
              <span className={`font-semibold ${viewMode === 'services' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                {selectedCell.avgServices.toFixed(1)} serviços
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Utilização: </span>
              <span className={`font-semibold ${viewMode === 'utilization' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {Math.round(selectedCell.utilization)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Dias analisados: </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedCell.uniqueDays}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gradient Legend + Capacity Footer */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <span className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400`}>Baixa</span>
          <div className={`flex-1 h-2.5 rounded-full flex overflow-hidden ${isDark ? 'ring-1 ring-white/[0.05]' : 'ring-1 ring-slate-200'}`}>
            {viewMode === 'services' ? (
              <>
                <div className="flex-1 bg-cyan-200 dark:bg-cyan-200/80" />
                <div className="flex-1 bg-cyan-400 dark:bg-cyan-400/90" />
                <div className="flex-1 bg-cyan-500" />
                <div className="flex-1 bg-cyan-600" />
                <div className="flex-1 bg-cyan-700 dark:bg-cyan-600" />
              </>
            ) : (
              <>
                <div className="flex-1 bg-emerald-200 dark:bg-emerald-200/80" />
                <div className="flex-1 bg-emerald-400 dark:bg-emerald-400/90" />
                <div className="flex-1 bg-emerald-500" />
                <div className="flex-1 bg-emerald-600" />
                <div className="flex-1 bg-emerald-700 dark:bg-emerald-600" />
              </>
            )}
          </div>
          <span className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400`}>Alta</span>
        </div>
        <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400`}>
          Capacidade máxima: {maxServicesPerHour} serviços/hora
        </p>
      </div>
    </div>
  );
};

export default UtilizationHeatmap;
