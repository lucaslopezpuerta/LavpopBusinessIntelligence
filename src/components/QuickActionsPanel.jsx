import React from 'react';
import { FileDown, Users, TrendingUp, Settings, MessageCircle, Calendar } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  gray: '#6b7280'
};

const QuickActionsPanel = ({ onAction }) => {
  const actions = [
    {
      id: 'export-data',
      label: 'Export Data',
      description: 'Download CSV reports',
      icon: FileDown,
      color: COLORS.primary,
      bgColor: '#e3f2fd'
    },
    {
      id: 'view-customers',
      label: 'Customers',
      description: 'View customer lifecycle',
      icon: Users,
      color: COLORS.accent,
      bgColor: '#e8f5e9'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Deep dive analysis',
      icon: TrendingUp,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      id: 'operations',
      label: 'Operations',
      description: 'Machine efficiency',
      icon: Settings,
      color: '#10306B',
      bgColor: '#e3f2fd'
    },
    {
      id: 'contact-atrisk',
      label: 'Contact At-Risk',
      description: 'Bulk WhatsApp message',
      icon: MessageCircle,
      color: '#25D366',
      bgColor: '#dcfce7'
    },
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'Plan maintenance',
      icon: Calendar,
      color: '#dc2626',
      bgColor: '#fee2e2'
    }
  ];

  const handleAction = (actionId) => {
    if (onAction) {
      onAction(actionId);
    } else {
      // Default behavior
      console.log('Action triggered:', actionId);
      
      switch(actionId) {
        case 'view-customers':
          // Navigate to customers tab (you'll implement this)
          alert('Navigate to Customers tab');
          break;
        case 'analytics':
          alert('Navigate to Analytics tab');
          break;
        case 'operations':
          alert('Navigate to Operations tab');
          break;
        case 'export-data':
          alert('Export functionality coming soon');
          break;
        case 'contact-atrisk':
          alert('Bulk contact feature coming soon');
          break;
        case 'schedule':
          alert('Scheduling feature coming soon');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          fontSize: '16px',
          fontWeight: '600',
          color: COLORS.primary,
          margin: 0,
          marginBottom: '0.25rem'
        }}>
          Quick Actions
        </h3>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Common tasks and shortcuts
        </p>
      </div>

      {/* Actions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem'
      }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = action.bgColor;
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: action.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon style={{ width: '20px', height: '20px', color: action.color }} />
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: COLORS.primary,
                  marginBottom: '2px'
                }}>
                  {action.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.gray,
                  lineHeight: '1.3'
                }}>
                  {action.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsPanel;
