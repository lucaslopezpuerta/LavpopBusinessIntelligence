import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280'
};

const DayOfWeekChart = ({ dayPatterns }) => {
  if (!dayPatterns || dayPatterns.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading day of week patterns...
      </div>
    );
  }

  const getColor = (utilization) => {
    if (utilization >= 60) return COLORS.accent; // Excellent
    if (utilization >= 40) return COLORS.primary; // Good
    if (utilization >= 25) return COLORS.amber; // Fair
    return COLORS.red; // Low
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const chartData = dayPatterns.map(day => ({
    name: day.dayShort,
    utilization: day.totalUtilization,
    services: day.avgTotal,
    revenue: day.avgRevenue,
    color: getColor(day.totalUtilization)
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dayData = dayPatterns.find(d => d.dayShort === data.name);
      
      return (
        <div style={{
          background: 'white',
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          minWidth: '200px'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: '600', 
            color: COLORS.primary,
            marginBottom: '0.5rem'
          }}>
            {dayData.dayName}
          </p>
          <div style={{ fontSize: '12px', color: COLORS.gray }}>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Utilização:</strong> {data.utilization.toFixed(1)}%
            </div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Serviços:</strong> {data.services.toFixed(1)}/dia
            </div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Receita:</strong> {formatCurrency(data.revenue)}
            </div>
            <div>
              <strong>Transações:</strong> {dayData.avgTransactions.toFixed(1)}/dia
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Find best and worst days
  const sortedDays = [...dayPatterns].sort((a, b) => b.totalUtilization - a.totalUtilization);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Calendar style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Utilização por Dia da Semana
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Padrão de utilização semanal (Semana Atual)
        </p>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: COLORS.gray, fontWeight: 600 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: COLORS.gray }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ 
                value: 'Utilização (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 11, fill: COLORS.gray }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {/* Best Day */}
        <div style={{
          padding: '1rem',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #dcfce7'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            letterSpacing: '0.5px'
          }}>
            Melhor Dia
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: COLORS.accent,
            marginBottom: '0.25rem'
          }}>
            {bestDay.dayName}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.gray }}>
            <div>{bestDay.totalUtilization.toFixed(1)}% utilização</div>
            <div>{bestDay.avgTotal.toFixed(1)} serviços</div>
            <div>{formatCurrency(bestDay.avgRevenue)}</div>
          </div>
        </div>

        {/* Worst Day */}
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fee2e2'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            letterSpacing: '0.5px'
          }}>
            Menor Movimento
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: COLORS.red,
            marginBottom: '0.25rem'
          }}>
            {worstDay.dayName}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.gray }}>
            <div>{worstDay.totalUtilization.toFixed(1)}% utilização</div>
            <div>{worstDay.avgTotal.toFixed(1)} serviços</div>
            <div>{formatCurrency(worstDay.avgRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Staffing Recommendation */}
      <div style={{
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray
      }}>
        💡 <strong>Recomendação de Escala:</strong> Priorize equipe completa em{' '}
        {sortedDays.slice(0, 3).map(d => d.dayName).join(', ')}. 
        Considere horário reduzido em {worstDay.dayName}.
      </div>
    </div>
  );
};

export default DayOfWeekChart;
