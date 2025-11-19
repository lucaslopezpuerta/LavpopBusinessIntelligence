// Dashboard.jsx v6.1 - HYBRID VIEW WITH CURRENT WEEK BANNER
// ✅ NEW: Current week banner with real-time metrics and projection
// ✅ NEW: Toggle between "Última Semana Completa" and "Semana Atual"
// ✅ Honest labeling (no more misleading "Esta semana")
// ✅ Quick Actions in header as icon buttons
// ✅ Responsive KPI grid (9 cols ultra-wide, 3x3 on 1080p, 1 col mobile)
// ✅ Google Business Widget WITH API integration
// ✅ Ultra compact layout - guaranteed no scroll on 1080p
//
// CHANGELOG:
// v6.1 (2025-11-19): HYBRID VIEW IMPLEMENTATION
//   - Added CurrentWeekBanner showing real-time partial week
//   - Added view toggle (complete week vs current week)
//   - Fixed misleading date labels
//   - KPICards can now show either the complete or the current week
// v6.0 (2025-11-16): Major layout optimization - Quick Actions in header

import React, { useMemo, useState } from 'react';
import KPICards from '../components/KPICards';
import CurrentWeekBanner from '../components/CurrentWeekBanner';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { Calendar, MessageSquare, Settings, ExternalLink, BarChart3, CalendarDays } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  blue: '#3b82f6'
};

const Dashboard = ({ data, onNavigate }) => {
  // ✅ NEW: View mode state
  const [viewMode, setViewMode] = useState('complete'); // 'complete' or 'current'

  const businessMetrics = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateBusinessMetrics(data.sales);
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    return calculateCustomerMetrics(data.sales, data.rfm);
  }, [data?.sales, data?.rfm]);

  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'schedule':
        console.log('Agenda: Coming soon');
        // TODO: Integrate calendar/maintenance scheduling
        break;
      case 'campaigns':
        console.log('Campanhas: Coming soon');
        // TODO: Integrate SMS/marketing campaigns
        break;
      case 'settings':
        console.log('Configurações: Coming soon');
        // TODO: Integrate settings panel
        break;
      default:
        console.log('Action:', actionId);
    }
  };

  if (!businessMetrics || !customerMetrics) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          Carregando dashboard...
        </div>
      </div>
    );
  }

  // Get the appropriate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'current') {
      return {
        start: businessMetrics.windows.currentWeek.startDate,
        end: businessMetrics.windows.currentWeek.endDate,
        label: `Semana Atual (${businessMetrics.windows.currentWeek.daysElapsed} dias)`
      };
    } else {
      return {
        start: businessMetrics.windows.weekly.startDate,
        end: businessMetrics.windows.weekly.endDate,
        label: 'Última Semana Completa'
      };
    }
  };

  const dateRange = getDateRange();

  // Get the urgent insight
  const getTopInsight = () => {
    const weekly = businessMetrics.weekly || {};
    const utilization = Math.round(weekly.totalUtilization || 0);
    
    if (utilization < 15) {
      return {
        text: `Utilização crítica: ${utilization}% última semana`,
        color: COLORS.primary,
        action: 'Considere promoção urgente ou marketing'
      };
    }
    
    const atRiskCount = customerMetrics.atRiskCount || 0;
    if (atRiskCount > 15) {
      return {
        text: `${atRiskCount} clientes em risco de churn`,
        color: COLORS.primary,
        action: 'Contatar clientes em risco hoje'
      };
    }
    
    return null;
  };

  const topInsight = getTopInsight();

  return (
    <div style={{ 
      padding: '1rem',
      maxWidth: '1920px',
      margin: '0 auto'
    }}>
      {/* Header Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        {/* Date Range Display */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Calendar style={{ 
            width: '20px', 
            height: '20px', 
            color: COLORS.primary 
          }} />
          <div>
            <div style={{
              fontSize: '11px',
              color: COLORS.gray,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '2px'
            }}>
              {dateRange.label}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: COLORS.primary
            }}>
              {dateRange.start} - {dateRange.end}
            </div>
          </div>
        </div>

        {/* Weather Widget */}
        <WeatherWidget />

        {/* Social Media Widget */}
        <SocialMediaWidget />

        {/* Google Business Widget */}
        <GoogleBusinessWidget />

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => handleQuickAction('schedule')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = COLORS.lightGray}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Calendar style={{ width: '20px', height: '20px', color: COLORS.primary }} />
            <span style={{ fontSize: '10px', color: COLORS.gray, fontWeight: '600' }}>Agenda</span>
          </button>

          <button
            onClick={() => handleQuickAction('campaigns')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = COLORS.lightGray}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <MessageSquare style={{ width: '20px', height: '20px', color: COLORS.accent }} />
            <span style={{ fontSize: '10px', color: COLORS.gray, fontWeight: '600' }}>Campanhas</span>
          </button>

          <button
            onClick={() => handleQuickAction('settings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = COLORS.lightGray}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Settings style={{ width: '20px', height: '20px', color: COLORS.gray }} />
            <span style={{ fontSize: '10px', color: COLORS.gray, fontWeight: '600' }}>Config</span>
          </button>
        </div>
      </div>

      {/* ✅ NEW: Current Week Banner */}
      <CurrentWeekBanner businessMetrics={businessMetrics} />

      {/* ✅ NEW: View Mode Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Toggle Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'white',
          padding: '0.25rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setViewMode('complete')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: viewMode === 'complete' ? COLORS.primary : 'transparent',
              color: viewMode === 'complete' ? 'white' : COLORS.gray
            }}
          >
            <BarChart3 style={{ width: '16px', height: '16px' }} />
            Última Semana Completa
          </button>

          <button
            onClick={() => setViewMode('current')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: viewMode === 'current' ? COLORS.accent : 'transparent',
              color: viewMode === 'current' ? 'white' : COLORS.gray
            }}
          >
            <CalendarDays style={{ width: '16px', height: '16px' }} />
            Semana Atual ({businessMetrics.windows.currentWeek.daysElapsed} dias)
          </button>
        </div>

        {/* Top Insight (if any) */}
        {topInsight && (
          <div style={{
            padding: '0.625rem 1rem',
            background: `${topInsight.color}15`,
            borderRadius: '8px',
            borderLeft: `4px solid ${topInsight.color}`,
            flex: 1,
            minWidth: '300px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: topInsight.color,
              marginBottom: '2px'
            }}>
              {topInsight.text}
            </div>
            <div style={{
              fontSize: '12px',
              color: COLORS.gray
            }}>
              {topInsight.action}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards - Shows either complete or current week based on toggle */}
      <KPICards 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={data.sales}
        viewMode={viewMode}
      />

      {/* At-Risk Customers Table */}
      <AtRiskCustomersTable 
        customerMetrics={customerMetrics}
      />
    </div>
  );
};

export default Dashboard;
