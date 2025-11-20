// CustomerDetailModal.jsx v2.2 - COMPACT PROFESSIONAL REDESIGN
// ✅ Matches At-Risk table design philosophy
// ✅ All text in Brazilian Portuguese
// ✅ Shows only last 5 transactions (not 10)
// ✅ Compact layout with optimized spacing
// ✅ Two-column grid for better space usage
// ✅ Professional brand colors
//
// CHANGELOG:
// v2.0 (2025-11-16): Complete redesign - compact, Portuguese, 5 transactions
// v1.5 (previous): English version with 10 transactions

import React, { useMemo } from 'react';
import { X, Phone, MessageCircle, Calendar, Activity, Tag, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { parseBrDate } from '../utils/dateUtils';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  red: '#dc2626',
  amber: '#f59e0b',
  gray: '#6b7280',
  lightGray: '#f3f4f6'
};

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

const translateRiskLevel = (riskLevel) => {
  const translations = {
    'Healthy': 'Saudável',
    'Monitor': 'Monitorar',
    'At Risk': 'Em Risco',
    'Churning': 'Perdendo',
    'New Customer': 'Novo Cliente',
    'Lost': 'Perdido'
  };
  return translations[riskLevel] || riskLevel;
};

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

/**
 * Parse machine string from Sales CSV
 */
const parseMachines = (machineStr) => {
  if (!machineStr || machineStr === 'N/A') return [];
  
  const parts = machineStr.split(',').map(s => s.trim());
  const machines = [];
  
  parts.forEach(part => {
    const washMatch = part.match(/Lavadora:\s*(\d+)/i);
    if (washMatch) {
      machines.push({ code: `L${washMatch[1]}`, type: 'wash' });
      return;
    }
    
    const dryMatch = part.match(/Secadora:\s*(\d+)/i);
    if (dryMatch) {
      machines.push({ code: `S${dryMatch[1]}`, type: 'dry' });
      return;
    }
  });
  
  return machines;
};

// Machine badges component
const MachineDisplay = ({ machineStr }) => {
  const machines = parseMachines(machineStr);
  
  if (machines.length === 0) {
    return <span style={{ color: COLORS.gray, fontSize: '11px' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {machines.map((machine, idx) => {
        const isWash = machine.type === 'wash';
        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700',
              background: isWash ? '#dbeafe' : '#AAF7A6',
              color: isWash ? COLORS.primary : '#2E4510',
              border: `1px solid ${isWash ? '#93c5fd' : '#86efac'}`
            }}
          >
            {machine.code}
          </span>
        );
      })}
    </div>
  );
};

// Coupon badge component
const CouponBadge = ({ couponCode }) => {
  if (!couponCode || couponCode === '' || couponCode.toLowerCase() === 'n/d') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: '600',
        background: '#f3f4f6',
        color: '#6b7280',
        border: '1px solid #d1d5db'
      }}>
        <XCircle style={{ width: '10px', height: '10px' }} />
        Não
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '700',
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    }}>
      <Tag style={{ width: '10px', height: '10px' }} />
      {couponCode}
    </span>
  );
};

const CustomerDetailModal = ({ customer, onClose, salesData = [] }) => {
    console.log('[CustomerDetailModal] customer.doc:', customer?.doc);
    console.log('[CustomerDetailModal] salesData length:', salesData?.length);
    console.log('[CustomerDetailModal] first row keys:', salesData[0] && Object.keys(salesData[0]));
    console.log('[CustomerDetailModal] first row doc fields:', {
    Doc_Cliente: salesData[0]?.Doc_Cliente,
    document: salesData[0]?.document,
    });

  const transactionHistory = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    const customerTxns = salesData
      .filter(row => {
        const doc = String(row.Doc_Cliente || row.document || '').replace(/\D/g, '').padStart(11, '0');
        return doc === customer.doc;
      })
      .map(row => {
        const dateStr = row.Data_Hora || row.Data || '';
        const date = parseBrDate(dateStr);
        
        const amountStr = String(row.Valor_Pago || row.net_value || '0');
        const amount = parseFloat(amountStr.replace(',', '.'));
        
        const machineStr = row.Maquinas || row.Maquina || row.machine || '';
        const machines = parseMachines(machineStr);
        const totalCycles = machines.length;
        
        const paymentMethod = row.Meio_de_Pagamento || row.payment_method || 'N/A';
        const couponCode = row.Codigo_Cupom || row.coupon_code || '';
        
        return {
          date,
          dateValid: date !== null && !isNaN(date.getTime()),
          amount,
          cycles: totalCycles,
          machineStr,
          paymentMethod,
          couponCode
        };
      })
      .filter(txn => txn.dateValid)
      .sort((a, b) => b.date - a.date)
      .slice(0, 5); // Only last 5 transactions
    
    return customerTxns;
  }, [salesData, customer.doc]);

  const formatCurrency = (value) => {
    if (isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleCall = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      window.location.href = `tel:+55${cleanPhone}`;
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/\D/g, '');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = isMobile 
        ? `https://api.whatsapp.com/send?phone=55${cleanPhone}` // Mobile: opens app
        : `https://web.whatsapp.com/send?phone=55${cleanPhone}`; // Desktop: opens web
      window.open(url, '_blank');
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
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* COMPACT HEADER */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
          padding: '1rem 1.25rem',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              {customer.name || 'Cliente sem nome'}
            </h2>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {customer.phone || 'Sem telefone'} • {customer.doc ? `CPF: ${customer.doc.slice(0, 3)}...${customer.doc.slice(-2)}` : 'Sem CPF'}
            </div>
          </div>

          {/* Risk Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              background: riskColors.bg,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: `2px solid ${riskColors.border}`,
              fontSize: '13px',
              fontWeight: '700',
              color: riskColors.text
            }}>
              {getRiskIcon(customer.riskLevel)} {translateRiskLevel(customer.riskLevel)}
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <X style={{ width: '20px', height: '20px', color: 'white' }} />
            </button>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleCall}
            disabled={!customer.phone}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: `2px solid ${COLORS.primary}`,
              background: 'white',
              cursor: customer.phone ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.primary,
              opacity: customer.phone ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (customer.phone) {
                e.currentTarget.style.background = COLORS.primary;
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = COLORS.primary;
            }}
          >
            <Phone style={{ width: '18px', height: '18px' }} />
            Ligar
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={!customer.phone}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '2px solid #25D366',
              background: 'white',
              cursor: customer.phone ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              fontWeight: '600',
              color: '#25D366',
              opacity: customer.phone ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (customer.phone) {
                e.currentTarget.style.background = '#25D366';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#25D366';
            }}
          >
            <MessageCircle style={{ width: '18px', height: '18px' }} />
            WhatsApp
          </button>
        </div>

        {/* TWO-COLUMN STATS GRID */}
        <div style={{
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {/* Column 1: Financial */}
          <div style={{
            background: COLORS.lightGray,
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: COLORS.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: 0,
              marginBottom: '0.75rem'
            }}>
              💰 Resumo Financeiro
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>Total Gasto</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
                  {formatCurrency(customer.netTotal || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>Total de Visitas</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
                  {customer.transactions || customer.frequency || 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>Gasto/Visita</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: COLORS.accent }}>
                  {formatCurrency(customer.transactions > 0 ? customer.netTotal / customer.transactions : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Behavior */}
          <div style={{
            background: COLORS.lightGray,
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: COLORS.gray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: 0,
              marginBottom: '0.75rem'
            }}>
              📊 Comportamento
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>Dias desde última visita</span>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: customer.daysSinceLastVisit > customer.avgDaysBetween ? COLORS.red : COLORS.accent
                }}>
                  {customer.daysSinceLastVisit || 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>Intervalo médio (dias)</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: COLORS.gray }}>
                  {customer.avgDaysBetween || 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.gray }}>Serviços/Visita</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
                  {customer.servicesPerVisit || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SERVICE PREFERENCES - COMPACT ROW */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity style={{ width: '16px', height: '16px', color: COLORS.primary }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase' }}>
              Preferências
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: COLORS.gray, marginBottom: '2px' }}>Lavagens</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
                {customer.washPercentage}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: COLORS.gray, marginBottom: '2px' }}>Secagens</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.accent }}>
                {customer.dryPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* COMPACT TRANSACTION HISTORY - Last 5 */}
        <div style={{ padding: '1.25rem' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '700',
            color: COLORS.primary,
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar style={{ width: '16px', height: '16px' }} />
            Últimas 5 Transações
          </h3>
          
          {transactionHistory.length > 0 ? (
            <div style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ 
                    background: COLORS.lightGray
                  }}>
                    <th style={{ 
                      padding: '0.625rem', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: COLORS.gray,
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>DATA</th>
                    <th style={{ 
                      padding: '0.625rem', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: COLORS.gray,
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>VALOR</th>
                    <th style={{ 
                      padding: '0.625rem', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: COLORS.gray,
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>CICLOS</th>
                    <th style={{ 
                      padding: '0.625rem', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: COLORS.gray,
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>MÁQUINAS</th>
                    <th style={{ 
                      padding: '0.625rem', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: COLORS.gray,
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>CUPOM</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((txn, idx) => (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: idx === transactionHistory.length - 1 ? 'none' : '1px solid #f3f4f6',
                        background: 'white'
                      }}
                    >
                      <td style={{ padding: '0.625rem', color: COLORS.gray, textAlign: 'center', fontSize: '11px' }}>
                        {formatDate(txn.date)}
                      </td>
                      <td style={{ 
                        padding: '0.625rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: COLORS.primary,
                        fontSize: '12px'
                      }}>
                        {formatCurrency(txn.amount)}
                      </td>
                      <td style={{ 
                        padding: '0.625rem', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        color: COLORS.primary,
                        fontSize: '14px'
                      }}>
                        {txn.cycles}
                      </td>
                      <td style={{ padding: '0.625rem', textAlign: 'center' }}>
                        <MachineDisplay machineStr={txn.machineStr} />
                      </td>
                      <td style={{ padding: '0.625rem', textAlign: 'center' }}>
                        <CouponBadge couponCode={txn.couponCode} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: COLORS.gray,
              background: COLORS.lightGray,
              borderRadius: '8px'
            }}>
              Nenhuma transação disponível
            </div>
          )}
        </div>

        {/* RISK ALERT - Compact */}
        {(customer.riskLevel === 'At Risk' || customer.riskLevel === 'Churning') && customer.daysOverdue > 0 && (
          <div style={{
            margin: '0 1.25rem 1.25rem 1.25rem',
            padding: '0.75rem 1rem',
            background: customer.riskLevel === 'Churning' ? '#fee2e2' : '#fef3c7',
            borderRadius: '8px',
            border: `2px solid ${customer.riskLevel === 'Churning' ? COLORS.red : COLORS.amber}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                Atenção Necessária
              </div>
              <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>
                Cliente está <strong>{customer.daysOverdue} dias atrasado</strong> (frequência média: {customer.avgDaysBetween} dias).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailModal;
