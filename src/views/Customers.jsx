// Customers View v1.0 - Integrated CustomerLifecycleTool V2.1 Design
import React, { useState, useMemo } from 'react';
import { 
  Users, Phone, MessageCircle, Search, Download, 
  TrendingUp, Calendar, DollarSign, AlertCircle,
  Filter, X, ChevronDown, Award
} from 'lucide-react';
import { formatCurrency } from '../utils/numberUtils';
import { calculateCustomerMetrics } from '../utils/customerMetrics';

const BRAND_COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  lightBlue: '#f0f9ff',
  lightGreen: '#f0fdf4'
};

const URGENT_THRESHOLD = 300; // R$ threshold for "urgent" customers

// Risk badge colors and icons
const getRiskConfig = (riskLevel) => {
  const configs = {
    'Healthy': { 
      bg: BRAND_COLORS.lightGreen, 
      text: BRAND_COLORS.accent, 
      border: BRAND_COLORS.accent,
      icon: '🟢',
      label: 'Saudável'
    },
    'Monitor': { 
      bg: BRAND_COLORS.lightBlue, 
      text: BRAND_COLORS.primary, 
      border: BRAND_COLORS.primary,
      icon: '🔵',
      label: 'Monitorar'
    },
    'At Risk': { 
      bg: '#fef3c7', 
      text: '#d97706', 
      border: '#f59e0b',
      icon: '⚠️',
      label: 'Em Risco'
    },
    'Churning': { 
      bg: '#fee2e2', 
      text: '#dc2626', 
      border: '#ef4444',
      icon: '🚨',
      label: 'Crítico'
    },
    'New Customer': { 
      bg: '#f3e8ff', 
      text: '#9333ea', 
      border: '#a855f7',
      icon: '🆕',
      label: 'Novo'
    },
    'Lost': { 
      bg: '#f3f4f6', 
      text: '#6b7280', 
      border: '#9ca3af',
      icon: '⛔',
      label: 'Perdido'
    }
  };
  return configs[riskLevel] || configs['Monitor'];
};

// Compact Customer Card
const CustomerCard = ({ customer, onClick }) => {
  const riskConfig = getRiskConfig(customer.riskLevel);
  
  // Determine card background
  const getCardBackground = (riskLevel) => {
    switch(riskLevel) {
      case 'Churning': return '#fee2e2';
      case 'At Risk': return '#fef3c7';
      case 'Monitor': return '#f0f9ff';
      case 'Lost': return '#f3f4f6';
      default: return '#ffffff';
    }
  };

  const handleCall = (e) => {
    e.stopPropagation();
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: getCardBackground(customer.riskLevel),
        border: `2px solid ${riskConfig.border}`,
        borderRadius: '12px',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header: Risk Badge + Days Since Last Visit */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '0.75rem'
      }}>
        <span style={{
          backgroundColor: riskConfig.bg,
          color: riskConfig.text,
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>{riskConfig.icon}</span>
          {riskConfig.label}
        </span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Última visita</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
            {customer.daysSinceLastVisit}d atrás
          </div>
        </div>
      </div>

      {/* Customer Name */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '0.75rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {customer.name}
      </h3>

      {/* Two-column metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Gasto Total</div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: BRAND_COLORS.primary 
          }}>
            {formatCurrency(customer.netTotal)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Visitas</div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: BRAND_COLORS.accent 
          }}>
            {customer.transactions}
          </div>
        </div>
      </div>

      {/* Second row: Segment + Frequency */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '0.75rem',
        fontSize: '13px'
      }}>
        <div>
          <span style={{ color: '#6b7280' }}>Segmento: </span>
          <span style={{ fontWeight: '600' }}>{customer.segment}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Freq: </span>
          <span style={{ fontWeight: '600' }}>
            {customer.avgDaysBetween ? `${customer.avgDaysBetween}d` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Risk-specific metrics for At Risk/Churning */}
      {(customer.riskLevel === 'At Risk' || customer.riskLevel === 'Churning') && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            fontSize: '13px'
          }}>
            <div>
              <span style={{ color: '#6b7280' }}>Atraso: </span>
              <span style={{ fontWeight: '700', color: '#dc2626' }}>
                {customer.daysOverdue}d
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Retorno: </span>
              <span style={{ 
                fontWeight: '700',
                color: customer.returnLikelihood < 30 ? '#dc2626' : 
                       customer.returnLikelihood < 60 ? '#d97706' : '#059669'
              }}>
                {customer.returnLikelihood}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {customer.phone && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={handleCall}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: BRAND_COLORS.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Phone size={14} />
            Ligar
          </button>
          <button
            onClick={handleWhatsApp}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

// Customer Detail Modal
const CustomerDetailModal = ({ customer, onClose }) => {
  if (!customer) return null;

  const riskConfig = getRiskConfig(customer.riskLevel);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}
    onClick={onClose}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              {customer.name}
            </h2>
            <span style={{
              backgroundColor: riskConfig.bg,
              color: riskConfig.text,
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span>{riskConfig.icon}</span>
              {riskConfig.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={24} color="#6b7280" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <MetricBox
              icon={<DollarSign size={20} color={BRAND_COLORS.primary} />}
              label="Gasto Total"
              value={formatCurrency(customer.netTotal)}
              color={BRAND_COLORS.primary}
            />
            <MetricBox
              icon={<TrendingUp size={20} color={BRAND_COLORS.accent} />}
              label="Total de Visitas"
              value={customer.transactions}
              color={BRAND_COLORS.accent}
            />
            <MetricBox
              icon={<Calendar size={20} color="#6b7280" />}
              label="Dias desde última visita"
              value={`${customer.daysSinceLastVisit}d`}
              color="#374151"
            />
            <MetricBox
              icon={<TrendingUp size={20} color="#6b7280" />}
              label="Frequência média"
              value={customer.avgDaysBetween ? `${customer.avgDaysBetween}d` : 'N/A'}
              color="#374151"
            />
          </div>

          {/* Detailed Info Sections */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              Informações do Cliente
            </h3>
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <InfoRow label="Documento" value={customer.doc} />
              <InfoRow label="Segmento RFM" value={customer.segment} />
              {customer.phone && <InfoRow label="Telefone" value={customer.phone} />}
              <InfoRow label="Primeira visita" value={customer.firstVisit?.toLocaleDateString('pt-BR')} />
              <InfoRow label="Última visita" value={customer.lastVisit?.toLocaleDateString('pt-BR')} />
            </div>
          </div>

          {/* Service Preferences */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              Preferências de Serviço
            </h3>
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <InfoRow 
                label="Total de serviços" 
                value={customer.totalServices} 
              />
              <InfoRow 
                label="Serviços por visita" 
                value={customer.servicesPerVisit} 
              />
              <InfoRow 
                label="Lavagens" 
                value={`${customer.washServices} (${customer.washPercentage}%)`} 
              />
              <InfoRow 
                label="Secagens" 
                value={`${customer.dryServices} (${customer.dryPercentage}%)`} 
              />
            </div>
          </div>

          {/* Risk Analysis (if applicable) */}
          {(customer.riskLevel === 'At Risk' || customer.riskLevel === 'Churning') && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <AlertCircle size={20} color="#dc2626" />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#dc2626',
                  margin: 0
                }}>
                  Análise de Risco
                </h3>
              </div>
              <InfoRow 
                label="Dias de atraso" 
                value={`${customer.daysOverdue}d`}
                valueColor="#dc2626"
              />
              <InfoRow 
                label="Probabilidade de retorno" 
                value={`${customer.returnLikelihood}%`}
                valueColor={customer.returnLikelihood < 30 ? '#dc2626' : '#d97706'}
              />
            </div>
          )}

          {/* Action Buttons */}
          {customer.phone && (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => window.location.href = `tel:${customer.phone}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: BRAND_COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <Phone size={18} />
                Ligar para Cliente
              </button>
              <button
                onClick={() => {
                  const cleanPhone = customer.phone.replace(/\D/g, '');
                  window.open(`https://wa.me/${cleanPhone}`, '_blank');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <MessageCircle size={18} />
                Enviar WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper components
const MetricBox = ({ icon, label, value, color }) => (
  <div style={{
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  }}>
    <div>{icon}</div>
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '700', color }}>
        {value}
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value, valueColor = '#111827' }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #e5e7eb'
  }}>
    <span style={{ fontSize: '14px', color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: '600', color: valueColor }}>
      {value || 'N/A'}
    </span>
  </div>
);

// Main Customers View Component
const Customers = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState('spending');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all' or 'urgent'

  const customerMetrics = useMemo(() => {
    if (!data?.sales || !data?.rfm) return null;
    return calculateCustomerMetrics(data.sales, data.rfm);
  }, [data?.sales, data?.rfm]);

  if (!customerMetrics) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          Carregando dados dos clientes...
        </div>
      </div>
    );
  }

  const { allCustomers, activeCustomers } = customerMetrics;

  // Get unique segments for filter
  const segments = useMemo(() => {
    const segmentSet = new Set(activeCustomers.map(c => c.segment));
    return ['all', ...Array.from(segmentSet)].filter(Boolean);
  }, [activeCustomers]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let filtered = activeCustomers;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.doc.includes(term) ||
        (c.phone && c.phone.includes(term))
      );
    }

    // Segment filter
    if (selectedSegment !== 'all') {
      filtered = filtered.filter(c => c.segment === selectedSegment);
    }

    // Risk filter
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(c => c.riskLevel === selectedRisk);
    }

    // Sorting
    switch(sortBy) {
      case 'spending':
        filtered.sort((a, b) => b.netTotal - a.netTotal);
        break;
      case 'visits':
        filtered.sort((a, b) => b.transactions - a.transactions);
        break;
      case 'lastVisit':
        filtered.sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit);
        break;
      case 'risk':
        const riskOrder = { 'Churning': 0, 'At Risk': 1, 'Monitor': 2, 'Healthy': 3, 'New Customer': 4, 'Lost': 5 };
        filtered.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
        break;
      default:
        break;
    }

    return filtered;
  }, [activeCustomers, searchTerm, selectedSegment, selectedRisk, sortBy]);

  // Urgent customers (high-value at-risk)
  const urgentCustomers = useMemo(() => {
    return activeCustomers
      .filter(c => 
        (c.riskLevel === 'At Risk' || c.riskLevel === 'Churning') &&
        c.netTotal >= URGENT_THRESHOLD
      )
      .sort((a, b) => b.netTotal - a.netTotal);
  }, [activeCustomers]);

  // Export to CSV
  const handleExport = () => {
    const customers = activeView === 'urgent' ? urgentCustomers : filteredCustomers;
    
    const csvContent = [
      ['Nome', 'Documento', 'Telefone', 'Segmento', 'Nível de Risco', 'Gasto Total', 'Visitas', 'Dias Desde Última Visita', 'Frequência Média', 'Probabilidade de Retorno'].join(','),
      ...customers.map(c => [
        c.name,
        c.doc,
        c.phone || '',
        c.segment,
        c.riskLevel,
        c.netTotal.toFixed(2),
        c.transactions,
        c.daysSinceLastVisit,
        c.avgDaysBetween || 'N/A',
        c.returnLikelihood || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lavpop-clientes-${activeView}-${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  const displayCustomers = activeView === 'urgent' ? urgentCustomers : filteredCustomers;

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: BRAND_COLORS.primary,
          marginBottom: '0.5rem'
        }}>
          Gestão de Clientes
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>
          {activeCustomers.length} clientes ativos • {urgentCustomers.length} necessitam atenção urgente
        </p>
      </div>

      {/* View Toggle */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        backgroundColor: '#f3f4f6',
        padding: '0.25rem',
        borderRadius: '8px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveView('all')}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: activeView === 'all' ? 'white' : 'transparent',
            color: activeView === 'all' ? BRAND_COLORS.primary : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeView === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Users size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Todos os Clientes ({activeCustomers.length})
        </button>
        <button
          onClick={() => setActiveView('urgent')}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: activeView === 'urgent' ? 'white' : 'transparent',
            color: activeView === 'urgent' ? '#dc2626' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeView === 'urgent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Ação Urgente ({urgentCustomers.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search 
              size={20} 
              color="#6b7280"
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nome, documento ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = BRAND_COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Show/Hide Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: showFilters ? BRAND_COLORS.primary : 'white',
              color: showFilters ? 'white' : BRAND_COLORS.primary,
              border: `2px solid ${BRAND_COLORS.primary}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Filter size={16} />
            Filtros
            <ChevronDown 
              size={16} 
              style={{
                transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: BRAND_COLORS.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Segmento
              </label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">Todos os Segmentos</option>
                {segments.filter(s => s !== 'all').map(seg => (
                  <option key={seg} value={seg}>{seg}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Nível de Risco
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">Todos os Níveis</option>
                <option value="Healthy">Saudável</option>
                <option value="Monitor">Monitorar</option>
                <option value="At Risk">Em Risco</option>
                <option value="Churning">Crítico</option>
                <option value="New Customer">Novo</option>
                <option value="Lost">Perdido</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Ordenar Por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="spending">Gasto Total</option>
                <option value="visits">Número de Visitas</option>
                <option value="lastVisit">Última Visita</option>
                <option value="risk">Nível de Risco</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Customer Cards Grid */}
      {displayCustomers.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {displayCustomers.map(customer => (
            <CustomerCard
              key={customer.doc}
              customer={customer}
              onClick={() => setSelectedCustomer(customer)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'white',
          borderRadius: '12px'
        }}>
          <Users size={64} color="#d1d5db" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
            Nenhum cliente encontrado
          </h3>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Tente ajustar seus filtros de busca
          </p>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default Customers;
