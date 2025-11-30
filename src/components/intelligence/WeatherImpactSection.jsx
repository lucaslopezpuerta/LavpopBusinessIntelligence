// WeatherImpactSection.jsx v1.0
// Weather impact analysis section for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx
//   - Mobile responsive grid (1 col mobile, 2 tablet, 3 desktop)
//   - Responsive chart margins
//   - Accessibility improvements

import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Cloud, CloudRain, Sun, TrendingDown } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';
import { useIsMobile } from '../../hooks/useMediaQuery';

const WeatherCard = ({
  icon: Icon,
  label,
  revenue,
  servicesPerDay,
  totalDays,
  impact,
  colorScheme,
  formatCurrency
}) => {
  const schemes = {
    yellow: {
      bg: 'from-yellow-50 via-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:via-yellow-800/20 dark:to-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-200 dark:bg-yellow-800/50',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      labelColor: 'text-yellow-700 dark:text-yellow-300',
      valueColor: 'text-yellow-900 dark:text-yellow-100',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      divider: 'border-yellow-200 dark:border-yellow-800'
    },
    blue: {
      bg: 'from-blue-50 via-blue-100 to-blue-50 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-200 dark:bg-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      labelColor: 'text-blue-700 dark:text-blue-300',
      valueColor: 'text-blue-900 dark:text-blue-100',
      textColor: 'text-blue-700 dark:text-blue-400',
      divider: 'border-blue-200 dark:border-blue-800'
    },
    indigo: {
      bg: 'from-indigo-50 via-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:via-indigo-800/20 dark:to-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-800',
      iconBg: 'bg-indigo-200 dark:bg-indigo-800/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      labelColor: 'text-indigo-700 dark:text-indigo-300',
      valueColor: 'text-indigo-900 dark:text-indigo-100',
      textColor: 'text-indigo-700 dark:text-indigo-400',
      divider: 'border-indigo-200 dark:border-indigo-800'
    }
  };

  const colors = schemes[colorScheme] || schemes.blue;

  return (
    <div
      className={`p-4 sm:p-6 bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={`p-1.5 sm:p-2 ${colors.iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.iconColor}`} aria-hidden="true" />
        </div>
        <div>
          <p className={`text-[10px] sm:text-xs font-medium ${colors.labelColor} uppercase tracking-wide`}>
            {label}
          </p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colors.valueColor}`}>
            {formatCurrency(revenue)}
          </p>
        </div>
      </div>
      <div className={`mt-2 sm:mt-3 pt-2 sm:pt-3 border-t ${colors.divider}`}>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className={colors.textColor}>Ciclos/dia:</span>
          <span className={`font-semibold ${colors.valueColor}`}>{Math.round(servicesPerDay)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm mt-1">
          <span className={colors.textColor}>Total dias:</span>
          <span className={`font-semibold ${colors.valueColor}`}>{totalDays}</span>
        </div>
        {impact !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <TrendingDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors.iconColor}`} aria-hidden="true" />
            <span className={`text-xs sm:text-sm font-bold ${colors.textColor}`}>
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

  const chartMargins = useMemo(() => (
    isMobile
      ? { top: 10, right: 20, bottom: 40, left: 100 }
      : { top: 20, right: 80, bottom: 50, left: 140 }
  ), [isMobile]);

  if (!weatherImpact) return null;

  return (
    <SectionCard
      title="Impacto do Clima"
      subtitle="Como o clima afeta sua receita diária"
      icon={Cloud}
      id="weather-section"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Weather Stats Grid - 1 col mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <WeatherCard
            icon={Sun}
            label="Dias de Sol"
            revenue={weatherImpact.sunny.revenue}
            servicesPerDay={weatherImpact.sunny.services}
            totalDays={weatherImpact.sunny.days}
            colorScheme="yellow"
            formatCurrency={formatCurrency}
          />
          <WeatherCard
            icon={Cloud}
            label="Dias Nublados"
            revenue={weatherImpact.cloudy.revenue}
            servicesPerDay={weatherImpact.cloudy.services}
            totalDays={weatherImpact.cloudy.days}
            impact={weatherImpact.cloudy.impact}
            colorScheme="blue"
            formatCurrency={formatCurrency}
          />
          <WeatherCard
            icon={CloudRain}
            label="Dias Chuvosos"
            revenue={weatherImpact.rainy.revenue}
            servicesPerDay={weatherImpact.rainy.services}
            totalDays={weatherImpact.rainy.days}
            impact={weatherImpact.rainy.impact}
            colorScheme="indigo"
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Chart with accessible description */}
        <div>
          <p id="weather-chart-desc" className="sr-only">
            Gráfico de barras horizontal comparando receita média por tipo de clima: Sol{' '}
            {formatCurrency(weatherImpact.sunny.revenue)}, Nublado{' '}
            {formatCurrency(weatherImpact.cloudy.revenue)}, Chuvoso{' '}
            {formatCurrency(weatherImpact.rainy.revenue)}.
          </p>
          <div
            className="h-56 sm:h-64 lg:h-80"
            aria-describedby="weather-chart-desc"
            role="img"
            aria-label="Gráfico de Impacto do Clima"
          >
            <ResponsiveBar
              data={[
                {
                  type: 'Dias de Sol',
                  'Receita Média': weatherImpact.sunny.revenue,
                  color: '#eab308'
                },
                {
                  type: 'Dias Nublados',
                  'Receita Média': weatherImpact.cloudy.revenue,
                  color: '#3b82f6'
                },
                {
                  type: 'Dias Chuvosos',
                  'Receita Média': weatherImpact.rainy.revenue,
                  color: '#6366f1'
                }
              ]}
              keys={['Receita Média']}
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
              animate={true}
              motionConfig="gentle"
              theme={nivoTheme}
            />
          </div>
        </div>

        {/* Impact Summary - Responsive */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1 sm:mb-2">
              Melhor Cenário
            </h4>
            <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(weatherImpact.bestCaseScenario)}
              <span className="text-xs sm:text-sm font-normal text-blue-700 dark:text-blue-400">
                /dia
              </span>
            </p>
            <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400 mt-0.5 sm:mt-1">
              Dias de sol
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg">
            <h4 className="text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1 sm:mb-2">
              Pior Cenário
            </h4>
            <p className="text-lg sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {formatCurrency(weatherImpact.worstCaseScenario)}
              <span className="text-xs sm:text-sm font-normal text-indigo-700 dark:text-indigo-400">
                /dia
              </span>
            </p>
            <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-400 mt-0.5 sm:mt-1">
              Dias chuvosos
            </p>
          </div>
        </div>

        {/* Actionable Insight */}
        {Math.abs(weatherImpact.rainy.impact) > 20 ? (
          <InsightBox
            type="warning"
            title="Alto Impacto de Chuva Detectado"
            message={`Dias chuvosos reduzem sua receita em ${formatPercent(Math.abs(weatherImpact.rainy.impact))}. Recomendação: Quando a previsão indicar chuva, ative uma campanha promocional via WhatsApp para compensar a queda esperada. Exemplo: "CHUVA15" para 15% de desconto.`}
          />
        ) : (
          <InsightBox
            type="info"
            title="Impacto de Clima Moderado"
            message={`O clima tem impacto moderado no seu negócio (${formatPercent(Math.abs(weatherImpact.rainy.impact))} em dias chuvosos). Isso indica boa resiliência operacional. Continue monitorando para identificar oportunidades de otimização.`}
          />
        )}
      </div>
    </SectionCard>
  );
};

export default WeatherImpactSection;
