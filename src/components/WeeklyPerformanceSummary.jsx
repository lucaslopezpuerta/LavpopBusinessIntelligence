// WeeklyPerformanceSummary_v2.0.jsx
// ✅ Now shows PREVIOUS week's KPIs instead of current week
// ✅ Calculates metrics for 7-13 days ago

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

  // Access PREVIOUS week's data instead of current week
  const { previousWeekly, previousWeekOverWeek, windows } = businessMetrics;

  // If previous week data doesn't exist, show message
  if (!previousWeekly) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ color: COLORS.gray, fontSize: '14px' }}>
          Previous week data not available
        </div>
      </div>
    );
  }

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
      value: formatCurrency(previousWeekly.netRevenue),
      change: previousWeekOverWeek.netRevenue,
      changeLabel: formatPercent(previousWeekOverWeek.netRevenue)
    },
    {
      label: 'Transactions',
      value: previousWeekly.transactions,
      change: previousWeekOverWeek.transactions,
      changeLabel: formatPercent(previousWeekOverWeek.transactions)
    },
    {
      label: 'Services',
      value: previousWeekly.totalServices,
      change: previousWeekOverWeek.totalServices,
      changeLabel: formatPercent(previousWeekOverWeek.totalServices)
    },
    {
      label: 'Utilization',
      value: `${Math.round(previousWeekly.totalUtilization)}%`,
      change: previousWeekOverWeek.utilization,
      changeLabel: previousWeekOverWeek.utilization !== null ? formatPercent(previousWeekOverWeek.utilization) : 'N/A'
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
            Previous Week Performance
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          {windows.previousWeekly?.startDate} - {windows.previousWeekly?.endDate}
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
