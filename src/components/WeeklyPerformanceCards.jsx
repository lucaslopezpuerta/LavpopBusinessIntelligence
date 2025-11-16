// WeeklyPerformanceCards.jsx v1.0
// Replaces WeeklyPerformanceSummary with card-style layout
// Shows previous week metrics in Quick Actions style

import React from 'react';
import { DollarSign, Activity, TrendingUp, Gauge } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

const WeeklyPerformanceCards = ({ businessMetrics }) => {
  if (!businessMetrics) return null;

  const { previousWeek = {}, weekOverWeek = {} } = businessMetrics;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) return COLORS.gray;
    if (value > 0) return COLORS.accent;
    if (value < 0) return '#dc2626';
    return COLORS.gray;
  };

  const metrics = [
    {
      id: 'revenue',
      label: 'Receita',
      value: formatCurrency(previousWeek.netRevenue),
      change: weekOverWeek.netRevenue,
      icon: DollarSign,
      color: COLORS.primary,
      bgColor: '#e3f2fd'
    },
    {
      id: 'transactions',
      label: 'Transações',
      value: formatNumber(previousWeek.totalTransactions),
      change: weekOverWeek.transactions,
      icon: Activity,
      color: COLORS.primary,
      bgColor: '#e3f2fd'
    },
    {
      id: 'services',
      label: 'Serviços',
      value: formatNumber(previousWeek.totalServices),
      change: weekOverWeek.totalServices,
      icon: TrendingUp,
      color: COLORS.accent,
      bgColor: '#dcfce7'
    },
    {
      id: 'utilization',
      label: 'Utilização',
      value: `${Math.round(previousWeek.totalUtilization || 0)}%`,
      change: weekOverWeek.utilization,
      icon: Gauge,
      color: '#f59e0b',
      bgColor: '#fef3c7'
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
        <h3 style={{ 
          fontSize: '16px',
          fontWeight: '700',
          color: COLORS.primary,
          margin: 0,
          marginBottom: '0.25rem'
        }}>
          Desempenho Semana Anterior
        </h3>
        <p style={{
          fontSize: '13px',
          color: COLORS.gray,
          margin: 0
        }}>
          {previousWeek.startDate && previousWeek.endDate && 
            `${previousWeek.startDate} - ${previousWeek.endDate}`}
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const changeColor = getChangeColor(metric.change);
          
          return (
            <div
              key={metric.id}
              style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = metric.bgColor;
                e.currentTarget.style.borderColor = metric.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon and Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: metric.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon style={{ width: '18px', height: '18px', color: metric.color }} />
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.gray,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  {metric.label}
                </div>
              </div>

              {/* Value */}
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: COLORS.primary,
                lineHeight: '1'
              }}>
                {metric.value}
              </div>

              {/* Change */}
              {metric.change !== null && metric.change !== undefined && !isNaN(metric.change) && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: changeColor
                }}>
                  {formatPercent(metric.change)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPerformanceCards;
