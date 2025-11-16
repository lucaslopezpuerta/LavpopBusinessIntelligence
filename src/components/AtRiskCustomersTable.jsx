// AtRiskCustomersTable.jsx v2.3 - ULTRA COMPACT & ENHANCED DESIGN
// ✅ Reduced padding and spacing for compactness
// ✅ Removed footer tip to save space
// ✅ Enhanced visual design with gradients
// ✅ Center-aligned columns
// ✅ Fixed risk percentage display
//
// CHANGELOG:
// v2.3 (2025-11-15): Ultra compact design, removed footer, enhanced visuals
// v2.2 (2025-11-15): Fixed risk % display, center-aligned all columns

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
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
        padding: '1rem',
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
    e.stopPropagation();
    const cleaned = formatPhone(phone);
    if (cleaned) {
      window.location.href = `tel:+55${cleaned}`;
    }
  };

  const handleWhatsApp = (e, phone) => {
    e.stopPropagation();
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

  const getRiskBadge = (riskLevel, returnLikelihood) => {
    const color = getRiskColor(riskLevel);
    const translatedLevel = translateRiskLevel(riskLevel);
    const churnPercent = returnLikelihood !== undefined && returnLikelihood !== null 
      ? Math.round(100 - returnLikelihood) 
      : 0;
    
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '3px 8px',
        borderRadius: '12px',
        background: `${color}15`,
        color: color,
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        <AlertTriangle style={{ width: '11px', height: '11px' }} />
        {translatedLevel} ({churnPercent}%)
      </div>
    );
  };

  if (atRiskCustomers.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{
          color: COLORS.primary,
          fontSize: '15px',
          fontWeight: '600',
          marginBottom: '0.25rem'
        }}>
          🎉 Ótimas notícias!
        </div>
        <div style={{ color: COLORS.gray, fontSize: '13px' }}>
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
        padding: '1rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Compact Header with Gradient */}
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.75rem',
          background: `linear-gradient(135deg, ${COLORS.amber}15 0%, ${COLORS.red}15 100%)`,
          borderRadius: '8px',
          border: `1px solid ${COLORS.amber}30`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle style={{ width: '18px', height: '18px', color: COLORS.amber }} />
            <h3 style={{ 
              fontSize: '14px',
              fontWeight: '700',
              color: COLORS.primary,
              margin: 0
            }}>
              Top {maxRows} Clientes em Risco
            </h3>
          </div>
          <p style={{
            fontSize: '11px',
            color: COLORS.gray,
            margin: 0,
            marginTop: '0.25rem',
            marginLeft: '26px'
          }}>
            Clientes de alto valor • Clique para detalhes
          </p>
        </div>

        {/* Compact Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid #e5e7eb'
              }}>
                <th style={{ 
                  padding: '8px 6px', 
                  fontWeight: '600', 
                  color: COLORS.gray, 
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  CLIENTE
                </th>
                <th style={{ 
                  padding: '8px 6px', 
                  fontWeight: '600', 
                  color: COLORS.gray, 
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  STATUS
                </th>
                <th style={{ 
                  padding: '8px 6px', 
                  fontWeight: '600', 
                  color: COLORS.gray, 
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  TOTAL
                </th>
                <th style={{ 
                  padding: '8px 6px', 
                  fontWeight: '600', 
                  color: COLORS.gray, 
                  fontSize: '11px', 
                  textAlign: 'center'
                }}>
                  DIAS
                </th>
                <th style={{ 
                  padding: '8px 6px', 
                  fontWeight: '600', 
                  color: COLORS.gray, 
                  fontSize: '11px', 
                  textAlign: 'center'
                }}>
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.primary}08`;
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '12px', marginBottom: '2px' }}>
                      {customer.name || 'Cliente sem nome'}
                    </div>
                    {customer.phone && (
                      <div style={{ fontSize: '10px', color: COLORS.gray }}>
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    {getRiskBadge(customer.riskLevel, customer.returnLikelihood)}
                  </td>
                  <td style={{ 
                    padding: '8px 6px', 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: COLORS.primary,
                    fontSize: '12px'
                  }}>
                    {formatCurrency(customer.netTotal || 0)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 6px',
                      borderRadius: '6px',
                      background: '#f3f4f6',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: COLORS.gray
                    }}>
                      {customer.daysSinceLastVisit || 0}
                    </span>
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                      {customer.phone && formatPhone(customer.phone) && (
                        <>
                          <button
                            onClick={(e) => handleCall(e, customer.phone)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11px',
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
                            <Phone style={{ width: '12px', height: '12px' }} />
                            Ligar
                          </button>
                          <button
                            onClick={(e) => handleWhatsApp(e, customer.phone)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11px',
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
                            <MessageCircle style={{ width: '12px', height: '12px' }} />
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
