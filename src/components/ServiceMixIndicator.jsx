// ServiceMixIndicator_v2.0.jsx
// ✅ Now uses Lavpop brand colors (#10306B blue, #53be33 green)
// ✅ Service Balance calculation verified: |washPercent - 50| = deviation from 50/50

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = {
  primary: '#10306B',    // Lavpop Blue (for Wash)
  accent: '#53be33',     // Lavpop Green (for Dry)
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

  // Use brand colors for pie chart
  const pieColors = [COLORS.primary, COLORS.accent];

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

      {/* Stats Row - Using Brand Colors */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        {/* Wash Services - Primary Blue */}
        <div style={{
          padding: '0.75rem',
          background: `${COLORS.primary}10`,  // 10% opacity of primary
          borderRadius: '8px',
          border: `1px solid ${COLORS.primary}30`  // 30% opacity of primary
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            WASH SERVICES
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>
              {serviceMixData.washServices}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
              ({serviceMixData.washPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
        
        {/* Dry Services - Accent Green */}
        <div style={{
          padding: '0.75rem',
          background: `${COLORS.accent}10`,  // 10% opacity of accent
          borderRadius: '8px',
          border: `1px solid ${COLORS.accent}30`  // 30% opacity of accent
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            DRY SERVICES
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.accent }}>
              {serviceMixData.dryServices}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.accent }}>
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
      {/* Math: |washPercent - 50| shows deviation from perfect 50/50 balance */}
      {/* Example: 55.8% wash → |55.8 - 50| = 5.8% wash-heavy ✅ */}
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
          color: serviceMixData.washPercent > 50 ? COLORS.primary : COLORS.accent
        }}>
          {Math.abs(serviceMixData.washPercent - 50).toFixed(1)}% {serviceMixData.washPercent > 50 ? 'wash-heavy' : 'dry-heavy'}
        </div>
      </div>
    </div>
  );
};

export default ServiceMixIndicator;
