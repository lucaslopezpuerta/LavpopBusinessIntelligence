// Analytics Date Range Selector v1.0
// Advanced date range selector for Analytics tab
// Supports 10 preset ranges + custom date picker
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { getAnalyticsDateOptions, formatDate } from '../utils/analyticsDateUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

const AnalyticsDateRangeSelector = ({ value, onChange, dateWindow, onCustomDateChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const options = getAnalyticsDateOptions();
  
  const handleRangeChange = (newValue) => {
    if (newValue === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onChange(newValue);
    }
  };
  
  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      
      if (start <= end) {
        onCustomDateChange(start, end);
        setShowCustomPicker(false);
      }
    }
  };
  
  // Convert Date objects to YYYY-MM-DD format for input
  const toInputFormat = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.25rem 1.5rem',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Main selector row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
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
              Período de Análise
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
            onChange={(e) => handleRangeChange(e.target.value)}
            style={{
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              fontSize: '14px',
              fontWeight: '500',
              color: COLORS.primary,
              cursor: 'pointer',
              outline: 'none',
              minWidth: '220px'
            }}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Custom date picker (shown when 'custom' is selected) */}
      {showCustomPicker && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            <label style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: COLORS.gray,
              minWidth: '60px'
            }}>
              De:
            </label>
            <input
              type="date"
              value={customStart || toInputFormat(dateWindow.start)}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd || toInputFormat(new Date())}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                flex: 1
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
            <label style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: COLORS.gray,
              minWidth: '60px'
            }}>
              Até:
            </label>
            <input
              type="date"
              value={customEnd || toInputFormat(dateWindow.end)}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart}
              max={toInputFormat(new Date())}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                flex: 1
              }}
            />
          </div>
          
          <button
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: customStart && customEnd ? COLORS.primary : '#d1d5db',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: customStart && customEnd ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDateRangeSelector;
