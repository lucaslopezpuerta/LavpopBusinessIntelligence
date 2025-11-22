// OperatingCyclesChart_v1.1.jsx
// Operating cycles chart showing daily wash vs dry cycles using Nivo
//
// FEATURES:
// ✅ Nivo ResponsiveBar chart (grouped mode)
// ✅ Dark/Light theme support
// ✅ Shows wash and dry cycles per day
// ✅ Proper numeric day sorting
// ✅ Labels on top of bars
// ✅ No legends (uses color key in header)
// ✅ WashingMachine icon
// ✅ Follows Lavpop Design System
//
// CHANGELOG:
// v1.1 (2025-11-21): Fixed sorting, grouped bars, labels, icon, font
// v1.0 (2025-11-21): Initial implementation

import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { WashingMachine, Calendar } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';

const COLORS = {
  wash: '#3b82f6',     // Blue for washes
  dry: '#f59e0b',      // Amber for dryers
  primary: '#1a5a8e',  // Lavpop blue
  accent: '#55b03b'    // Lavpop green
};

/**
 * Count machines from string like "Lavadora 1, Secadora 2"
 */
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

/**
 * Get month name in Portuguese
 */
function getMonthName(monthIndex) {
  const months = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];
  return months[monthIndex];
}

const OperatingCyclesChart = ({ 
  salesData, 
  month = null,  // 0-11, null = current month
  year = null    // YYYY, null = current year
}) => {
  const { isDark } = useTheme();

  const { chartData, periodInfo } = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { chartData: [], periodInfo: null };
    }

    const now = new Date();
    const targetMonth = month !== null ? month : now.getMonth();
    const targetYear = year !== null ? year : now.getFullYear();

    // Get days in target month
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Initialize daily map with NUMERIC keys
    const dailyMap = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dailyMap[day] = {
        dayNum: day,
        day: String(day).padStart(2, '0'),
        Lavagens: 0,
        Secagens: 0
      };
    }

    // Process sales data
    salesData.forEach(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date) return;

      // Filter by target month/year
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

    // Convert to array and sort by numeric day
    const data = Object.values(dailyMap).sort((a, b) => a.dayNum - b.dayNum);

    // Calculate totals
    const totalWash = data.reduce((sum, d) => sum + d.Lavagens, 0);
    const totalDry = data.reduce((sum, d) => sum + d.Secagens, 0);

    const info = {
      month: getMonthName(targetMonth),
      year: targetYear,
      totalWash,
      totalDry,
      totalCycles: totalWash + totalDry
    };

    return { chartData: data, periodInfo: info };
  }, [salesData, month, year]);

  // Theme-aware colors
  const theme = {
    background: 'transparent',
    textColor: isDark ? '#e2e8f0' : '#475569',
    fontSize: 11,
    axis: {
      domain: {
        line: {
          stroke: isDark ? '#334155' : '#e2e8f0',
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: isDark ? '#334155' : '#e2e8f0',
          strokeWidth: 1
        },
        text: {
          fontSize: 11,
          fill: isDark ? '#94a3b8' : '#64748b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }
      },
      legend: {
        text: {
          fontSize: 12,
          fill: isDark ? '#cbd5e1' : '#475569',
          fontWeight: 600,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }
      }
    },
    grid: {
      line: {
        stroke: isDark ? '#1e293b' : '#f1f5f9',
        strokeWidth: 1
      }
    },
    labels: {
      text: {
        fontSize: 11,
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }
    },
    tooltip: {
      container: {
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#0f172a',
        fontSize: 12,
        borderRadius: '8px',
        boxShadow: isDark 
          ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '8px 12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }
    }
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-sans">
            Ciclos de Operação
          </h3>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-sans">
            Mês de {periodInfo.month}/{periodInfo.year}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.wash }} />
              <span className="text-slate-600 dark:text-slate-400 font-medium font-sans">
                Lavagens ({periodInfo.totalWash})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.dry }} />
              <span className="text-slate-600 dark:text-slate-400 font-medium font-sans">
                Secagens ({periodInfo.totalDry})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '400px' }}>
        <ResponsiveBar
          data={chartData}
          keys={['Lavagens', 'Secagens']}
          indexBy="day"
          margin={{ top: 40, right: 20, bottom: 50, left: 50 }}
          padding={0.3}
          groupMode="grouped"
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={[COLORS.wash, COLORS.dry]}
          borderRadius={4}
          borderWidth={0}
          theme={theme}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Dia do Mês',
            legendPosition: 'middle',
            legendOffset: 40
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Número de Ciclos',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          enableGridY={true}
          enableLabel={true}
          label={d => d.value > 0 ? d.value : ''}
          labelSkipWidth={0}
          labelSkipHeight={0}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 2]]
          }}
          legends={[]}
          role="application"
          ariaLabel="Gráfico de ciclos de operação"
          barAriaLabel={e => `${e.id}: ${e.formattedValue} no dia ${e.indexValue}`}
          tooltip={({ id, value, indexValue, color }) => (
            <div style={{
              padding: '8px 12px',
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: '8px',
              boxShadow: isDark 
                ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}>
                <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
                <strong style={{ 
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  fontSize: '13px'
                }}>
                  Dia {indexValue}
                </strong>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}>
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    backgroundColor: color
                  }}
                />
                <span style={{ 
                  color: isDark ? '#cbd5e1' : '#475569',
                  fontWeight: 600
                }}>
                  {id}:
                </span>
                <span style={{ 
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  fontWeight: 700
                }}>
                  {value} {value === 1 ? 'ciclo' : 'ciclos'}
                </span>
              </div>
            </div>
          )}
          animate={true}
          motionConfig="gentle"
        />
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-lavpop-blue dark:text-blue-400 font-sans">
              {periodInfo.totalCycles}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 font-sans">
              Total Ciclos
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-sans" style={{ color: COLORS.wash }}>
              {periodInfo.totalWash}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 font-sans">
              Lavagens
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-sans" style={{ color: COLORS.dry }}>
              {periodInfo.totalDry}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 font-sans">
              Secagens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatingCyclesChart;
