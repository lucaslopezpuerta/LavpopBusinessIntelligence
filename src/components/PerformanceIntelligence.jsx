// Performance Intelligence Component v1.0
// Interactive performance analysis with revenue, service, and utilization trends
// Features: Drill-down charts, growth indicators, AI insights
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles } from 'lucide-react';
import { 
  calculateRevenueTrend, 
  calculatePeriodComparison, 
  identifyPeakPeriods,
  calculateTrendDirection 
} from '../utils/analyticsMetrics';
import { formatCurrency } from '../utils/numberUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280',
  red: '#dc2626',
  blue: '#3b82f6',
  green: '#10b981'
};

// Custom tooltip for charts
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
            entry.name.includes('%') ? `${entry.value}%` :
            entry.value
          }
        </div>
      ))}
    </div>
  );
};

const PerformanceIntelligence = ({ salesData, startDate, endDate }) => {
  const [activeChart, setActiveChart] = useState('revenue'); // revenue, services, utilization
  
  // Calculate trend data
  const trendData = useMemo(() => {
    if (!salesData) return null;
    return calculateRevenueTrend(salesData, startDate, endDate);
  }, [salesData, startDate, endDate]);
  
  // Calculate period comparison
  const comparison = useMemo(() => {
    if (!salesData) return null;
    return calculatePeriodComparison(salesData, startDate, endDate);
  }, [salesData, startDate, endDate]);
  
  // Identify peaks
  const peaks = useMemo(() => {
    if (!trendData) return null;
    return identifyPeakPeriods(trendData.data);
  }, [trendData]);
  
  // Calculate trend direction
  const trendDirection = useMemo(() => {
    if (!trendData) return 'stable';
    return calculateTrendDirection(trendData.data);
  }, [trendData]);
  
  if (!trendData || !comparison) {
    return <div>Carregando análise de performance...</div>;
  }
  
  // Get growth icon
  const getGrowthIcon = (value) => {
    if (value > 5) return <TrendingUp size={18} style={{ color: COLORS.green }} />;
    if (value < -5) return <TrendingDown size={18} style={{ color: COLORS.red }} />;
    return <Minus size={18} style={{ color: COLORS.gray }} />;
  };
  
  // Generate AI insight
  const generateInsight = () => {
    const { current, growth } = comparison;
    const insights = [];
    
    // Revenue insight
    if (growth.revenue > 10) {
      insights.push(`Receita cresceu ${growth.revenue.toFixed(1)}% em relação ao período anterior`);
    } else if (growth.revenue < -10) {
      insights.push(`Receita caiu ${Math.abs(growth.revenue).toFixed(1)}% - atenção necessária`);
    }
    
    // Utilization insight
    if (current.utilization < 20) {
      insights.push(`Utilização de ${current.utilization.toFixed(1)}% indica oportunidade de crescimento`);
    } else if (current.utilization > 40) {
      insights.push(`Utilização de ${current.utilization.toFixed(1)}% está acima da média - excelente desempenho`);
    }
    
    // Trend insight
    if (trendDirection === 'increasing') {
      insights.push('Tendência de crescimento consistente identificada');
    } else if (trendDirection === 'decreasing') {
      insights.push('Tendência de declínio requer ação estratégica');
    }
    
    // Peak insight
    if (peaks && peaks.peak) {
      insights.push(`Melhor período: ${peaks.peak.label} com ${formatCurrency(peaks.peak.revenue)}`);
    }
    
    return insights;
  };
  
  const insights = generateInsight();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        {/* Revenue Card */}
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: COLORS.gray,
            marginBottom: '0.5rem'
          }}>
            RECEITA TOTAL
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: COLORS.primary,
            marginBottom: '0.5rem'
          }}>
            {formatCurrency(comparison.current.revenue)}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {getGrowthIcon(comparison.growth.revenue)}
            <span style={{ 
              color: comparison.growth.revenue > 0 ? COLORS.green : 
                     comparison.growth.revenue < 0 ? COLORS.red : COLORS.gray
            }}>
              {comparison.growth.revenue > 0 ? '+' : ''}{comparison.growth.revenue.toFixed(1)}% vs período anterior
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: COLORS.gray,
            marginTop: '0.5rem'
          }}>
            Média diária: {formatCurrency(comparison.current.avgDailyRevenue)}
          </div>
        </div>
        
        {/* Services Card */}
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: COLORS.gray,
            marginBottom: '0.5rem'
          }}>
            TOTAL DE CICLOS
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: COLORS.primary,
            marginBottom: '0.5rem'
          }}>
            {comparison.current.totalServices}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {getGrowthIcon(comparison.growth.services)}
            <span style={{ 
              color: comparison.growth.services > 0 ? COLORS.green : 
                     comparison.growth.services < 0 ? COLORS.red : COLORS.gray
            }}>
              {comparison.growth.services > 0 ? '+' : ''}{comparison.growth.services.toFixed(1)}% vs período anterior
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: COLORS.gray,
            marginTop: '0.5rem'
          }}>
            {comparison.current.washServices} lavagens • {comparison.current.dryServices} secagens
          </div>
        </div>
        
        {/* Utilization Card */}
        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: COLORS.gray,
            marginBottom: '0.5rem'
          }}>
            UTILIZAÇÃO MÉDIA
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: COLORS.primary,
            marginBottom: '0.5rem'
          }}>
            {comparison.current.utilization.toFixed(1)}%
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {getGrowthIcon(comparison.growth.utilization)}
            <span style={{ 
              color: comparison.growth.utilization > 0 ? COLORS.green : 
                     comparison.growth.utilization < 0 ? COLORS.red : COLORS.gray
            }}>
              {comparison.growth.utilization > 0 ? '+' : ''}{comparison.growth.utilization.toFixed(1)}% vs período anterior
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: COLORS.gray,
            marginTop: '0.5rem'
          }}>
            {trendDirection === 'increasing' ? '📈 Tendência crescente' :
             trendDirection === 'decreasing' ? '📉 Tendência decrescente' :
             '➡️ Tendência estável'}
          </div>
        </div>
      </div>
      
      {/* AI Insights Box */}
      {insights.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a5a8e 0%, #2e7ab8 100%)',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={20} />
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Insights Inteligentes
            </span>
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1.5rem',
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            {insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Chart Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem',
        background: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #e5e7eb'
      }}>
        {[
          { id: 'revenue', label: 'Receita' },
          { id: 'services', label: 'Ciclos' },
          { id: 'utilization', label: 'Utilização' }
        ].map(chart => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id)}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              borderRadius: '7px',
              border: 'none',
              background: activeChart === chart.id ? 'white' : 'transparent',
              color: activeChart === chart.id ? COLORS.primary : COLORS.gray,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeChart === chart.id ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            {chart.label}
          </button>
        ))}
      </div>
      
      {/* Interactive Chart */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: COLORS.primary,
          marginBottom: '1rem'
        }}>
          {activeChart === 'revenue' ? 'Tendência de Receita' :
           activeChart === 'services' ? 'Tendência de Ciclos' :
           'Tendência de Utilização'}
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          {activeChart === 'utilization' ? (
            <LineChart data={trendData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                stroke={COLORS.gray}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={COLORS.gray}
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke={COLORS.accent}
                strokeWidth={3}
                dot={{ fill: COLORS.accent, r: 4 }}
                activeDot={{ r: 6 }}
                name="Utilização (%)"
              />
            </LineChart>
          ) : (
            <BarChart data={trendData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                stroke={COLORS.gray}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={COLORS.gray}
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => 
                  activeChart === 'revenue' ? `R$${value}` : value
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={activeChart === 'revenue' ? 'revenue' : 'totalServices'}
                fill={COLORS.primary}
                radius={[8, 8, 0, 0]}
                name={activeChart === 'revenue' ? 'Receita (R$)' : 'Total de Ciclos'}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
        
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '12px',
          color: COLORS.gray,
          textAlign: 'center'
        }}>
          Granularidade: {
            trendData.granularity === 'day' ? 'Diária' :
            trendData.granularity === 'week' ? 'Semanal' :
            'Mensal'
          } • Clique em um período para mais detalhes
        </div>
      </div>
    </div>
  );
};

export default PerformanceIntelligence;
