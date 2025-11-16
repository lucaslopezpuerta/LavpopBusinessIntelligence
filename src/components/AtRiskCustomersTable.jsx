// AtRiskCustomersTable.jsx v3.0 - CLEAN PROFESSIONAL REDESIGN
// ✅ Clean header with brand blue accent
// ✅ Simple, professional color scheme
// ✅ Elegant table design with better spacing
// ✅ Brand-focused (no gradient, clean lines)
// ✅ Ultra compact for space efficiency
//
// CHANGELOG:
// v3.0 (2025-11-15): Complete redesign - clean, professional, brand-focused

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280',
  lightGray: '#f3f4f6'
};

const AtRiskCustomersTable = ({ customerMetrics, salesData, maxRows = 5 }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  if (!customerMetrics || !customerMetrics.activeCustomers) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: COLORS.gray
      }}>
        Carregando clientes em risco...
      </div>
    );
  }

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
        gap: '0.3rem',
        padding: '4px 10px',
        borderRadius: '6px',
        background: `${color}10`,
        border: `1px solid ${color}30`,
        color: color,
        fontSize: '11px',
        fontWeight: '600'
      }}>
        <AlertTriangle style={{ width: '12px', height: '12px' }} />
        {translatedLevel} {churnPercent}%
      </div>
    );
  };

  if (atRiskCustomers.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{
          color: COLORS.accent,
          fontSize: '16px',
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
        borderRadius: '10px',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Clean Header with Brand Accent */}
        <div style={{
          marginBottom: '0.875rem',
          paddingBottom: '0.75rem',
          borderBottom: `2px solid ${COLORS.primary}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `${COLORS.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle style={{ width: '18px', height: '18px', color: COLORS.primary }} />
            </div>
            <h3 style={{ 
              fontSize: '15px',
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
            marginLeft: '40px'
          }}>
            Alto valor, precisam atenção • Clique para detalhes
          </p>
        </div>

        {/* Clean Professional Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{
                background: COLORS.lightGray
              }}>
                <th style={{ 
                  padding: '0.625rem 0.75rem',
                  fontWeight: '600',
                  color: COLORS.gray,
                  fontSize: '11px',
                  textAlign: 'left',
                  borderTopLeftRadius: '6px',
                  borderBottomLeftRadius: '6px'
                }}>
                  CLIENTE
                </th>
                <th style={{ 
                  padding: '0.625rem 0.75rem',
                  fontWeight: '600',
                  color: COLORS.gray,
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  RISCO
                </th>
                <th style={{ 
                  padding: '0.625rem 0.75rem',
                  fontWeight: '600',
                  color: COLORS.gray,
                  fontSize: '11px',
                  textAlign: 'right'
                }}>
                  TOTAL
                </th>
                <th style={{ 
                  padding: '0.625rem 0.75rem',
                  fontWeight: '600',
                  color: COLORS.gray,
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  DIAS
                </th>
                <th style={{ 
                  padding: '0.625rem 0.75rem',
                  fontWeight: '600',
                  color: COLORS.gray,
                  fontSize: '11px',
                  textAlign: 'right',
                  borderTopRightRadius: '6px',
                  borderBottomRightRadius: '6px'
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
                    borderBottom: index < atRiskCustomers.length - 1 ? `1px solid ${COLORS.lightGray}` : 'none',
                    transition: 'background 0.15s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.primary}05`}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px', marginBottom: '2px' }}>
                      {customer.name || 'Cliente sem nome'}
                    </div>
                    {customer.phone && (
                      <div style={{ fontSize: '11px', color: COLORS.gray }}>
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {getRiskBadge(customer.riskLevel, customer.returnLikelihood)}
                  </td>
                  <td style={{ 
                    padding: '0.75rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: COLORS.primary,
                    fontSize: '13px'
                  }}>
                    {formatCurrency(customer.netTotal || 0)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: COLORS.lightGray,
                      fontSize: '12px',
                      fontWeight: '600',
                      color: COLORS.gray
                    }}>
                      {customer.daysSinceLastVisit || 0}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      {customer.phone && formatPhone(customer.phone) && (
                        <>
                          <button
                            onClick={(e) => handleCall(e, customer.phone)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${COLORS.primary}30`,
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
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
                              e.currentTarget.style.borderColor = `${COLORS.primary}30`;
                            }}
                          >
                            <Phone style={{ width: '12px', height: '12px' }} />
                            Ligar
                          </button>
                          <button
                            onClick={(e) => handleWhatsApp(e, customer.phone)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #25D36630',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
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
                              e.currentTarget.style.borderColor = '#25D36630';
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
