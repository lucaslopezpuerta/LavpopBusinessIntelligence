// Dashboard.jsx v6.0
// ✅ Quick Actions moved to header as icon buttons (saves ~130px vertical)
// ✅ Responsive KPI grid (9 cols ultra-wide, 3x3 on 1080p, 1 col mobile)
// ✅ Google Business Widget WITH API integration
// ✅ Ultra compact layout - guaranteed no scroll on 1080p
// ✅ Mobile responsive design
//
// CHANGELOG:
// v6.0 (2025-11-16): Major layout optimization - Quick Actions in header, responsive grid, compact design
// v5.3 (2025-11-15): Final optimization - restored QuickActions design, ultra compact table
// v5.2 (2025-11-15): Optimized for single-screen view, enhanced brand colors

import React, { useMemo } from 'react';
import KPICards from '../components/KPICards';
import WeatherWidget from '../components/WeatherWidget_API';
import SocialMediaWidget from '../components/SocialMediaWidget';
import GoogleBusinessWidget from '../components/GoogleBusinessWidget';
import AtRiskCustomersTable from '../components/AtRiskCustomersTable';
import { calculateBusinessMetrics } from '../utils/businessMetrics';
import { calculateCustomerMetrics } from '../utils/customerMetrics';
import { Calendar, MessageSquare, Settings, ExternalLink } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  purple: '#8b5cf6',
  pink: '#ec4899',
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

  // Quick Action buttons for header
  const quickActions = [
    {
      id: 'schedule',
      label: 'Agenda',
      icon: Calendar,
      color: COLORS.purple
    },
    {
      id: 'campaigns',
      label: 'Campanhas',
      icon: MessageSquare,
      color: COLORS.pink
    },
    {
      id: 'settings',
      label: 'Config',
      icon: Settings,
      color: COLORS.gray
    }
  ];

  return (
    <div style={{ 
      padding: '0.75rem 1rem', 
      maxWidth: '1600px', 
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* OPTIMIZED HEADER with Quick Actions */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
        borderRadius: '12px',
        padding: '0.875rem 1.125rem',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 12px rgba(26, 90, 142, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Left: Title & Date */}
          <div>
            <h1 style={{
              fontSize: '26px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
              marginBottom: '0.2rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Dashboard Lavpop
            </h1>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Calendar style={{ width: '12px', height: '12px' }} />
              Semana de {startDate} - {endDate}
            </div>
          </div>

          {/* Right: Widgets + Quick Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            flexWrap: 'wrap'
          }}>
            {/* Widgets */}
            <WeatherWidget />
            <SocialMediaWidget 
              instagramFollowers={1200} 
              facebookFollowers={850}
            />
            <GoogleBusinessWidget />

            {/* Divider */}
            <div style={{
              width: '1px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.3)',
              margin: '0 0.25rem'
            }} />

            {/* Quick Action Icon Buttons */}
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  title={action.label}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.querySelector('svg').style.color = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.querySelector('svg').style.color = 'white';
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px', color: 'white', transition: 'color 0.2s' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ULTRA COMPACT URGENT INSIGHT */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '0.5rem 0.875rem',
        marginBottom: '0.75rem',
        border: `2px solid ${topInsight.color}`,
        boxShadow: `0 2px 8px ${topInsight.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: topInsight.color,
            animation: 'pulse 2s infinite'
          }} />
          <div>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              color: COLORS.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginRight: '0.5rem'
            }}>
              ALERTA
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: '700',
              color: topInsight.color
            }}>
              {topInsight.text}
            </span>
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          💡 {topInsight.action}
        </div>
      </div>

      {/* RESPONSIVE KPI CARDS - 9 cols ultra-wide, 3x3 on 1080p, 1 col mobile */}
      <KPICards 
        businessMetrics={businessMetrics}
        customerMetrics={customerMetrics}
        salesData={data.sales}
      />

      {/* ULTRA COMPACT AT-RISK CUSTOMERS */}
      <AtRiskCustomersTable 
        customerMetrics={customerMetrics}
        salesData={data.sales}
        maxRows={5}
      />

      {/* COMPACT FOOTER */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '0.5rem 0.875rem',
        marginTop: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          fontSize: '10px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          Links Úteis:
        </div>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
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
                gap: '0.25rem',
                fontSize: '10px',
                color: COLORS.primary,
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = COLORS.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = COLORS.primary}
            >
              <ExternalLink style={{ width: '10px', height: '10px' }} />
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
        
        @media (max-width: 768px) {
          /* Mobile optimizations */
          h1 { font-size: 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
