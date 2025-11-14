import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Droplet, Activity } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  wash: '#3b82f6',
  dry: '#f59e0b',
  gray: '#6b7280'
};

const WashVsDryChart = ({ washVsDry }) => {
  if (!washVsDry) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading wash vs dry comparison...
      </div>
    );
  }

  const { wash, dry, total } = washVsDry;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Data for charts
  const servicesData = [
    { name: 'Lavagens', value: wash.services, color: COLORS.wash },
    { name: 'Secagens', value: dry.services, color: COLORS.dry }
  ];

  const revenueData = [
    { name: 'Lavagens', value: wash.revenue, color: COLORS.wash },
    { name: 'Secagens', value: dry.revenue, color: COLORS.dry }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '0.75rem',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: COLORS.primary }}>
            {label}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', color: COLORS.gray }}>
            {payload[0].value.toLocaleString('pt-BR')}
          </p>
        </div>
      );
    }
    return null;
  };

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
          <Activity style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Lavagem vs Secagem
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Comparação de serviços e receita (Semana Atual)
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Wash Stats */}
        <div style={{
          padding: '1rem',
          background: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Droplet style={{ width: '16px', height: '16px', color: COLORS.wash }} />
            <h4 style={{ 
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.wash,
              margin: 0
            }}>
              Lavagens
            </h4>
          </div>
          <div style={{ 
            fontSize: '24px',
            fontWeight: '700',
            color: COLORS.wash,
            marginBottom: '0.25rem'
          }}>
            {wash.services}
          </div>
          <div style={{ 
            fontSize: '12px',
            color: COLORS.gray,
            marginBottom: '0.5rem'
          }}>
            {wash.percentOfServices.toFixed(1)}% dos serviços
          </div>
          <div style={{ 
            fontSize: '14px',
            fontWeight: '600',
            color: COLORS.primary
          }}>
            {formatCurrency(wash.revenue)}
          </div>
          <div style={{ 
            fontSize: '11px',
            color: COLORS.gray
          }}>
            {formatCurrency(wash.avgPerService)}/serviço
          </div>
        </div>

        {/* Dry Stats */}
        <div style={{
          padding: '1rem',
          background: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fef3c7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Activity style={{ width: '16px', height: '16px', color: COLORS.dry }} />
            <h4 style={{ 
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.dry,
              margin: 0
            }}>
              Secagens
            </h4>
          </div>
          <div style={{ 
            fontSize: '24px',
            fontWeight: '700',
            color: COLORS.dry,
            marginBottom: '0.25rem'
          }}>
            {dry.services}
          </div>
          <div style={{ 
            fontSize: '12px',
            color: COLORS.gray,
            marginBottom: '0.5rem'
          }}>
            {dry.percentOfServices.toFixed(1)}% dos serviços
          </div>
          <div style={{ 
            fontSize: '14px',
            fontWeight: '600',
            color: COLORS.primary
          }}>
            {formatCurrency(dry.revenue)}
          </div>
          <div style={{ 
            fontSize: '11px',
            color: COLORS.gray
          }}>
            {formatCurrency(dry.avgPerService)}/serviço
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem'
      }}>
        {/* Services Chart */}
        <div>
          <h5 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            letterSpacing: '0.5px'
          }}>
            Volume de Serviços
          </h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={servicesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: COLORS.gray }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: COLORS.gray }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {servicesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div>
          <h5 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            letterSpacing: '0.5px'
          }}>
            Receita Gerada
          </h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: COLORS.gray }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: COLORS.gray }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray
      }}>
        💡 <strong>Análise:</strong> {wash.avgPerService > dry.avgPerService 
          ? 'Lavagens geram mais receita por serviço'
          : 'Secagens geram mais receita por serviço'}. Considere ajustar estratégia de pricing.
      </div>
    </div>
  );
};

export default WashVsDryChart;
