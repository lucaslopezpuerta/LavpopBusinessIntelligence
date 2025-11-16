// Dashboard.jsx v5.1 - STREAMLINED LAYOUT
// ✅ All 9 KPIs in main grid (including wash, dry, new clients)
// ✅ Individual Quick Action cards
// ✅ Removed redundant components
// ✅ No scrolling required - optimized for single screen
// ✅ Fixed date formatting (already in DD/MM/YYYY)
// ✅ Fixed alert panel width
// ✅ Improved layout

// CHANGELOG:
// v5.0 (2025-11-15): Reorganized layout - all metrics in KPI grid, individual quick action cards
// v4.0 (2025-11-14): Streamlined version with new components
// v3.0 (2025-11-13): Enhanced with customer lifecycle tool

// Dashboard.jsx v5.1 - FIXED

import React, { useMemo } from 'react';
import KPICards from '../components/KPICards';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import UrgentInsightCard from '../components/UrgentInsightCard';
import QuickActionsCards from '../components/QuickActionsCards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { ExternalLink, Calendar } from 'lucide-react';

const Dashboard = ({ data, onNavigate }) => {
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

  // ✅ FIXED: Dates are already in DD/MM/YYYY format from businessMetrics
  const startDate = businessMetrics.windows.weekly.startDate;
  const endDate = businessMetrics.windows.weekly.endDate;

  return (
    <div style={{ 
      padding: '1.5rem 2rem', 
      maxWidth: '1600px', 
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* HEADER */}
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
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1a5a8e',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Dashboard Lavpop
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
              Semana de {startDate} - {endDate}
            </div>
          </div>

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
          </div>
        </div>
      </div>

      {/* URGENT INSIGHT - ✅ FIXED: Added max-width */}
      <div style={{ maxWidth: '100%', marginBottom: '1.5rem' }}>
        <UrgentInsightCard 
          businessMetrics={businessMetrics}
          customerMetrics={customerMetrics}
        />
      </div>

      {/* 9 KPI CARDS */}
      <KPICards 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={data.sales}
      />

      {/* QUICK ACTIONS */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
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

      {/* AT-RISK CUSTOMERS */}
      <AtRiskCustomersTable 
        customerMetrics={customerMetrics}
        salesData={data.sales}
        maxRows={5}
      />

      {/* FOOTER */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '1rem 1.5rem',
        marginTop: '1.5rem',
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
          {[
            { href: 'https://admin.mercadopago.com.br', label: 'Mercado Pago' },
            { href: 'https://app.asaas.com', label: 'Asaas' },
            { href: 'https://console.twilio.com', label: 'Twilio SMS' },
            { href: 'https://drive.google.com', label: 'Google Drive' },
            { href: 'https://maps.app.goo.gl/VwNojjvheJrXZeRd8', label: 'Google Maps' }
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
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
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
