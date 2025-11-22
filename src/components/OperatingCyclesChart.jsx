// OperatingCyclesChart_v1.4.jsx
// Operating cycles chart using Recharts
//
// FEATURES:
// ✅ Recharts BarChart (grouped mode)
// ✅ Labels above bars
// ✅ Mobile: last 10 days from the current date
// ✅ Footer: always shows full month totals
// ✅ Rectangular bars, Lavpop brand colors
//
// CHANGELOG:
// v1.4 (2025-11-21): Mobile shows 10 days before current date, footer shows full month totals
// v1.3 (2025-11-21): Switched to Recharts, rectangular bars
// v1.2 (2025-11-21): Brand colors, full month names
// v1.1 (2025-11-21): Fixed sorting, grouped bars
// v1.0 (2025-11-21): Initial implementation

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { WashingMachine, Calendar } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';

const COLORS = {
  wash: {
    light: '#1a5a8e',
    dark: '#3b82f6'
  },
  dry: {
    light: '#55b03b',
    dark: '#55b03b'
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
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const dailyMap = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap[day] = {
        dayNum: day,
        day: String(day).padStart(2, '0'),
        Lavagens: 0,
        Secagens: 0
      };
    }

    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date) return;

      if (date.getMonth() !== targetMonth || date.getFullYear() !== targetYear) {
        return;
      }

      const dayNum = date.getDate();
      const machineInfo = countMachines(row.Maquina || row.machine || row.Maquinas || '');

      if (dailyMap[dayNum]) {
        dailyMap[dayNum].Lavagens += machineInfo.wash;
        dailyMap[dayNum].Secagens += machineInfo.dry;
      }
    });

    let allData = Object.values(dailyMap).sort((a, b) => a.dayNum - b.dayNum);

    // Calculate FULL MONTH totals (always)
    const totalWash = allData.reduce((sum, d) => sum + d.Lavagens, 0);
    const totalDry = allData.reduce((sum, d) => sum + d.Secagens, 0);

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
      totalWash,
      totalDry,
      totalCycles: totalWash + totalDry
    };

    return { chartData: displayData, periodInfo: info };
  }, [salesData, month, year, isMobile]);

  const washColor = isDark ? COLORS.wash.dark : COLORS.wash.light;
  const dryColor = isDark ? COLORS.dry.dark : COLORS.dry.light;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-lavpop-blue dark:text-blue-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Dia {label}
            </p>
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {entry.name}:
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                {entry.value} {entry.value === 1 ? 'ciclo' : 'ciclos'}
              </span>
            </div>
          ))}
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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <WashingMachine className="w-5 h-5 text-lavpop-blue dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ciclos de Operação
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Mês de {periodInfo.month}/{periodInfo.year}
        </p>
      </div>

      {/* Chart */}
      <div style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 30, right: 20, bottom: 50, left: 50 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#1e293b' : '#f1f5f9'} 
            />
            <XAxis 
              dataKey="day"
              tick={{ 
                fontSize: 11, 
                fill: isDark ? '#94a3b8' : '#64748b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              tickLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              label={{ 
                value: 'Dia do Mês', 
                position: 'insideBottom', 
                offset: -40,
                style: {
                  fontSize: 12,
                  fill: isDark ? '#cbd5e1' : '#475569',
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }
              }}
            />
            <YAxis 
              tick={{ 
                fontSize: 11, 
                fill: isDark ? '#94a3b8' : '#64748b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
              axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              tickLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
              label={{ 
                value: 'Número de Ciclos', 
                angle: -90, 
                position: 'insideLeft',
                style: {
                  fontSize: 12,
                  fill: isDark ? '#cbd5e1' : '#475569',
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1e293b40' : '#f1f5f940' }} />
            
            <Bar 
              dataKey="Lavagens" 
              fill={washColor} 
              radius={0}
              name="Lavagens"
            >
              <LabelList content={renderLabel} />
            </Bar>
            
            <Bar 
              dataKey="Secagens" 
              fill={dryColor} 
              radius={0}
              name="Secagens"
            >
              <LabelList content={renderLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer - Always Full Month */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {periodInfo.totalCycles}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              Total Ciclos
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: washColor }}>
              {periodInfo.totalWash}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              Lavagens
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: dryColor }}>
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
