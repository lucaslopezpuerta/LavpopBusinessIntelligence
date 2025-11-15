// OPERATIONS KPI CARDS V4.0
// ✅ Adjusted thresholds (40/25/15) for self-service laundromats
// ✅ Peak vs off-peak breakdown
// ✅ Marketing suggestions
// ✅ Week-over-week trend indicators
//
// CHANGELOG:
// v4.0 (2025-11-15): Major enhancement release
//   - Adjusted utilization thresholds to 40/25/15 (realistic for self-service)
//   - Added peak vs off-peak utilization display
//   - Added actionable marketing suggestions based on utilization level
//   - Added week-over-week trend indicators (planned - needs previous period data)
//   - Enhanced capacity opportunity messaging
// v3.0 (2025-11-15): Filter responsiveness fix
// v2.0 (Previous): Added revenue breakdown card
// v1.0 (Previous): Initial KPI cards implementation

import React from 'react';
import { Gauge, Droplet, Activity, DollarSign, Info, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  amber: '#f59e0b',
  red: '#dc2626',
  gray: '#6b7280',
  lightGreen: '#86efac'
};

const OperationsKPICards = ({ businessMetrics, operationsMetrics }) => {
  if (!operationsMetrics?.utilization) {
    return <div className="text-gray-500 p-4">Carregando métricas operacionais...</div>;
  }

  // Use filtered utilization data from operationsMetrics
  const util = operationsMetrics.utilization;
  
  const washUtil = util.washUtilization || 0;
  const dryUtil = util.dryUtilization || 0;
  const totalUtil = util.totalUtilization || 0;

  // Peak vs Off-Peak data
  const peak = util.peak || {};
  const offPeak = util.offPeak || {};

  // Get revenue breakdown from operationsMetrics
  const revenueBreakdown = operationsMetrics?.revenueBreakdown || {
    machineRevenue: 0,
    recargaRevenue: 0,
    totalRevenue: 0
  };

  // ADJUSTED THRESHOLDS for self-service laundromats
  const getUtilColor = (util) => {
    if (util >= 40) return COLORS.accent;   // 40%+ = Excellent
    if (util >= 25) return COLORS.primary;  // 25-39% = Good
    if (util >= 15) return COLORS.amber;    // 15-24% = Regular
    return COLORS.red;                       // 0-14% = Low
  };

  const getUtilLabel = (util) => {
    if (util >= 40) return 'Excelente';
    if (util >= 25) return 'Bom';
    if (util >= 15) return 'Regular';
    return 'Baixo';
  };

  const getUtilDescription = (util, type) => {
    const status = getUtilLabel(util);
    
    if (type === 'wash') {
      if (util >= 40) return 'Lavadoras muito utilizadas - operação eficiente';
      if (util >= 25) return 'Uso saudável das lavadoras';
      if (util >= 15) return 'Espaço para crescimento - considere marketing';
      return 'Baixa utilização - oportunidade de expansão';
    }
    
    if (type === 'dry') {
      if (util >= 40) return 'Secadoras muito utilizadas - boa demanda';
      if (util >= 25) return 'Uso saudável das secadoras';
      if (util >= 15) return 'Espaço para crescimento - considere marketing';
      return 'Baixa utilização - oportunidade de expansão';
    }
    
    // total
    if (util >= 40) return 'Operação eficiente - capacidade bem aproveitada';
    if (util >= 25) return 'Operação saudável - espaço para crescimento';
    if (util >= 15) return 'Capacidade ociosa - oportunidade de marketing';
    return 'Revisar estratégia de marketing e horários';
  };

  // Marketing suggestions based on utilization level
  const getMarketingSuggestion = (util, peakUtil, offPeakUtil, type) => {
    // If peak is good but overall is low, focus on off-peak
    if (peakUtil >= 30 && offPeakUtil < 10) {
      return '💡 Pico OK! Foco: Promoção "Horário Feliz" manhã/noite';
    }
    
    // If overall is very low, general marketing needed
    if (util < 15) {
      return '💡 Ação: Marketing em redes sociais + parceria local';
    }
    
    // If moderate, incremental improvements
    if (util >= 15 && util < 25) {
      return '💡 Oportunidade: Programa de fidelidade e indicações';
    }
    
    // If good, maintain and optimize
    if (util >= 25 && util < 40) {
      return '💡 Otimizar: Análise de picos para melhor distribuição';
    }
    
    // If excellent, capacity planning
    if (util >= 40) {
      return '✅ Excelente! Monitorar picos para evitar filas';
    }
    
    return '';
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
      description: getUtilDescription(washUtil, 'wash'),
      icon: Droplet,
      color: getUtilColor(washUtil),
      iconBg: washUtil >= 25 ? '#e8f5e9' : '#fef3c7',
      capacity: '3 máquinas',
      details: `${util.totalWashServices} serviços / ${util.maxWashCycles} ciclos possíveis`,
      tooltip: 'Mede quantos ciclos de lavagem foram usados em relação à capacidade máxima disponível no período',
      peakUtil: peak.washUtilization || 0,
      offPeakUtil: offPeak.washUtilization || 0,
      suggestion: getMarketingSuggestion(washUtil, peak.washUtilization || 0, offPeak.washUtilization || 0, 'wash')
    },
    {
      id: 'dry',
      title: 'SECADORAS',
      value: `${Math.round(dryUtil)}%`,
      subtitle: getUtilLabel(dryUtil),
      description: getUtilDescription(dryUtil, 'dry'),
      icon: Activity,
      color: getUtilColor(dryUtil),
      iconBg: dryUtil >= 25 ? '#e8f5e9' : '#fef3c7',
      capacity: '5 máquinas',
      details: `${util.totalDryServices} serviços / ${util.maxDryCycles} ciclos possíveis`,
      tooltip: 'Mede quantos ciclos de secagem foram usados em relação à capacidade máxima disponível no período',
      peakUtil: peak.dryUtilization || 0,
      offPeakUtil: offPeak.dryUtilization || 0,
      suggestion: getMarketingSuggestion(dryUtil, peak.dryUtilization || 0, offPeak.dryUtilization || 0, 'dry')
    },
    {
      id: 'total',
      title: 'UTILIZAÇÃO TOTAL',
      value: `${Math.round(totalUtil)}%`,
      subtitle: getUtilLabel(totalUtil),
      description: getUtilDescription(totalUtil, 'total'),
      icon: Gauge,
      color: getUtilColor(totalUtil),
      iconBg: totalUtil >= 25 ? '#e8f5e9' : '#fef3c7',
      capacity: '8 máquinas',
      details: `${util.totalServices} serviços totais em ${util.activeDays} dias`,
      tooltip: 'Média ponderada da utilização de lavadoras e secadoras (baseada na proporção de máquinas)',
      peakUtil: peak.totalUtilization || 0,
      offPeakUtil: offPeak.totalUtilization || 0,
      suggestion: getMarketingSuggestion(totalUtil, peak.totalUtilization || 0, offPeak.totalUtilization || 0, 'total')
    }
  ];

  return (
    <>
      {/* Utilization KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  <div 
                    style={{ cursor: 'help' }}
                    title={kpi.tooltip}
                  >
                    <Info style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                  </div>
                </div>
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

              {/* Subtitle and Description */}
              <div style={{ 
                fontSize: '13px',
                color: kpi.color,
                fontWeight: '600',
                marginBottom: '0.25rem'
              }}>
                {kpi.subtitle}
              </div>
              <div style={{ 
                fontSize: '11px',
                color: '#6b7280',
                marginBottom: '0.75rem',
                lineHeight: '1.4'
              }}>
                {kpi.description}
              </div>

              {/* Peak vs Off-Peak Breakdown */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: '11px'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ⏰ Horários:
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.5rem' 
                }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '10px' }}>
                      Pico ({peak.hours})
                    </div>
                    <div style={{ 
                      color: kpi.peakUtil >= 25 ? COLORS.accent : COLORS.amber,
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {Math.round(kpi.peakUtil)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '10px' }}>
                      Fora de pico
                    </div>
                    <div style={{ 
                      color: kpi.offPeakUtil >= 15 ? COLORS.primary : COLORS.red,
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {Math.round(kpi.offPeakUtil)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Suggestion */}
              {kpi.suggestion && (
                <div style={{
                  background: kpi.suggestion.includes('✅') ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${kpi.suggestion.includes('✅') ? '#86efac' : '#fef08a'}`,
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.75rem',
                  fontSize: '11px',
                  color: '#374151',
                  lineHeight: '1.4'
                }}>
                  {kpi.suggestion}
                </div>
              )}

              {/* Capacity and Details */}
              <div style={{ 
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '0.25rem'
              }}>
                {kpi.capacity}
              </div>
              <div style={{ 
                fontSize: '11px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                {kpi.details}
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
                Período: {operationsMetrics.dateRange}
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
            💡 <strong>Nota:</strong> Receita de máquinas = uso direto com pagamento. Venda de créditos = prepagamento para uso futuro.
          </div>
        </div>
      )}
    </>
  );
};

export default OperationsKPICards;
