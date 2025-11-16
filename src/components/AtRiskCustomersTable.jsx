// AtRiskCustomersTable.jsx v2.1 - PORTUGUESE & MAX ROWS
// ✅ Full Portuguese translation
// ✅ Support for maxRows prop (default 10)
// ✅ Integrated CustomerDetailModal
// ✅ Click-to-view-details functionality
//
// CHANGELOG:
// v2.1 (2025-11-15): Added Portuguese labels, maxRows prop support
// v2.0 (2025-11-14): Integrated CustomerDetailModal with click functionality

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const COLORS = {
  primary: '#1a5a8e',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280'
};

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!customerMetrics || !customerMetrics.activeCustomers) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Carregando clientes em risco...
      </div>
    );
  }

  // Get top N at-risk and churning customers, sorted by total spending
  const atRiskCustomers = customerMetrics.activeCustomers
    .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
    .sort((a, b) => b.netTotal - a.netTotal)
    .slice(0, maxRows);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned;
    }
    return null;
  };

  const handleCall = (e, phone) => {
    e.stopPropagation(); // Prevent row click
    const cleaned = formatPhone(phone);
    if (cleaned) {
      window.location.href = `tel:+55${cleaned}`;
    }
  };

  const handleWhatsApp = (e, phone) => {
    e.stopPropagation(); // Prevent row click
    const cleaned = formatPhone(phone);
    if (cleaned) {
      window.open(`https://web.whatsapp.com/send?phone=55${cleaned}`, '_blank');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Churning': return COLORS.red;
      case 'At Risk': return COLORS.amber;
      default: return COLORS.gray;
    }
  };

  const translateRiskLevel = (riskLevel) => {
    switch (riskLevel) {
      case 'Churning': return 'Perdendo';
      case 'At Risk': return 'Em Risco';
      default: return riskLevel;
    }
  };

  const getRiskBadge = (riskLevel, likelihood) => {
    const color = getRiskColor(riskLevel);
    const translatedLevel = translateRiskLevel(riskLevel);
    
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '4px 10px',
        borderRadius: '12px',
        background: `${color}15`,
        color: color,
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        <AlertTriangle style={{ width: '12px', height: '12px' }} />
        {translatedLevel} ({likelihood}%)
      </div>
    );
  };

  if (atRiskCustomers.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{
          color: COLORS.primary,
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          🎉 Ótimas notícias!
        </div>
        <div style={{ color: COLORS.gray, fontSize: '14px' }}>
          Nenhum cliente em risco detectado
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: COLORS.amber }} />
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '700',
              color: COLORS.primary,
              margin: 0
            }}>
              Top {maxRows} Clientes em Risco
            </h3>
          </div>
          <p style={{
            fontSize: '13px',
            color: COLORS.gray,
            margin: 0
          }}>
            Clientes de alto valor que precisam de atenção imediata • Clique para detalhes
          </p>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid #e5e7eb',
                textAlign: 'left'
              }}>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px' }}>
                  CLIENTE
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px' }}>
                  STATUS DE RISCO
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px', textAlign: 'right' }}>
                  TOTAL GASTO
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px', textAlign: 'center' }}>
                  DIAS INATIVO
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px', textAlign: 'right' }}>
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer, index) => (
                <tr 
                  key={customer.doc || index}
                  style={{ 
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                      {customer.name || 'Cliente sem nome'}
                    </div>
                    {customer.phone && (
                      <div style={{ fontSize: '12px', color: COLORS.gray }}>
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {getRiskBadge(customer.riskLevel, customer.churnLikelihood)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: COLORS.primary }}>
                    {formatCurrency(customer.netTotal || 0)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#f3f4f6',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: COLORS.gray
                    }}>
                      {customer.daysSinceLastPurchase || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {customer.phone && formatPhone(customer.phone) && (
                        <>
                          <button
                            onClick={(e) => handleCall(e, customer.phone)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: COLORS.primary,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = COLORS.primary;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = COLORS.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = COLORS.primary;
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                          >
                            <Phone style={{ width: '14px', height: '14px' }} />
                            Ligar
                          </button>
                          <button
                            onClick={(e) => handleWhatsApp(e, customer.phone)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#25D366',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#25D366';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = '#25D366';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#25D366';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                          >
                            <MessageCircle style={{ width: '14px', height: '14px' }} />
                            WhatsApp
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '12px',
          color: COLORS.gray
        }}>
          💡 <strong>Dica:</strong> Clique em qualquer cliente para ver histórico completo e sugestões de reativação
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          salesData={salesData}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </>
  );
};

export default AtRiskCustomersTable;
