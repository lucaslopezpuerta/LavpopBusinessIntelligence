// WashDryServiceCards.jsx v1.0
// Shows wash and dry service counts as separate cards
// Replaces the Service Mix pie chart

import React from 'react';
import { Droplet, Flame } from 'lucide-react';

const COLORS = {
  wash: '#3b82f6',
  dry: '#f59e0b',
  gray: '#6b7280'
};

const WashDryServiceCards = ({ businessMetrics }) => {
  if (!businessMetrics) return null;

  const { weekly = {} } = businessMetrics;
  
  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const washCount = weekly.washerServices || 0;
  const dryCount = weekly.dryerServices || 0;
  const total = washCount + dryCount;
  
  const washPercent = total > 0 ? ((washCount / total) * 100).toFixed(0) : 0;
  const dryPercent = total > 0 ? ((dryCount / total) * 100).toFixed(0) : 0;

  const services = [
    {
      id: 'wash',
      label: 'Lavagens',
      count: washCount,
      percent: washPercent,
      icon: Droplet,
      color: COLORS.wash,
      bgColor: '#dbeafe'
    },
    {
      id: 'dry',
      label: 'Secagens',
      count: dryCount,
      percent: dryPercent,
      icon: Flame,
      color: COLORS.dry,
      bgColor: '#fef3c7'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem'
    }}>
      {services.map((service) => {
        const Icon = service.icon;
        
        return (
          <div
            key={service.id}
            style={{
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
              e.currentTarget.style.borderColor = service.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {/* Icon and Label */}
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
                {service.label}
              </h3>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: service.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon style={{ width: '24px', height: '24px', color: service.color }} />
              </div>
            </div>

            {/* Count */}
            <div style={{
              fontSize: '36px',
              fontWeight: '700',
              color: service.color,
              lineHeight: '1',
              marginBottom: '0.5rem'
            }}>
              {formatNumber(service.count)}
            </div>

            {/* Percentage */}
            <div style={{
              fontSize: '14px',
              color: COLORS.gray,
              fontWeight: '600'
            }}>
              {service.percent}% do total
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WashDryServiceCards;
