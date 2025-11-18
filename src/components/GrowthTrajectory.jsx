// Growth Trajectory Component v1.0
// Hero section showing 12-month revenue trend with forecast
// Story-telling design with gradient background
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { 
  aggregateByMonth, 
  forecastRevenue, 
  calculateAverageGrowth,
  identifyPeakMonths,
  calculateMoMGrowth
} from '../utils/analyticsCalculations';
import { formatCurrency } from '../utils/numberUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280',
  red: '#dc2626',
  blue: '#3b82f6',
  lightBlue: '#60a5fa',
  green: '#10b981'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0].payload;
  
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
      <div style={{ 
        fontSize: '14px', 
        color: data.isForecast ? COLORS.blue : COLORS.primary,
        fontWeight: '600'
      }}>
        {formatCurrency(data.revenue)}
        {data.isForecast && <span style={{ fontSize: '11px', marginLeft: '0.25rem' }}>(projeção)</span>}
      </div>
      {data.momGrowth !== null && data.momGrowth !== undefined && !data.isForecast && (
        <div style={{ 
          fontSize: '12px', 
          color: data.momGrowth > 0 ? COLORS.green : COLORS.red,
          marginTop: '0.25rem'
        }}>
          {data.momGrowth > 0 ? '+' : ''}{data.momGrowth.toFixed(1)}% MoM
        </div>
      )}
    </div>
  );
};

const GrowthTrajectory = ({ salesData }) => {
  // Calculate monthly data with forecast
  const { monthlyData, forecasts, stats } = useMemo(() => {
    if (!salesData) return { monthlyData: [], forecasts: [], stats: null };
    
    const monthly = aggregateByMonth(salesData);
    const monthlyWithGrowth = calculateMoMGrowth(monthly);
    
    // Get last 12 months
    const last12Months = monthlyWithGrowth.slice(-12);
    
    const forecasts = forecastRevenue(monthly);
    const avgGrowth = calculateAverageGrowth(monthly, 6);
    const peaks = identifyPeakMonths(monthly);
    
    // Calculate total revenue
    const totalRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
    
    // Trend direction
    const recentAvg = last12Months.slice(-3).reduce((sum, m) => sum + m.revenue, 0) / 3;
    const olderAvg = last12Months.slice(0, 3).reduce((sum, m) => sum + m.revenue, 0) / 3;
    const trendDirection = recentAvg > olderAvg * 1.1 ? 'increasing' : 
                          recentAvg < olderAvg * 0.9 ? 'decreasing' : 'stable';
    
    return {
      monthlyData: last12Months,
      forecasts,
      stats: {
        avgGrowth,
        bestMonth: peaks.best,
        trendDirection,
        totalRevenue
      }
    };
  }, [salesData]);
  
  // Combine historical and forecast data
  const chartData = [...monthlyData, ...forecasts];
  
  if (!stats) return <div>Carregando trajetória de crescimento...</div>;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a5a8e 0%, #2e7ab8 100%)',
      borderRadius: '16px',
      padding: '2rem',
      color: 'white',
      boxShadow: '0 10px 30px rgba(26, 90, 142, 0.3)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Trajetória de Crescimento
            </h2>
            <p style={{
              fontSize: '14px',
              opacity: 0.9,
              margin: 0
            }}>
              Últimos 12 meses + projeção de 3 meses
            </p>
          </div>
          
          {/* Trend indicator */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {stats.trendDirection === 'increasing' ? (
              <TrendingUp size={24} />
            ) : stats.trendDirection === 'decreasing' ? (
              <TrendingDown size={24} />
            ) : (
              <div style={{ width: '24px', height: '2px', background: 'white' }} />
            )}
            <div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase' }}>
                Tendência
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {stats.trendDirection === 'increasing' ? 'Crescimento' :
                 stats.trendDirection === 'decreasing' ? 'Declínio' : 'Estável'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Key stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            padding: '1rem',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '0.5rem' }}>
              CRESCIMENTO MÉDIO (6M)
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              {stats.avgGrowth !== null ? `${stats.avgGrowth > 0 ? '+' : ''}${stats.avgGrowth}%` : 'N/A'}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            padding: '1rem',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '0.5rem' }}>
              MELHOR MÊS
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>
              {stats.bestMonth.label}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '0.25rem' }}>
              {formatCurrency(stats.bestMonth.revenue)}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            padding: '1rem',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '0.5rem' }}>
              PRÓXIMA PROJEÇÃO
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>
              {forecasts.length > 0 ? forecasts[0].label : 'N/A'}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '0.25rem' }}>
              {forecasts.length > 0 ? formatCurrency(forecasts[0].revenue) : ''}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Chart */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.8)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgba(255,255,255,0.8)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.8)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$${value}`}
              tick={{ fill: 'rgba(255,255,255,0.8)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#ffffff"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.isForecast ? 4 : 5}
                    fill={payload.isForecast ? COLORS.lightBlue : '#ffffff'}
                    stroke={payload.isForecast ? COLORS.lightBlue : '#ffffff'}
                    strokeWidth={2}
                    style={{ filter: payload.isForecast ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                  />
                );
              }}
              activeDot={{ r: 7, fill: '#ffffff', stroke: 'none' }}
              strokeDasharray={(props) => props.isForecast ? '5 5' : '0'}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          fontSize: '11px',
          textAlign: 'center',
          opacity: 0.8
        }}>
          Linha sólida: histórico real • Linha tracejada: projeção baseada em tendência dos últimos 6 meses
        </div>
      </div>
    </div>
  );
};

export default GrowthTrajectory;
