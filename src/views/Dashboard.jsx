// Dashboard.jsx v5.3
// ✅ Ultra compact layout - no scrolling on 1080p
// ✅ Restored colorful QuickActionsCards design
// ✅ Compact AtRiskCustomersTable with enhanced design
// ✅ Enhanced brand colors with gradient header
// ✅ All components optimized for space
//
// CHANGELOG:
// v5.3 (2025-11-15): Final optimization - restored QuickActions design, ultra compact table
// v5.2 (2025-11-15): Optimized for single-screen view, enhanced brand colors
// v5.1 (2025-11-15): Streamlined layout with 9 KPIs

import React, { useMemo } from 'react';
import KPICards from '../components/KPICards';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import QuickActionsCards from '../components/QuickActionsCards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { ExternalLink, Calendar } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280',
  lightGray: '#f3f4f6'
};

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
      case 'schedule':
      case 'campaigns':
      case 'settings':
        console.log('Action:', actionId, '(coming soon)');
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

  const startDate = businessMetrics.windows.weekly.startDate;
  const endDate = businessMetrics.windows.weekly.endDate;

  // Get the urgent insight
  const getTopInsight = () => {
    const weekly = businessMetrics.weekly || {};
    const utilization = Math.round(weekly.totalUtilization || 0);
    
    if (utilization < 15) {
      return {
        text: `Utilização crítica: ${utilization}% esta semana`,
        color: COLORS.primary,
        action: 'Considere promoção urgente ou marketing'
      };
    }
    
    const atRiskCount = customerMetrics.atRiskCount || 0;
    if (atRiskCount > 15) {
      return {
        text: `${atRiskCount} clientes em risco precisam atenção`,
        color: '#dc2626',
        action: 'Ver clientes em risco abaixo'
      };
    }
    
    return {
      text: `Semana saudável: ${utilization}% utilização`,
      color: COLORS.accent,
      action: 'Continue o bom trabalho!'
    };
  };

  const topInsight = getTopInsight();

  return (
    <div style={{ 
      padding: '0.875rem 1.25rem', 
      maxWidth: '1600px', 
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* COMPACT HEADER with Brand Gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        marginBottom: '0.875rem',
        boxShadow: '0 4px 12px rgba(26, 90, 142, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.875rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
              marginBottom: '0.25rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Dashboard Lavpop
            </h1>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Calendar style={{ width: '13px', height: '13px' }} />
              Semana de {startDate} - {endDate}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
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

      {/* ULTRA COMPACT URGENT INSIGHT - Single Line */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '0.65rem 1rem',
        marginBottom: '0.875rem',
        border: `2px solid ${topInsight.color}`,
        boxShadow: `0 2px 8px ${topInsight.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.875rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: topInsight.color,
            animation: 'pulse 2s infinite'
          }} />
          <div>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: COLORS.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginRight: '0.65rem'
            }}>
              ALERTA URGENTE
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: '700',
              color: topInsight.color
            }}>
              {topInsight.text}
            </span>
          </div>
        </div>
        <div style={{
          fontSize: '12px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          💡 {topInsight.action}
        </div>
      </div>

      {/* 9 KPI CARDS */}
      <KPICards 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={data.sales}
      />

      {/* COMPACT QUICK ACTIONS - Colorful Cards Restored */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '0.875rem 1rem',
        marginBottom: '0.875rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '13px',
          fontWeight: '700',
          color: COLORS.primary,
          margin: 0,
          marginBottom: '0.65rem'
        }}>
          Ações Rápidas
        </h3>
        <QuickActionsCards onAction={handleQuickAction} />
      </div>

      {/* ULTRA COMPACT AT-RISK CUSTOMERS */}
      <AtRiskCustomersTable 
        customerMetrics={customerMetrics}
        salesData={data.sales}
        maxRows={5}
      />

      {/* ULTRA COMPACT FOOTER */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        padding: '0.65rem 1rem',
        marginTop: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          fontSize: '11px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          Links Úteis:
        </div>
        <div style={{
          display: 'flex',
          gap: '0.875rem',
          flexWrap: 'wrap'
        }}>
          {[
            { href: 'https://admin.mercadopago.com.br', label: 'Mercado Pago' },
            { href: 'https://app.asaas.com', label: 'Asaas' },
            { href: 'https://console.twilio.com', label: 'Twilio' },
            { href: 'https://drive.google.com', label: 'Drive' },
            { href: 'https://maps.app.goo.gl/VwNojjvheJrXZeRd8', label: 'Maps' }
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '11px',
                color: COLORS.primary,
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = COLORS.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = COLORS.primary}
            >
              <ExternalLink style={{ width: '11px', height: '11px' }} />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
