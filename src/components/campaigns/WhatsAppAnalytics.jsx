// WhatsAppAnalytics.jsx v1.0
// WhatsApp Business API Analytics Dashboard
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.0 (2025-12-17): Initial implementation
//   - KPI cards: Total conversations, cost, delivery rate, read rate
//   - Cost trend line chart
//   - Delivery funnel (sent → delivered → read)
//   - Date range filter (7d, 30d, custom)
//   - Sync status and manual sync trigger

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageCircle,
  DollarSign,
  Send,
  CheckCircle2,
  Eye,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// UI Components
import KPICard, { KPIGrid } from '../ui/KPICard';
import SectionCard from '../ui/SectionCard';

// Services
import { api } from '../../utils/apiService';

// Chart colors (from chartColors.js)
const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  amber: '#f59f0b',
  gray: '#6b7280',
  lightGray: '#d1d5db',
  sent: '#6366f1',
  delivered: '#10b981',
  read: '#3b82f6'
};

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const formatPercent = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Get date range based on filter
const getDateRange = (filter) => {
  const now = new Date();
  const to = now.toISOString().split('T')[0];

  let from;
  switch (filter) {
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'all':
    default:
      from = '2024-12-09'; // Start date
      break;
  }

  return { from, to };
};

// ==================== DATE FILTER COMPONENT ====================

const DateFilter = ({ value, onChange }) => {
  const options = [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'all', label: 'Tudo' }
  ];

  return (
    <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md transition-all
            ${value === option.id
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// ==================== COST TREND CHART ====================

const CostTrendChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      date: formatDate(d.bucket_date),
      cost: parseFloat(d.cost) || 0,
      conversations: d.conversations || 0
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Sem dados para o período selecionado</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-slate-900 dark:text-white mb-1">{label}</p>
        <p className="text-green-600 dark:text-green-400">
          Custo: {formatCurrency(payload[0]?.value)}
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Conversas: {formatNumber(payload[0]?.payload?.conversations)}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} opacity={0.3} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: COLORS.gray }}
          tickLine={false}
          axisLine={{ stroke: COLORS.lightGray }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: COLORS.gray }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="cost"
          stroke={COLORS.accent}
          strokeWidth={2}
          dot={{ fill: COLORS.accent, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.accent }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ==================== DELIVERY FUNNEL ====================

const DeliveryFunnel = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const funnelData = [
    {
      label: 'Enviadas',
      value: summary?.totalSent || 0,
      color: COLORS.sent,
      icon: Send,
      percentage: 100
    },
    {
      label: 'Entregues',
      value: summary?.totalDelivered || 0,
      color: COLORS.delivered,
      icon: CheckCircle2,
      percentage: summary?.deliveryRate || 0
    },
    {
      label: 'Lidas',
      value: summary?.totalRead || 0,
      color: COLORS.read,
      icon: Eye,
      percentage: summary?.readRate || 0
    }
  ];

  return (
    <div className="space-y-4">
      {funnelData.map((stage, index) => {
        const Icon = stage.icon;
        const width = Math.max(30, stage.percentage);

        return (
          <div key={stage.label} className="relative">
            {/* Arrow connector */}
            {index > 0 && (
              <div className="absolute -top-3 left-6 text-slate-300 dark:text-slate-600">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stage.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: stage.color }} />
              </div>

              {/* Bar and info */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stage.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatNumber(stage.value)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: stage.color
                    }}
                  />
                </div>

                {/* Percentage */}
                {index > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatPercent(stage.percentage)} das enviadas
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const WhatsAppAnalytics = () => {
  const [dateFilter, setDateFilter] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [summary, setSummary] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [messageSummary, setMessageSummary] = useState(null);
  const [conversationSummary, setConversationSummary] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { from, to } = getDateRange(dateFilter);

      // Fetch all data in parallel
      const [summaryRes, dailyRes, messagesRes, conversationsRes] = await Promise.all([
        api.waba.getSummary(),
        api.waba.getDailyMetrics(from, to),
        api.waba.getMessages(from, to),
        api.waba.getConversations({ from, to })
      ]);

      setSummary(summaryRes.summary);
      setDailyMetrics(dailyRes.metrics || []);
      setMessageSummary(messagesRes.summary);
      setConversationSummary(conversationsRes.summary);
    } catch (err) {
      console.error('Failed to fetch WABA analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  // Initial fetch and on filter change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual sync handler
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await api.waba.triggerSync();
      // Refresh data after sync
      await fetchData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate KPIs from current period data
  const kpis = useMemo(() => {
    return {
      totalConversations: conversationSummary?.totalConversations || 0,
      totalCost: conversationSummary?.totalCost || 0,
      deliveryRate: messageSummary?.deliveryRate || 0,
      readRate: messageSummary?.readRate || 0
    };
  }, [conversationSummary, messageSummary]);

  // Check if we have any data
  const hasData = summary?.total_conversations > 0 || dailyMetrics.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with date filter and sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              WhatsApp Business Analytics
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Custos e métricas de entrega
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasData && !error && (
        <SectionCard>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nenhum dado disponível
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
              Os dados do WhatsApp Business serão sincronizados automaticamente a cada 4 horas.
              Clique em "Sincronizar" para buscar os dados agora.
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>
        </SectionCard>
      )}

      {/* KPI Cards */}
      {(hasData || isLoading) && (
        <KPIGrid columns={4}>
          <KPICard
            label="Conversas"
            value={formatNumber(kpis.totalConversations)}
            icon={MessageCircle}
            variant="gradient"
            gradientFrom="from-green-500"
            gradientTo="to-emerald-600"
            isLoading={isLoading}
            subtitle="Total no período"
          />
          <KPICard
            label="Custo Total"
            value={formatCurrency(kpis.totalCost)}
            icon={DollarSign}
            variant="gradient"
            gradientFrom="from-amber-500"
            gradientTo="to-orange-600"
            isLoading={isLoading}
            subtitle="Marketing + outros"
          />
          <KPICard
            label="Taxa de Entrega"
            value={formatPercent(kpis.deliveryRate)}
            icon={CheckCircle2}
            variant="gradient"
            gradientFrom="from-blue-500"
            gradientTo="to-indigo-600"
            isLoading={isLoading}
            subtitle="Msgs entregues"
          />
          <KPICard
            label="Taxa de Leitura"
            value={formatPercent(kpis.readRate)}
            icon={Eye}
            variant="gradient"
            gradientFrom="from-purple-500"
            gradientTo="to-violet-600"
            isLoading={isLoading}
            subtitle="Msgs lidas"
          />
        </KPIGrid>
      )}

      {/* Charts row */}
      {(hasData || isLoading) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Trend Chart */}
          <SectionCard
            title="Evolução de Custos"
            subtitle="Custo diário de conversas"
            icon={TrendingUp}
          >
            <CostTrendChart data={dailyMetrics} isLoading={isLoading} />
          </SectionCard>

          {/* Delivery Funnel */}
          <SectionCard
            title="Funil de Entrega"
            subtitle="Enviadas → Entregues → Lidas"
            icon={Send}
          >
            <DeliveryFunnel summary={messageSummary} isLoading={isLoading} />
          </SectionCard>
        </div>
      )}

      {/* Category breakdown (if multiple categories exist) */}
      {(hasData || isLoading) && conversationSummary?.byCategory && Object.keys(conversationSummary.byCategory).length > 1 && (
        <SectionCard
          title="Por Categoria"
          subtitle="Breakdown por tipo de conversa"
          icon={MessageCircle}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(conversationSummary.byCategory).map(([category, data]) => (
              <div
                key={category}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center"
              >
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  {category}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(data.conversations)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {formatCurrency(data.cost)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default WhatsAppAnalytics;
