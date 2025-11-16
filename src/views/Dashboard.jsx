// Dashboard.jsx v5.0 - STREAMLINED LAYOUT
// ✅ All 9 KPIs in main grid (including wash, dry, new clients)
// ✅ Individual Quick Action cards
// ✅ Removed redundant components
// ✅ No scrolling required - optimized for single screen
//
// CHANGELOG:
// v5.0 (2025-11-15): Reorganized layout - all metrics in KPI grid, individual quick action cards
// v4.0 (2025-11-14): Streamlined version with new components
// v3.0 (2025-11-13): Enhanced with customer lifecycle tool

import React, { useMemo } from 'react';
import KPICards from '../components/KPICards';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import UrgentInsightCard from '../components/UrgentInsightCard';
import QuickActionsCards from '../components/QuickActionsCards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { ExternalLink, Calendar } from 'lucide-react';

const Dashboard = ({ data, onNavigate }) => {
  // Calculate business metrics
  const businessMetrics = useMemo(() => {
    if (!data?.sales) return null;
    try {
      return calculateBusinessMetrics(data.sales);
    } catch (err) {
      console.error('Business metrics error:', err);
      return null;
    }
  }, [data?.sales]);

  // Calculate customer metrics
  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    return calculateCustomerMetrics(data.sales, data.rfm);
  }, [data?.sales, data?.rfm]);

  const handleQuickAction = (actionId) => {
    switch(actionId) {
      case 'view-customers':
        onNavigate?.('customers');
        break;
      case 'analytics':
        onNavigate?.('analytics');
        break;
      case 'operations':
        onNavigate?.('operations');
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

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ 
      padding: '1.5rem 2rem', 
      maxWidth: '1600px', 
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* HEADER SECTION */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Title & Date */}
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a5a8e',
              marginBottom: '0.5rem',
              margin: 0
            }}>
              Dashboard Lavpop
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
              Semana de {formatDate(businessMetrics.windows.weekly.startDate)} - {formatDate(businessMetrics.windows.weekly.endDate)}
            </div>
          </div>

          {/* Right: Weather, Social Media & Google Business */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <WeatherWidget />
            <SocialMediaWidget 
              instagramFollowers={1200} 
              facebookFollowers={850}
            />
            <GoogleBusinessWidget />
          </div>
        </div>
      </div>

      {/* URGENT INSIGHT CARD */}
      <UrgentInsightCard 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
      />

      {/* KPI CARDS - ALL 9 METRICS */}
      <KPICards 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={data.sales}
      />

      {/* MAIN CONTENT GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Row 1: Quick Actions (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '700',
              color: '#1a5a8e',
              margin: 0,
              marginBottom: '1rem'
            }}>
              Ações Rápidas
            </h3>
            <QuickActionsCards onAction={handleQuickAction} />
          </div>
        </div>

        {/* Row 2: At-Risk Customers (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <AtRiskCustomersTable 
            customerMetrics={customerMetrics}
            salesData={data.sales}
            maxRows={5}
          />
        </div>
      </div>

      {/* FOOTER - Quick Links */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          Links Úteis:
        </div>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <a
            href="https://admin.mercadopago.com.br"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '13px',
              color: '#1a5a8e',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#55b03b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#1a5a8e'}
          >
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Mercado Pago
          </a>
          <a
            href="https://app.asaas.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '13px',
              color: '#1a5a8e',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#55b03b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#1a5a8e'}
          >
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Asaas
          </a>
          <a
            href="https://console.twilio.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '13px',
              color: '#1a5a8e',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#55b03b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#1a5a8e'}
          >
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Twilio SMS
          </a>
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '13px',
              color: '#1a5a8e',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#55b03b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#1a5a8e'}
          >
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Google Drive
          </a>
          <a
            href="https://maps.app.goo.gl/VwNojjvheJrXZeRd8"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '13px',
              color: '#1a5a8e',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#55b03b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#1a5a8e'}
          >
            <ExternalLink style={{ width: '14px', height: '14px' }} />
            Google Maps
          </a>
        </div>
      </div>

      {/* Mobile Responsive Override */}
      <style jsx>{`
        @media (max-width: 1023px) {
          div[style*="gridColumn"] {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
