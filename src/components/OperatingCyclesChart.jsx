// OperatingCyclesChart.jsx v5.0 - SPLIT BY FILTER
// ✅ NEW: Split by filter (All/Wash Only/Dry Only)
// ✅ Previous month comparison lines (dashed)
// ✅ Gradient bars for visual depth
// ✅ Mobile responsive adjustments
// ✅ Design System v3.2 compliant
//
// CHANGELOG:
// v5.0 (2025-12-16): Split by filter
//   - NEW: Filter to show All/Wash Only/Dry Only
//   - Toggle buttons in header next to month selector
//   - Dynamic chart rendering based on filter
// v4.6 (2025-12-01): Design System compliance
//   - Fixed fontSize: 11 → 12 on XAxis ticks
// v4.5 (2025-12-01): Date selector tabs
//   - Added month/year selector tabs in header
//   - Shows last 4 months for easy navigation
//   - Uses internal state when props not provided
// v4.4 (2025-11-30): Accessibility & UX improvements
// v4.3 (2025-11-30): Chart memoization for performance
// v4.2 (2025-11-30): Performance improvements
// v4.1 (2025-11-29): Design System v3.0 compliance
// v4.0: Previous implementation
import React, { useState, useMemo, useCallback } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Line, ComposedChart } from 'recharts';
import { WashingMachine, TrendingUp, Calendar, Droplet, Flame, Layers } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';

import { getChartColors } from '../utils/chartColors';

function countMachines(str) {
  if (!str) return { wash: 0, dry: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry };
}

function getMonthName(monthIndex) {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return months[monthIndex];
}

const OperatingCyclesChart = ({
  salesData,
  month: propMonth = null,
  year: propYear = null
}) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Generate last 4 months for selector
  const monthOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: getMonthName(date.getMonth()).slice(0, 3).toUpperCase(),
        fullLabel: `${getMonthName(date.getMonth())}/${date.getFullYear()}`
      });
    }
    return options;
  }, []);

  // Internal state for selected month/year (uses props if provided)
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: propMonth !== null ? propMonth : monthOptions[0].month,
    year: propYear !== null ? propYear : monthOptions[0].year
  });

  // Split by filter state: 'all' | 'wash' | 'dry'
  const [splitBy, setSplitBy] = useState('all');

  // Use props if provided, otherwise use internal state
  const month = propMonth !== null ? propMonth : selectedPeriod.month;
  const year = propYear !== null ? propYear : selectedPeriod.year;

  // Memoize colors to prevent new object references on every render
  const colors = useMemo(() => getChartColors(isDark), [isDark]);

  const { chartData, periodInfo } = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { chartData: [], periodInfo: null };
    }

    const now = new Date();
    const targetMonth = month !== null ? month : now.getMonth();
    const targetYear = year !== null ? year : now.getFullYear();

    // Previous month calculation
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const dailyMap = {};
    const prevMonthMap = {};

    // Initialize maps
    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap[day] = {
        dayNum: day,
        day: String(day).padStart(2, '0'),
        Lavagens: 0,
        Secagens: 0,
        Total: 0,
        PrevWash: 0,
        PrevDry: 0,
        PreviousTotal: 0
      };
      prevMonthMap[day] = { wash: 0, dry: 0, total: 0 };
    }

    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date) return;

      const dayNum = date.getDate();
      const machineInfo = countMachines(row.Maquina || row.machine || row.Maquinas || '');
      const totalCycles = machineInfo.wash + machineInfo.dry;

      // Current Month Data
      if (date.getMonth() === targetMonth && date.getFullYear() === targetYear) {
        if (dailyMap[dayNum]) {
          dailyMap[dayNum].Lavagens += machineInfo.wash;
          dailyMap[dayNum].Secagens += machineInfo.dry;
          dailyMap[dayNum].Total += totalCycles;
        }
      }

      // Previous Month Data (for comparison)
      if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
        if (prevMonthMap[dayNum]) {
          prevMonthMap[dayNum].wash += machineInfo.wash;
          prevMonthMap[dayNum].dry += machineInfo.dry;
          prevMonthMap[dayNum].total += totalCycles;
        }
      }
    });

    // Merge previous month data into dailyMap
    Object.keys(dailyMap).forEach(day => {
      dailyMap[day].PrevWash = prevMonthMap[day]?.wash || 0;
      dailyMap[day].PrevDry = prevMonthMap[day]?.dry || 0;
      dailyMap[day].PreviousTotal = prevMonthMap[day]?.total || 0;
    });

    let allData = Object.values(dailyMap).sort((a, b) => a.dayNum - b.dayNum);

    // Calculate FULL MONTH totals (always)
    const totalWash = allData.reduce((sum, d) => sum + d.Lavagens, 0);
    const totalDry = allData.reduce((sum, d) => sum + d.Secagens, 0);
    const totalPrevious = allData.reduce((sum, d) => sum + d.PreviousTotal, 0);

    // For mobile: show 10 days before current date
    let displayData = allData;
    if (isMobile) {
      const currentDay = now.getDate();
      const startDay = Math.max(1, currentDay - 9);
      displayData = allData.filter(d => d.dayNum >= startDay && d.dayNum <= currentDay);
    }

    const info = {
      month: getMonthName(targetMonth),
      year: targetYear,
      prevMonth: getMonthName(prevMonth),
      totalWash,
      totalDry,
      totalCycles: totalWash + totalDry,
      totalPrevious
    };

    return { chartData: displayData, periodInfo: info };
  }, [salesData, month, year, isMobile]);

  // Memoize CustomTooltip to prevent recreation on every render
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter payload based on splitBy
      const filteredPayload = payload.filter(entry => {
        if (splitBy === 'all') return true;
        if (splitBy === 'wash') {
          return entry.dataKey === 'Lavagens' || entry.dataKey === 'PrevWash';
        }
        if (splitBy === 'dry') {
          return entry.dataKey === 'Secagens' || entry.dataKey === 'PrevDry';
        }
        return true;
      });

      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg z-50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Dia {label}
            </p>
          </div>
          {filteredPayload.map((entry, index) => {
            // Skip rendering if value is 0 and it's not the comparison line
            if (entry.value === 0 && !entry.dataKey.startsWith('Prev')) return null;

            let labelText = entry.name;
            let isPrev = false;

            if (entry.dataKey === 'PrevWash') {
              labelText = `Lavagens (${periodInfo?.prevMonth || ''})`;
              isPrev = true;
            } else if (entry.dataKey === 'PrevDry') {
              labelText = `Secagens (${periodInfo?.prevMonth || ''})`;
              isPrev = true;
            }

            const color = isPrev
              ? (entry.dataKey === 'PrevWash' ? colors.info : colors.warning)
              : (entry.dataKey === 'Lavagens' ? colors.primary : colors.secondary);

            return (
              <div key={index} className="flex items-center justify-between gap-3 text-xs mb-1 last:mb-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 ${isPrev ? 'rounded-full' : 'rounded-sm'}`}
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {labelText}:
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {entry.value} {entry.value === 1 ? 'ciclo' : 'ciclos'}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }, [periodInfo?.prevMonth, splitBy]);

  // Memoize renderLabel to prevent recreation on every render
  const renderLabel = useCallback((props) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={colors.labelText}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      >
        {value}
      </text>
    );
  }, [colors.labelText]);

  if (!periodInfo || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <div className="text-center">
            <WashingMachine className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-sans">Sem dados disponíveis para o período selecionado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <WashingMachine className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Ciclos de Operação
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mês de {periodInfo.month}/{periodInfo.year}
            </p>
          </div>

          {/* Controls: Month Selector + Split By Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Split By Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Exibir:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <button
                  onClick={() => setSplitBy('all')}
                  className={`
                    px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5
                    ${splitBy === 'all'
                      ? 'bg-white dark:bg-slate-600 text-slate-700 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                  title="Mostrar todos os ciclos"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Todos</span>
                </button>
                <button
                  onClick={() => setSplitBy('wash')}
                  className={`
                    px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5
                    ${splitBy === 'wash'
                      ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400'
                    }
                  `}
                  title="Apenas lavagens"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lav</span>
                </button>
                <button
                  onClick={() => setSplitBy('dry')}
                  className={`
                    px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5
                    ${splitBy === 'dry'
                      ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400'
                    }
                  `}
                  title="Apenas secagens"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sec</span>
                </button>
              </div>
            </div>

            {/* Month Selector Tabs */}
            {propMonth === null && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                {monthOptions.map((opt) => {
                  const isSelected = opt.month === month && opt.year === year;
                  return (
                    <button
                      key={`${opt.month}-${opt.year}`}
                      onClick={() => setSelectedPeriod({ month: opt.month, year: opt.year })}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                        ${isSelected
                          ? 'bg-white dark:bg-slate-600 text-lavpop-blue dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50'
                        }
                      `}
                      title={opt.fullLabel}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Legend - Accessible with shapes (filtered by splitBy) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" role="list" aria-label="Legenda do gráfico">
          {(splitBy === 'all' || splitBy === 'wash') && (
            <>
              <div className="flex items-center gap-1.5" role="listitem">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.primary }} aria-hidden="true"></div>
                <span className="text-slate-600 dark:text-slate-400">Lavagens</span>
              </div>
              <div className="flex items-center gap-1.5" role="listitem">
                <svg className="w-4 h-3" aria-hidden="true" viewBox="0 0 16 12">
                  <line x1="0" y1="6" x2="16" y2="6" stroke={colors.info} strokeWidth="2" strokeDasharray="4 2" />
                </svg>
                <span className="text-slate-600 dark:text-slate-400">Lavagens (Mês Ant.)</span>
              </div>
            </>
          )}
          {(splitBy === 'all' || splitBy === 'dry') && (
            <>
              <div className="flex items-center gap-1.5" role="listitem">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.secondary }} aria-hidden="true"></div>
                <span className="text-slate-600 dark:text-slate-400">Secagens</span>
              </div>
              <div className="flex items-center gap-1.5" role="listitem">
                <svg className="w-4 h-3" aria-hidden="true" viewBox="0 0 16 12">
                  <line x1="0" y1="6" x2="16" y2="6" stroke={colors.warning} strokeWidth="2" strokeDasharray="4 2" />
                </svg>
                <span className="text-slate-600 dark:text-slate-400">Secagens (Mês Ant.)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <defs>
              <linearGradient id="washGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.primary} stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="dryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.secondary} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{
                fontSize: 12,
                fill: colors.tickText,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              axisLine={{ stroke: colors.axisLine }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Ciclos',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: {
                  fontSize: 12,
                  fill: colors.yAxisLabel,
                  fontWeight: 600,
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.cursorFill }} />

            {/* Previous Month Wash Trend - conditional on splitBy */}
            {(splitBy === 'all' || splitBy === 'wash') && (
              <Line
                type="monotone"
                dataKey="PrevWash"
                name="Lavagens (Mês Anterior)"
                stroke={colors.info}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}
            {/* Previous Month Dry Trend - conditional on splitBy */}
            {(splitBy === 'all' || splitBy === 'dry') && (
              <Line
                type="monotone"
                dataKey="PrevDry"
                name="Secagens (Mês Anterior)"
                stroke={colors.warning}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Wash Bars - conditional on splitBy */}
            {(splitBy === 'all' || splitBy === 'wash') && (
              <Bar
                dataKey="Lavagens"
                fill="url(#washGradient)"
                radius={[4, 4, 0, 0]}
                name="Lavagens"
                maxBarSize={50}
              >
                <LabelList content={renderLabel} />
              </Bar>
            )}

            {/* Dry Bars - conditional on splitBy */}
            {(splitBy === 'all' || splitBy === 'dry') && (
              <Bar
                dataKey="Secagens"
                fill="url(#dryGradient)"
                radius={[4, 4, 0, 0]}
                name="Secagens"
                maxBarSize={50}
              >
                <LabelList content={renderLabel} />
              </Bar>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Mobile indicator for partial data */}
      {isMobile && (
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          📱 Mostrando últimos 10 dias no gráfico. Totais abaixo são do mês completo.
        </div>
      )}

      {/* Stats Footer - Always Full Month, with filter highlight */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          <div className={`text-center transition-opacity duration-200 ${splitBy !== 'all' ? 'opacity-50' : ''}`}>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {periodInfo.totalCycles}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              Total Ciclos
              {periodInfo.totalCycles > periodInfo.totalPrevious ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
              )}
            </div>
          </div>
          <div className={`text-center transition-all duration-200 ${splitBy === 'wash' ? 'scale-110' : splitBy === 'dry' ? 'opacity-50' : ''}`}>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>
              {periodInfo.totalWash}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <Droplet className="w-3 h-3" style={{ color: colors.primary }} />
              Lavagens
            </div>
          </div>
          <div className={`text-center transition-all duration-200 ${splitBy === 'dry' ? 'scale-110' : splitBy === 'wash' ? 'opacity-50' : ''}`}>
            <div className="text-2xl font-bold" style={{ color: colors.secondary }}>
              {periodInfo.totalDry}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3" style={{ color: colors.secondary }} />
              Secagens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatingCyclesChart;
