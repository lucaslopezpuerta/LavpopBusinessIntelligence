// GrowthTrendsSection.jsx v6.0.0
// Growth & trends analysis section for Intelligence tab
// Design System v5.1 compliant - Premium Glass styling
//
// CHANGELOG:
// v6.0.0 (2026-01-24): Premium Glass redesign
//   - Replaced SectionCard with direct Premium Glass container
//   - Added useMediaQuery() for isDesktop responsive sizing
//   - Redesigned service breakdown cards with Premium Glass styling
//   - Updated chart container and period selector styling
//   - Redesigned mobile cards and desktop table with Premium Glass
//   - KPI grid now uses direct grid (4 cols desktop, 2 cols mobile)
//   - Coherent with PriorityMatrix, RevenueForecast, ProfitabilitySection
// v5.15 (2026-01-09): Light background KPI cards
// v5.14 (2026-01-09): Design System v4.0 typography compliance
// v5.13 (2026-01-07): Use shared ContextHelp component
// v5.12-v5.0: Previous versions (chart improvements, service breakdown, etc.)

import { useMemo, useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock, Droplet, Wind, CreditCard, Info, Calendar, ChevronDown } from 'lucide-react';
import KPICard from '../ui/KPICard';
import ContextHelp from '../ContextHelp';
import { useIsMobile, useMediaQuery } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMonthKey, getBrazilDateParts } from '../../utils/dateUtils';
import { CHART_ANIMATION } from '../../constants/animations';

// Service segment card - Premium Glass style
const ServiceSegmentCard = ({ label, icon: Icon, revenue, growth, isMainDriver, formatCurrency, isDark, isDesktop }) => {
  const growthColor = growth === null
    ? isDark ? 'text-slate-400' : 'text-slate-500'
    : growth > 0
      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
      : growth < -5
        ? isDark ? 'text-red-400' : 'text-red-600'
        : isDark ? 'text-amber-400' : 'text-amber-600';

  const iconColor = isMainDriver
    ? isDark ? 'text-red-400' : 'text-red-500'
    : isDark ? 'text-slate-400' : 'text-slate-500';

  const iconBg = isMainDriver
    ? isDark ? 'bg-red-500/20' : 'bg-red-100'
    : isDark ? 'bg-slate-700' : 'bg-slate-100';

  return (
    <div className={`
      p-3 rounded-xl
      ${isMainDriver
        ? isDark
          ? 'bg-red-900/20 ring-2 ring-red-500/30'
          : 'bg-red-50 ring-2 ring-red-200'
        : isDark
          ? 'bg-space-dust/60 ring-1 ring-white/[0.08]'
          : 'bg-white ring-1 ring-slate-200'
      }
      shadow-sm
    `}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {label}
            </span>
            {isMainDriver && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                Foco
              </span>
            )}
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>vs mês anterior</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(revenue)}
          </p>
          <p className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold ${growthColor}`}>
            {growth === null ? '—' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
          </p>
        </div>
      </div>
    </div>
  );
};

// Chart period options
const CHART_PERIODS = [
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
  { value: 24, label: '24M' },
];

const GrowthTrendsSection = ({
  growthTrends,
  serviceBreakdown,
  formatCurrency,
  formatPercent,
  collapsible = false,
  isCollapsed = false,
  onToggle
}) => {
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { isDark } = useTheme();

  // Reduced motion preference for accessibility
  const prefersReducedMotion = useReducedMotion();
  const chartAnim = prefersReducedMotion ? CHART_ANIMATION.REDUCED : CHART_ANIMATION.LINE;

  // Chart period selector state
  const [chartPeriod, setChartPeriod] = useState(12);

  // Memoize chart data with formatted month names
  const chartData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;
    const dataPoints = growthTrends.monthly.slice(-chartPeriod).map((m) => ({
      month: formatMonthKey(m.month, isMobile ? 'tiny' : 'short'),
      fullMonth: formatMonthKey(m.month, 'long'),
      Receita: m.revenue || 0,
      isPartial: m.isPartial || false,
    }));
    if (dataPoints.length < 2) return null;
    return dataPoints;
  }, [growthTrends?.monthly, isMobile, chartPeriod]);

  // Calculate average revenue for trend line
  const averageRevenue = useMemo(() => {
    if (!chartData?.length) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.Receita, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  // Currency formatter for tooltips and Y-axis
  const currencyFormatter = useCallback((value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Format Y axis values (compact on mobile)
  const formatYAxis = useCallback((value) => {
    if (isMobile) {
      if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
      }
      return `R$ ${value}`;
    }
    return currencyFormatter(value);
  }, [isMobile, currencyFormatter]);

  // Custom tooltip for Recharts
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className={`
        px-3 py-2 rounded-lg shadow-xl pointer-events-none
        ${isDark ? 'bg-space-dust ring-1 ring-white/[0.1]' : 'bg-white ring-1 ring-slate-200'}
      `}>
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {data.fullMonth || data.month}
        </p>
        <p className={`text-base font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          {currencyFormatter(data.Receita)}
        </p>
      </div>
    );
  }, [isDark, currencyFormatter]);

  // Memoize monthly data for table/cards
  const monthlyData = useMemo(() =>
    growthTrends?.monthly?.slice(-6).reverse() || [],
    [growthTrends?.monthly]
  );

  if (!growthTrends) return null;

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (growthTrends.trend === 'increasing') {
      return { icon: TrendingUp, color: 'positive', label: 'Crescendo' };
    }
    if (growthTrends.trend === 'decreasing') {
      return { icon: TrendingDown, color: 'negative', label: 'Caindo' };
    }
    return { icon: Minus, color: 'neutral', label: 'Estável' };
  };

  const trendDisplay = getTrendDisplay();

  // Month names for YoY labels
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calculate YoY comparison data
  const yoyData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;

    const currentMonth = growthTrends.monthly.find(m => m.isCurrentMonth || m.isPartial)
      || growthTrends.monthly[growthTrends.monthly.length - 1];

    const yoyGrowth = currentMonth.yoyGrowth;
    const hasYoYData = yoyGrowth !== null && yoyGrowth !== undefined;

    const currentMonthDate = currentMonth.month;
    const [year, month] = currentMonthDate.split('-').map(Number);
    const lastYearKey = `${year - 1}-${String(month).padStart(2, '0')}`;
    const lastYearMonth = growthTrends.monthly.find(m => m.month === lastYearKey);

    let lastYearRevenue = 0;
    if (lastYearMonth) {
      lastYearRevenue = lastYearMonth.revenue;
    } else if (hasYoYData && yoyGrowth !== 0 && currentMonth.revenue > 0) {
      lastYearRevenue = Math.round(currentMonth.revenue / (1 + yoyGrowth / 100));
    }

    return {
      currentRevenue: currentMonth.revenue,
      lastYearRevenue,
      yoyGrowth,
      hasLastYearData: hasYoYData,
      currentMonthLabel: formatMonthKey(currentMonth.month, 'short'),
      lastYearLabel: lastYearMonth ? formatMonthKey(lastYearKey, 'short') : `${MONTH_NAMES[month - 1]} ${year - 1}`
    };
  }, [growthTrends?.monthly, MONTH_NAMES]);

  // Get current/previous month names for service breakdown context
  const brazilParts = getBrazilDateParts();
  const currentMonthName = MONTH_NAMES[brazilParts.month - 1];
  const previousMonthIdx = brazilParts.month === 1 ? 11 : brazilParts.month - 2;
  const previousMonthName = MONTH_NAMES[previousMonthIdx];

  return (
    <div
      id="growth-section"
      className={`
        ${isDark ? 'bg-space-dust/40' : 'bg-white/80'}
        backdrop-blur-xl rounded-2xl p-5
        ${isDark
          ? 'ring-1 ring-white/[0.05] shadow-[0_0_20px_-5px_rgba(59,130,246,0.15),inset_0_1px_1px_rgba(255,255,255,0.10)]'
          : 'ring-1 ring-slate-200/80 shadow-[0_8px_32px_-12px_rgba(100,116,139,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
        }
        overflow-hidden
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <TrendingUp className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Crescimento & Tendências
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Últimos {growthTrends.displayedMonths} meses
            </p>
          </div>
        </div>

        {/* Collapse toggle */}
        {collapsible && (
          <button
            onClick={onToggle}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-100'}
            `}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expandir seção' : 'Recolher seção'}
          >
            <ChevronDown className={`
              w-5 h-5 transition-transform duration-200
              ${isDark ? 'text-slate-400' : 'text-slate-500'}
              ${isCollapsed ? '' : 'rotate-180'}
            `} />
          </button>
        )}
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="space-y-5">
          {/* Service Breakdown */}
          {serviceBreakdown && (growthTrends.trend === 'decreasing' || serviceBreakdown.mainDeclineDriver) && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TrendingDown className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                  <span>Análise por Serviço</span>
                  <ContextHelp description="Comparação do volume de cada tipo de serviço entre o mês atual e o mês anterior." />
                </h4>
                <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Info className="w-3 h-3" />
                  {currentMonthName} vs {previousMonthName}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <ServiceSegmentCard
                  label="Lavagem"
                  icon={Droplet}
                  revenue={serviceBreakdown.wash?.revenue || 0}
                  growth={serviceBreakdown.wash?.growth}
                  isMainDriver={serviceBreakdown.mainDeclineDriver === 'wash'}
                  formatCurrency={formatCurrency}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
                <ServiceSegmentCard
                  label="Secagem"
                  icon={Wind}
                  revenue={serviceBreakdown.dry?.revenue || 0}
                  growth={serviceBreakdown.dry?.growth}
                  isMainDriver={serviceBreakdown.mainDeclineDriver === 'dry'}
                  formatCurrency={formatCurrency}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
                <ServiceSegmentCard
                  label="Recarga"
                  icon={CreditCard}
                  revenue={serviceBreakdown.recarga?.revenue || 0}
                  growth={serviceBreakdown.recarga?.growth}
                  isMainDriver={serviceBreakdown.mainDeclineDriver === 'recarga'}
                  formatCurrency={formatCurrency}
                  isDark={isDark}
                  isDesktop={isDesktop}
                />
              </div>
            </div>
          )}

          {/* KPI Grid - 2 cols mobile, 4 cols desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              label="Cresc. Médio"
              mobileLabel="Média"
              value={formatPercent(growthTrends.avgGrowth, 1)}
              subtitle="6 meses"
              color={growthTrends.avgGrowth > 0 ? 'positive' : growthTrends.avgGrowth < 0 ? 'negative' : 'neutral'}
              variant="default"
              icon={TrendingUp}
            />
            <KPICard
              label="Cresc. YoY"
              mobileLabel="YoY"
              value={yoyData?.hasLastYearData ? formatPercent(yoyData.yoyGrowth || 0, 1) : 'N/A'}
              subtitle={yoyData?.hasLastYearData ? `vs ${yoyData.lastYearLabel}` : 'Sem dados'}
              color={!yoyData?.hasLastYearData ? 'neutral' : (yoyData.yoyGrowth || 0) > 0 ? 'positive' : (yoyData.yoyGrowth || 0) < 0 ? 'negative' : 'neutral'}
              variant="default"
              icon={Calendar}
            />
            <KPICard
              label="Ano Anterior"
              mobileLabel="Ano Ant."
              value={yoyData?.hasLastYearData ? formatCurrency(yoyData.lastYearRevenue) : 'N/A'}
              subtitle={yoyData?.lastYearLabel || '-'}
              color="blue"
              variant="default"
              icon={Clock}
            />
            <KPICard
              label="Tendência"
              mobileLabel="Direção"
              value={trendDisplay.label}
              subtitle={growthTrends.trend !== 'stable' ? '3 meses' : 'Estável'}
              color={trendDisplay.color}
              variant="default"
              icon={trendDisplay.icon}
            />
          </div>

          {/* Area Chart */}
          {chartData && (
            <div className={`
              p-4 rounded-xl
              ${isDark ? 'bg-space-dust/60' : 'bg-white'}
              ring-1 ${isDark ? 'ring-white/[0.08]' : 'ring-slate-200'}
              shadow-sm
            `}>
              {/* Chart header with period selector */}
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Evolução da Receita
                </h4>
                <div className={`flex items-center gap-1 p-0.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  {CHART_PERIODS.map((period) => (
                    <button
                      key={period.value}
                      type="button"
                      onClick={() => setChartPeriod(period.value)}
                      disabled={growthTrends.monthly.length < period.value}
                      className={`
                        px-2.5 py-1 text-xs font-medium rounded-md transition-all
                        ${chartPeriod === period.value
                          ? isDark
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white text-slate-900 shadow-sm'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }
                        ${growthTrends.monthly.length < period.value ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              <motion.div
                className="h-64 sm:h-80 lg:h-96 w-full -mx-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={isMobile
                      ? { top: 10, right: 15, bottom: 5, left: 10 }
                      : { top: 20, right: 30, bottom: 20, left: 20 }
                    }
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#334155' : '#e2e8f0'}
                      vertical={false}
                    />
                    {/* Average trend line */}
                    <ReferenceLine
                      y={averageRevenue}
                      stroke={isDark ? '#f59e0b' : '#d97706'}
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      label={{
                        value: `Média: ${currencyFormatter(averageRevenue)}`,
                        position: 'insideTopRight',
                        fill: isDark ? '#fbbf24' : '#b45309',
                        fontSize: isMobile ? 10 : 12,
                        fontWeight: 600,
                      }}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: isMobile ? 9 : 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                      axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                      tickLine={false}
                      dy={isMobile ? 5 : 8}
                      interval={0}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 50 : 30}
                      padding={{ left: isMobile ? 5 : 20, right: isMobile ? 5 : 20 }}
                    />
                    <YAxis
                      tickFormatter={formatYAxis}
                      tick={{ fontSize: isMobile ? 10 : 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={isMobile ? 40 : 65}
                      tickCount={isMobile ? 4 : 6}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeDasharray: '3 3' }}
                      allowEscapeViewBox={{ x: isMobile, y: isMobile }}
                      offset={15}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="Receita"
                      stroke="#3b82f6"
                      strokeWidth={isMobile ? 2 : 2.5}
                      fill="url(#revenueGradient)"
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={chartAnim.duration}
                      animationEasing={chartAnim.easing}
                      animationBegin={chartAnim.delay}
                      dot={isMobile ? false : {
                        fill: '#3b82f6',
                        stroke: isDark ? '#1e293b' : '#ffffff',
                        strokeWidth: 2,
                        r: 4
                      }}
                      activeDot={{
                        fill: '#3b82f6',
                        stroke: isDark ? '#1e293b' : '#ffffff',
                        strokeWidth: 2,
                        r: isMobile ? 6 : 7
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          )}

          {/* Mobile: Compact cards */}
          <div className="block lg:hidden">
            <h4 className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Últimos 6 Meses
            </h4>

            <div className="space-y-2">
              {monthlyData.map((month) => {
                const isLastYearSameMonth = yoyData?.lastYearLabel && formatMonthKey(month.month, 'short') === yoyData.lastYearLabel;

                return (
                  <div
                    key={month.month}
                    className={`
                      rounded-xl p-3 transition-colors
                      ${month.isCurrentMonth || month.isPartial
                        ? isDark ? 'bg-blue-900/20 ring-1 ring-blue-500/20' : 'bg-blue-50 ring-1 ring-blue-200'
                        : isLastYearSameMonth
                          ? isDark ? 'bg-slate-700/50 ring-1 ring-slate-600' : 'bg-slate-100 ring-1 ring-slate-300'
                          : isDark ? 'bg-space-dust/60 ring-1 ring-white/[0.08]' : 'bg-white ring-1 ring-slate-200'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isLastYearSameMonth && (
                          <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                        <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatMonthKey(month.month, 'long')}
                        </span>
                        {month.isPartial && (
                          <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                            <Clock className="w-2.5 h-2.5" />
                            Parcial
                          </span>
                        )}
                      </div>

                      {month.momGrowth !== null ? (
                        <span className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold
                          ${month.momGrowth > 0
                            ? isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                            : month.momGrowth < 0
                              ? isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                              : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }
                        `}>
                          {month.momGrowth > 0 && <TrendingUp className="w-3 h-3" />}
                          {month.momGrowth < 0 && <TrendingDown className="w-3 h-3" />}
                          {month.momGrowth === 0 && <Minus className="w-3 h-3" />}
                          {month.momGrowth > 0 ? '+' : ''}{month.momGrowth.toFixed(1)}%
                        </span>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <span className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Receita</span>
                        <p className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(month.revenue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ciclos</span>
                        <p className={`text-lg font-semibold leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {month.services.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Table view */}
          <div className={`
            hidden lg:block rounded-xl overflow-hidden
            ${isDark ? 'ring-1 ring-white/[0.08]' : 'ring-1 ring-slate-200'}
          `}>
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <tr>
                  <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mês
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Receita
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Ciclos
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Crescimento MoM
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                {monthlyData.map((month) => (
                  <tr
                    key={month.month}
                    className={
                      month.isCurrentMonth
                        ? isDark ? 'bg-blue-900/10' : 'bg-blue-50/50'
                        : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                    }
                  >
                    <td className={`px-4 py-3 text-sm text-center font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className="flex items-center justify-center gap-2">
                        {formatMonthKey(month.month, 'long')}
                        {month.isPartial && (
                          <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                            <Clock className="w-2.5 h-2.5" />
                            Parcial
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm text-center font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {month.services.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {month.momGrowth !== null ? (
                        <span className={`inline-flex items-center justify-center gap-1 font-semibold ${
                          month.momGrowth > 0
                            ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                            : month.momGrowth < 0
                              ? isDark ? 'text-red-400' : 'text-red-600'
                              : isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {month.momGrowth > 0 && <TrendingUp className="w-4 h-4" />}
                          {month.momGrowth < 0 && <TrendingDown className="w-4 h-4" />}
                          {formatPercent(month.momGrowth, 1)}
                        </span>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthTrendsSection;
