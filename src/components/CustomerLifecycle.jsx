// Customer Lifecycle Component v1.0 (Simplified)
// Shows customer trends and health metrics over time
// Will be enhanced with full acquisition/retention data in future
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial simplified implementation

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { aggregateByMonth } from '../utils/analyticsCalculations';
import { formatCurrency } from '../utils/numberUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280',
  green: '#10b981',
  blue: '#3b82f6'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div style={{
      background: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        fontSize: '12px', 
        fontWeight: '600', 
        color: COLORS.gray,
        marginBottom: '0.5rem'
      }}>
        {label}
      </div>
      {payload.map((entry, index) => (
        <div key={index} style={{ 
          fontSize: '13px', 
          color: entry.color,
          fontWeight: '500',
          marginTop: '0.25rem'
        }}>
          {entry.name}: {
            entry.name.includes('R$') ? formatCurrency(entry.value) :
            entry.value
          }
        </div>
      ))}
    </div>
  );
};

const CustomerLifecycle = ({ salesData, customerData }) => {
  const { monthlyMetrics, totalCustomers, insights } = useMemo(() => {
    if (!salesData) return { monthlyMetrics: [], totalCustomers: 0, insights: [] };
    
    const monthlyData = aggregateByMonth(salesData);
    
    // Get last 12 months
    const last12Months = monthlyData.slice(-12);
    
    // Calculate average revenue per service (proxy for customer value)
    const monthlyMetrics = last12Months.map(month => ({
      label: month.label,
      services: month.services,
      revenuePerService: month.services > 0 ? 
        Math.round((month.revenue / month.services) * 100) / 100 : 0
    }));
    
    // Calculate insights
    const insights = [];
    
    // Average services trend
    const avgServices = last12Months.reduce((sum, m) => sum + m.services, 0) / last12Months.length;
    const recentAvgServices = last12Months.slice(-3).reduce((sum, m) => sum + m.services, 0) / 3;
    
    if (recentAvgServices > avgServices * 1.1) {
      insights.push({
        icon: '📈',
        text: `Volume de serviços crescendo - média recente ${recentAvgServices.toFixed(0)} vs ${avgServices.toFixed(0)} geral`
      });
    }
    
    // Revenue per service trend
    const avgRevenuePerService = last12Months.reduce((sum, m) => 
      sum + (m.services > 0 ? m.revenue / m.services : 0), 0) / last12Months.length;
    
    insights.push({
      icon: '💰',
      text: `Ticket médio por serviço: ${formatCurrency(avgRevenuePerService)}`
    });
    
    // Total customers (if available)
    const totalCustomers = customerData ? customerData.length : 0;
    
    return { monthlyMetrics, totalCustomers, insights };
  }, [salesData, customerData]);
  
  if (monthlyMetrics.length === 0) return <div>Carregando dados de clientes...</div>;
  
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <Users size={20} style={{ color: COLORS.primary }} />
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.primary,
            margin: 0
          }}>
            Evolução de Clientes
          </h3>
        </div>
        <p style={{
          fontSize: '14px',
          color: COLORS.gray,
          margin: 0
        }}>
          Análise de volume e valor por cliente ao longo do tempo
        </p>
      </div>
      
      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {totalCustomers > 0 && (
          <div style={{
            background: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: COLORS.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem'
            }}>
              TOTAL DE CLIENTES
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: COLORS.primary
            }}>
              {totalCustomers.toLocaleString('pt-BR')}
            </div>
          </div>
        )}
        
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem'
          }}>
            SERVIÇOS/MÊS (MÉDIA)
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: COLORS.accent
          }}>
            {Math.round(monthlyMetrics.reduce((sum, m) => sum + m.services, 0) / monthlyMetrics.length)}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem'
          }}>
            TICKET MÉDIO
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: COLORS.blue
          }}>
            {formatCurrency(monthlyMetrics.reduce((sum, m) => sum + m.revenuePerService, 0) / monthlyMetrics.length)}
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          color: COLORS.primary,
          marginBottom: '1rem'
        }}>
          Volume de Serviços por Mês
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              stroke={COLORS.gray}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke={COLORS.gray}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="services" 
              stroke={COLORS.accent}
              strokeWidth={3}
              dot={{ fill: COLORS.accent, r: 5 }}
              activeDot={{ r: 7 }}
              name="Serviços"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {insights.map((insight, index) => (
          <div
            key={index}
            style={{
              padding: '1rem 1.25rem',
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <div style={{ fontSize: '20px', lineHeight: 1 }}>
              {insight.icon}
            </div>
            <div style={{
              fontSize: '13px',
              color: COLORS.gray,
              lineHeight: '1.6'
            }}>
              {insight.text}
            </div>
          </div>
        ))}
      </div>
      
      {/* Future enhancement note */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        borderRadius: '10px',
        border: '1px solid #bbf7d0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <TrendingUp size={20} style={{ color: COLORS.accent, flexShrink: 0, marginTop: '0.125rem' }} />
        <div>
          <div style={{
            fontSize: '13px',
            fontWeight: '700',
            color: COLORS.accent,
            marginBottom: '0.25rem'
          }}>
            Em Desenvolvimento
          </div>
          <p style={{
            fontSize: '12px',
            color: COLORS.gray,
            margin: 0,
            lineHeight: '1.5'
          }}>
            Em breve: taxa de aquisição, retenção, churn rate, análise de coortes e lifetime value detalhado
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLifecycle;
