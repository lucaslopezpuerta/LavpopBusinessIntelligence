// ProfitabilitySection.jsx v1.0
// Profitability analysis section for Intelligence tab
// Design System v3.0 compliant
//
// CHANGELOG:
// v1.0 (2025-11-30): Initial extraction from Intelligence.jsx
//   - Mobile responsive KPI grid (2 cols mobile, 4 desktop)
//   - Responsive break-even analysis layout
//   - Responsive chart margins
//   - Accessibility improvements (aria-describedby, sr-only)

import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { DollarSign } from 'lucide-react';
import SectionCard from '../ui/SectionCard';
import InsightBox from '../ui/InsightBox';
import { useIsMobile } from '../../hooks/useMediaQuery';

const ProfitabilitySection = ({
  profitability,
  formatCurrency,
  formatPercent,
  nivoTheme
}) => {
  const isMobile = useIsMobile();

  const chartMargins = useMemo(() => (
    isMobile
      ? { top: 10, right: 20, bottom: 40, left: 70 }
      : { top: 20, right: 130, bottom: 50, left: 80 }
  ), [isMobile]);

  if (!profitability) return null;

  return (
    <SectionCard
      title="Rentabilidade"
      subtitle="Análise de custos vs receita e ponto de equilíbrio"
      icon={DollarSign}
      id="profitability-section"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* KPI Grid - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
              Receita Bruta
            </p>
            <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(profitability.grossRevenue)}
            </p>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mt-1">
              + Cashback aplicado
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Custos Totais
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(profitability.totalCosts)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-slate-400 mt-1">
              Fixos + Manutenção
            </p>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg bg-gradient-to-br ${
              profitability.netProfit > 0
                ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
                : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
            }`}
          >
            <p
              className={`text-[10px] sm:text-xs font-medium mb-1 ${
                profitability.netProfit > 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              Lucro Líquido
            </p>
            <p
              className={`text-lg sm:text-2xl font-bold ${
                profitability.netProfit > 0
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}
            >
              {formatCurrency(profitability.netProfit)}
            </p>
            <p
              className={`text-[10px] sm:text-xs mt-1 ${
                profitability.netProfit > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {profitability.netProfit > 0 ? 'Positivo' : 'Negativo'}
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
              Margem
            </p>
            <p className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatPercent(profitability.profitMargin)}
            </p>
            <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 mt-1">
              {profitability.daysInPeriod} dias
            </p>
          </div>
        </div>

        {/* Break-even Analysis - Responsive layout */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-lavpop-blue-50 to-lavpop-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-lavpop-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-lavpop-primary dark:text-blue-300 mb-0.5 sm:mb-1">
                Ponto de Equilíbrio
              </h3>
              <p className="text-xs sm:text-sm text-lavpop-blue-700 dark:text-blue-400">
                Serviços necessários para cobrir custos
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-lavpop-blue-700 dark:text-blue-400 mb-0.5 sm:mb-1">
                Meta / Realizado
              </p>
              <p className="text-xl sm:text-2xl font-bold text-lavpop-primary dark:text-blue-200">
                {profitability.breakEvenServices} / {profitability.actualServices}
              </p>
            </div>
          </div>

          {/* Progress Bar with sr-only description */}
          <div className="relative">
            <div
              className="h-3 sm:h-4 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner"
              role="progressbar"
              aria-valuenow={profitability.actualServices}
              aria-valuemin={0}
              aria-valuemax={profitability.breakEvenServices}
              aria-label={`Progresso para break-even: ${profitability.actualServices} de ${profitability.breakEvenServices} serviços`}
            >
              <div
                className={`h-full transition-all duration-500 ${
                  profitability.isAboveBreakEven
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}
                style={{
                  width: `${Math.min((profitability.actualServices / profitability.breakEvenServices) * 100, 100)}%`
                }}
              />
            </div>
            <span className="sr-only">
              {profitability.isAboveBreakEven
                ? `Acima do break-even em ${formatPercent(profitability.breakEvenBuffer)}`
                : `Faltam ${profitability.breakEvenServices - profitability.actualServices} serviços para break-even`}
            </span>
            <div className="flex justify-between text-[10px] sm:text-xs text-lavpop-blue-700 dark:text-blue-400 mt-1.5 sm:mt-2">
              <span>0 ciclos</span>
              <span>{profitability.breakEvenServices} ciclos (break-even)</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 sm:mb-3">
              Custos Fixos
            </h4>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-slate-400">Período:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {profitability.daysInPeriod} dias
                </span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-slate-400">Total:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(profitability.fixedCosts)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 sm:mb-3">
              Manutenção
            </h4>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-slate-400">Custo:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(profitability.maintenanceCosts)}
                </span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-slate-400">% do Total:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatPercent((profitability.maintenanceCosts / profitability.totalCosts) * 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart with accessible description */}
        <div>
          <p id="profitability-chart-desc" className="sr-only">
            Gráfico de barras mostrando receita de {formatCurrency(profitability.totalRevenue)},
            custos de {formatCurrency(profitability.totalCosts)}, e lucro de{' '}
            {formatCurrency(Math.max(0, profitability.netProfit))}.
          </p>
          <div
            className="h-48 sm:h-56 lg:h-64"
            aria-describedby="profitability-chart-desc"
            role="img"
            aria-label="Gráfico de Rentabilidade"
          >
            <ResponsiveBar
              data={[
                {
                  category: 'Análise',
                  Receita: profitability.totalRevenue,
                  Custos: profitability.totalCosts,
                  Lucro: Math.max(0, profitability.netProfit)
                }
              ]}
              keys={['Receita', 'Custos', 'Lucro']}
              indexBy="category"
              margin={chartMargins}
              padding={0.3}
              groupMode="grouped"
              colors={['#55b03b', '#ef4444', '#8b5cf6']}
              borderRadius={8}
              axisLeft={{
                format: (value) => (isMobile ? `${Math.round(value / 1000)}k` : formatCurrency(value))
              }}
              labelTextColor="white"
              labelSkipWidth={12}
              labelSkipHeight={12}
              legends={
                isMobile
                  ? []
                  : [
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        translateX: 120,
                        itemWidth: 100,
                        itemHeight: 20,
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]
              }
              animate={true}
              motionConfig="gentle"
              theme={nivoTheme}
            />
          </div>
          {/* Mobile legend */}
          {isMobile && (
            <div
              className="flex justify-center gap-4 mt-2 text-xs"
              role="list"
              aria-label="Legenda do gráfico"
            >
              <div className="flex items-center gap-1.5" role="listitem">
                <div className="w-3 h-3 rounded-sm bg-[#55b03b]" aria-hidden="true" />
                <span className="text-gray-600 dark:text-slate-400">Receita</span>
              </div>
              <div className="flex items-center gap-1.5" role="listitem">
                <div className="w-3 h-3 rounded-sm bg-[#ef4444]" aria-hidden="true" />
                <span className="text-gray-600 dark:text-slate-400">Custos</span>
              </div>
              <div className="flex items-center gap-1.5" role="listitem">
                <div className="w-3 h-3 rounded-sm bg-[#8b5cf6]" aria-hidden="true" />
                <span className="text-gray-600 dark:text-slate-400">Lucro</span>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        {profitability.isAboveBreakEven ? (
          <InsightBox
            type="success"
            title="Negócio Lucrativo"
            message={`Você está ${formatPercent(Math.abs(profitability.breakEvenBuffer))} acima do ponto de equilíbrio. Margem de lucro de ${formatPercent(profitability.profitMargin)}. Continue mantendo a eficiência operacional!`}
          />
        ) : (
          <InsightBox
            type="warning"
            title="Atenção: Abaixo do Break-Even"
            message={`Você precisa de mais ${profitability.breakEvenServices - profitability.actualServices} serviços para atingir o ponto de equilíbrio. Considere lançar promoções urgentes ou revisar custos fixos nas Configurações.`}
          />
        )}
      </div>
    </SectionCard>
  );
};

export default ProfitabilitySection;
