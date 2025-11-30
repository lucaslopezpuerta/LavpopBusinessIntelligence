// RevenueTrendChart_v2.1.jsx
// ✅ Replaced "Previous Period" and "Last Year" with daily wash/dry cycle counts
// Shows: Gross Revenue, Net Revenue, Wash Cycles, Dry Cycles
//
// CHANGELOG:
// v2.1 (2025-11-30): Chart memoization for performance
//   - Memoized CustomTooltip component to prevent unnecessary repaints
// v2.0: Previous implementation

import React, { useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280',
  lightGray: '#d1d5db',
  amber: '#f59f0bff'
};

/**
 * Parse Brazilian number format
 */
function parseBrNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const str = String(value).trim();
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

/**
 * Count machines from string like "Lavadora 1, Secadora 2"
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

const RevenueTrendChart = ({ salesData }) => {
  const chartData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const CASHBACK_RATE = 0.075;
    const CASHBACK_START = new Date(2024, 5, 1); // June 1, 2024

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parse all sales data
    const records = salesData.map(row => {
      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date) return null;

      let grossValue = parseBrNumber(row.Valor_Venda || row.gross_value || 0);
      let netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);

      // Apply cashback
      if (date >= CASHBACK_START) {
        const cashback = grossValue * CASHBACK_RATE;
        netValue = netValue - cashback;
      }

      // Count machines
      const machineInfo = countMachines(row.Maquina || row.machine || row.Maquinas || '');

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      return {
        date,
        dateStr,
        grossValue,
        netValue,
        washCycles: machineInfo.wash,
        dryCycles: machineInfo.dry
      };
    }).filter(r => r !== null);

    // Group by date for last 30 days
    const dailyMap = {};
    records.forEach(r => {
      if (r.date >= thirtyDaysAgo && r.date <= now) {
        if (!dailyMap[r.dateStr]) {
          dailyMap[r.dateStr] = {
            date: r.dateStr,
            grossRevenue: 0,
            netRevenue: 0,
            washCycles: 0,
            dryCycles: 0,
            count: 0
          };
        }
        dailyMap[r.dateStr].grossRevenue += r.grossValue;
        dailyMap[r.dateStr].netRevenue += r.netValue;
        dailyMap[r.dateStr].washCycles += r.washCycles;
        dailyMap[r.dateStr].dryCycles += r.dryCycles;
        dailyMap[r.dateStr].count++;
      }
    });

    // Create array of last 30 days
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Format for display (DD/MM)
      const displayDate = `${day}/${month}`;

      const dayData = dailyMap[dateStr] || {
        grossRevenue: 0,
        netRevenue: 0,
        washCycles: 0,
        dryCycles: 0
      };

      dailyData.push({
        date: displayDate,
        grossRevenue: Math.round(dayData.grossRevenue * 100) / 100,
        netRevenue: Math.round(dayData.netRevenue * 100) / 100,
        washCycles: dayData.washCycles,
        dryCycles: dayData.dryCycles
      });
    }

    return dailyData;
  }, [salesData]);

  // Memoize CustomTooltip to prevent recreation on every render
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontWeight: '600',
            color: COLORS.primary,
            fontSize: '13px'
          }}>
            {label}
          </p>
          {payload.map((entry, index) => {
            const isRevenue = entry.dataKey.includes('Revenue');
            const formattedValue = isRevenue
              ? formatCurrency(entry.value)
              : `${entry.value} cycles`;

            return (
              <p key={index} style={{
                margin: '4px 0',
                fontSize: '12px',
                color: entry.color,
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <span style={{ fontWeight: '600' }}>{entry.name}:</span>
                <span>{formattedValue}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  }, []);

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
          <TrendingUp style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Revenue Trend (Last 30 Days)
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Daily revenue and machine utilization
        </p>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: COLORS.gray }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: COLORS.gray }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: COLORS.gray }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{ value: 'Cycles', angle: -90, position: 'insideRight', style: { fontSize: 11, fill: COLORS.gray } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: '12px',
                paddingTop: '10px'
              }}
            />
            
            {/* Revenue Lines */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="grossRevenue" 
              stroke={COLORS.lightGray}
              strokeWidth={2}
              name="Gross Revenue"
              dot={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="netRevenue" 
              stroke={COLORS.accent}
              strokeWidth={2}
              name="Net Revenue"
              dot={false}
            />
            
            {/* Machine Cycle Lines */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="washCycles" 
              stroke={COLORS.primary}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Wash Cycles"
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="dryCycles" 
              stroke={COLORS.amber}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Dry Cycles"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.gray,
          fontSize: '14px'
        }}>
          No data available for the last 30 days
        </div>
      )}
    </div>
  );
};

export default RevenueTrendChart;
