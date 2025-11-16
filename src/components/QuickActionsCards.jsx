// QuickActionsCards.jsx v1.0
import React from 'react';
import { Users, TrendingUp, Gauge, Calendar, MessageSquare, Settings } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  gray: '#6b7280'
};

const QuickActionsCards = ({ onAction }) => {
  const actions = [
    {
      id: 'view-customers',
      label: 'Ver Clientes',
      description: 'Gestão de clientes',
      icon: Users,
      color: COLORS.primary,
      bgColor: '#e3f2fd'
    },
    {
      id: 'analytics',
      label: 'Análises',
      description: 'Tendências e insights',
      icon: TrendingUp,
      color: COLORS.accent,
      bgColor: '#dcfce7'
    },
    {
      id: 'operations',
      label: 'Operações',
      description: 'Desempenho de máquinas',
      icon: Gauge,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      id: 'schedule',
      label: 'Agenda',
      description: 'Manutenções e tarefas',
      icon: Calendar,
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    },
    {
      id: 'campaigns',
      label: 'Campanhas',
      description: 'Marketing e SMS',
      icon: MessageSquare,
      color: '#ec4899',
      bgColor: '#fce7f3'
    },
    {
      id: 'settings',
      label: 'Configurações',
      description: 'Ajustes do sistema',
      icon: Settings,
      color: COLORS.gray,
      bgColor: '#f3f4f6'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '1rem'
    }}>
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <div
            key={action.id}
            onClick={() => onAction?.(action.id)}
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = action.bgColor;
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: action.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon style={{ width: '24px', height: '24px', color: action.color }} />
            </div>

            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '0.25rem'
              }}>
                {action.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                {action.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickActionsCards;
