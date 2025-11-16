// AtRiskCustomersTable_v2.0.jsx
// ✅ Integrated CustomerDetailModal
// ✅ Verified RFM data merge (phone, name already in customerMetrics.activeCustomers)
// ✅ Added click-to-view-details functionality

import React, { useState } from 'react';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';

const COLORS = {
  primary: '#10306B',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280'
};

const AtRiskCustomersTable = ({ customerMetrics, salesData }) => {
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
        Loading at-risk customers...
      </div>
    );
  }

  // Get top 5 at-risk and churning customers, sorted by total spending
  const atRiskCustomers = customerMetrics.activeCustomers
    .filter(c => c.riskLevel === 'At Risk' || c.riskLevel === 'Churning')
    .sort((a, b) => b.netTotal - a.netTotal)
    .slice(0, 5);

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

  const getRiskBadge = (riskLevel, likelihood) => {
    const color = getRiskColor(riskLevel);
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
        {riskLevel} ({likelihood}%)
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
          🎉 Great news!
        </div>
        <div style={{ color: COLORS.gray, fontSize: '14px' }}>
          No at-risk customers detected
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
              fontWeight: '600',
              color: COLORS.primary,
              margin: 0
            }}>
              Top 5 At-Risk Customers
            </h3>
          </div>
          <p style={{
            fontSize: '13px',
            color: COLORS.gray,
            margin: 0
          }}>
            High-value customers who need immediate attention • Click row for details
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
                  Customer
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px' }}>
                  Risk Status
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px', textAlign: 'right' }}>
                  Total Spent
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px', textAlign: 'center' }}>
                  Days Overdue
                </th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: COLORS.gray, fontSize: '12px', textAlign: 'right' }}>
                  Actions
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
                    <div style={{ fontWeight: '500', color: COLORS.primary }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.gray }}>
                      {customer.transactions} visits
                      {customer.phone && (
                        <span style={{ marginLeft: '0.5rem' }}>• 📞 {customer.phone}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {getRiskBadge(customer.riskLevel, customer.returnLikelihood)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: COLORS.primary }}>
                    {formatCurrency(customer.netTotal)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {customer.daysOverdue} days
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {customer.phone && formatPhone(customer.phone) ? (
                        <>
                          <button
                            onClick={(e) => handleCall(e, customer.phone)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              padding: 0,
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = COLORS.primary;
                              e.currentTarget.style.borderColor = COLORS.primary;
                              e.currentTarget.querySelector('svg').style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.querySelector('svg').style.color = COLORS.primary;
                            }}
                            title="Call"
                          >
                            <Phone style={{ width: '16px', height: '16px', color: COLORS.primary }} />
                          </button>
                          <button
                            onClick={(e) => handleWhatsApp(e, customer.phone)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              padding: 0,
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#25D366';
                              e.currentTarget.style.borderColor = '#25D366';
                              e.currentTarget.querySelector('svg').style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.querySelector('svg').style.color = '#25D366';
                            }}
                            title="WhatsApp"
                          >
                            <MessageCircle style={{ width: '16px', height: '16px', color: '#25D366' }} />
                          </button>
                        </>
                      ) : (
                        <span style={{ 
                          fontSize: '12px', 
                          color: COLORS.gray,
                          fontStyle: 'italic'
                        }}>
                          No phone
                        </span>
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
          onClose={() => setSelectedCustomer(null)}
          salesData={salesData}
        />
      )}
    </>
  );
};

export default AtRiskCustomersTable;
