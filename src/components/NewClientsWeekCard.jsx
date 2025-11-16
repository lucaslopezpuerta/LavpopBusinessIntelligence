// NewClientsWeekCard.jsx v1.0
// Shows new clients count for the current week
// Simple card format

import React, { useMemo } from 'react';
import { UserPlus, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

const NewClientsWeekCard = ({ salesData }) => {
  const newClientsData = useMemo(() => {
    if (!salesData || salesData.length === 0) return null;

    // Get current week boundaries (Sunday to Saturday)
    const now = new Date();
    let lastSaturday = new Date(now);
    const daysFromSaturday = (now.getDay() + 1) % 7;
    lastSaturday.setDate(lastSaturday.getDate() - daysFromSaturday);
    lastSaturday.setHours(23, 59, 59, 999);
    
    let startSunday = new Date(lastSaturday);
    startSunday.setDate(startSunday.getDate() - 6);
    startSunday.setHours(0, 0, 0, 0);

    // Get previous week for comparison
    let prevWeekEnd = new Date(startSunday);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    prevWeekEnd.setHours(23, 59, 59, 999);
    
    let prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    prevWeekStart.setHours(0, 0, 0, 0);

    // Track first purchase per customer
    const customerFirstPurchase = {};
    
    salesData.forEach(row => {
      const dateStr = row.Data || row.data || row.date;
      if (!dateStr) return;
      
      const [day, month, year] = dateStr.split('/');
      const saleDate = new Date(year, month - 1, day);
      
      const cpf = row.Doc_Cliente || row.doc || row.cpf;
      if (!cpf) return;
      
      if (!customerFirstPurchase[cpf] || saleDate < customerFirstPurchase[cpf]) {
        customerFirstPurchase[cpf] = saleDate;
      }
    });

    // Count new clients this week
    let currentWeekNew = 0;
    let previousWeekNew = 0;
    
    Object.values(customerFirstPurchase).forEach(firstDate => {
      if (firstDate >= startSunday && firstDate <= lastSaturday) {
        currentWeekNew++;
      } else if (firstDate >= prevWeekStart && firstDate <= prevWeekEnd) {
        previousWeekNew++;
      }
    });

    // Calculate week-over-week change
    let weekOverWeekChange = null;
    if (previousWeekNew > 0) {
      weekOverWeekChange = ((currentWeekNew - previousWeekNew) / previousWeekNew) * 100;
    }

    return {
      count: currentWeekNew,
      previousCount: previousWeekNew,
      weekOverWeek: weekOverWeekChange
    };
  }, [salesData]);

  if (!newClientsData) return null;

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getTrendData = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return { show: false };
    }
    
    if (value > 0) {
      return { 
        show: true,
        icon: TrendingUp,
        text: `+${value.toFixed(1)}%`, 
        color: COLORS.accent
      };
    }
    
    if (value < 0) {
      return { 
        show: true,
        icon: TrendingDown,
        text: `${value.toFixed(1)}%`, 
        color: '#dc2626'
      };
    }
    
    return { 
      show: true,
      text: '→ 0%', 
      color: COLORS.gray
    };
  };

  const trend = getTrendData(newClientsData.weekOverWeek);
  const TrendIcon = trend.icon;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{ 
          fontSize: '13px',
          fontWeight: '700',
          color: COLORS.gray,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: 0
        }}>
          Novos Clientes
        </h3>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UserPlus style={{ width: '24px', height: '24px', color: COLORS.accent }} />
        </div>
      </div>

      {/* Count */}
      <div style={{
        fontSize: '36px',
        fontWeight: '700',
        color: COLORS.accent,
        lineHeight: '1',
        marginBottom: '0.5rem'
      }}>
        {formatNumber(newClientsData.count)}
      </div>

      {/* Trend */}
      {trend.show && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '13px'
        }}>
          {TrendIcon && (
            <TrendIcon style={{ width: '16px', height: '16px', color: trend.color }} />
          )}
          <span style={{ 
            color: trend.color,
            fontWeight: '600'
          }}>
            {trend.text}
          </span>
          <span style={{ color: COLORS.gray, marginLeft: '0.25rem' }}>
            vs semana anterior
          </span>
        </div>
      )}

      {!trend.show && (
        <div style={{
          fontSize: '13px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          Esta semana
        </div>
      )}
    </div>
  );
};

export default NewClientsWeekCard;
