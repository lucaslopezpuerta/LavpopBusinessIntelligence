// DiscountComparisonCard.jsx v1.1
// A/B Testing visualization for discount and service comparison
// Design System v3.1 compliant
//
// CHANGELOG:
// v1.1 (2026-01-29): Migrate badges and icon wells to solid colors
//   - Badges now use solid bg-{color}-600/500 with white text
//   - Icon wells use solid colors instead of opacity-based
// v1.0 (2025-12-10): Initial implementation
//   - Horizontal bar charts for discount % comparison
//   - Service type comparison (Todos, Lavagem, Secagem)
//   - Highlights best performers with star indicator
//   - Responsive grid layout
//   - Dark mode support

import React from 'react';
import {
  Beaker,
  Star,
  Percent,
  Sparkles
} from 'lucide-react';
import SectionCard from '../ui/SectionCard';

// ==================== COMPARISON BAR ====================

const ComparisonBar = ({
  label,
  value,
  maxValue,
  returnRate,
  campaigns,
  revenue,
  isBest = false,
  color = 'purple'
}) => {
  const percentage = maxValue > 0 ? (returnRate / maxValue) * 100 : 0;

  const colorClasses = {
    purple: {
      bar: 'from-purple-500 to-violet-600',
      text: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-600 dark:bg-purple-500 text-white'
    },
    blue: {
      bar: 'from-blue-500 to-indigo-600',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-600 dark:bg-blue-500 text-white'
    },
    emerald: {
      bar: 'from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-600 dark:bg-emerald-500 text-white'
    }
  };

  const colors = colorClasses[color] || colorClasses.purple;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${colors.text}`}>
            {label}
          </span>
          {isBest && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
            {campaigns} {campaigns === 1 ? 'campanha' : 'campanhas'}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {returnRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      {revenue > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{value} contatos</span>
          <span>R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
        </div>
      )}
    </div>
  );
};

// ==================== EMPTY STATE ====================

const EmptyComparison = ({ type }) => (
  <div className="text-center py-6">
    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <Beaker className="w-5 h-5 text-slate-400" />
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Sem dados de {type} ainda
    </p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
      Envie campanhas com diferentes {type === 'desconto' ? 'descontos' : 'servicos'}
    </p>
  </div>
);

// ==================== MAIN COMPONENT ====================

const DiscountComparisonCard = ({
  discountData = [],
  serviceData = [],
  bestDiscount,
  bestService,
  isLoading = false
}) => {
  // Sort discount data by percentage
  const sortedDiscounts = [...discountData].sort((a, b) => a.discount - b.discount);

  // Find max values for scaling
  const maxDiscountRate = Math.max(...discountData.map(d => d.returnRate || 0), 1);
  const maxServiceRate = Math.max(...serviceData.map(s => s.returnRate || 0), 1);

  // Service labels
  const serviceLabels = {
    'all': 'Todos os Servicos',
    'wash': 'So Lavagem',
    'dry': 'So Secagem'
  };

  // Loading state
  if (isLoading) {
    return (
      <SectionCard
        title="Analise de A/B Testing"
        subtitle="Comparacao de descontos e tipos de servico"
        icon={Beaker}
        color="purple"
      >
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  const hasDiscountData = discountData.length > 0;
  const hasServiceData = serviceData.length > 0;

  // No data at all
  if (!hasDiscountData && !hasServiceData) {
    return (
      <SectionCard
        title="Analise de A/B Testing"
        subtitle="Comparacao de descontos e tipos de servico"
        icon={Beaker}
        color="purple"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
            Pronto para A/B Testing
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Envie campanhas com diferentes descontos (15%, 20%, 25%, 30%) e tipos de servico
            para descobrir o que funciona melhor para seus clientes.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Analise de A/B Testing"
      subtitle="Comparacao de descontos e tipos de servico"
      icon={Beaker}
      color="purple"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Discount Comparison */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <Percent className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Retorno por Desconto
            </h4>
          </div>

          {hasDiscountData ? (
            <div className="space-y-4">
              {sortedDiscounts.map((item) => (
                <ComparisonBar
                  key={item.discount}
                  label={`${item.discount}%`}
                  value={item.contacts || 0}
                  maxValue={maxDiscountRate}
                  returnRate={item.returnRate || 0}
                  campaigns={item.campaigns || 0}
                  revenue={item.revenue || 0}
                  isBest={bestDiscount?.discount === item.discount}
                  color="purple"
                />
              ))}
            </div>
          ) : (
            <EmptyComparison type="desconto" />
          )}

          {/* Best discount insight */}
          {bestDiscount && hasDiscountData && (
            <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>{bestDiscount.discount}%</strong> e o desconto mais efetivo com{' '}
                  <strong>{bestDiscount.returnRate?.toFixed(1)}%</strong> de retorno
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Service Type Comparison */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Retorno por Tipo de Servico
            </h4>
          </div>

          {hasServiceData ? (
            <div className="space-y-4">
              {serviceData.map((item) => (
                <ComparisonBar
                  key={item.service}
                  label={serviceLabels[item.service] || item.service}
                  value={item.contacts || 0}
                  maxValue={maxServiceRate}
                  returnRate={item.returnRate || 0}
                  campaigns={item.campaigns || 0}
                  revenue={item.revenue || 0}
                  isBest={bestService?.service === item.service}
                  color="blue"
                />
              ))}
            </div>
          ) : (
            <EmptyComparison type="servico" />
          )}

          {/* Best service insight */}
          {bestService && hasServiceData && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>{serviceLabels[bestService.service] || bestService.service}</strong> tem{' '}
                  <strong>{bestService.returnRate?.toFixed(1)}%</strong> de retorno
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default DiscountComparisonCard;
