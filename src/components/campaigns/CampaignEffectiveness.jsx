// CampaignEffectiveness.jsx v1.0
// Displays campaign effectiveness metrics in the overview tab
// Shows return rates, revenue recovered, and method comparison
//
// CHANGELOG:
// v1.0 (2025-12-08): Initial implementation
//   - Fetches metrics from contactTrackingService
//   - Shows KPI summary: contacts, returns, rate, revenue
//   - Method comparison: Call vs WhatsApp effectiveness
//   - Campaign breakdown table

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  MessageCircle,
  Target,
  RefreshCw,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { getEffectivenessMetrics } from '../../utils/contactTrackingService';

// ==================== HELPER COMPONENTS ====================

const MetricCard = ({ label, value, subtitle, icon: Icon, color = 'blue', trend = null }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
  };

  const valueColorClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    purple: 'text-purple-700 dark:text-purple-300',
    amber: 'text-amber-700 dark:text-amber-300'
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${valueColorClasses[color]}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {subtitle}
        </div>
      )}
      {trend !== null && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          {trend >= 0 ? '+' : ''}{trend}% vs. período anterior
        </div>
      )}
    </div>
  );
};

const MethodComparisonBar = ({ method, label, icon: Icon, total, returned, rate, maxTotal }) => {
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${method === 'whatsapp' ? 'text-green-500' : 'text-blue-500'}`} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{rate}%</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
            ({returned}/{total})
          </span>
        </div>
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            method === 'whatsapp'
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : 'bg-gradient-to-r from-blue-400 to-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CampaignEffectiveness = ({ className = '' }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getEffectivenessMetrics({ days: timeRange });
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch effectiveness metrics:', err);
        setError('Não foi possível carregar as métricas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  // Format helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Calculate display values
  const summary = metrics?.summary || {};
  const methodComparison = summary.methodComparison || { call: {}, whatsapp: {} };

  // Max for bar chart scaling
  const maxMethodTotal = Math.max(
    methodComparison.call?.total || 0,
    methodComparison.whatsapp?.total || 0,
    1
  );

  // No data state
  const hasData = summary.totalContacts > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Efetividade de Contatos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o retorno dos clientes contatados
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <button
              onClick={() => setTimeRange(timeRange)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {!hasData ? (
          /* Empty State */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nenhum contato registrado
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Quando você contactar clientes em risco, as métricas de efetividade aparecerão aqui.
              Use a tabela de Clientes em Risco para começar.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Contatos"
                value={summary.totalContacts || 0}
                subtitle={`${summary.totalPending || 0} aguardando retorno`}
                icon={Users}
                color="blue"
              />
              <MetricCard
                label="Retornaram"
                value={summary.totalReturned || 0}
                subtitle="clientes voltaram"
                icon={CheckCircle2}
                color="green"
              />
              <MetricCard
                label="Taxa de Retorno"
                value={`${summary.returnRate || 0}%`}
                subtitle={summary.avgDaysToReturn ? `${summary.avgDaysToReturn} dias em média` : 'calculando...'}
                icon={TrendingUp}
                color="purple"
              />
              <MetricCard
                label="Receita Recuperada"
                value={formatCurrency(summary.totalRevenue || 0)}
                subtitle="dos que retornaram"
                icon={DollarSign}
                color="amber"
              />
            </div>

            {/* Method Comparison */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Comparação por Canal
              </h4>

              <div className="space-y-4">
                <MethodComparisonBar
                  method="whatsapp"
                  label="WhatsApp"
                  icon={MessageCircle}
                  total={methodComparison.whatsapp?.total || 0}
                  returned={methodComparison.whatsapp?.returned || 0}
                  rate={methodComparison.whatsapp?.rate || 0}
                  maxTotal={maxMethodTotal}
                />
                <MethodComparisonBar
                  method="call"
                  label="Ligação"
                  icon={Phone}
                  total={methodComparison.call?.total || 0}
                  returned={methodComparison.call?.returned || 0}
                  rate={methodComparison.call?.rate || 0}
                  maxTotal={maxMethodTotal}
                />
              </div>

              {/* Best Channel Insight */}
              {(methodComparison.whatsapp?.total > 0 || methodComparison.call?.total > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    {methodComparison.whatsapp?.rate >= methodComparison.call?.rate ? (
                      <span>
                        <strong className="text-green-600 dark:text-green-400">WhatsApp</strong> está com melhor taxa de retorno
                        {methodComparison.call?.total > 0 && methodComparison.whatsapp?.rate > methodComparison.call?.rate
                          ? ` (+${(methodComparison.whatsapp.rate - methodComparison.call.rate).toFixed(1)}pp)`
                          : ''}
                      </span>
                    ) : (
                      <span>
                        <strong className="text-blue-600 dark:text-blue-400">Ligações</strong> estão com melhor taxa de retorno
                        {` (+${(methodComparison.call.rate - methodComparison.whatsapp.rate).toFixed(1)}pp)`}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Campaign Breakdown */}
            {metrics?.byCampaign && metrics.byCampaign.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Por Campanha
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Campanha</th>
                        <th className="text-center py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Contatos</th>
                        <th className="text-center py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Retornaram</th>
                        <th className="text-center py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Taxa</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-600 dark:text-slate-400">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.byCampaign.slice(0, 5).map((campaign, idx) => (
                        <tr
                          key={campaign.campaign_id || idx}
                          className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {campaign.campaign_id ? (
                                <Target className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              ) : (
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                                {campaign.campaign_name || 'Contato Manual'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                            {campaign.total_contacts}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={campaign.returned_count > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-slate-400'}>
                              {campaign.returned_count}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              campaign.return_rate >= 20
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : campaign.return_rate >= 10
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {campaign.return_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                            {formatCurrency(campaign.total_return_revenue || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Contacts Note */}
            {summary.totalPending > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>{summary.totalPending} contatos</strong> ainda aguardando retorno. Os clientes têm até 7 dias para retornar antes de serem considerados como não-recuperados.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignEffectiveness;
