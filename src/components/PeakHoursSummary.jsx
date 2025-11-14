import React from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  red: '#dc2626',
  gray: '#6b7280'
};

const PeakHoursSummary = ({ peakHours }) => {
  if (!peakHours) {
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

  const { peak = [], offPeak = [] } = peakHours;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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
          Análise de utilização por hora (Semana Atual)
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Peak Hours */}
        <div>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #e8f5e9'
          }}>
            <TrendingUp style={{ width: '18px', height: '18px', color: COLORS.accent }} />
            <h4 style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.accent,
              margin: 0
            }}>
              Horários de Pico
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {peak.slice(0, 5).map((hour, index) => (
              <div 
                key={hour.hour}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: '#f8fef8',
                  borderRadius: '8px',
                  border: '1px solid #e8f5e9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: COLORS.accent,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: COLORS.primary
                    }}>
                      {hour.hourLabel}
                    </div>
                    <div style={{ 
                      fontSize: '11px',
                      color: COLORS.gray
                    }}>
                      {hour.avgServices.toFixed(1)} serviços/h
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '13px',
                    fontWeight: '600',
                    color: COLORS.accent
                  }}>
                    {hour.utilization.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: '10px',
                    color: COLORS.gray
                  }}>
                    {formatCurrency(hour.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            fontSize: '12px',
            color: COLORS.gray
          }}>
            💡 <strong>Recomendação:</strong> Manter equipe completa durante estes horários
          </div>
        </div>

        {/* Off-Peak Hours */}
        <div>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #fee2e2'
          }}>
            <TrendingDown style={{ width: '18px', height: '18px', color: COLORS.red }} />
            <h4 style={{ 
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.red,
              margin: 0
            }}>
              Horários de Vale
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {offPeak.slice(0, 5).map((hour, index) => (
              <div 
                key={hour.hour}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: '#fef8f8',
                  borderRadius: '8px',
                  border: '1px solid #fee2e2'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: COLORS.red,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: COLORS.primary
                    }}>
                      {hour.hourLabel}
                    </div>
                    <div style={{ 
                      fontSize: '11px',
                      color: COLORS.gray
                    }}>
                      {hour.avgServices.toFixed(1)} serviços/h
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '13px',
                    fontWeight: '600',
                    color: COLORS.red
                  }}>
                    {hour.utilization.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: '10px',
                    color: COLORS.gray
                  }}>
                    {formatCurrency(hour.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fef2f2',
            borderRadius: '8px',
            fontSize: '12px',
            color: COLORS.gray
          }}>
            💡 <strong>Oportunidade:</strong> Horários ideais para promoções e manutenção
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursSummary;
