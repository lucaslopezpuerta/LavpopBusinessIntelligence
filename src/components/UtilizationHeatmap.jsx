// UtilizationHeatmap Component v3.0.0
// Hour x Day heatmap showing average service utilization patterns
//
// CHANGELOG:
// v3.0.0 (2025-11-26): Nivo Charts Migration + Design System alignment
//   - Migrated from custom grid to @nivo/heatmap
//   - Replaced all inline styles with Tailwind CSS
//   - Added dark mode support throughout
//   - Using lavpopNivoTheme for consistent styling
//   - Using lavpopUtilizationScale (blue gradient) for brand alignment
//   - Swapped axes: Days on X-axis, Hours on Y-axis
//   - Created custom CSS gradient legend (Nivo's built-in legend didn't work)
//   - Disabled hover opacity/dimming effect on cells
//   - Improved empty cell appearance with transparent slate color
//   - Aligned tooltip typography with Design System (text-sm title, text-xs content)
//   - Removed COLORS object
//   - Aligned with Design System v3.0
// v2.1 (2025-11-15): Portuguese labels
//   - Changed "Low activity" to "Baixa atividade"
//   - Changed "High activity" to "Alta atividade"
//   - Confirmed displays average services per hour/day
// v2.0 (2025-11-15): Dynamic date filtering
//   - Removed hardcoded "last 4 weeks" logic
//   - Now receives dateFilter and dateWindow props from parent
//   - Uses dateWindow.start and dateWindow.end for filtering
//   - Displays explicit date range in subtitle
//   - Synchronized with Operations tab DateRangeSelector
// v1.0 (Previous): Initial implementation with fixed 4-week window

import React, { useMemo } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Activity } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { lavpopNivoTheme, lavpopUtilizationScale } from '../contexts/nivoTheme';

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
 * Get color based on value intensity using lavpopUtilizationScale
 */
const getColorFromScale = (value, maxValue) => {
  // Empty cells: use transparent/very subtle color
  if (value === 0 || maxValue === 0) return 'rgba(148, 163, 184, 0.08)'; // slate-400 at 8% opacity

  const intensity = value / maxValue;

  if (intensity > 0.8) return lavpopUtilizationScale[5]; // dark green
  if (intensity > 0.6) return lavpopUtilizationScale[4]; // medium-dark green
  if (intensity > 0.4) return lavpopUtilizationScale[3]; // medium green
  if (intensity > 0.2) return lavpopUtilizationScale[2]; // light green
  return lavpopUtilizationScale[1]; // very light green
};

const UtilizationHeatmap = ({ salesData, dateFilter = 'currentWeek', dateWindow }) => {
  const { nivoData, maxAvg } = useMemo(() => {
    if (!salesData || salesData.length === 0 || !dateWindow) return { nivoData: null, maxAvg: 0 };

    const OPERATING_HOURS = { start: 8, end: 23 };
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Use dateWindow from centralized filter
    const startDate = dateWindow.start;
    const endDate = dateWindow.end;

    // Initialize grid: [hour][day]
    const grid = {};
    for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
      grid[hour] = {};
      for (let day = 0; day < 7; day++) {
        grid[hour][day] = { services: 0, days: 0 };
      }
    }

    // Count unique days we have data for each hour/day combination
    const daysSeen = {};
    for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
      daysSeen[hour] = {};
      for (let day = 0; day < 7; day++) {
        daysSeen[hour][day] = new Set();
      }
    }

    // Process sales data
    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date || date < startDate || date > endDate) return;

      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (hour >= OPERATING_HOURS.start && hour < OPERATING_HOURS.end) {
        const machineInfo = countMachines(row.Maquinas || row.machine || '');

        grid[hour][dayOfWeek].services += machineInfo.total;

        // Track which calendar dates we've seen for this hour/day combo
        const dateStr = date.toISOString().split('T')[0];
        daysSeen[hour][dayOfWeek].add(dateStr);
      }
    });

    // Calculate averages
    const avgGrid = {};
    let maxValue = 0;

    for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
      avgGrid[hour] = {};
      for (let day = 0; day < 7; day++) {
        const uniqueDays = daysSeen[hour][day].size;
        const avg = uniqueDays > 0 ? grid[hour][day].services / uniqueDays : 0;
        avgGrid[hour][day] = Math.round(avg * 10) / 10;
        maxValue = Math.max(maxValue, avgGrid[hour][day]);
      }
    }

    // Transform to Nivo format: array of hour objects (Y-axis), each with data array for days (X-axis)
    const hours = Array.from(
      { length: OPERATING_HOURS.end - OPERATING_HOURS.start },
      (_, i) => OPERATING_HOURS.start + i
    );

    const nivoFormatted = hours.map(hour => ({
      id: `${hour}h`,
      data: days.map((dayName, dayIndex) => ({
        x: dayName,
        y: avgGrid[hour][dayIndex] || 0
      }))
    }));

    return {
      nivoData: nivoFormatted,
      maxAvg: maxValue
    };
  }, [salesData, dateWindow]);

  if (!nivoData) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        Carregando mapa de calor de utilização...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Mapa de Calor de Utilização
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-500 italic mt-0.5">
          Valores = média de serviços por hora em cada dia da semana
        </p>
      </div>

      {/* Nivo Heatmap */}
      <div className="h-[500px] nivo-heatmap-no-hover-dim">
        <style>{`
          .nivo-heatmap-no-hover-dim rect {
            opacity: 1 !important;
          }
        `}</style>
        <ResponsiveHeatMap
          data={nivoData}
          theme={lavpopNivoTheme}
          colors={(cell) => getColorFromScale(cell.value, maxAvg)}
          margin={{ top: 20, right: 90, bottom: 60, left: 60 }}
          valueFormat=">-.1f"
          axisTop={null}
          axisRight={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Horário',
            legendPosition: 'middle',
            legendOffset: 50
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Dia da Semana',
            legendPosition: 'middle',
            legendOffset: 40
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Horário',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          cellOpacity={1}
          cellBorderWidth={1}
          cellBorderColor="var(--color-border)"
          isInteractive={true}
          enableLabels={true}
          label={(cell) => cell.value > 0 ? cell.formattedValue : ''}
          labelTextColor={(cell) => {
            if (cell.value === 0) return 'transparent';
            const intensity = cell.value / maxAvg;
            return intensity > 0.5 ? '#ffffff' : 'var(--color-text-secondary)';
          }}
          tooltip={({ cell }) => (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {cell.data.x} {cell.serieId}
              </div>
              <div className="text-xs font-semibold text-lavpop-blue dark:text-blue-400">
                {cell.value.toFixed(1)} serviços em média
              </div>
            </div>
          )}
          hoverTarget="cell"
          animate={true}
          motionConfig="gentle"
        />
      </div>

      {/* Custom Gradient Legend */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 w-full max-w-md">
          <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Baixa atividade
          </span>
          <div className="flex-1 h-3 rounded-full flex overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex-1" style={{ backgroundColor: lavpopUtilizationScale[1] }} />
            <div className="flex-1" style={{ backgroundColor: lavpopUtilizationScale[2] }} />
            <div className="flex-1" style={{ backgroundColor: lavpopUtilizationScale[3] }} />
            <div className="flex-1" style={{ backgroundColor: lavpopUtilizationScale[4] }} />
            <div className="flex-1" style={{ backgroundColor: lavpopUtilizationScale[5] }} />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Alta atividade
          </span>
        </div>
      </div>
    </div>
  );
};

export default UtilizationHeatmap;
