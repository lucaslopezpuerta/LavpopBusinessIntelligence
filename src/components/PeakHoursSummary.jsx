// PEAK HOURS SUMMARY V2.0

import React from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  red: '#dc2626',
  gray: '#6b7280',
  amber: '#f59e0b'
};

const PeakHoursSummary = ({ peakHours, dateWindow }) => {
  if (!peakHours || !peakHours.peak || !peakHours.offPeak) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading peak hours data...
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Show top 3 peak and bottom 3 off-peak only
  const topPeak = peakHours.peak.slice(0, 3);
  const bottomOffPeak = peakHours.offPeak.slice(0, 3);

  // Self-service recommendations based on utilization
  const getRecommendation = (util) => {
    if (util >= 50) return {
      text: "Pico crítico - monitore remotamente para problemas",
      icon: "🔥",
      color: COLORS.red
    };
    if (util >= 30) return {
      text: "Alta demanda - verifique máquinas antes do período",
      icon: "⚡",
      color: COLORS.accent
    };
    if (util >= 15) return {
      text: "Fluxo moderado - período de operação normal",
      icon: "✓",
      color: COLORS.primary
    };
    return {
      text: "Baixa demanda - ideal para manutenção preventiva",
      icon: "🔧",
      color: COLORS.amber
    };
  };

  const peakRec = getRecommendation(topPeak[0]?.utilization || 0);
  const offPeakRec = getRecommendation(bottomOffPeak[0]?.utilization || 0);

  const HourRow = ({ hour, index, isPeak }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      background: index === 0 ? (isPeak ? '#f0fdf4' : '#fef2f2') : 'transparent',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      border: index === 0 ? `1px solid ${isPeak ? '#dcfce7' : '#fee2e2'}` : '1px solid transparent'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: isPeak ? COLORS.accent : COLORS.red,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          {index + 1}
        </div>
        <div>
          <div style={{ 
            fontSize: '15px',
            fontWeight: '600',
            color: COLORS.primary
          }}>
            {hour.hourLabel}
          </div>
          <div style={{ 
            fontSize: '12px',
            color: COLORS.gray
          }}>
            {hour.avgServices.toFixed(1)} serviços/h
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '700',
          color: isPeak ? COLORS.accent : COLORS.red
        }}>
          {hour.utilization.toFixed(1)}%
        </div>
        <div style={{ 
          fontSize: '12px',
          color: COLORS.gray
        }}>
          {formatCurrency(hour.revenue)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Clock style={{ width: '20px', height: '20px', color: COLORS.primary }} />
          <h3 style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.primary,
            margin: 0
          }}>
            Melhores e Piores Horários
          </h3>
        </div>
        <p style={{
          fontSize: '12px',
          color: COLORS.gray,
          margin: 0
        }}>
          Período: {dateWindow?.dateRange || 'Carregando...'}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Peak Hours */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <TrendingUp style={{ width: '18px', height: '18px', color: COLORS.accent }} />
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.accent,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Horários de Pico
            </h4>
          </div>
          
          {topPeak.map((hour, index) => (
            <HourRow key={hour.hour} hour={hour} index={index} isPeak={true} />
          ))}
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            fontSize: '12px',
            color: COLORS.gray
          }}>
            <div style={{ color: peakRec.color, fontWeight: '600', marginBottom: '0.25rem' }}>
              {peakRec.icon} {peakRec.text}
            </div>
          </div>
        </div>

        {/* Off-Peak Hours */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <TrendingDown style={{ width: '18px', height: '18px', color: COLORS.red }} />
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.red,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Horários de Vale
            </h4>
          </div>
          
          {bottomOffPeak.map((hour, index) => (
            <HourRow key={hour.hour} hour={hour} index={index} isPeak={false} />
          ))}
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fef2f2',
            borderRadius: '8px',
            fontSize: '12px',
            color: COLORS.gray
          }}>
            <div style={{ color: offPeakRec.color, fontWeight: '600', marginBottom: '0.25rem' }}>
              {offPeakRec.icon} {offPeakRec.text}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Service Strategy Insights */}
      <div style={{
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px',
        color: COLORS.gray
      }}>
        <div style={{ fontWeight: '600', color: COLORS.primary, marginBottom: '0.5rem' }}>
          💡 Estratégias para Self-Service:
        </div>
        <div style={{ lineHeight: '1.6' }}>
          <div><strong>Horários de Pico:</strong> Configure alertas remotos para monitorar filas e problemas de máquinas</div>
          <div><strong>Horários de Vale:</strong> Execute manutenção preventiva, limpeza profunda, ou lance promoções via WhatsApp</div>
          <div style={{ marginTop: '0.5rem', fontSize: '11px', fontStyle: 'italic' }}>
            ⓘ Receita inclui vendas de crédito (Recarga)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursSummary;
