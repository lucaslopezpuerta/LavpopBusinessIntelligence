// QuickActionsCards.jsx v2.0 - ONLY UTILITY ACTIONS
// ✅ Only 3 cards: Agenda, Campanhas, Configurações
// ✅ Removed duplicate navigation (Ver Clientes, Análises, Operações)
// ✅ Larger, more prominent design
// ✅ Brand colors for better integration
//
// CHANGELOG:
// v2.0 (2025-11-15): Removed navigation duplicates, kept only utility actions

import React from 'react';
import { Calendar, MessageSquare, Settings } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280'
};

const QuickActionsCards = ({ onAction }) => {
  const actions = [
    {
      id: 'schedule',
      label: 'Agenda',
      description: 'Manutenções e tarefas',
      icon: Calendar,
      color: COLORS.purple,
      bgColor: '#ede9fe'
    },
    {
      id: 'campaigns',
      label: 'Campanhas',
      description: 'Marketing e SMS',
      icon: MessageSquare,
      color: COLORS.pink,
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
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.875rem'
    }}>
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <div
            key={action.id}
            onClick={() => onAction?.(action.id)}
            style={{
              background: 'white',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.625rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = action.bgColor;
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
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
              borderRadius: '10px',
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
                marginBottom: '0.2rem'
              }}>
                {action.label}
              </div>
              <div style={{
                fontSize: '11px',
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
