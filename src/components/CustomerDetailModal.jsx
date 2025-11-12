// CustomerDetailModal_v1.0.jsx
// ✅ Reusable modal for customer details across all dashboard components
// ✅ Shows full transaction history, risk timeline, service preferences
// ✅ Integrated Call/WhatsApp buttons

import React, { useMemo } from 'react';
import { X, Phone, MessageCircle, TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  red: '#dc2626',
  amber: '#f59e0b',
  gray: '#6b7280',
  lightGray: '#f3f4f6'
};

/**
 * Risk badge colors matching V2.1
 */
const getRiskColor = (riskLevel) => {
  switch(riskLevel) {
    case 'Healthy': return { bg: '#f0fdf4', text: COLORS.accent, border: COLORS.accent };
    case 'Monitor': return { bg: '#eff6ff', text: COLORS.primary, border: COLORS.primary };
    case 'At Risk': return { bg: '#fef3c7', text: COLORS.amber, border: COLORS.amber };
    case 'Churning': return { bg: '#fee2e2', text: COLORS.red, border: COLORS.red };
    case 'New Customer': return { bg: '#f3e8ff', text: '#9333ea', border: '#a855f7' };
    case 'Lost': return { bg: COLORS.lightGray, text: COLORS.gray, border: '#9ca3af' };
    default: return { bg: COLORS.lightGray, text: COLORS.gray, border: '#9ca3af' };
  }
};

/**
 * Risk level icons matching V2.1
 */
const getRiskIcon = (riskLevel) => {
  switch(riskLevel) {
    case 'Healthy': return '🟢';
    case 'Monitor': return '🔵';
    case 'At Risk': return '⚠️';
    case 'Churning': return '🚨';
    case 'New Customer': return '🆕';
    case 'Lost': return '⛔';
    default: return '❓';
  }
};

const CustomerDetailModal = ({ customer, onClose, salesData = [] }) => {
  // Calculate transaction history for this customer
  const transactionHistory = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    const customerTxns = salesData
      .filter(row => {
        const doc = String(row.Doc_Cliente || row.document || '').replace(/\D/g, '').padStart(11, '0');
        return doc === customer.doc;
      })
      .map(row => ({
        date: new Date(row.Data || row.Data_Hora || ''),
        amount: parseFloat(row.Valor_Pago || row.net_value || 0),
        services: String(row.Maquina || row.machine || '').split(',').length
      }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 10); // Last 10 transactions
    
    return customerTxns;
  }, [salesData, customer.doc]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const riskColors = getRiskColor(customer.riskLevel);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.primary,
                margin: 0
              }}>
                {customer.name}
              </h2>
              
              {/* Risk Badge */}
              <span 
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: riskColors.bg,
                  color: riskColors.text,
                  border: `2px solid ${riskColors.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {getRiskIcon(customer.riskLevel)} {customer.riskLevel}
              </span>
            </div>

            {/* Segment */}
            <div style={{ fontSize: '14px', color: COLORS.gray, marginBottom: '0.5rem' }}>
              Segment: <span style={{ fontWeight: '600', color: COLORS.primary }}>{customer.segment}</span>
            </div>

            {/* Phone with action buttons */}
            {customer.phone && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={handleCall}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '8px 16px',
                    background: COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Phone style={{ width: '16px', height: '16px' }} />
                  Call {customer.phone}
                </button>
                <button
                  onClick={handleWhatsApp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '8px 16px',
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <MessageCircle style={{ width: '16px', height: '16px' }} />
                  WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = COLORS.lightGray}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X style={{ width: '24px', height: '24px', color: COLORS.gray }} />
          </button>
        </div>

        {/* Key Metrics Row */}
        <div style={{
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          background: COLORS.lightGray
        }}>
          <div>
            <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '4px', fontWeight: '500' }}>
              TOTAL SPENT
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS.primary }}>
              {formatCurrency(customer.netTotal)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '4px', fontWeight: '500' }}>
              VISITS
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS.primary }}>
              {customer.transactions}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '4px', fontWeight: '500' }}>
              AVG DAYS BETWEEN
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS.primary }}>
              {customer.avgDaysBetween || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '4px', fontWeight: '500' }}>
              DAYS SINCE LAST
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: customer.riskLevel === 'Churning' || customer.riskLevel === 'At Risk' ? COLORS.red : COLORS.primary }}>
              {customer.daysSinceLastVisit}
            </div>
          </div>
        </div>

        {/* Service Preferences */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Activity style={{ width: '18px', height: '18px' }} />
            Service Preferences
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '12px', color: COLORS.gray, marginBottom: '4px' }}>
                Wash Services
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.primary }}>
                {customer.washPercentage}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: COLORS.gray, marginBottom: '4px' }}>
                Dry Services
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.accent }}>
                {customer.dryPercentage}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: COLORS.gray, marginBottom: '4px' }}>
                Services/Visit
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.primary }}>
                {customer.servicesPerVisit}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar style={{ width: '18px', height: '18px' }} />
            Recent Transactions (Last 10)
          </h3>
          
          {transactionHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: COLORS.gray }}>
                      Date
                    </th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: COLORS.gray }}>
                      Amount
                    </th>
                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: COLORS.gray }}>
                      Services
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((txn, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px', color: COLORS.gray }}>
                        {formatDate(txn.date)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: COLORS.primary }}>
                        {formatCurrency(txn.amount)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: COLORS.gray }}>
                        {txn.services}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: COLORS.gray }}>
              No transaction history available
            </div>
          )}
        </div>

        {/* Risk Alert for At-Risk/Churning Customers */}
        {(customer.riskLevel === 'At Risk' || customer.riskLevel === 'Churning') && customer.daysOverdue > 0 && (
          <div style={{
            margin: '0 1.5rem 1.5rem 1.5rem',
            padding: '1rem',
            background: customer.riskLevel === 'Churning' ? '#fee2e2' : '#fef3c7',
            borderRadius: '8px',
            border: `2px solid ${customer.riskLevel === 'Churning' ? COLORS.red : COLORS.amber}`
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.primary, marginBottom: '4px' }}>
              ⚠️ Attention Required
            </div>
            <div style={{ fontSize: '13px', color: COLORS.gray }}>
              This customer is <strong>{customer.daysOverdue} days overdue</strong> based on their average visit frequency of {customer.avgDaysBetween} days. 
              Consider reaching out with a promotion or check-in call.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailModal;
