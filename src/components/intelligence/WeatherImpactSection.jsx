// WeatherImpactSection.jsx v3.5
// Weather impact analysis section for Intelligence tab
// Design System v3.1 compliant - Comfort-based thermal classification
//
// CHANGELOG:
// v3.5 (2025-12-02): Mobile layout fixes
//   - BASELINE badge: smaller on mobile, truncated to "BASE"
//   - Stats row: stack vertically when 180d badge present to prevent overflow
//   - Chart: minimal margins (5px left) for maximum bar width
//   - Chart: fixed "0k" issue - shows "R$ 558" for values <1000, "1.2k" for ≥1000
// v3.4 (2025-12-02): Enhanced chart interactivity
//   - Added value labels at end of each bar (LabelList)
//   - Improved hover effect with activeBar stroke highlight
//   - Better cursor feedback on hover (semi-transparent overlay)
//   - Increased right margin to accommodate labels
// v3.3 (2025-12-02): Migrated chart from Nivo to Recharts
//   - Replaced ResponsiveBar (Nivo) with BarChart (Recharts)
//   - Custom tooltip matching project patterns
//   - Better dark mode support via Tailwind classes
//   - Consistent with other Recharts components in codebase
// v3.2 (2025-12-02): Improved UI clarity
//   - BASELINE badge now inline with category name (not underneath)
//   - Enhanced tooltip with full category classification criteria
//   - Tooltip shows all thresholds (Quente ≥23°C, Frio ≤10°C, etc.)
// v3.1 (2025-12-02): Adaptive window support
//   - Shows 180d badge when category uses extended window
//   - Updates subtitle to reflect primary vs extended window
//   - Better transparency about data sources
// v3.0 (2025-12-02): Major overhaul - Comfort-based weather analysis
//   - Replaced precipitation-only (sunny/cloudy/rainy) with heat index classification
//   - New categories: Abafado, Quente, Frio, Ameno, Úmido, Chuvoso
//   - Added temperature and humidity correlation cards
//   - Dynamic insight based on best-performing weather condition
//   - Improved actionability for laundromat business
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
// v2.1 (2025-12-02): Unified section header
// v2.0 (2025-11-30): Major refactor with unified components
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import {
  Cloud,
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Clock
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';
import { ChartLegend } from '../ui/ChartSection';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { semanticColors } from '../../utils/colorMapping';

// Comfort Weather Card - displays a single comfort category
const ComfortWeatherCard = ({
  category,
  formatCurrency,
  isBaseline = false
}) => {
  const colors = semanticColors[category.key] || semanticColors.neutral;
  const hasData = category.hasEnoughData;

  // Determine trend icon
  const TrendIcon = category.impact > 0 ? TrendingUp :
                    category.impact < 0 ? TrendingDown : Minus;
  const trendColor = category.impact > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                     category.impact < 0 ? 'text-red-600 dark:text-red-400' :
                     'text-gray-500 dark:text-gray-400';

  // Check if we need to stack stats (when extended window badge is present)
  const shouldStackStats = category.extendedWindow && hasData && category.impact !== null && !isBaseline;

  return (
    <div className={`
      p-3 sm:p-4 rounded-xl border transition-shadow hover:shadow-md
      ${colors.bgGradient} ${colors.border}
      ${isBaseline ? 'ring-2 ring-offset-2 ring-lime-400 dark:ring-lime-500' : ''}
    `}>
      {/* Header with emoji and label */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
        <span className="text-lg sm:text-xl flex-shrink-0" role="img" aria-label={category.label}>
          {category.emoji}
        </span>
        <div className="min-w-0 flex-1 flex items-center gap-1">
          <p className={`text-xs font-semibold ${colors.text} uppercase tracking-wide truncate`}>
            {category.label}
          </p>
          {isBaseline && (
            <span className="text-[9px] sm:text-[10px] font-medium text-lime-600 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/40 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">
              <span className="sm:hidden">BASE</span>
              <span className="hidden sm:inline">BASELINE</span>
            </span>
          )}
        </div>
      </div>

      {/* Revenue */}
      <p className={`text-lg sm:text-xl font-bold ${colors.text} mb-1`}>
        {hasData ? formatCurrency(category.revenue) : '—'}
        <span className={`text-xs font-normal ${colors.textMuted} ml-1`}>/dia</span>
      </p>

      {/* Stats row - stack on mobile when extended window badge + trend present */}
      <div className={`text-xs ${shouldStackStats ? 'space-y-1' : 'flex items-center justify-between'}`}>
        <span className={`flex items-center gap-1 ${colors.textSubtle}`}>
          {hasData ? `${category.days} dias` : 'Sem dados'}
          {category.extendedWindow && (
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium"
              title="Janela estendida (180 dias) usada por dados insuficientes nos últimos 90 dias"
            >
              <Clock className="w-2.5 h-2.5" />
              180d
            </span>
          )}
        </span>
        {hasData && category.impact !== null && !isBaseline && (
          <span className={`flex items-center gap-0.5 font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {category.impact > 0 ? '+' : ''}{category.impact.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Temperature/Humidity hint */}
      {hasData && (category.avgTemp > 0 || category.avgHumidity > 0) && (
        <div className={`mt-2 pt-2 border-t ${colors.border} flex gap-3 text-xs ${colors.textSubtle}`}>
          {category.avgTemp > 0 && (
            <span className="flex items-center gap-0.5">
              <Thermometer className="w-3 h-3" />
              {category.avgTemp}°C
            </span>
          )}
          {category.avgHumidity > 0 && (
            <span className="flex items-center gap-0.5">
              <Droplets className="w-3 h-3" />
              {category.avgHumidity}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Correlation Card - displays temperature or humidity correlation
const CorrelationCard = ({
  type, // 'temperature' | 'humidity'
  correlation,
  formatPercent
}) => {
  if (!correlation?.hasEnoughData) return null;

  const isTemp = type === 'temperature';
  const Icon = isTemp ? Thermometer : Droplets;
  const label = isTemp ? 'Temperatura' : 'Umidade';
  const unit = isTemp ? '°C' : '%';
  const perUnit = isTemp ? correlation.percentPerDegree : correlation.percentPerPercent;

  // Determine correlation strength
  const r = Math.abs(correlation.correlation);
  const strength = r >= 0.3 ? 'Forte' : r >= 0.15 ? 'Moderada' : 'Fraca';
  const strengthColor = r >= 0.3 ? 'text-purple-600 dark:text-purple-400' :
                        r >= 0.15 ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-500 dark:text-gray-400';

  const bgColor = isTemp
    ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
    : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
  const borderColor = isTemp
    ? 'border-orange-200 dark:border-orange-800'
    : 'border-blue-200 dark:border-blue-800';
  const iconColor = isTemp
    ? 'text-orange-500 dark:text-orange-400'
    : 'text-blue-500 dark:text-blue-400';

  return (
    <div className={`p-4 rounded-xl border ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${isTemp ? 'bg-orange-100 dark:bg-orange-800/50' : 'bg-blue-100 dark:bg-blue-800/50'}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Correlation coefficient */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
            Correlação
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            r = {correlation.correlation.toFixed(2)}
          </p>
          <p className={`text-xs font-medium ${strengthColor}`}>
            {strength}
          </p>
        </div>

        {/* Impact per unit */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
            Impacto
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {perUnit > 0 ? '+' : ''}{perUnit.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            por 1{unit}
          </p>
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {correlation.interpretation}
        </p>
      </div>
    </div>
  );
};

const WeatherImpactSection = ({
  weatherImpact,       // Legacy precipitation-based (kept for fallback)
  comfortWeatherImpact, // New comfort-based analysis
  formatCurrency,
  formatPercent
}) => {
  const isMobile = useIsMobile();

  // Custom tooltip for Recharts
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl min-w-[160px]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            {data.type}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            <strong>Receita Média:</strong> {formatCurrency(data['Receita Média'])}
          </p>
        </div>
      );
    }
    return null;
  }, [formatCurrency]);

  // Use comfort data if available, otherwise fallback to legacy
  const hasComfortData = comfortWeatherImpact?.hasEnoughData;

  // Prepare chart data from comfort categories
  const chartData = useMemo(() => {
    if (!hasComfortData) return null;

    const cats = comfortWeatherImpact.categories;
    const validCats = Object.entries(cats)
      .filter(([_, c]) => c.hasEnoughData && c.revenue > 0)
      .sort((a, b) => b[1].revenue - a[1].revenue);

    if (validCats.length < 2) return null;

    return validCats.map(([key, cat]) => ({
      type: cat.label,
      'Receita Média': Math.round(cat.revenue),
      color: semanticColors[key]?.chartColor || '#64748b'
    }));
  }, [hasComfortData, comfortWeatherImpact?.categories]);

  // Chart legend items
  const legendItems = useMemo(() => {
    if (!chartData) return [];
    return chartData.map(d => ({
      color: d.color,
      label: d.type
    }));
  }, [chartData]);

  // Early return if no data
  if (!hasComfortData && !weatherImpact) return null;

  // Get categories and correlations
  const categories = comfortWeatherImpact?.categories || {};
  const tempCorr = comfortWeatherImpact?.temperatureCorrelation;
  const humidityCorr = comfortWeatherImpact?.humidityCorrelation;
  const bestCondition = comfortWeatherImpact?.bestCondition || 'mild';
  const worstCondition = comfortWeatherImpact?.worstCondition || 'rainy';
  const baselineCondition = comfortWeatherImpact?.baselineCondition || 'mild';

  // Prepare category array for rendering (sorted by revenue)
  const categoryArray = useMemo(() => {
    return Object.entries(categories)
      .map(([key, cat]) => ({ key, ...cat }))
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  }, [categories]);

  // Generate dynamic insight
  const getInsight = () => {
    const best = categories[bestCondition];
    const worst = categories[worstCondition];

    if (!best?.hasEnoughData || !worst?.hasEnoughData) {
      return {
        type: 'info',
        title: 'Dados em Coleta',
        message: `Analisando ${comfortWeatherImpact?.totalDaysAnalyzed || 0} dias. Continue coletando dados para insights mais precisos sobre o impacto do clima no seu negócio.`
      };
    }

    const diff = best.revenue - worst.revenue;
    const diffPercent = worst.revenue > 0 ? ((diff / worst.revenue) * 100).toFixed(0) : 0;

    // Check if there's a significant difference
    if (Math.abs(best.impact || 0) < 10 && Math.abs(worst.impact || 0) < 10) {
      return {
        type: 'success',
        title: 'Negócio Resiliente ao Clima',
        message: `Excelente! Seu negócio mostra pouca variação entre condições climáticas (máx. ${formatCurrency(diff)} de diferença). Isso indica uma base de clientes fiel e operação estável.`
      };
    }

    // Significant weather impact
    const bestLabel = best.label?.toLowerCase() || 'favoráveis';
    const worstLabel = worst.label?.toLowerCase() || 'adversas';

    return {
      type: 'warning',
      title: `Dias ${best.emoji} ${best.label} Geram +${diffPercent}% Receita`,
      message: `Dias ${bestLabel} rendem ${formatCurrency(diff)} a mais que dias ${worstLabel}. ${
        worstCondition === 'rainy'
          ? 'Quando a previsão indicar chuva, ative uma campanha promocional (ex: "CHUVA15" para 15% off).'
          : worstCondition === 'cold'
            ? 'Em dias frios, considere promoções em cobertores e itens pesados.'
            : 'Monitore a previsão e ajuste sua estratégia conforme o clima.'
      }`
    };
  };

  const insight = getInsight();

  // Build subtitle based on window usage
  const windowLabel = comfortWeatherImpact?.extendedWindowUsed
    ? `${comfortWeatherImpact.primaryWindowDays}–${comfortWeatherImpact.extendedWindowDays}`
    : (comfortWeatherImpact?.primaryWindowDays || 90);

  return (
    <SectionCard
      title="Impacto do Clima"
      subtitle={`Análise de conforto térmico • Últimos ${windowLabel} dias (${comfortWeatherImpact?.totalDaysAnalyzed || weatherImpact?.totalDaysAnalyzed || 0} dias)`}
      icon={Cloud}
      id="weather-section"
      color="emerald"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Actionable Insight */}
        <InsightBox
          type={insight.type}
          title={insight.title}
          message={insight.message}
        />

        {/* Comfort Categories Grid */}
        {hasComfortData && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Receita por Condição Climática
              </h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-72 z-10 text-left">
                  <p className="font-semibold mb-1.5">Classificação por Conforto Térmico</p>
                  <ul className="space-y-0.5 text-[11px] text-gray-300">
                    <li>🥵 <strong>Abafado:</strong> sensação ≥27°C</li>
                    <li>☀️ <strong>Quente:</strong> temperatura ≥23°C</li>
                    <li>😌 <strong>Ameno:</strong> 10–23°C (baseline)</li>
                    <li>❄️ <strong>Frio:</strong> temperatura ≤10°C</li>
                    <li>💧 <strong>Úmido:</strong> umidade ≥80% + precipitação</li>
                    <li>🌧️ <strong>Chuvoso:</strong> precipitação &gt;5mm</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {categoryArray.map(cat => (
                <ComfortWeatherCard
                  key={cat.key}
                  category={cat}
                  formatCurrency={formatCurrency}
                  isBaseline={cat.key === baselineCondition}
                />
              ))}
            </div>
          </div>
        )}

        {/* Best/Worst Summary */}
        {hasComfortData && categories[bestCondition]?.hasEnoughData && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className={`p-4 rounded-xl border ${semanticColors[bestCondition]?.bgGradient || ''} ${semanticColors[bestCondition]?.border || ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{categories[bestCondition]?.emoji}</span>
                <h4 className={`text-sm font-semibold ${semanticColors[bestCondition]?.text || ''}`}>
                  Melhor Cenário
                </h4>
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${semanticColors[bestCondition]?.text || ''}`}>
                {formatCurrency(comfortWeatherImpact.bestCaseScenario)}
                <span className={`text-sm font-normal ${semanticColors[bestCondition]?.textMuted || ''} ml-1`}>/dia</span>
              </p>
              <p className={`text-xs ${semanticColors[bestCondition]?.textSubtle || ''} mt-1`}>
                {categories[bestCondition]?.description}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${semanticColors[worstCondition]?.bgGradient || ''} ${semanticColors[worstCondition]?.border || ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{categories[worstCondition]?.emoji}</span>
                <h4 className={`text-sm font-semibold ${semanticColors[worstCondition]?.text || ''}`}>
                  Pior Cenário
                </h4>
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${semanticColors[worstCondition]?.text || ''}`}>
                {formatCurrency(comfortWeatherImpact.worstCaseScenario)}
                <span className={`text-sm font-normal ${semanticColors[worstCondition]?.textMuted || ''} ml-1`}>/dia</span>
              </p>
              <p className={`text-xs ${semanticColors[worstCondition]?.textSubtle || ''} mt-1`}>
                {categories[worstCondition]?.description}
              </p>
            </div>
          </div>
        )}

        {/* Correlation Cards */}
        {(tempCorr?.hasEnoughData || humidityCorr?.hasEnoughData) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Correlações Climáticas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <CorrelationCard
                type="temperature"
                correlation={tempCorr}
                formatPercent={formatPercent}
              />
              <CorrelationCard
                type="humidity"
                correlation={humidityCorr}
                formatPercent={formatPercent}
              />
            </div>
          </div>
        )}

        {/* Chart - only render if we have valid data */}
        {chartData && chartData.length >= 2 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Comparativo de Receita
            </h3>
            <p id="comfort-weather-chart-desc" className="sr-only">
              Gráfico de barras horizontal comparando receita média por condição climática,
              ordenado do melhor para o pior cenário.
            </p>
            <div
              className="h-48 sm:h-56 lg:h-64"
              aria-describedby="comfort-weather-chart-desc"
              role="img"
              aria-label="Gráfico de Impacto do Clima por Conforto Térmico"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: isMobile ? 50 : 85, bottom: 5, left: isMobile ? 5 : 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${Math.round(value)}`}
                    tickCount={isMobile ? 4 : 6}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: isMobile ? 11 : 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 52 : 70}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
                  <Bar
                    dataKey="Receita Média"
                    radius={[0, 6, 6, 0]}
                    activeBar={{ strokeWidth: 2, stroke: '#1e293b' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-opacity duration-150 hover:opacity-80"
                      />
                    ))}
                    <LabelList
                      dataKey="Receita Média"
                      position="right"
                      formatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : formatCurrency(value)}
                      style={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile Legend */}
            {isMobile && <ChartLegend items={legendItems} />}
          </div>
        )}

        {/* Data Quality Warning */}
        {comfortWeatherImpact?.warning && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {comfortWeatherImpact.warning}
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default WeatherImpactSection;
