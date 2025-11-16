// Dashboard.jsx v5.2 - OPTIMIZED SINGLE-SCREEN LAYOUT
// ✅ Compact urgent insight card (single line)
// ✅ Smaller quick action cards (icon-first design)
// ✅ Enhanced brand colors (Lavpop blue #1a5a8e and green #55b03b)
// ✅ No scrolling required on 1080p screens
// ✅ Brand-focused header with gradient accents
//
// CHANGELOG:
// v5.2 (2025-11-15): Optimized for single-screen view, enhanced brand colors, compact components
// v5.1 (2025-11-15): Streamlined layout with 9 KPIs
// v5.0 (2025-11-15): Reorganized layout with all metrics in KPI grid

import React, { useMemo } from 'react';
import KPICards from '../components/KPICards';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import UrgentInsightCard from '../components/UrgentInsightCard';
import QuickActionsCards from '../components/QuickActionsCards';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { ExternalLink, Calendar, BarChart3, Users, Settings } from 'lucide-react';

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

  // Get the urgent insight from UrgentInsightCard logic
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
      padding: '1rem 1.5rem', 
      maxWidth: '1600px', 
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* COMPACT HEADER with Brand Gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1rem',
        boxShadow: '0 4px 12px rgba(26, 90, 142, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
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
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
              marginBottom: '0.25rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Dashboard Lavpop
            </h1>
            <div style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar style={{ width: '14px', height: '14px' }} />
              Semana de {startDate} - {endDate}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
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

      {/* COMPACT URGENT INSIGHT - Single Line */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '0.75rem 1.25rem',
        marginBottom: '1rem',
        border: `2px solid ${topInsight.color}`,
        boxShadow: `0 2px 8px ${topInsight.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: topInsight.color,
            animation: 'pulse 2s infinite'
          }} />
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: COLORS.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginRight: '0.75rem'
            }}>
              ALERTA URGENTE
            </span>
            <span style={{
              fontSize: '15px',
              fontWeight: '700',
              color: topInsight.color
            }}>
              {topInsight.text}
            </span>
          </div>
        </div>
        <div style={{
          fontSize: '13px',
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

      {/* COMPACT QUICK ACTIONS - Horizontal Icons */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '14px',
          fontWeight: '700',
          color: COLORS.primary,
          margin: 0,
          marginBottom: '0.75rem'
        }}>
          Ações Rápidas
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => handleQuickAction('view-customers')}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = COLORS.primary;
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Users style={{ width: '18px', height: '18px' }} />
            Ver Clientes
          </button>
          
          <button
            onClick={() => handleQuickAction('analytics')}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = COLORS.primary;
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <BarChart3 style={{ width: '18px', height: '18px' }} />
            Análises
          </button>
          
          <button
            onClick={() => handleQuickAction('operations')}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = COLORS.primary;
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Settings style={{ width: '18px', height: '18px' }} />
            Operações
          </button>
        </div>
      </div>

      {/* AT-RISK CUSTOMERS */}
      <AtRiskCustomersTable 
        customerMetrics={customerMetrics}
        salesData={data.sales}
        maxRows={5}
      />

      {/* COMPACT FOOTER */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '0.75rem 1.25rem',
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          fontSize: '12px',
          color: COLORS.gray,
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
                gap: '0.35rem',
                fontSize: '12px',
                color: COLORS.primary,
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = COLORS.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = COLORS.primary}
            >
              <ExternalLink style={{ width: '12px', height: '12px' }} />
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
