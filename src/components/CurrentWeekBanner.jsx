// CurrentWeekBanner.jsx v1.0 - Real-time current week summary with projection
// ✅ Shows current partial week metrics (Sunday → Today)
// ✅ Projects full week performance based on current pace
// ✅ Compares projection to last complete week
// ✅ Smart confidence indicators based on days elapsed
// ✅ Compact single-line or two-line layout
//
// CHANGELOG:
// v1.0 (2025-11-19): Initial implementation
//   - Current week summary (revenue, services, utilization)
//   - Weekly projection with confidence indicator
//   - Comparison to last complete week
//   - Responsive design (desktop 1-line, mobile 2-lines)

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Calendar } from 'lucide-react';

const COLORS = {
  primary: '#1a5a8e',
  accent: '#55b03b',
  red: '#dc2626',
  amber: '#f59e0b',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  blue: '#3b82f6'
};

const CurrentWeekBanner = ({ businessMetrics }) => {
  if (!businessMetrics?.currentWeek) {
    return null;
  }

  const { currentWeek } = businessMetrics;
  const { window, projection } = currentWeek;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Confidence level styling
  const getConfidenceStyle = () => {
    if (!projection.canProject) return { color: COLORS.gray, icon: AlertCircle };
    
    switch (projection.confidence) {
      case 'very_low':
        return { color: COLORS.red, icon: AlertCircle };
      case 'low':
        return { color: COLORS.amber, icon: AlertCircle };
      case 'medium':
        return { color: COLORS.blue, icon: TrendingUp };
      case 'high':
        return { color: COLORS.accent, icon: TrendingUp };
      default:
        return { color: COLORS.gray, icon: Minus };
    }
  };

  // Trend icon and color
  const getTrendIcon = () => {
    if (!projection.canProject) return null;
    
    if (projection.trend === 'up') {
      return <TrendingUp style={{ width: '18px', height: '18px', color: COLORS.accent }} />;
    } else if (projection.trend === 'down') {
      return <TrendingDown style={{ width: '18px', height: '18px', color: COLORS.red }} />;
    } else {
      return <Minus style={{ width: '18px', height: '18px', color: COLORS.gray }} />;
    }
  };

  const confidenceStyle = getConfidenceStyle();
  const ConfidenceIcon = confidenceStyle.icon;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a5a8e 0%, #2563eb 100%)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      marginBottom: '0.75rem',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar style={{ width: '20px', height: '20px' }} />
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Semana Atual
          </span>
          <span style={{
            fontSize: '13px',
            opacity: 0.9,
            fontWeight: '500'
          }}>
            ({window.startDate} - {window.endDate}, {window.daysElapsed} {window.daysElapsed === 1 ? 'dia' : 'dias'})
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '12px',
          opacity: 0.85,
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '4px 10px',
          borderRadius: '6px'
        }}>
          <ConfidenceIcon style={{ width: '14px', height: '14px' }} />
          <span>{window.dayOfWeek}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Current Week Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flex: 1,
          minWidth: '300px'
        }}>
          <div>
            <div style={{ 
              fontSize: '11px', 
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              marginBottom: '2px'
            }}>
              Receita
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              lineHeight: '1.1'
            }}>
              {formatCurrency(currentWeek.netRevenue)}
            </div>
          </div>

          <div style={{
            width: '1px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.3)'
          }} />

          <div>
            <div style={{ 
              fontSize: '11px', 
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              marginBottom: '2px'
            }}>
              Ciclos
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              lineHeight: '1.1'
            }}>
              {formatNumber(currentWeek.totalServices)}
            </div>
          </div>

          <div style={{
            width: '1px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.3)'
          }} />

          <div>
            <div style={{ 
              fontSize: '11px', 
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              marginBottom: '2px'
            }}>
              Utilização
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              lineHeight: '1.1'
            }}>
              {Math.round(currentWeek.totalUtilization)}%
            </div>
          </div>
        </div>

        {/* Projection */}
        {projection.canProject && (
          <>
            <div style={{
              width: '2px',
              height: '50px',
              background: 'rgba(255, 255, 255, 0.4)'
            }} />

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              minWidth: '280px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.9,
                  fontWeight: '600'
                }}>
                  Projeção Semana Completa
                </span>
                {getTrendIcon()}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.75rem',
                marginBottom: '0.375rem'
              }}>
                <span style={{
                  fontSize: '22px',
                  fontWeight: '700'
                }}>
                  {formatCurrency(projection.projectedRevenue)}
                </span>
                <span style={{
                  fontSize: '14px',
                  opacity: 0.9
                }}>
                  • {formatNumber(projection.projectedServices)} ciclos
                </span>
              </div>

              <div style={{
                fontSize: '12px',
                opacity: 0.85,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>
                  {projection.revenueVsLast > 0 ? '+' : ''}{projection.revenueVsLast.toFixed(1)}% vs última semana
                </span>
                {projection.confidence === 'very_low' && (
                  <span style={{
                    fontSize: '11px',
                    background: 'rgba(220, 38, 38, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    Volátil
                  </span>
                )}
                {projection.confidence === 'low' && (
                  <span style={{
                    fontSize: '11px',
                    background: 'rgba(245, 158, 11, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    Preliminar
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {!projection.canProject && (
          <div style={{
            fontSize: '13px',
            opacity: 0.8,
            fontStyle: 'italic',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px'
          }}>
            {projection.message}
          </div>
        )}
      </div>

      {/* Mobile-responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          /* Stack vertically on mobile */
        }
      `}</style>
    </div>
  );
};

export default CurrentWeekBanner;
