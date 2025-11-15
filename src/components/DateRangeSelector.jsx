// DateRangeSelector.jsx v1.0
// Unified date picker for Operations tab

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { getDateOptions } from '../utils/dateWindows';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280',
  lightGray: '#f9fafb',
  border: '#e5e7eb'
};

const DateRangeSelector = ({ value, onChange, dateWindow }) => {
  const options = useMemo(() => getDateOptions(), []);
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      background: 'white',
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      {/* Left: Date range display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Calendar style={{ width: '20px', height: '20px', color: COLORS.primary }} />
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600',
            color: COLORS.gray,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.25rem'
          }}>
            Período Selecionado
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: COLORS.primary 
          }}>
            {dateWindow.dateRange}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: COLORS.gray,
            marginTop: '0.125rem'
          }}>
            {dateWindow.label}
          </div>
        </div>
      </div>
      
      {/* Right: Dropdown selector */}
      <div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: '0.625rem 1rem',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            background: 'white',
            fontSize: '14px',
            fontWeight: '500',
            color: COLORS.primary,
            cursor: 'pointer',
            outline: 'none',
            minWidth: '280px'
          }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.displayLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DateRangeSelector;
