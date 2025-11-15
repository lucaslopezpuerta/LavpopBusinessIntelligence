// OPERATIONS KPI CARDS V2.0

import React from 'react';
import { Gauge, Droplet, Activity, DollarSign } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280'
};

const OperationsKPICards = ({ businessMetrics, operationsMetrics }) => {
  if (!businessMetrics) {
    return <div className="text-gray-500 p-4">Loading operations metrics...</div>;
  }

  const weekly = businessMetrics.weekly || {};
  
  // Get utilization percentages (now TIME-BASED)
  const washUtil = weekly.washUtilization || 0;
  const dryUtil = weekly.dryUtilization || 0;
  const totalUtil = weekly.totalUtilization || 0;

  // Get revenue breakdown from operationsMetrics
  const revenueBreakdown = operationsMetrics?.revenueBreakdown || {
    machineRevenue: 0,
    recargaRevenue: 0,
    totalRevenue: 0
  };

  const getUtilColor = (util) => {
    if (util >= 70) return COLORS.accent;
    if (util >= 50) return COLORS.primary;
    if (util >= 30) return COLORS.amber;
    return COLORS.red;
  };

  const getUtilLabel = (util) => {
    if (util >= 70) return 'Excelente';
    if (util >= 50) return 'Bom';
    if (util >= 30) return 'Regular';
    return 'Baixo';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const kpis = [
    {
      id: 'wash',
      title: 'LAVADORAS',
      value: `${Math.round(washUtil)}%`,
      subtitle: getUtilLabel(washUtil),
      icon: Droplet,
      color: getUtilColor(washUtil),
      iconBg: washUtil >= 50 ? '#e8f5e9' : '#fef3c7',
      capacity: '3 máquinas'
    },
    {
      id: 'dry',
      title: 'SECADORAS',
      value: `${Math.round(dryUtil)}%`,
      subtitle: getUtilLabel(dryUtil),
      icon: Activity,
      color: getUtilColor(dryUtil),
      iconBg: dryUtil >= 50 ? '#e8f5e9' : '#fef3c7',
      capacity: '5 máquinas'
    },
    {
      id: 'total',
      title: 'UTILIZAÇÃO TOTAL',
      value: `${Math.round(totalUtil)}%`,
      subtitle: getUtilLabel(totalUtil),
      icon: Gauge,
      color: getUtilColor(totalUtil),
      iconBg: totalUtil >= 50 ? '#e8f5e9' : '#fef3c7',
      capacity: '8 máquinas'
    }
  ];

  return (
    <>
      {/* Utilization KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          
          return (
            <div
              key={kpi.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                transition: 'all 0.2s',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Colored top bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: kpi.color
              }} />

              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  {kpi.title}
                </h3>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: kpi.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ width: '22px', height: '22px', color: kpi.color }} />
                </div>
              </div>

              {/* Value */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ 
                  fontSize: '32px',
                  fontWeight: '700',
                  color: kpi.color,
                  lineHeight: '1.2'
                }}>
                  {kpi.value}
                </div>
              </div>

              {/* Subtitle and Capacity */}
              <div style={{ 
                fontSize: '13px',
                color: kpi.color,
                fontWeight: '600',
                marginBottom: '0.25rem'
              }}>
                {kpi.subtitle}
              </div>
              <div style={{ 
                fontSize: '12px',
                color: '#9ca3af'
              }}>
                {kpi.capacity}
              </div>

              {/* Progress bar */}
              <div style={{
                marginTop: '1rem',
                height: '6px',
                background: '#f3f4f6',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(parseInt(kpi.value), 100)}%`,
                  background: kpi.color,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Breakdown Card */}
      {revenueBreakdown.totalRevenue > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <DollarSign style={{ width: '20px', height: '20px', color: COLORS.primary }} />
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: '600',
              color: COLORS.primary,
              margin: 0
            }}>
              Composição da Receita
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Machine Revenue */}
            <div style={{
              padding: '1rem',
              background: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #dbeafe'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: COLORS.gray,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                letterSpacing: '0.5px'
              }}>
                Receita de Máquinas
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.primary,
                marginBottom: '0.25rem'
              }}>
                {formatCurrency(revenueBreakdown.machineRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: COLORS.gray }}>
                {((revenueBreakdown.machineRevenue / revenueBreakdown.totalRevenue) * 100).toFixed(1)}% do total
              </div>
            </div>

            {/* Recarga Revenue */}
            {revenueBreakdown.recargaRevenue > 0 && (
              <div style={{
                padding: '1rem',
                background: '#fefce8',
                borderRadius: '8px',
                border: '1px solid #fef9c3'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: COLORS.gray,
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  letterSpacing: '0.5px'
                }}>
                  Venda de Créditos
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: COLORS.amber,
                  marginBottom: '0.25rem'
                }}>
                  {formatCurrency(revenueBreakdown.recargaRevenue)}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.gray }}>
                  {((revenueBreakdown.recargaRevenue / revenueBreakdown.totalRevenue) * 100).toFixed(1)}% do total
                </div>
              </div>
            )}

            {/* Total Revenue */}
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #dcfce7'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: COLORS.gray,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                letterSpacing: '0.5px'
              }}>
                Receita Total
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.accent,
                marginBottom: '0.25rem'
              }}>
                {formatCurrency(revenueBreakdown.totalRevenue)}
              </div>
              <div style={{ fontSize: '12px', color: COLORS.gray }}>
                Período atual
              </div>
            </div>
          </div>

          {/* Info note */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '12px',
            color: COLORS.gray
          }}>
            💡 <strong>Nota:</strong> Receita de máquinas = uso direto. Venda de créditos = prepagamento para uso futuro.
          </div>
        </div>
      )}
    </>
  );
};

export default OperationsKPICards;
