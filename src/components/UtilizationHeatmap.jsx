// UtilizationHeatmap Component v4.3.0
// Hour x Day heatmap showing average service utilization patterns
//
// CHANGELOG:
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
import { Activity, Info, X } from 'lucide-react';
import { parseBrDate, formatDate } from '../utils/dateUtils';
import { BUSINESS_PARAMS } from '../utils/operationsMetrics';

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
 * Get color based on value intensity
 */
const getColorFromIntensity = (intensity) => {
  if (intensity === 0) return 'bg-slate-100 dark:bg-slate-700/30';
  if (intensity > 0.8) return 'bg-green-700 dark:bg-green-600';
  if (intensity > 0.6) return 'bg-green-600 dark:bg-green-500';
  if (intensity > 0.4) return 'bg-green-500 dark:bg-green-400';
  if (intensity > 0.2) return 'bg-green-400 dark:bg-green-300';
  return 'bg-green-200 dark:bg-green-200';
};

/**
 * Get text color based on intensity for contrast
 */
const getTextColorFromIntensity = (intensity) => {
  if (intensity === 0) return 'text-slate-400 dark:text-slate-500';
  if (intensity > 0.5) return 'text-white';
  return 'text-slate-700 dark:text-slate-800';
};

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const UtilizationHeatmap = ({ salesData, dateFilter = 'currentWeek', dateWindow }) => {
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
    const TOTAL_MACHINES = BUSINESS_PARAMS.TOTAL_WASHERS + BUSINESS_PARAMS.TOTAL_DRYERS;
    const AVG_CYCLE_MINUTES = (BUSINESS_PARAMS.WASHER_CYCLE_MINUTES + BUSINESS_PARAMS.DRYER_CYCLE_MINUTES) / 2;
    const MAX_SERVICES_PER_HOUR = (TOTAL_MACHINES * 60) / AVG_CYCLE_MINUTES * BUSINESS_PARAMS.EFFICIENCY_FACTOR;

    const startDate = dateWindow.start;
    const endDate = dateWindow.end;

    // Initialize grid: [hour][day]
    const grid = {};
    const daysSeen = {};

    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      grid[hour] = {};
      daysSeen[hour] = {};
      for (let day = 0; day < 7; day++) {
        grid[hour][day] = { services: 0 };
        daysSeen[hour][day] = new Set();
      }
    }

    // Process sales data
    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date || date < startDate || date > endDate) return;

      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (hour >= HOUR_START && hour < HOUR_END) {
        const machineInfo = countMachines(row.Maquinas || row.machine || '');
        grid[hour][dayOfWeek].services += machineInfo.total;

        // Use formatDate to avoid UTC timezone issues
        const dateStr = formatDate(date);
        daysSeen[hour][dayOfWeek].add(dateStr);
      }
    });

    // Calculate averages and utilization
    const processedGrid = [];
    let maxValue = 0;

    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      const hourRow = {
        hour,
        cells: []
      };

      for (let day = 0; day < 7; day++) {
        const uniqueDays = daysSeen[hour][day].size;
        const avgServices = uniqueDays > 0 ? grid[hour][day].services / uniqueDays : 0;
        const roundedAvg = Math.round(avgServices * 10) / 10;
        const utilization = (roundedAvg / MAX_SERVICES_PER_HOUR) * 100;

        maxValue = Math.max(maxValue, roundedAvg);

        hourRow.cells.push({
          day,
          dayName: DAYS[day],
          dayNameFull: DAYS_FULL[day],
          avgServices: roundedAvg,
          utilization: Math.min(utilization, 100), // Cap at 100%
          uniqueDays,
          totalServices: grid[hour][day].services
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
      <div className="bg-white dark:bg-slate-800 rounded-xl px-2 py-3 sm:p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Carregando mapa de calor de utilização...
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl px-2 py-3 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
      onClick={handleOutsideClick}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              Mapa de Calor de Utilização
            </h3>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('services'); }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'services'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Serviços
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('utilization'); }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'utilization'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Utilização %
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 italic mt-0.5">
          {viewMode === 'services'
            ? 'Média de serviços por hora em cada dia da semana'
            : 'Taxa de utilização da capacidade operacional'
          }
        </p>
      </div>

      {/* Custom CSS Grid Heatmap - Compact: all hours fit without scroll */}
      <div className="min-w-[280px]">
        {/* Day Headers */}
        <div className="grid grid-cols-[32px_repeat(7,1fr)] sm:grid-cols-[40px_repeat(7,1fr)] gap-0.5 mb-0.5">
          <div /> {/* Empty corner */}
          {DAYS.map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-slate-600 dark:text-slate-400 py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Hour Rows - Fixed height cells */}
        {gridData.map(row => (
          <div
            key={row.hour}
            className="grid grid-cols-[32px_repeat(7,1fr)] sm:grid-cols-[40px_repeat(7,1fr)] gap-0.5 mb-0.5"
          >
            {/* Hour Label */}
            <div className="flex items-center justify-end pr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
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
                      h-6 sm:h-7 rounded transition-all
                      flex items-center justify-center
                      ${getColorFromIntensity(intensity)}
                      ${getTextColorFromIntensity(intensity)}
                      ${isSelected
                        ? 'ring-2 ring-lavpop-blue dark:ring-blue-400 ring-offset-1 dark:ring-offset-slate-800 z-10'
                        : 'hover:ring-1 hover:ring-slate-400 dark:hover:ring-slate-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-lavpop-blue dark:focus:ring-blue-400
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

      {/* Selected Cell Detail - Mobile-friendly panel */}
      {selectedCell && (
        <div
          className="mt-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {selectedCell.dayNameFull} {selectedCell.hour}h
            </span>
            <button
              onClick={handleOutsideClick}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          {/* Metrics row */}
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Média: </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedCell.avgServices.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Util.: </span>
              <span className="font-semibold text-lavpop-blue dark:text-blue-400">
                {Math.round(selectedCell.utilization)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Dias: </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedCell.uniqueDays}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gradient Legend + Capacity Footer */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 w-full max-w-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Baixa</span>
          <div className="flex-1 h-2 rounded-full flex overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex-1 bg-green-200" />
            <div className="flex-1 bg-green-400" />
            <div className="flex-1 bg-green-500" />
            <div className="flex-1 bg-green-600" />
            <div className="flex-1 bg-green-700" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Alta</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Capacidade: {maxServicesPerHour} serviços/hora
        </p>
      </div>
    </div>
  );
};

export default UtilizationHeatmap;
