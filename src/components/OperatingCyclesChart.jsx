// OperatingCyclesChart.jsx v4.0 - ENHANCED COMPARISON
// ✅ Previous month comparison lines (dashed)
// ✅ Gradient bars for visual depth
// ✅ Mobile responsive adjustments
import React, { useMemo, useState, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Line, ComposedChart } from 'recharts';
import { WashingMachine, Calendar, TrendingUp } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';

const COLORS = {
  wash: {
    light: '#1a5a8e',
    dark: '#3b82f6',
    gradientStart: '#3b82f6',
    gradientEnd: '#1d4ed8'
  },
  dry: {
    light: '#55b03b',
    dark: '#55b03b',
    gradientStart: '#4ade80',
    gradientEnd: '#16a34a'
  },
  comparison: {
    stroke: '#94a3b8',
    strokeDark: '#64748b'
  }
};

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
  month = null,
  year = null
}) => {
  const { isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const washColor = isDark ? COLORS.wash.dark : COLORS.wash.light;
  const dryColor = isDark ? COLORS.dry.dark : COLORS.dry.light;
  const comparisonColor = isDark ? COLORS.comparison.strokeDark : COLORS.comparison.stroke;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg z-50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Dia {label}
            </p>
          </div>
          {payload.map((entry, index) => {
            // Skip rendering if value is 0 and it's not the comparison line
            if (entry.value === 0 && !entry.dataKey.startsWith('Prev')) return null;

            let labelText = entry.name;
            let isPrev = false;

            if (entry.dataKey === 'PrevWash') {
              labelText = `Lavagens (${periodInfo.prevMonth})`;
              isPrev = true;
            } else if (entry.dataKey === 'PrevDry') {
              labelText = `Secagens (${periodInfo.prevMonth})`;
              isPrev = true;
            }

            return (
              <div key={index} className="flex items-center justify-between gap-3 text-xs mb-1 last:mb-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 ${isPrev ? 'rounded-full' : 'rounded-sm'}`}
                    style={{ backgroundColor: entry.color }}
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
  };

  const renderLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={isDark ? '#e2e8f0' : '#1e293b'}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      >
        {value}
      </text>
    );
  };

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Lavagens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Secagens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-300 border-t border-dashed border-blue-300"></div>
            <span className="text-slate-600 dark:text-slate-400">Lavagens (Mês Ant.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-orange-300 border-t border-dashed border-orange-300"></div>
            <span className="text-slate-600 dark:text-slate-400">Secagens (Mês Ant.)</span>
          </div>
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
                <stop offset="0%" stopColor={COLORS.wash.gradientStart} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.wash.gradientEnd} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="dryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.dry.gradientStart} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.dry.gradientEnd} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{
                fontSize: 11,
                fill: isDark ? '#94a3b8' : '#64748b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: isDark ? '#94a3b8' : '#64748b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Ciclos',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: {
                  fontSize: 12,
                  fill: isDark ? '#cbd5e1' : '#475569',
                  fontWeight: 600,
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1e293b40' : '#f1f5f940' }} />

            {/* Previous Month Wash Trend */}
            <Line
              type="monotone"
              dataKey="PrevWash"
              name="Lavagens (Mês Anterior)"
              stroke="#93c5fd" // Light blue
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
            />
            {/* Previous Month Dry Trend */}
            <Line
              type="monotone"
              dataKey="PrevDry"
              name="Secagens (Mês Anterior)"
              stroke="#fdba74" // Light orange
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
            />

            <Bar
              dataKey="Lavagens"
              fill="url(#washGradient)"
              radius={[4, 4, 0, 0]}
              name="Lavagens"
              maxBarSize={50}
            >
              <LabelList content={renderLabel} />
            </Bar>

            <Bar
              dataKey="Secagens"
              fill="url(#dryGradient)"
              radius={[4, 4, 0, 0]}
              name="Secagens"
              maxBarSize={50}
            >
              <LabelList content={renderLabel} />
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer - Always Full Month */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {periodInfo.totalCycles}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
              Total Ciclos
              {periodInfo.totalCycles > periodInfo.totalPrevious ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {periodInfo.totalWash}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              Lavagens
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {periodInfo.totalDry}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              Secagens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatingCyclesChart;
