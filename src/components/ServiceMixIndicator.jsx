import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  wash: '#3b82f6',
  dry: '#f59e0b',
  gray: '#6b7280'
};

/**
 * Count machines from transaction string
 */
function countMachines(str) {
  if (!str) return { wash: 0, dry: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry };
}

const ServiceMixIndicator = ({ businessMetrics }) => {
  const serviceMixData = useMemo(() => {
    if (!businessMetrics || !businessMetrics.weekly) return null;

    const { washServices, dryServices } = businessMetrics.weekly;
    const total = washServices + dryServices;

    if (total === 0) return null;

    const washPercent = (washServices / total) * 100;
    const dryPercent = (dryServices / total) * 100;

    return {
      data: [
        { name: 'Wash', value: washServices, percent: washPercent },
        { name: 'Dry', value: dryServices, percent: dryPercent }
      ],
      washServices,
      dryServices,
      total,
      washPercent,
      dryPercent
    };
  }, [businessMetrics]);

  if (!serviceMixData) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading service mix data...
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ 
            margin: '0 0 4px 0',
            fontWeight: '600',
            color: COLORS.primary,
            fontSize: '13px'
          }}>
            {data.name} Services
          </p>
          <p style={{ 
            margin: 0,
            fontSize: '14px',
            color: COLORS.gray
          }}>
            {data.value.toLocaleString('pt-BR')} services ({data.percent.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const pieColors = [COLORS.wash, COLORS.dry];

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
          <Activity style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Service Mix
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Wash vs Dry service distribution
        </p>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          padding: '0.75rem',
          background: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            WASH SERVICES
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.wash }}>
              {serviceMixData.washServices}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.wash }}>
              ({serviceMixData.washPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
        <div style={{
          padding: '0.75rem',
          background: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fef3c7'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            DRY SERVICES
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.dry }}>
              {serviceMixData.dryServices}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.dry }}>
              ({serviceMixData.dryPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={serviceMixData.data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {serviceMixData.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Balance Indicator */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '11px',
          color: COLORS.gray,
          marginBottom: '0.5rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          SERVICE BALANCE
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: COLORS.primary
        }}>
          {Math.abs(serviceMixData.washPercent - 50).toFixed(1)}% {serviceMixData.washPercent > 50 ? 'wash-heavy' : 'dry-heavy'}
        </div>
      </div>
    </div>
  );
};

export default ServiceMixIndicator;
