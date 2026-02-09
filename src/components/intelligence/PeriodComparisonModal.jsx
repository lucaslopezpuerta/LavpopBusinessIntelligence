// PeriodComparisonModal.jsx v1.0 - Comparative Period Analysis
// Side-by-side date range comparison with delta indicators and mini bar chart
// Design System v6.4 compliant - Cosmic Precision
//
// FEATURES:
// - Two date range selectors (Period A and Period B)
// - Preset range buttons (month vs month, week vs week, YoY, custom)
// - Side-by-side metrics: Revenue, Cycles, Avg Ticket, Unique Customers, Days
// - Delta indicators with green/red color coding
// - Mini comparison bar chart (Recharts)
// - Brazil timezone-aware date filtering
// - Responsive layout (stacked on mobile, side-by-side on desktop)
//
// CHANGELOG:
// v1.0 (2026-02-09): Initial implementation

import React, { useState, useMemo, useCallback } from 'react';
import { CalendarRange, TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import BaseModal from '../ui/BaseModal';
import { parseBrDate, getBrazilDateParts } from '../../utils/dateUtils';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/numberUtils';
import { parseBrNumber } from '../../utils/transactionParser';
import { getChartColors } from '../../utils/chartColors';

// ============================================
// CONSTANTS
// ============================================

const PRESET_RANGES = [
  { key: 'month-vs-prev', label: 'Mes atual vs anterior' },
  { key: 'month-vs-yoy', label: 'Mes vs mesmo mes ano passado' },
  { key: 'week-vs-prev', label: 'Semana vs anterior' },
  { key: 'custom', label: 'Personalizado' },
];

const METRIC_LABELS = {
  revenue: 'Receita',
  cycles: 'Ciclos',
  avgTicket: 'Ticket Medio',
  uniqueCustomers: 'Clientes Unicos',
  days: 'Dias no Periodo',
};

const METRIC_KEYS = ['revenue', 'cycles', 'avgTicket', 'uniqueCustomers', 'days'];

// Colors for period A / period B bars
const PERIOD_A_COLOR_DARK = '#3b82f6';  // blue-500
const PERIOD_A_COLOR_LIGHT = '#1a5a8e'; // lavpop-blue
const PERIOD_B_COLOR_DARK = '#a78bfa';  // violet-400
const PERIOD_B_COLOR_LIGHT = '#8b5cf6'; // violet-500

// ============================================
// HELPERS
// ============================================

/**
 * Get Brazil-timezone date string (YYYY-MM-DD) from a transaction's Data_Hora field.
 * The Data_Hora is already formatted in Brazil time by supabaseLoader, so we parse it
 * via parseBrDate and use the .brazil property.
 */
function getBrazilDateStr(dataHora) {
  const parsed = parseBrDate(dataHora);
  if (!parsed || !parsed.brazil) return null;
  const { year, month, day } = parsed.brazil;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Compute preset date ranges based on Brazil timezone "today".
 */
function computePresetDates(presetKey) {
  const bp = getBrazilDateParts();
  const today = new Date(bp.year, bp.month - 1, bp.day);

  switch (presetKey) {
    case 'month-vs-prev': {
      // Period A = current month so far, Period B = previous month (full)
      const aStart = new Date(bp.year, bp.month - 1, 1);
      const aEnd = today;
      const bStart = new Date(bp.year, bp.month - 2, 1);
      const bEnd = new Date(bp.year, bp.month - 1, 0); // last day of prev month
      return {
        aStart: toInputDate(aStart),
        aEnd: toInputDate(aEnd),
        bStart: toInputDate(bStart),
        bEnd: toInputDate(bEnd),
      };
    }

    case 'month-vs-yoy': {
      // Period A = current month so far, Period B = same month last year
      const aStart = new Date(bp.year, bp.month - 1, 1);
      const aEnd = today;
      const bStart = new Date(bp.year - 1, bp.month - 1, 1);
      // Use same day-of-month as today for fair comparison, capped to last day of that month
      const lastDayPrevYear = new Date(bp.year - 1, bp.month, 0).getDate();
      const bEndDay = Math.min(bp.day, lastDayPrevYear);
      const bEnd = new Date(bp.year - 1, bp.month - 1, bEndDay);
      return {
        aStart: toInputDate(aStart),
        aEnd: toInputDate(aEnd),
        bStart: toInputDate(bStart),
        bEnd: toInputDate(bEnd),
      };
    }

    case 'week-vs-prev': {
      // Period A = current week (Sun-today), Period B = previous week (Sun-Sat)
      const dayOfWeek = bp.dayOfWeek; // 0=Sun
      const thisSunday = new Date(today);
      thisSunday.setDate(today.getDate() - dayOfWeek);

      const prevSaturday = new Date(thisSunday);
      prevSaturday.setDate(thisSunday.getDate() - 1);
      const prevSunday = new Date(prevSaturday);
      prevSunday.setDate(prevSaturday.getDate() - 6);

      return {
        aStart: toInputDate(thisSunday),
        aEnd: toInputDate(today),
        bStart: toInputDate(prevSunday),
        bEnd: toInputDate(prevSaturday),
      };
    }

    default:
      return null;
  }
}

/** Convert a Date to YYYY-MM-DD for input[type="date"]. */
function toInputDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filter sales array by a YYYY-MM-DD range (inclusive).
 * Transaction dates are compared using Brazil timezone extracted from Data_Hora.
 */
function filterSalesByRange(sales, startStr, endStr) {
  if (!sales || !startStr || !endStr) return [];
  return sales.filter((t) => {
    const dateStr = getBrazilDateStr(t.Data_Hora);
    if (!dateStr) return false;
    return dateStr >= startStr && dateStr <= endStr;
  });
}

/**
 * Calculate metrics for a filtered subset of transactions.
 * Excludes Recarga from revenue, cycles, and avg ticket.
 * Includes all transaction types for unique customer count.
 */
function calcMetrics(filteredSales) {
  if (!filteredSales || filteredSales.length === 0) {
    return { revenue: 0, cycles: 0, avgTicket: 0, uniqueCustomers: 0, days: 0 };
  }

  let revenue = 0;
  let cycles = 0;
  let serviceTransactionCount = 0;
  const uniqueDocs = new Set();
  const uniqueDates = new Set();

  filteredSales.forEach((row) => {
    const machineStr = String(row.Maquinas || '').toLowerCase();
    const isRecarga = machineStr.includes('recarga');
    const netValue = parseBrNumber(row.Valor_Pago || 0);

    // Unique dates (Brazil timezone)
    const dateStr = getBrazilDateStr(row.Data_Hora);
    if (dateStr) uniqueDates.add(dateStr);

    // Unique customers (all types)
    const doc = String(row.Doc_Cliente || '').trim();
    if (doc && doc !== '' && doc !== '0') uniqueDocs.add(doc);

    // Revenue and cycles: exclude recarga
    if (!isRecarga) {
      revenue += netValue;
      serviceTransactionCount++;

      // Count machines (wash + dry) as cycles
      const machines = machineStr.split(',').map((m) => m.trim()).filter(Boolean);
      let machineCount = 0;
      machines.forEach((m) => {
        if (m.includes('lavadora') || m.includes('secadora')) machineCount++;
      });
      cycles += machineCount || 0;
    }
  });

  const avgTicket = serviceTransactionCount > 0 ? revenue / serviceTransactionCount : 0;

  return {
    revenue,
    cycles,
    avgTicket,
    uniqueCustomers: uniqueDocs.size,
    days: uniqueDates.size,
  };
}

/**
 * Calculate percentage change from B to A.
 * Positive means A is higher (improvement if metric is better when higher).
 */
function calcDelta(valA, valB) {
  if (valB === 0 && valA === 0) return 0;
  if (valB === 0) return valA > 0 ? 100 : -100;
  return ((valA - valB) / Math.abs(valB)) * 100;
}

/**
 * Format a metric value for display.
 */
function formatMetricValue(key, value) {
  switch (key) {
    case 'revenue':
      return formatCurrency(value);
    case 'avgTicket':
      return formatCurrency(value);
    case 'cycles':
    case 'uniqueCustomers':
    case 'days':
      return formatNumber(value, 0);
    default:
      return String(value);
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Preset range pill buttons
 */
const PresetPills = ({ activePreset, onSelect, isDark }) => (
  <div className="flex flex-wrap gap-2">
    {PRESET_RANGES.map((preset) => {
      const isActive = activePreset === preset.key;
      return (
        <button
          key={preset.key}
          type="button"
          onClick={() => onSelect(preset.key)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan focus-visible:ring-offset-2
            ${isDark ? 'focus-visible:ring-offset-space-dust' : 'focus-visible:ring-offset-white'}
            ${isActive
              ? isDark
                ? 'bg-stellar-cyan/20 text-stellar-cyan border border-stellar-cyan/40'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
              : isDark
                ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
            }
          `}
        >
          {preset.label}
        </button>
      );
    })}
  </div>
);

/**
 * Date range input pair
 */
const DateRangeInput = ({ label, color, startDate, endDate, onStartChange, onEndChange, isDark, disabled }) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        disabled={disabled}
        className={`
          flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-mono
          border transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
          ${isDark
            ? 'bg-space-nebula border-stellar-cyan/15 text-white placeholder-slate-500'
            : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={`${label} - data inicial`}
      />
      <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        disabled={disabled}
        className={`
          flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs font-mono
          border transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-cyan
          ${isDark
            ? 'bg-space-nebula border-stellar-cyan/15 text-white placeholder-slate-500'
            : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={`${label} - data final`}
      />
    </div>
  </div>
);

/**
 * Delta badge showing percentage change between two values
 */
const DeltaBadge = ({ delta, isDark }) => {
  if (delta === null || delta === undefined || isNaN(delta)) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
        <Minus className="w-3 h-3" />
        N/A
      </span>
    );
  }

  const isPositive = delta > 0;
  const isNeutral = Math.abs(delta) < 0.5;

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold
        ${isPositive
          ? isDark
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-emerald-100 text-emerald-700'
          : isDark
            ? 'bg-red-500/20 text-red-400'
            : 'bg-red-100 text-red-700'
        }
      `}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{formatPercent(delta, 1)}
    </span>
  );
};

/**
 * Single metric comparison row
 */
const MetricRow = ({ metricKey, label, valueA, valueB, delta, isDark, isMobile }) => (
  <div
    className={`
      grid items-center gap-2 py-3
      ${isMobile ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1.2fr_1fr_auto_1fr]'}
      border-b last:border-b-0
      ${isDark ? 'border-stellar-cyan/5' : 'border-slate-100'}
    `}
  >
    {/* Label */}
    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      {label}
    </span>

    {isMobile ? (
      /* Mobile: stacked layout */
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {formatMetricValue(metricKey, valueA)}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>vs</span>
          <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
            {formatMetricValue(metricKey, valueB)}
          </span>
        </div>
        <DeltaBadge delta={delta} isDark={isDark} />
      </div>
    ) : (
      /* Desktop: columns */
      <>
        <span className={`text-sm font-semibold tabular-nums text-right ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          {formatMetricValue(metricKey, valueA)}
        </span>
        <div className="flex justify-center">
          <DeltaBadge delta={delta} isDark={isDark} />
        </div>
        <span className={`text-sm font-semibold tabular-nums text-right ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
          {formatMetricValue(metricKey, valueB)}
        </span>
      </>
    )}
  </div>
);

/**
 * Mini comparison bar chart
 */
const ComparisonChart = ({ metricsA, metricsB, isDark }) => {
  const chartColors = getChartColors(isDark);
  const colorA = isDark ? PERIOD_A_COLOR_DARK : PERIOD_A_COLOR_LIGHT;
  const colorB = isDark ? PERIOD_B_COLOR_DARK : PERIOD_B_COLOR_LIGHT;

  // Normalize each metric to 0-100 for visual comparison
  const chartData = useMemo(() => {
    return ['revenue', 'cycles', 'avgTicket', 'uniqueCustomers'].map((key) => {
      const a = metricsA[key] || 0;
      const b = metricsB[key] || 0;
      const maxVal = Math.max(a, b, 1);
      return {
        name: METRIC_LABELS[key],
        periodA: (a / maxVal) * 100,
        periodB: (b / maxVal) * 100,
        rawA: a,
        rawB: b,
        key,
      };
    });
  }, [metricsA, metricsB]);

  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div
        className={`
          px-3 py-2 rounded-lg text-xs shadow-lg border
          ${isDark ? 'bg-space-dust border-stellar-cyan/20 text-white' : 'bg-white border-slate-200 text-slate-800'}
        `}
      >
        <p className="font-semibold mb-1">{item.name}</p>
        <p style={{ color: colorA }}>
          Periodo A: {formatMetricValue(item.key, item.rawA)}
        </p>
        <p style={{ color: colorB }}>
          Periodo B: {formatMetricValue(item.key, item.rawB)}
        </p>
      </div>
    );
  }, [isDark, colorA, colorB]);

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
          barCategoryGap="20%"
          barGap={2}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: chartColors.tickText,
              fontSize: 10,
            }}
            interval={0}
          />
          <YAxis hide domain={[0, 110]} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="periodA" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((_, index) => (
              <Cell key={`a-${index}`} fill={colorA} fillOpacity={0.85} />
            ))}
          </Bar>
          <Bar dataKey="periodB" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((_, index) => (
              <Cell key={`b-${index}`} fill={colorB} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Summary verdict: which period performed better overall
 */
const SummaryVerdict = ({ metricsA, metricsB, isDark }) => {
  const wins = useMemo(() => {
    let aWins = 0;
    let bWins = 0;
    ['revenue', 'cycles', 'avgTicket', 'uniqueCustomers'].forEach((key) => {
      if (metricsA[key] > metricsB[key]) aWins++;
      else if (metricsB[key] > metricsA[key]) bWins++;
    });
    return { a: aWins, b: bWins };
  }, [metricsA, metricsB]);

  const isTie = wins.a === wins.b;
  const aWon = wins.a > wins.b;

  let message;
  let badgeColor;
  if (isTie) {
    message = 'Desempenho equilibrado entre os periodos';
    badgeColor = isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (aWon) {
    message = `Periodo A venceu em ${wins.a} de 4 metricas`;
    badgeColor = isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200';
  } else {
    message = `Periodo B venceu em ${wins.b} de 4 metricas`;
    badgeColor = isDark ? 'bg-violet-500/15 text-violet-400 border-violet-500/20' : 'bg-violet-50 text-violet-700 border-violet-200';
  }

  return (
    <div
      className={`
        flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border
        ${badgeColor}
      `}
    >
      <BarChart3 className="w-3.5 h-3.5" />
      {message}
    </div>
  );
};

/**
 * Empty state when no data is available for the selected ranges
 */
const EmptyState = ({ isDark }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <CalendarRange className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      Selecione os periodos para comparar
    </p>
    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
      Escolha um preset ou defina datas personalizadas
    </p>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * PeriodComparisonModal - Side-by-side date range comparison
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal should close
 * @param {Array} salesData - transactions array (CSV-format rows with Data_Hora, Valor_Pago, etc.)
 * @param {Array} dailyRevenueData - daily_revenue / mv_daily_revenue rows (unused in v1.0, reserved for future)
 */
// eslint-disable-next-line no-unused-vars
const PeriodComparisonModal = ({ isOpen, onClose, salesData = [], dailyRevenueData = [] }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // -- State --
  const [activePreset, setActivePreset] = useState('month-vs-prev');
  const [periodA, setPeriodA] = useState({ start: '', end: '' });
  const [periodB, setPeriodB] = useState({ start: '', end: '' });
  const [isCustom, setIsCustom] = useState(false);

  // Compute effective dates: preset overrides manual dates unless custom
  const effectiveDates = useMemo(() => {
    if (isCustom) {
      return {
        aStart: periodA.start,
        aEnd: periodA.end,
        bStart: periodB.start,
        bEnd: periodB.end,
      };
    }
    const preset = computePresetDates(activePreset);
    if (preset) return preset;
    // Fallback to manual
    return {
      aStart: periodA.start,
      aEnd: periodA.end,
      bStart: periodB.start,
      bEnd: periodB.end,
    };
  }, [isCustom, activePreset, periodA, periodB]);

  // Sync manual inputs when preset changes
  const handlePresetSelect = useCallback((key) => {
    setActivePreset(key);
    if (key === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const preset = computePresetDates(key);
      if (preset) {
        setPeriodA({ start: preset.aStart, end: preset.aEnd });
        setPeriodB({ start: preset.bStart, end: preset.bEnd });
      }
    }
  }, []);

  // Initialize dates on first open
  const [initialized, setInitialized] = useState(false);
  useMemo(() => {
    if (isOpen && !initialized) {
      handlePresetSelect('month-vs-prev');
      setInitialized(true);
    }
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, initialized, handlePresetSelect]);

  // -- Calculated metrics --
  const metricsA = useMemo(
    () => calcMetrics(filterSalesByRange(salesData, effectiveDates.aStart, effectiveDates.aEnd)),
    [salesData, effectiveDates.aStart, effectiveDates.aEnd]
  );

  const metricsB = useMemo(
    () => calcMetrics(filterSalesByRange(salesData, effectiveDates.bStart, effectiveDates.bEnd)),
    [salesData, effectiveDates.bStart, effectiveDates.bEnd]
  );

  const deltas = useMemo(() => {
    const result = {};
    METRIC_KEYS.forEach((key) => {
      result[key] = calcDelta(metricsA[key], metricsB[key]);
    });
    return result;
  }, [metricsA, metricsB]);

  const hasData = metricsA.days > 0 || metricsB.days > 0;

  // -- Period colors --
  const colorA = isDark ? PERIOD_A_COLOR_DARK : PERIOD_A_COLOR_LIGHT;
  const colorB = isDark ? PERIOD_B_COLOR_DARK : PERIOD_B_COLOR_LIGHT;

  // -- Date input handlers for custom mode --
  const handlePeriodAStart = useCallback((val) => {
    setPeriodA((prev) => ({ ...prev, start: val }));
    if (!isCustom) { setIsCustom(true); setActivePreset('custom'); }
  }, [isCustom]);

  const handlePeriodAEnd = useCallback((val) => {
    setPeriodA((prev) => ({ ...prev, end: val }));
    if (!isCustom) { setIsCustom(true); setActivePreset('custom'); }
  }, [isCustom]);

  const handlePeriodBStart = useCallback((val) => {
    setPeriodB((prev) => ({ ...prev, start: val }));
    if (!isCustom) { setIsCustom(true); setActivePreset('custom'); }
  }, [isCustom]);

  const handlePeriodBEnd = useCallback((val) => {
    setPeriodB((prev) => ({ ...prev, end: val }));
    if (!isCustom) { setIsCustom(true); setActivePreset('custom'); }
  }, [isCustom]);

  // -- Render --
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Analise Comparativa"
      subtitle="Compare dois periodos lado a lado"
      icon={CalendarRange}
      iconColor="cyan"
      size="large"
      maxWidth="2xl"
      ariaLabel="Analise comparativa de periodos"
    >
      <div className="px-4 sm:px-6 pt-4 pb-6 space-y-5">
        {/* Preset pills */}
        <PresetPills
          activePreset={activePreset}
          onSelect={handlePresetSelect}
          isDark={isDark}
        />

        {/* Date range inputs */}
        <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <DateRangeInput
            label="Periodo A"
            color={colorA}
            startDate={effectiveDates.aStart}
            endDate={effectiveDates.aEnd}
            onStartChange={handlePeriodAStart}
            onEndChange={handlePeriodAEnd}
            isDark={isDark}
            disabled={false}
          />
          <DateRangeInput
            label="Periodo B"
            color={colorB}
            startDate={effectiveDates.bStart}
            endDate={effectiveDates.bEnd}
            onStartChange={handlePeriodBStart}
            onEndChange={handlePeriodBEnd}
            isDark={isDark}
            disabled={false}
          />
        </div>

        {/* Metrics comparison or empty state */}
        {hasData ? (
          <>
            {/* Column headers (desktop only) */}
            {!isMobile && (
              <div className="grid grid-cols-[1.2fr_1fr_auto_1fr] items-center gap-2 pb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Metrica
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: colorA }}>
                  Periodo A
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Variacao
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-right" style={{ color: colorB }}>
                  Periodo B
                </span>
              </div>
            )}

            {/* Metrics card */}
            <div
              className={`
                rounded-xl border p-3
                ${isDark ? 'bg-space-nebula/50 border-stellar-cyan/10' : 'bg-slate-50 border-slate-200'}
              `}
            >
              {METRIC_KEYS.map((key) => (
                <MetricRow
                  key={key}
                  metricKey={key}
                  label={METRIC_LABELS[key]}
                  valueA={metricsA[key]}
                  valueB={metricsB[key]}
                  delta={deltas[key]}
                  isDark={isDark}
                  isMobile={isMobile}
                />
              ))}
            </div>

            {/* Mini comparison bar chart */}
            <div
              className={`
                rounded-xl border p-3
                ${isDark ? 'bg-space-nebula/50 border-stellar-cyan/10' : 'bg-slate-50 border-slate-200'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Comparativo Visual
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colorA }} />
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>A</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colorB }} />
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>B</span>
                  </div>
                </div>
              </div>
              <ComparisonChart metricsA={metricsA} metricsB={metricsB} isDark={isDark} />
            </div>

            {/* Summary verdict */}
            <SummaryVerdict metricsA={metricsA} metricsB={metricsB} isDark={isDark} />
          </>
        ) : (
          <EmptyState isDark={isDark} />
        )}
      </div>
    </BaseModal>
  );
};

export default PeriodComparisonModal;
