// WhatsAppAnalytics.jsx v1.2
// WhatsApp Business API Analytics Dashboard
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.2 (2025-12-18): Per-template analytics with READ metrics
//   - Added 4th KPI card: "Taxa de Leitura" (from template-level data)
//   - Added template analytics table with per-template metrics
//   - Read metrics now available via template analytics API
// v1.1 (2025-12-17): Updated for available data
//   - Message metrics: sent, delivered (read not available at account level)
//   - Daily trend chart for message volume
//   - Delivery funnel visualization
// v1.0 (2025-12-17): Initial implementation

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowRight,
  Loader2,
  Eye,
  FileText
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// UI Components
import KPICard, { KPIGrid } from '../ui/KPICard';
import SectionCard from '../ui/SectionCard';

// Services
import { api } from '../../utils/apiService';

// Chart colors
const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280',
  lightGray: '#d1d5db',
  sent: '#6366f1',
  delivered: '#10b981'
};

// ==================== HELPER FUNCTIONS ====================

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
      from = '2025-12-09'; // Start date (first templates created)
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

// ==================== MESSAGE TREND CHART ====================

const MessageTrendChart = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      date: formatDate(d.bucket_date),
      sent: d.sent || 0,
      delivered: d.delivered || 0
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
        <p className="text-indigo-600 dark:text-indigo-400">
          Enviadas: {formatNumber(payload[0]?.payload?.sent)}
        </p>
        <p className="text-emerald-600 dark:text-emerald-400">
          Entregues: {formatNumber(payload[0]?.payload?.delivered)}
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="sent"
          stroke={COLORS.sent}
          strokeWidth={2}
          dot={{ fill: COLORS.sent, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.sent }}
        />
        <Line
          type="monotone"
          dataKey="delivered"
          stroke={COLORS.delivered}
          strokeWidth={2}
          dot={{ fill: COLORS.delivered, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.delivered }}
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
        {[...Array(2)].map((_, i) => (
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
    }
  ];

  return (
    <div className="space-y-6">
      {funnelData.map((stage, index) => {
        const Icon = stage.icon;
        const width = Math.max(30, stage.percentage);

        return (
          <div key={stage.label} className="relative">
            {/* Arrow connector */}
            {index > 0 && (
              <div className="absolute -top-4 left-6 text-slate-300 dark:text-slate-600">
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
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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

// ==================== TEMPLATE ANALYTICS TABLE ====================

const TemplateAnalyticsTable = ({ templates, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>Nenhum template com dados no período</p>
      </div>
    );
  }

  // Color-code rates
  const getRateColor = (rate, type) => {
    if (type === 'delivery') {
      if (rate >= 95) return 'text-emerald-600 dark:text-emerald-400';
      if (rate >= 90) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    }
    // Read rate
    if (rate >= 50) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 30) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-500 dark:text-slate-400';
  };

  // Category badge
  const CategoryBadge = ({ category }) => {
    const colors = {
      'MARKETING': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'UTILITY': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return (
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${colors[category] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
        {category || 'N/A'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Template</th>
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Enviadas</th>
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Entregues</th>
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400">Lidas</th>
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400">% Entrega</th>
            <th className="text-right py-3 px-2 font-medium text-slate-500 dark:text-slate-400">% Leitura</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template, idx) => (
            <tr
              key={template.templateId || idx}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={template.templateName}>
                    {template.templateName}
                  </span>
                  <CategoryBadge category={template.category} />
                </div>
              </td>
              <td className="text-right py-3 px-2 text-slate-900 dark:text-white font-medium">
                {formatNumber(template.sent)}
              </td>
              <td className="text-right py-3 px-2 text-slate-700 dark:text-slate-300">
                {formatNumber(template.delivered)}
              </td>
              <td className="text-right py-3 px-2 text-slate-700 dark:text-slate-300">
                {formatNumber(template.readCount)}
              </td>
              <td className={`text-right py-3 px-2 font-medium ${getRateColor(template.deliveryRate, 'delivery')}`}>
                {formatPercent(template.deliveryRate)}
              </td>
              <td className={`text-right py-3 px-2 font-medium ${getRateColor(template.readRate, 'read')}`}>
                {formatPercent(template.readRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [messageSummary, setMessageSummary] = useState(null);
  const [templateData, setTemplateData] = useState({ templates: [], summary: null });

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { from, to } = getDateRange(dateFilter);

      // Fetch message data and template analytics
      const [dailyRes, messagesRes, templateRes] = await Promise.all([
        api.waba.getDailyMetrics(from, to),
        api.waba.getMessages(from, to),
        api.waba.getTemplateAnalyticsSummary(from, to)
      ]);

      setDailyMetrics(dailyRes.metrics || []);
      setMessageSummary(messagesRes.summary);
      setTemplateData({
        templates: templateRes.templates || [],
        summary: templateRes.summary || null
      });
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
      // Sync both account analytics and template analytics
      await Promise.all([
        api.waba.triggerSync(),
        api.waba.triggerTemplateSync()
      ]);
      // Refresh data after sync
      await fetchData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate KPIs from message data + template summary
  const kpis = useMemo(() => {
    return {
      totalSent: messageSummary?.totalSent || 0,
      totalDelivered: messageSummary?.totalDelivered || 0,
      deliveryRate: messageSummary?.deliveryRate || 0,
      // Read rate from template analytics (only available at template level)
      readRate: templateData.summary?.readRate || 0,
      totalRead: templateData.summary?.totalRead || 0
    };
  }, [messageSummary, templateData.summary]);

  // Check if we have any data
  const hasData = dailyMetrics.length > 0 || messageSummary?.totalSent > 0;

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
              Métricas de envio e entrega de mensagens
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
            label="Mensagens Enviadas"
            value={formatNumber(kpis.totalSent)}
            icon={Send}
            variant="gradient"
            gradientFrom="from-indigo-500"
            gradientTo="to-purple-600"
            isLoading={isLoading}
            subtitle="Total no período"
          />
          <KPICard
            label="Mensagens Entregues"
            value={formatNumber(kpis.totalDelivered)}
            icon={CheckCircle2}
            variant="gradient"
            gradientFrom="from-emerald-500"
            gradientTo="to-green-600"
            isLoading={isLoading}
            subtitle="Chegaram ao destinatário"
          />
          <KPICard
            label="Taxa de Entrega"
            value={formatPercent(kpis.deliveryRate)}
            icon={TrendingUp}
            variant="gradient"
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-600"
            isLoading={isLoading}
            subtitle="Entregues / Enviadas"
          />
          <KPICard
            label="Taxa de Leitura"
            value={formatPercent(kpis.readRate)}
            icon={Eye}
            variant="gradient"
            gradientFrom="from-purple-500"
            gradientTo="to-pink-600"
            isLoading={isLoading}
            subtitle="Lidas / Entregues"
          />
        </KPIGrid>
      )}

      {/* Charts row */}
      {(hasData || isLoading) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Trend Chart */}
          <SectionCard
            title="Volume de Mensagens"
            subtitle="Enviadas e entregues por dia"
            icon={TrendingUp}
          >
            <MessageTrendChart data={dailyMetrics} isLoading={isLoading} />
          </SectionCard>

          {/* Delivery Funnel */}
          <SectionCard
            title="Funil de Entrega"
            subtitle="Enviadas → Entregues"
            icon={Send}
          >
            <DeliveryFunnel summary={messageSummary} isLoading={isLoading} />
          </SectionCard>
        </div>
      )}

      {/* Template Analytics Table */}
      {(hasData || isLoading) && (
        <SectionCard
          title="Métricas por Template"
          subtitle="Desempenho individual de cada template (inclui taxa de leitura)"
          icon={FileText}
        >
          <TemplateAnalyticsTable templates={templateData.templates} isLoading={isLoading} />
        </SectionCard>
      )}
    </div>
  );
};

export default WhatsAppAnalytics;
