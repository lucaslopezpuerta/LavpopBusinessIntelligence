// GrowthTrendsSection.jsx v5.12
// Growth & trends analysis section for Intelligence tab
// Design System v3.1 compliant - Migrated to Recharts
//
// CHANGELOG:
// v5.12 (2025-12-28): Tooltip contained within chart bounds
//   - Changed: allowEscapeViewBox=false to keep tooltip inside chart
//   - Recharts auto-flips tooltip at left/right edges
//   - Removed overflow-visible (no longer needed)
//   - Disabled tooltip animation for smoother mobile experience
// v5.11 (2025-12-28): Fix tooltip clipping by container
//   - Added overflow-visible to chart wrapper and container divs
//   - Tooltip no longer cut off at container edges
// v5.10 (2025-12-28): Improved chart labels and tooltip
//   - X-axis labels now angled (-45°) on mobile to show all months
//   - Increased bottom margin to accommodate angled labels
//   - Fixed tooltip positioning on mobile (centered, above finger)
//   - Improved tooltip touch target area
// v5.9 (2025-12-28): Chart period selector
//   - Added: Period selector above chart (6M, 12M, 24M)
//   - Dynamic chart data based on selected period
//   - Disabled options when insufficient data available
//   - Smooth tab-style selector UI
// v5.8 (2025-12-28): YoY calculation fix
//   - Fixed: Use pre-calculated yoyGrowth from full dataset
//   - Added: Back-calculate last year revenue when not in displayed data
//   - Fixed: hasLastYearData now checks yoyGrowth existence
//   - Improved: Full month name labels for YoY reference
// v5.7 (2025-12-28): YoY comparison replaces Best/Worst Month
//   - REPLACED: Best/Worst Month KPIs with YoY Growth comparison
//   - Shows current month vs same month last year
//   - More actionable insight for seasonal businesses
// v5.6 (2025-12-28): Mobile full month names
//   - Mobile cards now show full month names (e.g., "Dezembro 2024")
// v5.5 (2025-12-28): Chart improvements - animation, full width, mobile
//   - Added smooth animation on chart load (1200ms ease-out)
//   - Full container width with negative margins (-mx-4 sm:-mx-6)
//   - Increased chart height: h-64 sm:h-80 lg:h-96
//   - Mobile: hide dots (cleaner), larger activeDot for touch
//   - Mobile: reduced tick font size, show every other X label
//   - Mobile: 4 Y-axis ticks instead of 6 for less clutter
//   - Enhanced gradient: 3-stop for smoother fill transition
// v5.4 (2025-12-28): Mobile compatibility improvements
//   - InfoTooltip: tap-to-toggle with backdrop and close button on mobile
//   - ServiceSegmentCard: responsive grid (1 col mobile, 3 cols desktop)
//   - Touch targets: minimum 44px for interactive elements
//   - Improved spacing and readability on small screens
// v5.3 (2025-12-28): Removed redundant insights (covered by PriorityMatrix)
//   - REMOVED: All InsightBoxes - PriorityMatrix provides trend status and actions
//   - KEPT: Service breakdown cards for detailed view
// v5.2 (2025-12-28): Enhanced context for service analysis
//   - Added comparison period context to service breakdown header
//   - ServiceSegmentCard now shows "vs mês anterior" context
//   - InsightBox messages include specific comparison context
//   - Added Info icon with tooltip for service analysis explanation
// v5.1 (2025-12-28): Service breakdown integration
//   - Added serviceBreakdown prop for wash/dry/recarga analysis
//   - Shows service segment cards when decline detected
//   - Highlights main decline driver with specific insight
// v5.0 (2025-12-14): Migrated from Tremor to Recharts
//   - Replaced Tremor AreaChart with Recharts AreaChart
//   - Custom tooltip matching project patterns
//   - Gradient fill with linear gradient defs
//   - Reduced bundle size by removing Tremor dependency
// v4.2 (2025-12-03): Desktop table improvements
//   - Center-aligned all table headers and cells
//   - Full month names on desktop table (e.g., "Novembro 2024")
// v4.1 (2025-12-03): Mobile chart optimizations
//   - X-axis labels: 'tiny' format on mobile (e.g., "D24" for Dec 2024)
//   - Custom compact tooltip: smaller on mobile, shows full month name
//   - Removed label rotation since tiny format fits without rotation
//   - Fixed Y-axis width for proper currency display
// v4.0 (2025-12-03): Tremor chart library migration
// v3.2 (2025-12-03): Responsive labels + mobile card improvements
// v3.1 (2025-12-03): Mobile KPI card improvements
// v3.0 (2025-12-03): Major refactor - Nivo to Recharts migration
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
// v2.1 (2025-12-02): Unified section header
// v2.0 (2025-11-30): Major refactor with unified components
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import { useMemo, useCallback, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock, Droplet, Wind, CreditCard, Info, HelpCircle, X, Calendar } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard, { KPIGrid } from '../ui/KPICard';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMonthKey, getBrazilDateParts } from '../../utils/dateUtils';

// Mobile-friendly tooltip component with tap-to-toggle and backdrop
const InfoTooltip = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  const closeTooltip = useCallback(() => setIsVisible(false), []);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isVisible && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={closeTooltip}
          aria-hidden="true"
        />
      )}

      <div className="relative inline-block">
        <button
          type="button"
          className="p-2 -m-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          onMouseEnter={!isMobile ? () => setIsVisible(true) : undefined}
          onMouseLeave={!isMobile ? () => setIsVisible(false) : undefined}
          onClick={() => setIsVisible(!isVisible)}
          aria-label="Mais informações"
          aria-expanded={isVisible}
        >
          <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
        </button>

        {/* Mobile: Fixed modal in center of screen */}
        {isVisible && isMobile && (
          <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 text-left">
            <button
              type="button"
              onClick={closeTooltip}
              className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <p className="text-base text-slate-600 dark:text-slate-300 pr-8">
              {content}
            </p>
          </div>
        )}

        {/* Desktop: Popover tooltip */}
        {isVisible && !isMobile && (
          <div className="absolute z-50 w-56 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-left bottom-full left-1/2 -translate-x-1/2 mb-2">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white dark:border-t-slate-800" />

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {content}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

// Service segment card component - mobile-optimized with horizontal layout on small screens
const ServiceSegmentCard = ({ label, icon: Icon, revenue, growth, isMainDriver, formatCurrency, comparisonContext }) => {
  const isMobile = useIsMobile();
  const growthColor = growth === null ? 'text-slate-500' :
    growth > 0 ? 'text-emerald-600 dark:text-emerald-400' :
      growth < -5 ? 'text-red-600 dark:text-red-400' :
        'text-amber-600 dark:text-amber-400';

  // Mobile: horizontal layout with icon, label, revenue, growth in a row
  // Desktop: vertical stacked layout
  if (isMobile) {
    return (
      <div className={`
        p-3 rounded-xl border transition-all flex items-center gap-3
        ${isMainDriver
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-800'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }
      `}>
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isMainDriver ? 'bg-red-100 dark:bg-red-900/40' : 'bg-slate-200 dark:bg-slate-700'
          }`}>
          <Icon className={`w-5 h-5 ${isMainDriver ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>

        {/* Label + Focus badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
            {isMainDriver && (
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full">
                Foco
              </span>
            )}
          </div>
          {growth !== null && comparisonContext && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">vs mês anterior</span>
          )}
        </div>

        {/* Revenue + Growth */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {formatCurrency(revenue)}
          </p>
          <p className={`text-sm font-semibold ${growthColor}`}>
            {growth === null ? '—' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
          </p>
        </div>
      </div>
    );
  }

  // Desktop: original vertical layout
  return (
    <div className={`
      p-3 rounded-xl border transition-all
      ${isMainDriver
        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-800'
        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
      }
    `}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isMainDriver ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        {isMainDriver && (
          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full">
            Foco
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
        {formatCurrency(revenue)}
      </p>
      <div className="flex items-center gap-1">
        <p className={`text-xs font-medium ${growthColor}`}>
          {growth === null ? '—' : `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
        </p>
        {growth !== null && comparisonContext && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            vs ant.
          </span>
        )}
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
  // Collapsible props
  collapsible = false,
  isCollapsed = false,
  onToggle
}) => {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // Chart period selector state
  const [chartPeriod, setChartPeriod] = useState(12);

  // Memoize chart data with formatted month names
  // Use 'tiny' format on mobile (e.g., "N24") to prevent label truncation
  const chartData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;
    const dataPoints = growthTrends.monthly.slice(-chartPeriod).map((m) => ({
      month: formatMonthKey(m.month, isMobile ? 'tiny' : 'short'), // Mobile: "N24", Desktop: "Nov 24"
      fullMonth: formatMonthKey(m.month, 'long'), // For tooltip: "Novembro 2024"
      Receita: m.revenue || 0,
      isPartial: m.isPartial || false,
    }));
    // Need at least 2 points for a line
    if (dataPoints.length < 2) return null;
    return dataPoints;
  }, [growthTrends?.monthly, isMobile, chartPeriod]);

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

  // Custom tooltip for Recharts - optimized for mobile touch
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div
        className={`
          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
          rounded-lg shadow-xl pointer-events-none
          ${isMobile ? 'px-3 py-2' : 'px-3 py-2'}
        `}
      >
        <p className={`font-semibold text-slate-900 dark:text-white ${isMobile ? 'text-sm' : 'text-sm'}`}>
          {data.fullMonth || data.month}
        </p>
        <p className={`text-blue-600 dark:text-blue-400 font-bold ${isMobile ? 'text-base' : 'text-base'}`}>
          {currencyFormatter(data.Receita)}
        </p>
      </div>
    );
  }, [isMobile, currencyFormatter]);

  // Memoize monthly data for table/cards
  const monthlyData = useMemo(() =>
    growthTrends?.monthly?.slice(-6).reverse() || [],
    [growthTrends?.monthly]
  );

  if (!growthTrends) return null;

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (growthTrends.trend === 'increasing') {
      return { icon: TrendingUp, color: 'positive', label: 'Crescendo', symbol: '↗' };
    }
    if (growthTrends.trend === 'decreasing') {
      return { icon: TrendingDown, color: 'negative', label: 'Caindo', symbol: '↘' };
    }
    return { icon: Minus, color: 'neutral', label: 'Estável', symbol: '→' };
  };

  const trendDisplay = getTrendDisplay();

  // Month names for YoY labels and service breakdown context
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calculate YoY comparison data
  const yoyData = useMemo(() => {
    if (!growthTrends?.monthly?.length) return null;

    // Find the current (most recent) month
    const currentMonth = growthTrends.monthly.find(m => m.isCurrentMonth || m.isPartial)
      || growthTrends.monthly[growthTrends.monthly.length - 1];

    // Get YoY growth from the monthly data (pre-calculated from full dataset)
    const yoyGrowth = currentMonth.yoyGrowth;
    const hasYoYData = yoyGrowth !== null && yoyGrowth !== undefined;

    // Find same month last year in displayed data (may not be available)
    const currentMonthDate = currentMonth.month; // format: "2024-12"
    const [year, month] = currentMonthDate.split('-').map(Number);
    const lastYearKey = `${year - 1}-${String(month).padStart(2, '0')}`;
    const lastYearMonth = growthTrends.monthly.find(m => m.month === lastYearKey);

    // Calculate last year revenue: either from data or back-calculate from yoyGrowth
    // Formula: yoyGrowth = (current - lastYear) / lastYear * 100
    // So: lastYear = current / (1 + yoyGrowth/100)
    let lastYearRevenue = 0;
    if (lastYearMonth) {
      lastYearRevenue = lastYearMonth.revenue;
    } else if (hasYoYData && yoyGrowth !== 0 && currentMonth.revenue > 0) {
      // Back-calculate from YoY growth percentage
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
    <SectionCard
      title="Crescimento & Tendências"
      subtitle={`Análise de crescimento mensal e trajetória • Últimos ${growthTrends.displayedMonths} meses`}
      icon={TrendingUp}
      id="growth-section"
      color="emerald"
      collapsible={collapsible}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Note: Generic trend insights removed - now covered by PriorityMatrix */}

        {/* Service Breakdown - Shows which service segment is declining most */}
        {serviceBreakdown && (growthTrends.trend === 'decreasing' || serviceBreakdown.mainDeclineDriver) && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Análise por Serviço</span>
                <InfoTooltip content="Comparação do volume de cada tipo de serviço entre o mês atual e o mês anterior. Identifica qual serviço está puxando a queda." />
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-6 sm:ml-0">
                <Info className="w-3 h-3 flex-shrink-0" />
                {currentMonthName} vs {previousMonthName}
              </span>
            </div>
            {/* Responsive grid: stacked on mobile, 3 cols on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <ServiceSegmentCard
                label="Lavagem"
                icon={Droplet}
                revenue={serviceBreakdown.wash?.revenue || 0}
                growth={serviceBreakdown.wash?.growth}
                isMainDriver={serviceBreakdown.mainDeclineDriver === 'wash'}
                formatCurrency={formatCurrency}
                comparisonContext={true}
              />
              <ServiceSegmentCard
                label="Secagem"
                icon={Wind}
                revenue={serviceBreakdown.dry?.revenue || 0}
                growth={serviceBreakdown.dry?.growth}
                isMainDriver={serviceBreakdown.mainDeclineDriver === 'dry'}
                formatCurrency={formatCurrency}
                comparisonContext={true}
              />
              <ServiceSegmentCard
                label="Recarga"
                icon={CreditCard}
                revenue={serviceBreakdown.recarga?.revenue || 0}
                growth={serviceBreakdown.recarga?.growth}
                isMainDriver={serviceBreakdown.mainDeclineDriver === 'recarga'}
                formatCurrency={formatCurrency}
                comparisonContext={true}
              />
            </div>
            {/* Note: Service decline InsightBox removed - now covered by PriorityMatrix actions */}
          </div>
        )}

        {/* KPI Grid - Responsive labels: full on desktop, short on mobile */}
        <KPIGrid columns={4}>
          <KPICard
            label="Cresc. Médio"
            mobileLabel="Média"
            value={formatPercent(growthTrends.avgGrowth, 1)}
            subtitle="Últimos 6 meses"
            mobileSubtitle="6 meses"
            color={growthTrends.avgGrowth > 0 ? 'positive' : growthTrends.avgGrowth < 0 ? 'negative' : 'neutral'}
            variant="gradient"
            icon={TrendingUp}
          />
          <KPICard
            label="Cresc. YoY"
            mobileLabel="YoY"
            value={yoyData?.hasLastYearData ? formatPercent(yoyData.yoyGrowth || 0, 1) : 'N/A'}
            subtitle={yoyData?.hasLastYearData ? `vs ${yoyData.lastYearLabel}` : 'Sem dados do ano anterior'}
            color={!yoyData?.hasLastYearData ? 'neutral' : (yoyData.yoyGrowth || 0) > 0 ? 'positive' : (yoyData.yoyGrowth || 0) < 0 ? 'negative' : 'neutral'}
            variant="gradient"
            icon={Calendar}
          />
          <KPICard
            label="Mesmo Mês Ano Ant."
            mobileLabel="Ano Ant."
            value={yoyData?.hasLastYearData ? formatCurrency(yoyData.lastYearRevenue) : 'N/A'}
            subtitle={yoyData?.lastYearLabel || '-'}
            color="blue"
            variant="gradient"
            icon={Clock}
          />
          <KPICard
            label="Tendência"
            mobileLabel="Direção"
            value={trendDisplay.label}
            subtitle={growthTrends.trend !== 'stable' ? 'Últimos 3 meses' : 'Sem mudança clara'}
            mobileSubtitle={growthTrends.trend !== 'stable' ? '3 meses' : 'Estável'}
            color={trendDisplay.color}
            variant="gradient"
            icon={trendDisplay.icon}
          />
        </KPIGrid>

        {/* Area Chart - Recharts with animation */}
        {chartData && (
          <div className="-mx-4 sm:-mx-6">
            {/* Chart period selector */}
            <div className="flex items-center justify-between px-4 sm:px-6 mb-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Evolução da Receita
              </h4>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                {CHART_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setChartPeriod(period.value)}
                    disabled={growthTrends.monthly.length < period.value}
                    className={`
                      px-2.5 py-1 text-xs font-medium rounded-md transition-all
                      ${chartPeriod === period.value
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }
                      ${growthTrends.monthly.length < period.value
                        ? 'opacity-40 cursor-not-allowed'
                        : ''
                      }
                    `}
                    title={growthTrends.monthly.length < period.value
                      ? `Apenas ${growthTrends.monthly.length} meses disponíveis`
                      : `Mostrar ${period.value} meses`
                    }
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <p id="growth-chart-desc" className="sr-only">
              Gráfico de área mostrando a evolução da receita mensal nos últimos {chartPeriod} meses, com
              tendência {growthTrends.trend === 'increasing' ? 'de crescimento' : growthTrends.trend === 'decreasing' ? 'de queda' : 'estável'}.
            </p>
            <div
              className="h-64 sm:h-80 lg:h-96 w-full"
              aria-describedby="growth-chart-desc"
              role="img"
              aria-label="Gráfico de Tendência de Receita"
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
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: isMobile ? 9 : 12,
                      fill: isDark ? '#94a3b8' : '#64748b'
                    }}
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
                    tick={{
                      fontSize: isMobile ? 10 : 12,
                      fill: isDark ? '#94a3b8' : '#64748b'
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 40 : 65}
                    tickCount={isMobile ? 4 : 6}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeDasharray: '3 3' }}
                    // Contain within chart, let Recharts auto-flip at edges
                    allowEscapeViewBox={{ x: false, y: false }}
                    offset={isMobile ? 8 : 15}
                    wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="Receita"
                    stroke="#3b82f6"
                    strokeWidth={isMobile ? 2 : 2.5}
                    fill="url(#revenueGradient)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
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
            </div>
          </div>
        )}

        {/* Mobile/Tablet: Compact stacked cards (no horizontal scroll) */}
        <div className="block lg:hidden">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Últimos 6 Meses
          </h4>

          <div className="space-y-2">
            {monthlyData.map((month) => {
              // Check if this is the same month as last year for YoY context
              const isLastYearSameMonth = yoyData?.lastYearLabel && formatMonthKey(month.month, 'short') === yoyData.lastYearLabel;

              return (
                <div
                  key={month.month}
                  className={`
                    rounded-xl border p-3 transition-colors
                    ${month.isCurrentMonth || month.isPartial
                      ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20 border-lavpop-blue-200 dark:border-lavpop-blue-800'
                      : isLastYearSameMonth
                        ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }
                    active:scale-[0.99]
                  `}
                >
                  {/* Header row: Month name + badges + MoM growth */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isLastYearSameMonth && (
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" aria-label="Mesmo mês ano anterior" />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {formatMonthKey(month.month, 'long')}
                      </span>
                      {month.isPartial && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          Parcial
                        </span>
                      )}
                    </div>

                    {/* MoM Growth badge - right aligned */}
                    {month.momGrowth !== null ? (
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0
                        ${month.momGrowth > 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : month.momGrowth < 0
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }
                      `}>
                        {month.momGrowth > 0 && <TrendingUp className="w-3 h-3" aria-hidden="true" />}
                        {month.momGrowth < 0 && <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                        {month.momGrowth === 0 && <Minus className="w-3 h-3" aria-hidden="true" />}
                        {month.momGrowth > 0 ? '+' : ''}{month.momGrowth.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>

                  {/* Metrics row: Revenue and Cycles side by side */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Receita</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {formatCurrency(month.revenue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Ciclos</span>
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                        {month.services.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-lavpop-blue-200 dark:bg-lavpop-blue-700" />
              Atual
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Referência YoY
            </span>
          </div>
        </div>

        {/* Desktop: Table view - center aligned */}
        <div className="hidden lg:block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Mês
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Receita
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Ciclos
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Crescimento MoM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {monthlyData.map((month) => (
                  <tr
                    key={month.month}
                    className={
                      month.isCurrentMonth
                        ? 'bg-lavpop-blue-50 dark:bg-lavpop-blue-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                  >
                    <td className="px-4 py-3 text-sm text-center font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center justify-center gap-2">
                        {formatMonthKey(month.month, 'long')}
                        {month.isPartial && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            Parcial ({month.daysElapsed}/{month.daysInMonth} dias)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700 dark:text-slate-300">
                      {month.services.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {month.momGrowth !== null ? (
                        <span className={`inline-flex items-center justify-center gap-1 font-semibold ${month.momGrowth > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : month.momGrowth < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-600 dark:text-slate-400'
                          }`}>
                          {month.momGrowth > 0 && <TrendingUp className="w-4 h-4" aria-hidden="true" />}
                          {month.momGrowth < 0 && <TrendingDown className="w-4 h-4" aria-hidden="true" />}
                          {formatPercent(month.momGrowth, 1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default GrowthTrendsSection;
