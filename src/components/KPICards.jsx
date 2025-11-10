import React from 'react';
import { TrendingUp, TrendingDown, Activity, Users, AlertCircle, Heart } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  red: '#dc2626',
  amber: '#f59e0b',
  gray: '#6b7280'
};

const KPICards = ({ businessMetrics, customerMetrics }) => {
  // Customer metrics from customerMetrics.js (V2.1 logic)
  const activeCount = customerMetrics?.activeCount || 0;
  const atRiskCount = customerMetrics?.atRiskCount || 0;
  const healthRate = customerMetrics?.healthRate || 0;

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTrendIndicator = (value) => {
    if (value === null || value === undefined || isNaN(value)) return null;
    if (value > 0) return { icon: TrendingUp, color: COLORS.accent, label: 'vs Last Week' };
    if (value < 0) return { icon: TrendingDown, color: COLORS.red, label: 'vs Last Week' };
    return { icon: null, color: COLORS.gray, label: 'vs Last Week' };
  };

  const kpis = [
    {
      id: 'revenue',
      title: 'TOTAL NET REVENUE',
      value: formatCurrency(weekly.netRevenue || 0),
      change: weekOverWeek.netRevenue,
      changeLabel: formatPercent(weekOverWeek.netRevenue),
      trend: getTrendIndicator(weekOverWeek.netRevenue),
      icon: Activity,
      color: COLORS.primary
    },
    {
      id: 'services',
      title: 'TOTAL CYCLES',
      value: (weekly.totalServices || 0).toLocaleString('pt-BR'),
      change: weekOverWeek.totalServices,
      changeLabel: formatPercent(weekOverWeek.totalServices),
      trend: getTrendIndicator(weekOverWeek.totalServices),
      icon: Activity,
      color: COLORS.primary
    },
    {
      id: 'utilization',
      title: 'OVERALL UTILIZATION',
      value: `${Math.round(weekly.totalUtilization || 0)}%`,
      change: weekOverWeek.utilization,
      changeLabel: formatPercent(weekOverWeek.utilization),
      trend: getTrendIndicator(weekOverWeek.utilization),
      icon: Activity,
      color: COLORS.primary
    },
    {
      id: 'active',
      title: 'ACTIVE CUSTOMERS',
      value: activeCount.toLocaleString('pt-BR'),
      subtitle: 'Not "Lost"',
      icon: Users,
      color: COLORS.primary
    },
    {
      id: 'atrisk',
      title: 'AT-RISK CUSTOMERS',
      value: atRiskCount.toLocaleString('pt-BR'),
      subtitle: 'Need attention',
      icon: AlertCircle,
      color: COLORS.amber
    },
    {
      id: 'health',
      title: 'CUSTOMER HEALTH RATE',
      value: `${Math.round(healthRate)}%`,
      subtitle: '"Healthy" customers',
      icon: Heart,
      color: COLORS.accent
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trend?.icon;
        
        return (
          <div
            key={kpi.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {kpi.title}
              </h3>
              <Icon className="w-5 h-5" style={{ color: kpi.color }} />
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="text-3xl font-bold" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
            </div>

            {/* Change or Subtitle */}
            {kpi.trend && kpi.change !== null && (
              <div className="flex items-center gap-1 text-sm">
                {TrendIcon && (
                  <TrendIcon 
                    className="w-4 h-4" 
                    style={{ color: kpi.trend.color }}
                  />
                )}
                <span style={{ color: kpi.trend.color }}>
                  {kpi.changeLabel}
                </span>
                <span className="text-gray-500 ml-1">{kpi.trend.label}</span>
              </div>
            )}

            {kpi.subtitle && (
              <div className="text-sm text-gray-500">
                {kpi.subtitle}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
