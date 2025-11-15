// OPERATIONS KPI CARDS V4.0
// ✅ Realistic thresholds (25/15/10)
// ✅ Peak/off-peak breakdown
// ✅ Week-over-week trends
// ✅ Service count displays
// ✅ Removed generic marketing suggestions
//
// CHANGELOG:
// v4.0 (2025-11-15): Actionable Intelligence Upgrade
//   - Changed thresholds to 25/15/10 (aligned with 25% profitability target)
//   - Added peak/off-peak utilization breakdown (based on heatmap: 10-12h, 14-15h, 18-19h)
//   - Added week-over-week trend indicators (↑ +22%)
//   - Added service count displays (72 vs 59 last week)
//   - Removed generic marketing suggestions (noise reduction)
//   - Enhanced status messages (data-driven insights)
// v3.x: Time-based utilization + revenue reconciliation
// v2.x: Machine-specific KPIs
// v1.x: Initial implementation

import React, { useMemo } from 'react';
import { Flame, Activity, Gauge } from 'lucide-react';

const COLORS = {
  primary: '#10306B',
  accent: '#53be33',
  wash: '#3b82f6',
  dry: '#f59e0b',
  excellent: '#22c55e',
  good: '#53be33',
  fair: '#f59e0b',
  low: '#dc2626',
  gray: '#6b7280'
};

// REALISTIC THRESHOLDS (aligned with 25% profitability target)
const THRESHOLDS = {
  excellent: 25,  // Meeting/exceeding profit target
  good: 15,       // Healthy, growing operation
  fair: 10        // Acceptable, has upside
  // Below 10 = Low (needs attention)
};

const OperationsKPICards = ({ businessMetrics, operationsMetrics }) => {
  // Get peak/off-peak data
  const peakOffPeak = useMemo(() => {
    return businessMetrics?.peakOffPeak || null;
  }, [businessMetrics]);

  // Get trends data
  const trends = useMemo(() => {
    return businessMetrics?.trends || { wash: null, dry: null, total: null };
  }, [businessMetrics]);

  // Service counts
  const serviceCounts = useMemo(() => {
    return {
      wash: {
        current: businessMetrics?.services?.wash || 0,
        previous: businessMetrics?.previousWeek?.services?.wash || 0
      },
      dry: {
        current: businessMetrics?.services?.dry || 0,
        previous: businessMetrics?.previousWeek?.services?.dry || 0
      }
    };
  }, [businessMetrics]);

  if (!businessMetrics) {
    return (
      <div style={{ color: '#6b7280', padding: '1rem' }}>
        Loading KPI metrics...
      </div>
    );
  }

  const getStatus = (utilization) => {
    if (utilization >= THRESHOLDS.excellent) return { label: 'Excelente', color: COLORS.excellent, emoji: '🔥' };
    if (utilization >= THRESHOLDS.good) return { label: 'Bom', color: COLORS.good, emoji: '✅' };
    if (utilization >= THRESHOLDS.fair) return { label: 'Razoável', color: COLORS.fair, emoji: '⚠️' };
    return { label: 'Baixo', color: COLORS.low, emoji: '📉' };
  };

  const getTrendIndicator = (trend) => {
    if (!trend || trend.percent === null || trend.percent === undefined) return null;
    
    const percent = trend.percent;
    if (percent > 5) {
      return { icon: '↑', color: COLORS.accent, text: `+${percent.toFixed(0)}%` };
    }
    if (percent < -5) {
      return { icon: '↓', color: COLORS.low, text: `${percent.toFixed(0)}%` };
    }
    return { icon: '→', color: COLORS.gray, text: `${percent >= 0 ? '+' : ''}${percent.toFixed(0)}%` };
  };

  const formatServiceCount = (current, previous) => {
    const diff = current - previous;
    const sign = diff > 0 ? '+' : '';
    return { current, previous, diff, text: `${sign}${diff}` };
  };

  const washUtil = businessMetrics.utilization?.wash || 0;
  const dryUtil = businessMetrics.utilization?.dry || 0;
  const totalUtil = businessMetrics.utilization?.total || 0;

  const washStatus = getStatus(washUtil);
  const dryStatus = getStatus(dryUtil);
  const totalStatus = getStatus(totalUtil);

  const washTrend = getTrendIndicator(trends.wash);
  const dryTrend = getTrendIndicator(trends.dry);
  const totalTrend = getTrendIndicator(trends.total);

  const washServices = formatServiceCount(serviceCounts.wash.current, serviceCounts.wash.previous);
  const dryServices = formatServiceCount(serviceCounts.dry.current, serviceCounts.dry.previous);

  const KPICard = ({ 
    title, 
    icon: Icon, 
    utilization, 
    status, 
    capacity, 
    services,
    trend,
    peakOffPeakData,
    machineCount
  }) => {
    const progressWidth = Math.min(utilization, 100);
    const capacityPerHour = machineCount === 3 ? 2 : 1.33; // Washers: 2/hr, Dryers: 1.33/hr
    const maxCyclesPerWeek = machineCount * 15 * 7 * capacityPerHour; // machines * 15h/day * 7 days * cycles/hr

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: `2px solid ${status.color}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `${status.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon style={{ width: '18px', height: '18px', color: status.color }} />
            </div>
            <h3 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.gray,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </h3>
          </div>
          <span style={{ fontSize: '24px' }}>{status.emoji}</span>
        </div>

        {/* Utilization % + Trend */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{
              fontSize: '36px',
              fontWeight: '700',
              color: status.color
            }}>
              {utilization.toFixed(0)}%
            </span>
            {trend && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '20px', color: trend.color }}>{trend.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: trend.color }}>
                  {trend.text}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: status.color
            }}>
              {status.label}
            </span>
            {trend && (
              <span style={{ fontSize: '11px', color: COLORS.gray }}>
                vs semana passada
              </span>
            )}
          </div>
        </div>

        {/* Peak/Off-Peak Breakdown */}
        {peakOffPeakData && (
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: COLORS.primary,
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📊 Distribuição da Demanda
            </div>
            <div style={{ fontSize: '12px', color: COLORS.gray, lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>├─ Pico (10-12h, 14-15h, 18-19h):</span>
                <strong style={{ color: peakOffPeakData.peak >= 15 ? COLORS.accent : COLORS.gray }}>
                  {peakOffPeakData.peak.toFixed(0)}%
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>└─ Fora de pico:</span>
                <strong style={{ color: COLORS.gray }}>
                  {peakOffPeakData.offPeak.toFixed(0)}%
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Service Counts */}
        <div style={{
          background: '#f0f9ff',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{ fontSize: '12px', color: COLORS.gray, lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Semana Atual:</span>
              <strong style={{ color: COLORS.primary }}>{services.current} serviços</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Semana Passada:</span>
              <strong style={{ color: COLORS.gray }}>
                {services.previous} serviços
                {services.diff !== 0 && (
                  <span style={{ 
                    color: services.diff > 0 ? COLORS.accent : COLORS.low,
                    marginLeft: '0.25rem'
                  }}>
                    ({services.text})
                  </span>
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Data-Driven Insight */}
        {peakOffPeakData && (
          <div style={{
            padding: '0.5rem',
            background: '#fef3c7',
            borderRadius: '6px',
            fontSize: '11px',
            color: COLORS.gray,
            lineHeight: '1.5'
          }}>
            <strong>💡 </strong>
            {peakOffPeakData.peak - peakOffPeakData.offPeak > 8 ? (
              <>Demanda concentrada nos picos. Promova fora de pico com desconto.</>
            ) : peakOffPeakData.peak - peakOffPeakData.offPeak > 3 ? (
              <>Boa distribuição. Continue monitorando padrões.</>
            ) : (
              <>Distribuição equilibrada. Oportunidade de aumentar picos.</>
            )}
          </div>
        )}

        {/* Capacity Info */}
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '0.5rem' }}>
            {capacity} - {Math.round(maxCyclesPerWeek)} ciclos possíveis/semana
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressWidth}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${status.color}, ${status.color}dd)`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
            fontSize: '10px',
            color: COLORS.gray
          }}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Washers KPI */}
      <KPICard
        title="LAVADORAS"
        icon={Flame}
        utilization={washUtil}
        status={washStatus}
        capacity="3 máquinas"
        services={washServices}
        trend={washTrend}
        peakOffPeakData={peakOffPeak?.wash}
        machineCount={3}
      />

      {/* Dryers KPI */}
      <KPICard
        title="SECADORAS"
        icon={Activity}
        utilization={dryUtil}
        status={dryStatus}
        capacity="5 máquinas"
        services={dryServices}
        trend={dryTrend}
        peakOffPeakData={peakOffPeak?.dry}
        machineCount={5}
      />

      {/* Total Utilization KPI */}
      <KPICard
        title="UTILIZAÇÃO TOTAL"
        icon={Gauge}
        utilization={totalUtil}
        status={totalStatus}
        capacity="8 máquinas"
        services={{
          current: washServices.current + dryServices.current,
          previous: washServices.previous + dryServices.previous,
          diff: washServices.diff + dryServices.diff,
          text: `${washServices.diff + dryServices.diff >= 0 ? '+' : ''}${washServices.diff + dryServices.diff}`
        }}
        trend={totalTrend}
        peakOffPeakData={peakOffPeak?.total}
        machineCount={8}
      />
    </div>
  );
};

export default OperationsKPICards;
