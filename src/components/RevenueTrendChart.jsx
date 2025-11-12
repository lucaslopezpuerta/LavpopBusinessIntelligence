import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280',
  lightGray: '#d1d5db'
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

const RevenueTrendChart = ({ salesData }) => {
  const chartData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const CASHBACK_RATE = 0.075;
    const CASHBACK_START = new Date(2024, 5, 1); // June 1, 2024

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

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

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      return {
        date,
        dateStr,
        grossValue,
        netValue
      };
    }).filter(r => r !== null);

    // Group by date for current period (last 30 days)
    const dailyMapCurrent = {};
    records.forEach(r => {
      if (r.date >= thirtyDaysAgo && r.date <= now) {
        if (!dailyMapCurrent[r.dateStr]) {
          dailyMapCurrent[r.dateStr] = {
            date: r.dateStr,
            grossRevenue: 0,
            netRevenue: 0,
            count: 0
          };
        }
        dailyMapCurrent[r.dateStr].grossRevenue += r.grossValue;
        dailyMapCurrent[r.dateStr].netRevenue += r.netValue;
        dailyMapCurrent[r.dateStr].count++;
      }
    });

    // Group for previous period (31-60 days ago)
    const dailyMapPrevious = {};
    records.forEach(r => {
      if (r.date >= sixtyDaysAgo && r.date < thirtyDaysAgo) {
        if (!dailyMapPrevious[r.dateStr]) {
          dailyMapPrevious[r.dateStr] = {
            netRevenue: 0
          };
        }
        dailyMapPrevious[r.dateStr].netRevenue += r.netValue;
      }
    });

    // Group for same period last year
    const dailyMapLastYear = {};
    records.forEach(r => {
      if (r.date >= oneYearAgo) {
        // Calculate the equivalent date this year
        const thisYearDate = new Date(r.date);
        thisYearDate.setFullYear(now.getFullYear());
        
        if (thisYearDate >= thirtyDaysAgo && thisYearDate <= now) {
          const year = thisYearDate.getFullYear();
          const month = String(thisYearDate.getMonth() + 1).padStart(2, '0');
          const day = String(thisYearDate.getDate()).padStart(2, '0');
          const mappedDateStr = `${year}-${month}-${day}`;

          if (!dailyMapLastYear[mappedDateStr]) {
            dailyMapLastYear[mappedDateStr] = {
              netRevenue: 0
            };
          }
          dailyMapLastYear[mappedDateStr].netRevenue += r.netValue;
        }
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

      // Get previous period equivalent (30 days earlier)
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 30);
      const prevYear = prevDate.getFullYear();
      const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevDay = String(prevDate.getDate()).padStart(2, '0');
      const prevDateStr = `${prevYear}-${prevMonth}-${prevDay}`;

      dailyData.push({
        date: displayDate,
        grossRevenue: Math.round((dailyMapCurrent[dateStr]?.grossRevenue || 0) * 100) / 100,
        netRevenue: Math.round((dailyMapCurrent[dateStr]?.netRevenue || 0) * 100) / 100,
        previousPeriod: Math.round((dailyMapPrevious[prevDateStr]?.netRevenue || 0) * 100) / 100,
        lastYear: Math.round((dailyMapLastYear[dateStr]?.netRevenue || 0) * 100) / 100
      });
    }

    return dailyData;
  }, [salesData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
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
            color: COLORS.primary
          }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0',
              fontSize: '13px',
              color: entry.color
            }}>
              <span style={{ fontWeight: '600' }}>{entry.name}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        No revenue data available
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: COLORS.gray }}
            tickLine={{ stroke: COLORS.lightGray }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: COLORS.gray }}
            tickLine={{ stroke: COLORS.lightGray }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Current Period Lines (Solid) */}
          <Line 
            type="monotone" 
            dataKey="grossRevenue" 
            stroke={COLORS.primary}
            strokeWidth={2.5}
            name="Gross Revenue"
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="netRevenue" 
            stroke={COLORS.accent}
            strokeWidth={2.5}
            name="Net Revenue"
            dot={false}
            activeDot={{ r: 6 }}
          />
          
          {/* Comparison Lines (Dashed) */}
          <Line 
            type="monotone" 
            dataKey="previousPeriod" 
            stroke={COLORS.gray}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Previous Period"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="lastYear" 
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Same Period Last Year"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueTrendChart;
