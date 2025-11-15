// OPERATIONS KPI CARDS V4.0.2 - WORKING VERSION
// ✅ Correctly reads from operationsMetrics.utilization
// ✅ Dynamic peak/off-peak from operationsMetrics
// ✅ Realistic thresholds (25/15/10)
//
// CHANGELOG:
// v4.0.2 (2025-11-15): CRITICAL FIX - Correct data access
//   - Fixed: Now reads from operationsMetrics.utilization (not businessMetrics.windows)
//   - Fixed: Service counts from operationsMetrics.utilization
//   - Fixed: Peak/off-peak from operationsMetrics.utilization.peak/offPeak
//   - Simplified: Uses existing data structure correctly
// v4.0.1: Attempted dynamic peak hours (wrong data structure)
// v4.0: Initial enhanced version (wrong data access)

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
  excellent: 25,
  good: 15,
  fair: 10
};

const OperationsKPICards = ({ businessMetrics, operationsMetrics, previousWeekMetrics }) => {
  console.log('🎯 KPI Cards received:', {
    hasBusinessMetrics: !!businessMetrics,
    hasOperationsMetrics: !!operationsMetrics,
    hasPreviousWeek: !!previousWeekMetrics,
    currentUtil: operationsMetrics?.utilization
  });

  // Get current week data from operationsMetrics
  const currentData = useMemo(() => {
    if (!operationsMetrics?.utilization) return null;
    
    const util = operationsMetrics.utilization;
    return {
      wash: {
        utilization: util.washUtilization || 0,
        services: util.totalWashServices || 0,
        peak: util.peak?.washUtilization || 0,
        offPeak: util.offPeak?.washUtilization || 0
      },
      dry: {
        utilization: util.dryUtilization || 0,
        services: util.totalDryServices || 0,
        peak: util.peak?.dryUtilization || 0,
        offPeak: util.offPeak?.dryUtilization || 0
      },
      total: {
        utilization: util.totalUtilization || 0,
        services: util.totalServices || 0,
        peak: util.peak?.totalUtilization || 0,
        offPeak: util.offPeak?.totalUtilization || 0
      }
    };
  }, [operationsMetrics]);

  // Get previous week data
  const previousData = useMemo(() => {
    if (!previousWeekMetrics?.utilization) return null;
    
    const util = previousWeekMetrics.utilization;
    return {
      wash: {
        utilization: util.washUtilization || 0,
        services: util.totalWashServices || 0
      },
      dry: {
        utilization: util.dryUtilization || 0,
        services: util.totalDryServices || 0
      },
      total: {
        utilization: util.totalUtilization || 0,
        services: util.totalServices || 0
      }
    };
  }, [previousWeekMetrics]);

  // Calculate trends
  const trends = useMemo(() => {
    if (!currentData || !previousData) return { wash: null, dry: null, total: null };
    
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return null;
      return {
        percent: ((current - previous) / previous) * 100,
        absolute: current - previous
      };
    };
    
    return {
      wash: calculateTrend(currentData.wash.utilization, previousData.wash.utilization),
      dry: calculateTrend(currentData.dry.utilization, previousData.dry.utilization),
      total: calculateTrend(currentData.total.utilization, previousData.total.utilization)
    };
  }, [currentData, previousData]);

  // Get dynamic peak hour labels
  const peakHourLabels = useMemo(() => {
    if (!operationsMetrics?.peakHours?.peak || operationsMetrics.peakHours.peak.length === 0) {
      return '10-12h, 14-15h, 18-19h'; // Fallback
    }
    
    const peakHours = operationsMetrics.peakHours.peak.map(h => h.hour).sort((a, b) => a - b);
    
    // Group consecutive hours into ranges
    const ranges = [];
    let start = peakHours[0];
    let prev = peakHours[0];
    
    for (let i = 1; i < peakHours.length; i++) {
      if (peakHours[i] !== prev + 1) {
        ranges.push(start === prev ? `${start}h` : `${start}-${prev + 1}h`);
        start = peakHours[i];
      }
      prev = peakHours[i];
    }
    ranges.push(start === prev ? `${start}h` : `${start}-${prev + 1}h`);
    
    return ranges.join(', ');
  }, [operationsMetrics]);

  if (!currentData) {
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
    if (Math.abs(percent) < 0.1) return null; // Skip if no change
    
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

  const washStatus = getStatus(currentData.wash.utilization);
  const dryStatus = getStatus(currentData.dry.utilization);
  const totalStatus = getStatus(currentData.total.utilization);

  const washTrend = getTrendIndicator(trends.wash);
  const dryTrend = getTrendIndicator(trends.dry);
  const totalTrend = getTrendIndicator(trends.total);

  const washServices = formatServiceCount(
    currentData.wash.services,
    previousData?.wash.services || 0
  );
  const dryServices = formatServiceCount(
    currentData.dry.services,
    previousData?.dry.services || 0
  );

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
    const capacityPerHour = machineCount === 3 ? 2 : 1.33;
    const maxCyclesPerWeek = machineCount * 15 * 7 * capacityPerHour;

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
        {peakOffPeakData && peakOffPeakData.peak > 0 && (
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
                <span>├─ Pico ({peakHourLabels}):</span>
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
        {peakOffPeakData && peakOffPeakData.peak > 0 && (
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
        utilization={currentData.wash.utilization}
        status={washStatus}
        capacity="3 máquinas"
        services={washServices}
        trend={washTrend}
        peakOffPeakData={{
          peak: currentData.wash.peak,
          offPeak: currentData.wash.offPeak
        }}
        machineCount={3}
      />

      {/* Dryers KPI */}
      <KPICard
        title="SECADORAS"
        icon={Activity}
        utilization={currentData.dry.utilization}
        status={dryStatus}
        capacity="5 máquinas"
        services={dryServices}
        trend={dryTrend}
        peakOffPeakData={{
          peak: currentData.dry.peak,
          offPeak: currentData.dry.offPeak
        }}
        machineCount={5}
      />

      {/* Total Utilization KPI */}
      <KPICard
        title="UTILIZAÇÃO TOTAL"
        icon={Gauge}
        utilization={currentData.total.utilization}
        status={totalStatus}
        capacity="8 máquinas"
        services={{
          current: washServices.current + dryServices.current,
          previous: washServices.previous + dryServices.previous,
          diff: washServices.diff + dryServices.diff,
          text: `${washServices.diff + dryServices.diff >= 0 ? '+' : ''}${washServices.diff + dryServices.diff}`
        }}
        trend={totalTrend}
        peakOffPeakData={{
          peak: currentData.total.peak,
          offPeak: currentData.total.offPeak
        }}
        machineCount={8}
      />
    </div>
  );
};

export default OperationsKPICards;
