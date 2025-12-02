// WeatherImpactSection.jsx v2.2
// Weather impact analysis section for Intelligence tab
// Design System v3.1 compliant - Refactored with unified components
//
// CHANGELOG:
// v2.2 (2025-12-02): Fixed Nivo chart NaN crash
//   - Guard against empty/zero revenue data
//   - Conditional render: skip chart when no valid data
// v2.1 (2025-12-02): Unified section header
//   - Added color="emerald" for consistent styling with Intelligence tab
// v2.0 (2025-11-30): Major refactor
//   - Uses unified KPICard component
//   - Uses semantic weather colors from colorMapping
//   - InsightBox moved to top for visibility
//   - Fixed accessibility (minimum 12px font)
//   - Memoized chart data
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx

import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Cloud, CloudRain, Sun, TrendingDown } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import KPICard from '../ui/KPICard';
import InsightBox from '../ui/InsightBox';
import { ChartLegend } from '../ui/ChartSection';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { semanticColors } from '../../utils/colorMapping';

// Weather card with semantic colors
const WeatherCard = ({
  icon: Icon,
  label,
  revenue,
  servicesPerDay,
  totalDays,
  impact,
  weatherType, // 'sunny' | 'cloudy' | 'rainy'
  formatCurrency
}) => {
  const colors = semanticColors[weatherType] || semanticColors.neutral;

  return (
    <div className={`p-4 sm:p-5 ${colors.bgGradient} rounded-xl border ${colors.border} hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${colors.icon}`} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium ${colors.textMuted} uppercase tracking-wide`}>
            {label}
          </p>
          <p className={`text-xl sm:text-2xl font-bold ${colors.text}`}>
            {formatCurrency(revenue)}
          </p>
        </div>
      </div>
      <div className={`mt-3 pt-3 border-t ${colors.border}`}>
        <div className="flex justify-between text-sm mb-1">
          <span className={colors.textSubtle}>Ciclos/dia:</span>
          <span className={`font-semibold ${colors.text}`}>{Math.round(servicesPerDay)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={colors.textSubtle}>Total dias:</span>
          <span className={`font-semibold ${colors.text}`}>{totalDays}</span>
        </div>
        {impact !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <TrendingDown className={`w-4 h-4 ${colors.icon}`} aria-hidden="true" />
            <span className={`text-sm font-bold ${colors.textMuted}`}>
              {impact.toFixed(1)}% vs sol
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const WeatherImpactSection = ({
  weatherImpact,
  formatCurrency,
  formatPercent,
  nivoTheme
}) => {
  const isMobile = useIsMobile();

  // Memoize chart data - guard against invalid values
  const chartData = useMemo(() => {
    if (!weatherImpact) return null;
    // Check if we have valid revenue data (not all zeros/NaN)
    const hasValidData = (weatherImpact.sunny.revenue || 0) > 0 ||
                         (weatherImpact.cloudy.revenue || 0) > 0 ||
                         (weatherImpact.rainy.revenue || 0) > 0;
    if (!hasValidData) return null;
    return [
      {
        type: 'Dias de Sol',
        'Receita Media': weatherImpact.sunny.revenue || 0,
        color: semanticColors.sunny.chartColor
      },
      {
        type: 'Dias Nublados',
        'Receita Media': weatherImpact.cloudy.revenue || 0,
        color: semanticColors.cloudy.chartColor
      },
      {
        type: 'Dias Chuvosos',
        'Receita Media': weatherImpact.rainy.revenue || 0,
        color: semanticColors.rainy.chartColor
      }
    ];
  }, [weatherImpact]);

  // Memoize chart margins
  const chartMargins = useMemo(() => (
    isMobile
      ? { top: 10, right: 20, bottom: 40, left: 100 }
      : { top: 20, right: 80, bottom: 50, left: 140 }
  ), [isMobile]);

  // Chart legend items
  const legendItems = useMemo(() => [
    { color: semanticColors.sunny.chartColor, label: 'Sol' },
    { color: semanticColors.cloudy.chartColor, label: 'Nublado' },
    { color: semanticColors.rainy.chartColor, label: 'Chuvoso' }
  ], []);

  if (!weatherImpact) return null;

  const hasHighRainImpact = Math.abs(weatherImpact.rainy.impact) > 20;

  return (
    <SectionCard
      title="Impacto do Clima"
      subtitle={`Como o clima afeta sua receita diária • Últimos 90 dias (${weatherImpact.totalDaysAnalyzed} dias analisados)`}
      icon={Cloud}
      id="weather-section"
      color="emerald"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Actionable Insight First */}
        {hasHighRainImpact ? (
          <InsightBox
            type="warning"
            title="Alto Impacto de Chuva Detectado"
            message={`Dias chuvosos reduzem sua receita em ${formatPercent(Math.abs(weatherImpact.rainy.impact))}. Quando a previsao indicar chuva, ative uma campanha promocional via WhatsApp para compensar a queda. Exemplo: "CHUVA15" para 15% de desconto.`}
          />
        ) : (
          <InsightBox
            type="info"
            title="Impacto de Clima Moderado"
            message={`O clima tem impacto moderado no seu negocio (${formatPercent(Math.abs(weatherImpact.rainy.impact))} em dias chuvosos). Isso indica boa resiliencia operacional.`}
          />
        )}

        {/* Weather Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <WeatherCard
            icon={Sun}
            label="Dias de Sol"
            revenue={weatherImpact.sunny.revenue}
            servicesPerDay={weatherImpact.sunny.services}
            totalDays={weatherImpact.sunny.days}
            weatherType="sunny"
            formatCurrency={formatCurrency}
          />
          <WeatherCard
            icon={Cloud}
            label="Dias Nublados"
            revenue={weatherImpact.cloudy.revenue}
            servicesPerDay={weatherImpact.cloudy.services}
            totalDays={weatherImpact.cloudy.days}
            impact={weatherImpact.cloudy.impact}
            weatherType="cloudy"
            formatCurrency={formatCurrency}
          />
          <WeatherCard
            icon={CloudRain}
            label="Dias Chuvosos"
            revenue={weatherImpact.rainy.revenue}
            servicesPerDay={weatherImpact.rainy.services}
            totalDays={weatherImpact.rainy.days}
            impact={weatherImpact.rainy.impact}
            weatherType="rainy"
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Impact Summary */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-4 ${semanticColors.sunny.bgGradient} rounded-xl border ${semanticColors.sunny.border}`}>
            <h4 className={`text-sm font-semibold ${semanticColors.sunny.text} mb-2`}>
              Melhor Cenario
            </h4>
            <p className={`text-xl sm:text-2xl font-bold ${semanticColors.sunny.text}`}>
              {formatCurrency(weatherImpact.bestCaseScenario)}
              <span className={`text-sm font-normal ${semanticColors.sunny.textMuted} ml-1`}>/dia</span>
            </p>
            <p className={`text-xs ${semanticColors.sunny.textSubtle} mt-1`}>
              Dias de sol
            </p>
          </div>

          <div className={`p-4 ${semanticColors.rainy.bgGradient} rounded-xl border ${semanticColors.rainy.border}`}>
            <h4 className={`text-sm font-semibold ${semanticColors.rainy.text} mb-2`}>
              Pior Cenario
            </h4>
            <p className={`text-xl sm:text-2xl font-bold ${semanticColors.rainy.text}`}>
              {formatCurrency(weatherImpact.worstCaseScenario)}
              <span className={`text-sm font-normal ${semanticColors.rainy.textMuted} ml-1`}>/dia</span>
            </p>
            <p className={`text-xs ${semanticColors.rainy.textSubtle} mt-1`}>
              Dias chuvosos
            </p>
          </div>
        </div>

        {/* Chart - only render if we have valid data */}
        {chartData && (
        <div>
          <p id="weather-chart-desc" className="sr-only">
            Grafico de barras horizontal comparando receita media por tipo de clima: Sol{' '}
            {formatCurrency(weatherImpact.sunny.revenue)}, Nublado{' '}
            {formatCurrency(weatherImpact.cloudy.revenue)}, Chuvoso{' '}
            {formatCurrency(weatherImpact.rainy.revenue)}.
          </p>
          <div
            className="h-48 sm:h-56 lg:h-64"
            aria-describedby="weather-chart-desc"
            role="img"
            aria-label="Grafico de Impacto do Clima"
          >
            <ResponsiveBar
              data={chartData}
              keys={['Receita Media']}
              indexBy="type"
              layout="horizontal"
              margin={chartMargins}
              colors={(d) => d.data.color}
              borderRadius={8}
              padding={0.3}
              axisLeft={{
                tickSize: 0,
                tickPadding: 10
              }}
              axisBottom={{
                format: (value) => (isMobile ? `${Math.round(value / 1000)}k` : formatCurrency(value)),
                tickRotation: 0
              }}
              labelTextColor="white"
              enableGridY={false}
              animate={false}
              theme={nivoTheme}
            />
          </div>

          {/* Mobile Legend */}
          {isMobile && <ChartLegend items={legendItems} />}
        </div>
        )}
      </div>
    </SectionCard>
  );
};

export default WeatherImpactSection;
