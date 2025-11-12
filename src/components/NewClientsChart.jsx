import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserPlus } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280',
  lightGray: '#d1d5db'
};

/**
 * Normalize document number (CPF) - pad to 11 digits
 */
function normalizeDoc(doc) {
  if (!doc) return '';
  const cleaned = String(doc).replace(/\D/g, '');
  if (cleaned.length > 0 && cleaned.length <= 11) {
    return cleaned.padStart(11, '0');
  }
  return cleaned;
}

const NewClientsChart = ({ salesData }) => {
  const chartData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    // Track first visit date for each customer
    const customerFirstVisit = {};

    salesData.forEach(row => {
      const doc = normalizeDoc(row.Doc_Cliente || row.document || row.doc || '');
      if (!doc) return;

      const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
      if (!date) return;

      if (!customerFirstVisit[doc] || date < customerFirstVisit[doc]) {
        customerFirstVisit[doc] = date;
      }
    });

    // Get date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count new customers per day
    const dailyNewCustomers = {};

    Object.values(customerFirstVisit).forEach(firstVisit => {
      if (firstVisit >= thirtyDaysAgo && firstVisit <= now) {
        const year = firstVisit.getFullYear();
        const month = String(firstVisit.getMonth() + 1).padStart(2, '0');
        const day = String(firstVisit.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        if (!dailyNewCustomers[dateStr]) {
          dailyNewCustomers[dateStr] = 0;
        }
        dailyNewCustomers[dateStr]++;
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

      dailyData.push({
        date: displayDate,
        fullDate: dateStr,
        newCustomers: dailyNewCustomers[dateStr] || 0
      });
    }

    return dailyData;
  }, [salesData]);

  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return { total: 0, avg: 0, max: 0 };

    const total = chartData.reduce((sum, d) => sum + d.newCustomers, 0);
    const avg = total / chartData.length;
    const max = Math.max(...chartData.map(d => d.newCustomers));

    return { total, avg: avg.toFixed(1), max };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
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
            {label}
          </p>
          <p style={{ 
            margin: 0,
            fontSize: '14px',
            color: COLORS.accent,
            fontWeight: '600'
          }}>
            {data.newCustomers} new customer{data.newCustomers !== 1 ? 's' : ''}
          </p>
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
        No new customer data available
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
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <UserPlus style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            New Customers per Day (Last 30 Days)
          </h3>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            TOTAL NEW
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.accent }}>
            {stats.total}
          </div>
        </div>
        <div style={{
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            AVG PER DAY
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>
            {stats.avg}
          </div>
        </div>
        <div style={{
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.25rem', fontWeight: '500' }}>
            BEST DAY
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>
            {stats.max}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: COLORS.gray }}
            tickLine={false}
            axisLine={{ stroke: COLORS.lightGray }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: COLORS.gray }}
            tickLine={false}
            axisLine={{ stroke: COLORS.lightGray }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Bar 
            dataKey="newCustomers" 
            radius={[6, 6, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.newCustomers > 0 ? COLORS.accent : '#e5e7eb'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer Note */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray,
        textAlign: 'center'
      }}>
        📊 Tracking first-time customer visits to measure acquisition performance
      </div>
    </div>
  );
};

export default NewClientsChart;
