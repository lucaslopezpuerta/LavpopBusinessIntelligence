import React, { useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Droplet, Activity } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280',
  wash: '#3b82f6',
  dry: '#f59e0b'
};

const DayOfWeekChart = ({ dayPatterns, period = 'currentWeek', onPeriodChange }) => {
  useEffect(() => {
    console.log('📊 DayOfWeekChart received period:', period, 'days:', dayPatterns?.length);
  }, [period, dayPatterns]);

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

  const periodLabels = {
    currentWeek: 'Semana Atual',
    fourWeeks: 'Últimas 4 Semanas',
    allTime: 'Todo Período'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getColor = (utilization) => {
    if (utilization >= 60) return COLORS.accent;
    if (utilization >= 40) return COLORS.primary;
    if (utilization >= 25) return COLORS.amber;
    return COLORS.red;
  };

  // Prepare data for dual-axis chart
  const chartData = dayPatterns.map(day => ({
    name: day.dayShort,
    revenue: day.avgRevenue,
    utilization: day.totalUtilization,
    wash: day.avgWash,
    dry: day.avgDry,
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
            <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Droplet style={{ width: '12px', height: '12px', color: COLORS.wash }} />
              <strong>{data.wash.toFixed(1)} lavagens</strong>
            </div>
            <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity style={{ width: '12px', height: '12px', color: COLORS.dry }} />
              <strong>{data.dry.toFixed(1)} secagens</strong>
            </div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Receita:</strong> {formatCurrency(data.revenue)}
            </div>
            <div>
              <strong>Utilização:</strong> {data.utilization.toFixed(1)}%
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
      {/* Header with Date Filter */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
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
            Padrão de utilização semanal - {periodLabels[period]}
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.gray,
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Período
          </label>
          <select
            value={period}
            onChange={(e) => {
              const newPeriod = e.target.value;
              console.log('📅 DayOfWeekChart: Period changed to:', newPeriod);
              onPeriodChange && onPeriodChange(newPeriod);
            }}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              fontSize: '13px',
              fontWeight: '500',
              color: COLORS.primary,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="currentWeek">Semana Atual</option>
            <option value="fourWeeks">Últimas 4 Semanas</option>
            <option value="allTime">Todo Período</option>
          </select>
        </div>
      </div>

      {/* Dual-Axis Chart: Revenue (bars) + Utilization (line) */}
      <div style={{ marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: COLORS.gray, fontWeight: 600 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            {/* Left Y-Axis: Revenue */}
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: COLORS.gray }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              label={{ 
                value: 'Receita (R$)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 11, fill: COLORS.gray }
              }}
            />
            {/* Right Y-Axis: Utilization */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: COLORS.gray }}
              axisLine={{ stroke: '#e5e7eb' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              label={{ 
                value: 'Utilização (%)', 
                angle: 90, 
                position: 'insideRight',
                style: { fontSize: 11, fill: COLORS.gray }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              name="Receita"
              fill={COLORS.primary}
              radius={[8, 8, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="utilization" 
              name="Utilização (%)"
              stroke={COLORS.accent}
              strokeWidth={3}
              dot={{ r: 5, fill: COLORS.accent }}
            />
          </ComposedChart>
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
            marginBottom: '0.5rem'
          }}>
            {bestDay.dayName}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.gray, lineHeight: '1.6' }}>
            <div>{bestDay.totalUtilization.toFixed(1)}% utilização</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Droplet style={{ width: '12px', height: '12px', color: COLORS.wash }} />
              {bestDay.avgWash.toFixed(1)} lavagens
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity style={{ width: '12px', height: '12px', color: COLORS.dry }} />
              {bestDay.avgDry.toFixed(1)} secagens
            </div>
            <div style={{ fontWeight: '600', color: COLORS.primary, marginTop: '0.25rem' }}>
              {formatCurrency(bestDay.avgRevenue)}
            </div>
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
            marginBottom: '0.5rem'
          }}>
            {worstDay.dayName}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.gray, lineHeight: '1.6' }}>
            <div>{worstDay.totalUtilization.toFixed(1)}% utilização</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Droplet style={{ width: '12px', height: '12px', color: COLORS.wash }} />
              {worstDay.avgWash.toFixed(1)} lavagens
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity style={{ width: '12px', height: '12px', color: COLORS.dry }} />
              {worstDay.avgDry.toFixed(1)} secagens
            </div>
            <div style={{ fontWeight: '600', color: COLORS.primary, marginTop: '0.25rem' }}>
              {formatCurrency(worstDay.avgRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Service Recommendation */}
      <div style={{
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray
      }}>
        💡 <strong>Recomendação:</strong> Em {bestDay.dayName}, verifique máquinas antes do pico. 
        Em {worstDay.dayName}, agende manutenção preventiva ou oferece promoções para aumentar fluxo.
      </div>
    </div>
  );
};

export default DayOfWeekChart;
