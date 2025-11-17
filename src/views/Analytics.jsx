// Analytics View v1.0
// Main analytics view with date range selector and performance intelligence
// Features: Summary panel, interactive trends, AI insights
//
// CHANGELOG:
// v1.0 (2025-11-16): Initial implementation

import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, Users, Zap } from 'lucide-react';
import AnalyticsDateRangeSelector from '../components/AnalyticsDateRangeSelector';
import PerformanceIntelligence from '../components/PerformanceIntelligence';
import { getAnalyticsDateRange } from '../utils/analyticsDateUtils';
import { calculatePeriodSummary } from '../utils/analyticsMetrics';
import { formatCurrency } from '../utils/numberUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

const Analytics = ({ data }) => {
  const [dateOption, setDateOption] = useState('last30days');
  const [customDateRange, setCustomDateRange] = useState(null);
  
  // Get current date window
  const dateWindow = useMemo(() => {
    if (customDateRange) {
      return getAnalyticsDateRange('custom', customDateRange.start, customDateRange.end);
    }
    return getAnalyticsDateRange(dateOption);
  }, [dateOption, customDateRange]);
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!data || !data.sales) return null;
    return calculatePeriodSummary(data.sales, dateWindow.start, dateWindow.end);
  }, [data, dateWindow]);
  
  const handleDateChange = (newOption) => {
    setDateOption(newOption);
    if (newOption !== 'custom') {
      setCustomDateRange(null);
    }
  };
  
  const handleCustomDateChange = (start, end) => {
    setCustomDateRange({ start, end });
    setDateOption('custom');
  };
  
  if (!data || !data.sales) {
    return (
      <div className="view-container" style={{ padding: '2rem' }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: COLORS.primary }}>Carregando dados de análise...</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div className="view-container" style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '2rem 1.5rem'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: COLORS.primary,
          marginBottom: '0.5rem'
        }}>
          Analytics
        </h1>
        <p style={{
          fontSize: '14px',
          color: COLORS.gray
        }}>
          Análise detalhada de performance, tendências e insights estratégicos
        </p>
      </div>
      
      {/* Date Range Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AnalyticsDateRangeSelector
          value={dateOption}
          onChange={handleDateChange}
          dateWindow={dateWindow}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>
      
      {/* Summary Panel */}
      {summary && (
        <div style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <BarChart3 size={20} style={{ color: COLORS.primary }} />
            <span style={{
              fontSize: '14px',
              fontWeight: '700',
              color: COLORS.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Resumo do Período
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                color: COLORS.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Receita Total
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: COLORS.primary 
              }}>
                {formatCurrency(summary.revenue)}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: COLORS.gray,
                marginTop: '0.25rem'
              }}>
                {formatCurrency(summary.avgDailyRevenue)}/dia
              </div>
            </div>
            
            <div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                color: COLORS.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Total de Ciclos
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: COLORS.primary 
              }}>
                {summary.totalServices}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: COLORS.gray,
                marginTop: '0.25rem'
              }}>
                {summary.avgDailyServices.toFixed(1)}/dia
              </div>
            </div>
            
            <div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                color: COLORS.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Utilização Média
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: COLORS.primary 
              }}>
                {summary.utilization.toFixed(1)}%
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: COLORS.gray,
                marginTop: '0.25rem'
              }}>
                {summary.daysInRange} dias
              </div>
            </div>
            
            <div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                color: COLORS.gray,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
              }}>
                Mix de Serviços
              </div>
              <div style={{ 
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: COLORS.primary 
                  }}>
                    {summary.washServices}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: COLORS.gray 
                  }}>
                    Lavagens
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: COLORS.accent 
                  }}>
                    {summary.dryServices}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: COLORS.gray 
                  }}>
                    Secagens
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Intelligence Section */}
      <div style={{
        background: '#f9fafb',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <TrendingUp size={20} style={{ color: COLORS.primary }} />
          <span style={{
            fontSize: '18px',
            fontWeight: '700',
            color: COLORS.primary
          }}>
            Inteligência de Performance
          </span>
        </div>
        
        <PerformanceIntelligence
          salesData={data.sales}
          startDate={dateWindow.start}
          endDate={dateWindow.end}
        />
      </div>
      
      {/* Placeholder for future sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        {[
          { icon: Users, title: 'Customer Analytics', subtitle: 'Em breve' },
          { icon: Zap, title: 'Operational Patterns', subtitle: 'Em breve' },
          { icon: BarChart3, title: 'External Factors', subtitle: 'Em breve' }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                opacity: 0.6
              }}
            >
              <Icon size={32} style={{ color: COLORS.primary, margin: '0 auto 1rem' }} />
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: COLORS.primary,
                marginBottom: '0.5rem'
              }}>
                {item.title}
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: COLORS.gray 
              }}>
                {item.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Analytics;
