import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  red: '#dc2626',
  gray: '#6b7280'
};

const WeeklyPerformanceSummary = ({ businessMetrics }) => {
  if (!businessMetrics) {
    return null;
  }

  const { weekly, weekOverWeek, windows } = businessMetrics;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      label: 'Net Revenue',
      value: formatCurrency(weekly.netRevenue),
      change: weekOverWeek.netRevenue,
      changeLabel: formatPercent(weekOverWeek.netRevenue)
    },
    {
      label: 'Transactions',
      value: weekly.transactions,
      change: weekOverWeek.transactions,
      changeLabel: formatPercent(weekOverWeek.transactions)
    },
    {
      label: 'Services',
      value: weekly.totalServices,
      change: weekOverWeek.totalServices,
      changeLabel: formatPercent(weekOverWeek.totalServices)
    },
    {
      label: 'Utilization',
      value: `${Math.round(weekly.totalUtilization)}%`,
      change: weekOverWeek.utilization,
      changeLabel: weekOverWeek.utilization !== null ? formatPercent(weekOverWeek.utilization) : 'N/A'
    }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Calendar style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Weekly Performance
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          {windows.weekly.startDate} - {windows.weekly.endDate}
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        {metrics.map((metric, index) => (
          <div 
            key={index}
            style={{
              padding: '0.75rem',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ 
              fontSize: '11px', 
              color: COLORS.gray, 
              marginBottom: '0.5rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {metric.label}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between'
            }}>
              <div style={{ 
                fontSize: '20px',
                fontWeight: '700',
                color: COLORS.primary
              }}>
                {metric.value}
              </div>
              {metric.change !== null && !isNaN(metric.change) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: metric.change >= 0 ? COLORS.accent : COLORS.red
                }}>
                  {metric.change >= 0 ? (
                    <TrendingUp style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <TrendingDown style={{ width: '14px', height: '14px' }} />
                  )}
                  {metric.changeLabel}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPerformanceSummary;
