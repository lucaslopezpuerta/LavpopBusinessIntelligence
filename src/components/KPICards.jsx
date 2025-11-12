import React from 'react';
import { TrendingUp, TrendingDown, Activity, Users, AlertCircle, Heart } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  red: '#dc2626',
  amber: '#f59e0b',
  gray: '#6b7280',
  // Risk colors
  churning: '#dc2626',
  atRisk: '#f59e0b',
  monitor: '#10306B',
  healthy: '#53be33',
  new: '#9333ea'
};

const KPICards = ({ businessMetrics, customerMetrics }) => {
  // Safety check - don't render if no data
  if (!businessMetrics || !customerMetrics) {
    return (
      <div className="text-gray-500 p-4">
        Loading KPIs...
      </div>
    );
  }

  // Business metrics from businessMetrics.js
  const weekly = businessMetrics?.weekly || {};
  const weekOverWeek = businessMetrics?.weekOverWeek || {};
  
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
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'services',
      title: 'TOTAL CYCLES',
      value: (weekly.totalServices || 0).toLocaleString('pt-BR'),
      change: weekOverWeek.totalServices,
      changeLabel: formatPercent(weekOverWeek.totalServices),
      trend: getTrendIndicator(weekOverWeek.totalServices),
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'utilization',
      title: 'OVERALL UTILIZATION',
      value: `${Math.round(weekly.totalUtilization || 0)}%`,
      change: weekOverWeek.utilization,
      changeLabel: formatPercent(weekOverWeek.utilization),
      trend: getTrendIndicator(weekOverWeek.utilization),
      icon: Activity,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'active',
      title: 'ACTIVE CUSTOMERS',
      value: activeCount.toLocaleString('pt-BR'),
      subtitle: 'Not "Lost"',
      icon: Users,
      color: COLORS.primary,
      iconBg: '#e3f2fd'
    },
    {
      id: 'atrisk',
      title: 'AT-RISK CUSTOMERS',
      value: atRiskCount.toLocaleString('pt-BR'),
      subtitle: 'Need attention',
      icon: AlertCircle,
      color: COLORS.amber,
      iconBg: '#fef3c7'
    },
    {
      id: 'health',
      title: 'CUSTOMER HEALTH RATE',
      value: `${Math.round(healthRate)}%`,
      subtitle: '"Healthy" customers',
      icon: Heart,
      color: COLORS.accent,
      iconBg: '#e8f5e9'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trend?.icon;
        
        return (
          <div
            key={kpi.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
              transition: 'all 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{ 
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: 0
              }}>
                {kpi.title}
              </h3>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: kpi.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon style={{ width: '20px', height: '20px', color: kpi.color }} />
              </div>
            </div>

            {/* Value */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ 
                fontSize: '28px',
                fontWeight: '700',
                color: kpi.color,
                lineHeight: '1.2'
              }}>
                {kpi.value}
              </div>
            </div>

            {/* Change or Subtitle */}
            {kpi.trend && kpi.change !== null && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '13px'
              }}>
                {TrendIcon && (
                  <TrendIcon 
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      color: kpi.trend.color
                    }}
                  />
                )}
                <span style={{ 
                  color: kpi.trend.color,
                  fontWeight: '600'
                }}>
                  {kpi.changeLabel}
                </span>
                <span style={{ color: '#9ca3af', marginLeft: '0.25rem' }}>
                  {kpi.trend.label}
                </span>
              </div>
            )}

            {kpi.subtitle && (
              <div style={{ 
                fontSize: '13px',
                color: '#6b7280'
              }}>
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
